
const nodeConnect =(node) => {
    node.status({ fill: "green", shape: "dot", text: `已连接 ${node.server ? node.server.name : ''}` });
}
const nodeDisconnect =(node) => {
    node.status({ fill: "red", shape: "ring", text: `未连接 ${node.server ? node.server.name : ''}` });
}

module.exports = function(RED) {
    function IotExplorerConnect(config) {
        RED.nodes.createNode(this, config);
        
        this.server = RED.nodes.getNode(config.server);

        var node = this;

        nodeDisconnect(node);

        node.on('input', function (msg, send, done) {
            if (!node.server) {
                return
            }
            if (node.server.client && node.server.client.connected) {
                try {
                    node.server.client.end();
                } catch { }
            }
            node.server.createClient(msg.payload).then((client) => {
                nodeConnect(node);
                client.on("close", () => {
                    nodeDisconnect(node);
                    node.send([null, { payload: "close" }])
                })
                node.send([{ payload: "connected" }, null])
            }).catch((err) => {
                if (done) { // Node-RED 1.0 compatible
                    done(err);
                } else { // Node-RED 0.x compatible
                    node.error(err, msg);
                }
            })
        });
    }
    RED.nodes.registerType("iot connect",IotExplorerConnect);
}