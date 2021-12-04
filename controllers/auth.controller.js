const User = require("../models/User");
const asyncHandle = require("../middlewares/asyncHandle");
const ErrorResponse = require("../helpers/ErrorResponse");
const sendMail = require("../helpers/sendMail");
const crypto = require("crypto");
const configuration = require("../configs/configuration");
const driveServices = require("../googledrive/services");
const isFileTypeAllow = require("../helpers/fileTypeAllow");
const redisClient = require("../configs/redis");

module.exports.register = asyncHandle(async (req, res, next) => {
  const { username, password, email } = req.body;

  const user = await User.create({
    username,
    password,
    email,
    displayname: username,
  });

  const accessToken = user.signAccessToken();
  const refreshToken = await user.signRefreshToken();

  res.status(201).json({
    message: "registered successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

module.exports.login = asyncHandle(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new ErrorResponse("Invalid username or password", 400));
  }

  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid username or password", 400));
  }

  if (!user.matchPassword(password)) {
    return next(new ErrorResponse("Invalid username or password", 400));
  }

  const accessToken = user.signAccessToken();
  const refreshToken = await user.signRefreshToken();

  res.status(200).json({
    message: "signed in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

module.exports.getToken = asyncHandle(async (req, res, next) => {
  const accessToken = req.user.signAccessToken();

  res.status(200).json({
    message: "token has been refreshed successfully",
    data: {
      accessToken,
    },
  });
});

module.exports.getMe = asyncHandle(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    data: {
      user,
    },
  });
});

module.exports.updateProfile = asyncHandle(async (req, res, next) => {
  const { email, displayname } = req.body;
  const fieldsUpdate = {
    email,
    displayname,
  };

  for (let key in fieldsUpdate) {
    if (!fieldsUpdate[key]) {
      delete fieldsUpdate[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, fieldsUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: "updated profile successfully",
    data: {
      user,
    },
  });
});

module.exports.changePassword = asyncHandle(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { user } = req;
  console.log({ oldPassword, newPassword });

  if (!(oldPassword && newPassword)) {
    return next(new ErrorResponse("Invalid password", 400));
  }

  if (oldPassword === newPassword) {
    return next(
      new ErrorResponse(
        "The new password must be different from the current password",
        400
      )
    );
  }

  if (!user.matchPassword(oldPassword)) {
    return next(new ErrorResponse("Invalid password", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    message: "Changed password successfully",
  });
});

module.exports.forgotPassword = asyncHandle(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse("Invalid email", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const resetPasswordToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${configuration.CLIENT_URI}/reset-password/${resetPasswordToken}`;
  const html = `<p>Vui lòng click vào đây ${resetURL} để cập nhật lại mật khẩu. 
  Link tồn tại trong ${configuration.resetPassword.EXPIRED} phút.</p>`;

  const options = {
    email,
    subject: "Quên mật khẩu ?",
    html,
  };

  await sendMail(options);

  res.status(200).json({
    message: "check your email",
  });
});

module.exports.resetPassword = asyncHandle(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256", configuration.resetPassword.SECRET)
    .update(req.params.resetToken)
    .digest("hex");

  if (!resetPasswordToken) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpired: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpired = undefined;
  await user.save();

  res.status(200).json({
    message: "Changed password successfully",
  });
});

module.exports.changeAvatar = asyncHandle(async (req, res, next) => {
  const avatarFile = req.files.avatar;
  const user = await User.findById(req.user._id);

  if (!isFileTypeAllow(avatarFile.mimetype)) {
    return next(
      new ErrorResponse(`file type ${avatarFile.mimetype} is not supported`)
    );
  }

  const response = await driveServices.uploadFileToDrive(avatarFile, {
    name: user._id,
  });

  if (user.avatarId) {
    await driveServices.deleteFileInDrive(user.avatarId);
  }

  const fileId = response.data.id;

  let avatarLink = await driveServices.generateLinkFileByID(fileId);
  avatarLink = avatarLink.replace("&export=download", "");

  user.avatarLink = avatarLink;
  user.avatarId = fileId;
  await user.save();

  res.json({
    message: "Changed avatar successfully",
    data: {
      user,
    },
  });
});

module.exports.logOut = asyncHandle(async (req, res, next) => {
  await redisClient.del(req.user._id.toString());

  res.status(200).json({
    message: "Log out successfully",
  });
});
