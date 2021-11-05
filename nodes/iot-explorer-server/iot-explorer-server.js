const mqtt = require('mqtt');
const createNamePwd = require('../../lib/createNamePwd');
const events = require('events'); 

const parsePropertiesToString = (str, property) => {
    if (str && str.replace) {
        let out = str.replace(/\$?{.*?}/g, (value)=>{
            const key = value.replace(/(^\$?{|}$)/g,'')
            return (property && property[key]) || '';
        });
        return out;
    }
    return str;
}

const replaceTopicProperty = (topic, device) => {
    return parsePropertiesToString(topic,device);
}

module.exports = function (RED) {
    function IOTServerNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.name = config.name || '';

        node.emitter = new events.EventEmitter();

        node.createClient = (deviceInfo) => {
            const { productId, deviceName, devicePsk } = deviceInfo;
            let mqttUrl = config.mqttUrl || 'mqtt://{productId}.iotcloud.tencentdevices.com';
            mqttUrl = parsePropertiesToString(mqttUrl,deviceInfo)

            console.log('mqttUrl', mqttUrl);

            if (node.client) {
                try {
                    node.client.end();
                } catch { }
            }
            const client = mqtt.connect(mqttUrl, {
                clientId: productId + deviceName,
                ...createNamePwd(productId, deviceName, devicePsk),
            })

            node.client = client;
            node.device = { productId, deviceName, devicePsk };

            client.on('message', (topic, message) => {
                node.emitter.emit(topic, message);
            })

            return new Promise((resolve, reject) => {
                client.on('connect', () => {
                    resolve(client)
                })
                client.on('error', (err) => {
                    reject(err);
                })
            })
        }

        node.subscribe = (topic, callback) => {
            const fixTopic = replaceTopicProperty(topic, node.device);
            node.emitter.on(fixTopic, (message) => callback(message, fixTopic));
            node.client.subscribe(fixTopic, () => { })
        }
        node.publish = (topic, message) => {
            const fixTopic = replaceTopicProperty(topic, node.device);
            return new Promise((resolve, reject) => {
                node.client.publish(fixTopic, message, null, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            })
        }

        node.on('close',() => {
            node.client.end();
            node.emitter.removeAllListeners();
        })
    }
    RED.nodes.registerType("iot-explorer-server", IOTServerNode);
}