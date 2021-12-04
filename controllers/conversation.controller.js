const Conversation = require("../models/Conversation");
const asyncHandle = require("../middlewares/asyncHandle");
const ErrorResponse = require("../helpers/ErrorResponse");
const isFileTypeAllow = require("../helpers/fileTypeAllow");
const driveServices = require("../googledrive/services");

module.exports.changePhotoLink = asyncHandle(async (req, res, next) => {
  const photoFile = req.files.photo;

  if (!photoFile) {
    return next(new ErrorResponse("bad request", 400));
  }

  if (!isFileTypeAllow(photoFile.mimetype)) {
    return next(
      new ErrorResponse(`File type ${photoFile.mimetype} is not supported`, 400)
    );
  }

  const conversation = await Conversation.findById(req.params.conversationId)
    .populate({ path: "members", select: "-username -avatarId" })
    .populate({ path: "admin", select: "-username -avatarId" })
    .populate("lastMessage");

  if (!conversation) {
    return next(new ErrorResponse("conversation not found", 404));
  }

  if (
    !(
      conversation.members.findIndex(
        (member) => member._id.toString() === req.user._id.toString()
      ) + 1
    )
  ) {
    return next(new ErrorResponse("forbidden", 403));
  }

  const response = await driveServices.uploadFileToDrive(photoFile, {
    name: conversation._id,
  });

  if (conversation.photoId) {
    await driveServices.deleteFileInDrive(conversation.photoId);
  }

  const fileId = response.data.id;
  let photoLink = await driveServices.generateLinkFileByID(fileId);
  photoLink = photoLink.replace("&export=download", "");

  conversation.photoLink = photoLink;
  conversation.photoId = fileId;
  await conversation.save();

  res.status(200).json({
    message: "changed photo successfully",
    data: {
      conversation,
    },
  });
});

module.exports.changeRole = asyncHandle(async (req, res, next) => {
  const { userId, role } = req.body;

  if (!role || !userId) {
    return next(new ErrorResponse("bad request", 400));
  }

  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(new ErrorResponse("bad request", 400));
  }

  const isMember = conversation.members.includes(userId);

  if (!isMember) {
    return next(new ErrorResponse("user isn't a member", 400));
  }

  const isAdmin = conversation.admin.includes(userId);

  if (role === "admin" && !isAdmin) {
    conversation.admin = conversation.admin.concat(userId);
    await conversation.save();
  }

  if (role === "member" && isAdmin) {
    conversation.admin = conversation.admin.filter(
      (ad) => ad._id.toString() !== userId
    );

    if (!conversation.admin.length) {
      conversation.admin = conversation.admin.concat(conversation.members[0]);
    }
    await conversation.save();
  }

  await conversation.populate([
    { path: "members", select: "-username -avatarId" },
    { path: "admin", select: "-username -avatarId" },
    "lastMessage",
  ]);

  res.status(200).json({
    message: "success",
    data: {
      conversation,
    },
  });
});
