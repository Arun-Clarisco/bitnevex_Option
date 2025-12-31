const Config = require("../config/config")
const CryptoJS = require("crypto-js");

exports.decryptRequestPayload = (keyId, encPayload) => {
    try {
        const secretKey = Config[`REACT_APP_${keyId}_ENCRYPTION_KEY`];
        var bytes = CryptoJS.AES.decrypt(encPayload, secretKey);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (error) {
        return false
    };
};