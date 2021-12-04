const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../middlewares/auth.middleware");
const conversationController = require("../controllers/conversation.controller");

router.put(
  "/change-photo/:conversationId",
  verifyAccessToken,
  conversationController.changePhotoLink
);

router.put(
  "/change-role/:conversationId",
  verifyAccessToken,
  conversationController.changeRole
);
module.exports = router;
