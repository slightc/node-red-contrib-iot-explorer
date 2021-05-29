
module.exports = function (RED) {
    function IotDataOut(config) {
        RED.nodes.createNode(this, config);

        this.server = RED.nodes.getNode(config.server);
        this.pubType = config.pubType;

        var node = this;

        node.on('input', function (msg) {
            if (!node.server?.client?.connected) {
                return
            }
            const topic = config.pubTopic || `$thing/up/${config.pubType || 'property'}/{productId}/{deviceName}`;
            node.server?.publish(topic, JSON.stringify(msg.payload)).then(() => {
                node.send({ payload: "publish success" })
            }).catch(err => {
                console.log(err)
            })
        });
    }
    RED.nodes.registerType("iot data out", IotDataOut);
}