const { getEnv } = require("../../config/env");
const CloudinaryStorage = require("./CloudinaryStorage");
const S3Storage = require("./S3Storage");

class StorageFactory {
  static getStorage(overrideDriver) {
    const { imageStorage } = getEnv();
    const driver = (overrideDriver || imageStorage || "cloudinary").toLowerCase();

    if (driver === "s3") {
      return new S3Storage();
    }

    return new CloudinaryStorage();
  }

  static async upload(file, options) {
    const storage = StorageFactory.getStorage();
    return storage.upload(file, options);
  }

  static async remove(publicIdOrUrl) {
    if (!publicIdOrUrl) return null;

    const str = String(publicIdOrUrl);

    // If explicit URL, route directly to appropriate provider
    if (str.startsWith("http://") || str.startsWith("https://")) {
      if (str.includes("cloudinary.com")) {
        const cloudinaryStorage = new CloudinaryStorage();
        return cloudinaryStorage.remove(str);
      }
      if (str.includes("amazonaws.com") || str.includes(".s3.")) {
        const s3Storage = new S3Storage();
        return s3Storage.remove(str);
      }
    }

    const { imageStorage } = getEnv();
    const currentDriver = (imageStorage || "cloudinary").toLowerCase();
    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(str);

    // S3 keys have file extensions while Cloudinary public IDs standardly do not
    if (hasImageExtension && currentDriver === "s3") {
      const s3Storage = new S3Storage();
      return s3Storage.remove(str);
    }

    const storage = StorageFactory.getStorage();
    try {
      return await storage.remove(str);
    } catch (err) {
      console.warn(`StorageFactory removal warning with ${currentDriver}:`, err.message);
      try {
        const altDriver = currentDriver === "s3" ? "cloudinary" : "s3";
        const altStorage = StorageFactory.getStorage(altDriver);
        return await altStorage.remove(str);
      } catch (_) {
        return null;
      }
    }
  }
}

module.exports = StorageFactory;
