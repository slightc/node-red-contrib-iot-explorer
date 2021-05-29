
const nodeConnect =(node) => {
    node.status({ fill: "green", shape: "dot", text: "已连接" });
}
const nodeDisconnect =(node) => {
    node.status({ fill: "red", shape: "ring", text: "未连接" });
}

module.exports = function(RED) {
    function IotExplorerConnect(config) {
        RED.nodes.createNode(this, config);

        this.server = RED.nodes.getNode(config.server);

        var node = this;

        nodeDisconnect(node);

        node.on('input', function (msg) {
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
            })
        });
    }
    RED.nodes.registerType("iot connect",IotExplorerConnect);
}