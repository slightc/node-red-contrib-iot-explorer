const crypto = require('crypto-js')
const axios = require('axios')

function aesDecrypt(word, secret) {
    const iv = crypto.enc.Utf8.parse('0000000000000000');
    const key = crypto.enc.Utf8.parse(secret.slice(0, 16));
    const decrypt = crypto.AES.decrypt(word, key, { iv: iv, mode: crypto.mode.CBC });
    return decrypt.toString(crypto.enc.Utf8).replace(/[\0\s]/g,'');
}

module.exports = function (RED) {
    function DeviceRegisterHandler(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function (msg) {

            let nonce = Math.round(Math.random() * 10000)
            let timestamp = Math.floor(new Date().getTime() / 1000);
            let signSource = `deviceName=${msg.payload.deviceName}`
                + `&nonce=${nonce}`
                + `&productId=${msg.payload.productId}`
                + `&timestamp=${timestamp}`;

            let signature = crypto.HmacSHA1(signSource, config.productSecret).toString(crypto.enc.Hex);
            signature = crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(signature));

            let data = {
                productId: msg.payload.productId,
                deviceName: msg.payload.deviceName,
                nonce,
                timestamp,
                signature,
            }

            axios({
                method: 'POST',
                url: config.registerUrl || 'https://ap-guangzhou.gateway.tencentdevices.com/register/dev',
                headers: {
                    'Accept': 'text/xml,application/json;*/*',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: JSON.stringify(data),
            }).then((response) => {
                if (!response.data.payload) {
                    return Promise.reject();
                }
                const info = aesDecrypt(response.data.payload, config.productSecret)
                let infoObj = {};
                try {
                    infoObj = JSON.parse(String(info));
                } catch (e) {
                    console.log(e)
                    console.log(info,info.length,infoObj)
                }
                if (infoObj.psk) {
                    return Promise.resolve(infoObj.psk);
                }
                return Promise.reject();
            }).then((data) => {
                node.send({
                    payload: {
                        type: "update",
                        data: {
                            devicePsk: data
                        }
                    }
                })
            })
        });
    }
    RED.nodes.registerType("device reg", DeviceRegisterHandler);
}