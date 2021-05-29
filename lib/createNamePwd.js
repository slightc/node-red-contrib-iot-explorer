const crypto = require('crypto-js')
const randomString = require('./randomString')

const createUsernameAndPassword = function (productId, deviceName, devicePsk) {
    // 1. 生成 connid 为一个随机字符串，方便后台定位问题
    const connid = randomString(5);
    // 2. 生成过期时间，表示签名的过期时间,从纪元1970年1月1日 00:00:00 UTC 时间至今秒数的 UTF8 字符串
    const expiry = Math.round(new Date().getTime() / 1000) + 3600 * 24;
    // 3. 生成 MQTT 的 clientid 部分, 格式为 ${productid}${devicename}
    const clientId = productId + deviceName;
    // 4. 生成 MQTT 的 username 部分, 格式为 ${clientid};${sdkappid};${connid};${expiry}
    const username = `${clientId};21010406;${connid};${expiry}`;
    //5.  对 username 进行签名，生成token、根据物联网通信平台规则生成 password 字段
    const rawKey = crypto.enc.Base64.parse(devicePsk);       // 对设备密钥进行base64解码
    const token = crypto.HmacSHA1(username, rawKey);
    const password = token.toString(crypto.enc.Hex) + ";hmacsha1";

    return {
        username,
        password,
    }
}

module.exports = createUsernameAndPassword;