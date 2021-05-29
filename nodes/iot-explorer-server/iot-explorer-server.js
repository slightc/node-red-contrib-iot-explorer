const mqtt = require('mqtt');
const createNamePwd = require('../../lib/createNamePwd');
const events = require('events'); 

const replaceTopicProperty = (topic, device) => {
    if (topic && topic.replace) {
        let out = topic.replace('${productId}', '{productId}').replace('${deviceName}', '{deviceName}')
            .replace('{productId}', device.productId).replace('{deviceName}', device.deviceName)
        return out;
    }
    return topic;
}

module.exports = function (RED) {
    function IOTServerNode(n) {
        RED.nodes.createNode(this, n);

        const node = this;

        node.emitter = new events.EventEmitter();

        node.createClient = ({ productId, deviceName, devicePsk }) => {
            const mqttUrl = `mqtt://${productId}.iotcloud.tencentdevices.com`;

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