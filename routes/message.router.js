const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../middlewares/auth.middleware");
const advancedResults = require("../middlewares/advancedResults");
const messageController = require("../controllers/message.controller");
const Message = require("../models/Message");

router.get(
  "/",
  verifyAccessToken,
  advancedResults(Message, [
    { path: "sender", select: "_id displayname avatarLink" },
  ]),
  messageController.getMessageByConversation
);

module.exports = router;
