const asyncHandle = require("../middlewares/asyncHandle");

module.exports.getMessageByConversation = asyncHandle(
  async (req, res, next) => {
    res.status(200).json(res.advancedResults);
  }
);
