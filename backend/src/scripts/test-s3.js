require("dotenv").config();
const S3Storage = require("../services/image/S3Storage");
const { getEnv } = require("../config/env");

async function testS3Connection() {
  console.log("=== Testing AWS S3 Configuration ===");
  const env = getEnv();

  console.log("Current IMAGE_STORAGE setting:", env.imageStorage);
  console.log("AWS S3 Config:");
  console.log("  Region:          ", env.s3.region || "(not set)");
  console.log("  Access Key ID:   ", env.s3.accessKeyId ? `${env.s3.accessKeyId.slice(0, 4)}***` : "MISSING");
  console.log("  Secret Key:      ", env.s3.secretAccessKey ? "*****" : "MISSING");
  console.log("  Bucket Name:     ", env.s3.bucket || "MISSING");
  if (env.s3.endpoint) console.log("  Endpoint:        ", env.s3.endpoint);
  if (env.s3.customUrl) console.log("  Custom URL:      ", env.s3.customUrl);

  if (!env.s3.accessKeyId || !env.s3.secretAccessKey || !env.s3.bucket) {
    console.error("\n❌ Error: Missing required AWS S3 configuration in .env!");
    console.error("Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in backend/.env\n");
    process.exit(1);
  }

  const storage = new S3Storage();
  const dummyFile = {
    originalname: "test-image.png",
    mimetype: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
  };

  try {
    console.log("\n1. Testing Upload to S3 bucket...");
    const uploadResult = await storage.upload(dummyFile, { restaurantId: "test-suite" });
    console.log("  ✅ Upload successful!");
    console.log("  - Generated URL: ", uploadResult.url);
    console.log("  - Object Key:    ", uploadResult.publicId);

    console.log("\n2. Testing Deletion from S3 bucket...");
    await storage.remove(uploadResult.publicId);
    console.log("  ✅ Deletion successful!");

    console.log("\n🎉 AWS S3 integration test completed successfully!");
    console.log("You can now set IMAGE_STORAGE=s3 in backend/.env to switch image uploads to AWS S3.");
  } catch (err) {
    console.error("\n❌ AWS S3 Test Failed!");
    console.error("Error details:", err.message);
    if (err.$response) {
      console.error("HTTP Status Code:", err.$response.statusCode);
    }
    process.exit(1);
  }
}

testS3Connection();
