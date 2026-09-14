const required = ["DB_HOST", "DB_NAME", "DB_USER", "JWT_SECRET"];

function getEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    db: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || "restaurant_management",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    },
    jwt: { secret: process.env.JWT_SECRET || "development-only-secret", expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    cloudinary: { cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, apiSecret: process.env.CLOUDINARY_API_SECRET },
  };
}

module.exports = { getEnv };
