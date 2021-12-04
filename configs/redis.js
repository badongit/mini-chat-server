const redis = require("redis");
const configuration = require("./configuration");

const redisClient = redis.createClient({
  socket: { port: configuration.redis.PORT, host: configuration.redis.HOST },
  password: configuration.redis.PASSWORD,
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.log(`Error to connect Redis: ${error.message}`);
});

module.exports = redisClient;
