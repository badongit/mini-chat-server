const jwt = require("jsonwebtoken");
const ErrorResponse = require("../helpers/ErrorResponse");
const asyncHandle = require("./asyncHandle");
const configuration = require("../configs/configuration");
const User = require("../models/User");
const redisClient = require("../configs/redis");

module.exports.verifyAccessToken = asyncHandle(async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer")) {
    return next(new ErrorResponse("Invalid token", 401));
  }

  const token = authorization.split(" ")[1];

  const { id } = await jwt.verify(token, configuration.accessToken.SECRET);

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  req.user = user;
  next();
});

module.exports.verifyRefreshToken = asyncHandle(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse("Invalid token", 401));
  }

  const { id } = await jwt.verify(
    refreshToken,
    configuration.refreshToken.SECRET
  );

  const redisToken = await redisClient.get(id.toString());

  if (!redisToken) {
    return next(new ErrorResponse("Token not found", 404));
  }

  if (redisToken !== refreshToken) {
    return next(new ErrorResponse("Invalid token", 401));
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  req.user = user;
  next();
});
