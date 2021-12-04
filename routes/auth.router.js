const express = require("express");
const authController = require("../controllers/auth.controller");
const router = express.Router();
const {
  verifyRefreshToken,
  verifyAccessToken,
} = require("../middlewares/auth.middleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/token", verifyRefreshToken, authController.getToken);

router
  .route("/profile", verifyAccessToken)
  .get(verifyAccessToken, authController.getMe)
  .put(verifyAccessToken, authController.updateProfile);

router.put(
  "/change-password",
  verifyAccessToken,
  authController.changePassword
);

router.post("/forgot-password", authController.forgotPassword);

router.put("/reset-password/:resetToken", authController.resetPassword);

router.put("/avatar/upload", verifyAccessToken, authController.changeAvatar);

router.get("/logout", verifyAccessToken, authController.logOut);

module.exports = router;
