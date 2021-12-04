const express = require("express");
const router = express.Router();
const advancedResults = require("../middlewares/advancedResults");
const User = require("../models/User");
const userController = require("../controllers/user.controller");

router.get("/", advancedResults(User), userController.getUsers);

module.exports = router;
