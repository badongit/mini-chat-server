require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  resetPassword: {
    SECRET: process.env.RESET_PASSWORD_SECRET,
    EXPIRED: +process.env.RESET_PASSWORD_EXPIRED || 10,
  },
  redis: {
    PORT: process.env.REDIS_PORT || 11962,
    HOST: process.env.REDIS_HOST,
    PASSWORD: process.env.REDIS_PASSWORD,
  },
  accessToken: {
    SECRET: process.env.ACCESS_TOKEN_SECRET,
    EXPIRED: process.env.ACCESS_TOKEN_EXPIRED || "20m",
  },
  refreshToken: {
    SECRET: process.env.REFRESH_TOKEN_SECRET,
    EXPIRED: process.env.REFRESH_TOKEN_EXPIRED || "60d",
  },
  gmail: {
    USER: process.env.GMAIL_USERNAME,
    PASS: process.env.GMAIL_PASSWORD,
  },
  drive: {
    CLIENT_ID: process.env.DRIVE_CLIENT_ID,
    CLIENT_SECRET: process.env.DRIVE_CLIENT_SECRET,
    REDIRECT_URI:
      process.env.DRIVE_REDIRECT_URI ||
      "https://developers.google.com/oauthplayground",
    REFRESH_TOKEN: process.env.DRIVE_REFRESH_TOKEN,
    PARENT: process.env.DRIVE_PARENT_ID || "1x85ZQid5x_Es0a-w9x6ZqXlmcZz8yAPe",
  },
  START: process.env.START || 0,
  LIMIT: process.env.LIMIT || 20,
  CLIENT_URI: process.env.CLIENT_URI || "http://localhost:3000",
};
