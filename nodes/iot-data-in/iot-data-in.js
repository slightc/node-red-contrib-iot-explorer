
module.exports = function (RED) {
    function IotDataIn(config) {
        RED.nodes.createNode(this, config);

        this.server = RED.nodes.getNode(config.server);
        this.subType = config.subType;

        var node = this;

        node.on('input', function (msg) {
            if (!(node.server && node.server.client && node.server.client.connected)) {
                return
            }
            const topic = config.subTopic || `$thing/down/${config.subType || 'property'}/{productId}/{deviceName}`;
            node.server.subscribe(topic, (message) => {
                let data = message;
                try {
                    data = JSON.parse(message);
                } catch { }
                node.send({ payload: data })
            })
        });
    }
    RED.nodes.registerType("iot data in", IotDataIn);
}