const cloudinary = require("../../config/cloudinary");
const { getEnv } = require("../../config/env");
const ImageStorage = require("./ImageStorage");
class CloudinaryStorage extends ImageStorage {
  async upload(file, { restaurantId }) {
    if (!file?.buffer) return null;
    const { cloudName, apiKey, apiSecret } = getEnv().cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      throw Object.assign(new Error("Image storage is not configured"), { status: 503 });
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: `restaurant-management/restaurants/${restaurantId}/menu`,
          transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  async remove(publicId) {
    if (!publicId) return null;
    return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  }
}
module.exports = CloudinaryStorage;
