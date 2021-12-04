const errorHandle = require("../middlewares/errorHandle");
const authRouter = require("./auth.router");
const conversationRouter = require("./conversation.router");
const messageRouter = require("./message.router");
const userRouter = require("./user.router");

module.exports = (app) => {
  app.use("/api/auth", authRouter);

  app.use("/api/conversations", conversationRouter);

  app.use("/api/messages", messageRouter);

  app.use("/api/users", userRouter);

  app.use(errorHandle);
};
