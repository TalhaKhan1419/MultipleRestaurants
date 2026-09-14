const { v2: cloudinary } = require("cloudinary");
const { getEnv } = require("./env");

const { cloudinary: config } = getEnv();
if (config.cloudName && config.apiKey && config.apiSecret) {
  cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret });
}

module.exports = cloudinary;
