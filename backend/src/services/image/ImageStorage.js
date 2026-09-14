class ImageStorage {
  async upload() { throw new Error("ImageStorage.upload must be implemented"); }
  async remove() { throw new Error("ImageStorage.remove must be implemented"); }
}
module.exports = ImageStorage;
