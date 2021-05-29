const fs = require("fs")
const fsPm = require('fs/promises');
const os = require('os');
const randomString = require('../../lib/randomString');


module.exports = function(RED) {
    function DeviceInfoHandler(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        var filePath = (config.file || '~/.iot_dev_info').replace(/^~/,os.homedir())
        node.on('input', function(msg) {
            var type = 'read';
            if(typeof msg.payload === 'object'){
                type = msg.payload.type;
            }

            fsPm.access(filePath, fs.constants.R_OK | fs.constants.W_OK).catch(() => {
                console.log('create file')
                return fsPm.writeFile(filePath, '')
            }).then(() => {
                return fsPm.readFile(filePath).then((data) => {
                    var obj = {};
                    var needWrite = false;
                    var notSend = false;
                    try { obj = JSON.parse(data) } catch { }

                    if(!obj.deviceName){
                        obj.deviceName = randomString(8);
                        needWrite = true;
                    }

                    switch (type) {
                        case 'update': {
                            obj = { ...obj, ...msg.payload.data, deviceName: obj.deviceName };
                            needWrite = true;
                            break
                        }
                        case 'clear': {
                            obj = { deviceName: obj.deviceName };
                            needWrite = true;
                            notSend = true;
                            break
                        }
                        case 'reset': {
                            obj = { };
                            needWrite = true;
                            notSend = true;
                            break
                        }
                    }

                    return Promise.resolve().then(() => {
                        if (needWrite) {
                            return fsPm.writeFile(filePath, JSON.stringify(obj))
                        }
                        return Promise.resolve()
                    }).then(() => {
                        if (notSend) {
                            return null;
                        }
                        return obj;
                    })
                })
            }).then((data) => {
                if (!data) {
                    return
                }
                var replaceData = {
                    productId: config.productId,
                    deviceName: config.deviceName || data.deviceName,
                    devicePsk: config.devicePsk || data.devicePsk,
                };
                node.send({ payload: { ...data, ...replaceData } });
            })
            

        });
    }
    RED.nodes.registerType("device info",DeviceInfoHandler);
}