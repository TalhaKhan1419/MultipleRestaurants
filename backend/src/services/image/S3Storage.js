const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getEnv } = require("../../config/env");
const ImageStorage = require("./ImageStorage");
const crypto = require("crypto");

class S3Storage extends ImageStorage {
  getClient() {
    const { region, accessKeyId, secretAccessKey, bucket, endpoint, forcePathStyle } = getEnv().s3;
    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw Object.assign(
        new Error("AWS S3 storage is not properly configured. Missing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS_S3_BUCKET."),
        { status: 503 }
      );
    }

    const clientConfig = {
      region: region || "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
    }
    if (forcePathStyle !== undefined && forcePathStyle !== null && forcePathStyle !== "") {
      clientConfig.forcePathStyle = forcePathStyle === "true" || forcePathStyle === true;
    }

    const client = new S3Client(clientConfig);

    return { client, bucket, region: region || "us-east-1" };
  }

  extractKey(publicIdOrUrl) {
    if (!publicIdOrUrl) return null;
    if (typeof publicIdOrUrl !== "string") return null;
    if (publicIdOrUrl.startsWith("http://") || publicIdOrUrl.startsWith("https://")) {
      try {
        const parsed = new URL(publicIdOrUrl);
        let pathname = decodeURIComponent(parsed.pathname);
        if (pathname.startsWith("/")) pathname = pathname.slice(1);
        
        const { bucket } = getEnv().s3;
        if (bucket && pathname.startsWith(`${bucket}/`)) {
          pathname = pathname.slice(bucket.length + 1);
        }
        return pathname;
      } catch (_) {
        return publicIdOrUrl;
      }
    }
    return publicIdOrUrl;
  }

  async upload(file, { restaurantId }) {
    if (!file?.buffer) return null;

    const { client, bucket, region } = this.getClient();
    const { customUrl } = getEnv().s3;

    const fileExt = file.originalname ? file.originalname.split(".").pop().toLowerCase() : "jpg";
    const sanitizedExt = ["png", "jpeg", "jpg", "webp", "gif", "svg"].includes(fileExt) ? fileExt : "jpg";
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const key = `restaurant-management/restaurants/${restaurantId || "general"}/menu/${uniqueSuffix}.${sanitizedExt}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || `image/${sanitizedExt}`,
    });

    await client.send(command);

    let url;
    if (customUrl) {
      const cleanCustomUrl = customUrl.endsWith("/") ? customUrl.slice(0, -1) : customUrl;
      url = `${cleanCustomUrl}/${key}`;
    } else {
      url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    return { url, publicId: key };
  }

  async remove(publicIdOrUrl) {
    const key = this.extractKey(publicIdOrUrl);
    if (!key) return null;

    try {
      const { client, bucket } = this.getClient();
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await client.send(command);
    } catch (err) {
      console.warn("S3 Storage image deletion warning:", err.message);
      return null;
    }
  }
}

module.exports = S3Storage;
