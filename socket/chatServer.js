const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const configuration = require("../configs/configuration");
const User = require("../models/User");
const ErrorResponse = require("../helpers/ErrorResponse");
const { SocketEvent } = require("./constants/index");
const listeners = require("./listeners");

module.exports.listen = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      maxHttpBufferSize: 8e6,
    },
    transports: ["polling"],
  });

  // middleware auth
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth;

      const { id } = jwt.verify(token, configuration.accessToken.SECRET);

      const user = await User.findById(id);

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      socket.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  // socket connect
  io.on(SocketEvent.CONNECTION, async (socket) => {
    try {
      const user = await User.findById(socket.currentUser?._id);
      user.isOnline = true;
      await user.save();

      socket.emit(SocketEvent.SV_SEND_CUR_USER, user);
      io.sockets.emit(SocketEvent.SV_SEND_USER_CHANGE_STATUS, user);
    } catch (error) {
      console.log(error.message);
    }

    socket.on(SocketEvent.DISCONNECT, listeners.disconnect(io, socket));

    socket.on(
      SocketEvent.CLIENT_GET_CONVERSATIONS,
      listeners.getConversations(io, socket)
    );

    socket.on(
      SocketEvent.CLIENT_CREATE_CONVERSATION,
      listeners.createConversation(io, socket)
    );

    socket.on(SocketEvent.CLIENT_JOIN_ROOM, listeners.joinRoom(io, socket));

    socket.on(
      SocketEvent.CLIENT_UPDATE_CONVERSATION,
      listeners.updateConversation(io, socket)
    );

    socket.on(
      SocketEvent.CLIENT_LEAVE_CONVERSATION,
      listeners.leaveConversation(io, socket)
    );

    socket.on(
      SocketEvent.CLIENT_SEND_MESSAGE,
      listeners.sendMessage(io, socket)
    );
  });
};
