const mongoose = require("mongoose");
const User = require("../../models/User");
const Message = require("../../models/Message");
const Conversation = require("../../models/Conversation");
const { SocketEvent, SocketMessage } = require("../constants");

module.exports = (io, socket) => async (req) => {
  const { userId, conversationId } = req;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
    }).session(session);
    const user = await User.findById(userId).lean();

    if (!conversation) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.CONVERSATION_NOT_FOUND,
      });
    }

    if (!conversation.members.includes(userId)) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.USER_NOT_FOUND_IN_CONVERSATION,
      });
    }

    if (
      socket.currentUser._id.toString() !== userId &&
      !conversation.admin.includes(socket.currentUser._id)
    ) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.FORBIDDEN,
      });
    }

    if (!user) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.USER_NOT_FOUND,
      });
    }

    conversation.members = conversation.members.filter(
      (member) => member.toString() !== userId
    );

    conversation.admin = conversation.admin.filter(
      (ad) => ad.toString() !== userId
    );

    if (!conversation.admin.length && conversation.members.length) {
      conversation.admin = [conversation.members[0]];
    }

    const messageArr = await Message.create(
      [
        {
          conversation: conversation._id,
          text: `${user.displayname} has left this conversation.`,
          type: "system",
        },
      ],
      { session }
    );

    const message = messageArr[0];
    conversation.lastMessage = message._id;

    await conversation.save();
    await conversation.populate([
      { path: "members", select: "-username -avatarId" },
      { path: "admin", select: "-username -avatarId" },
      "lastMessage",
    ]);

    await session.commitTransaction();

    io.in(conversation._id.toString()).emit(
      SocketEvent.SV_SEND_MESSAGE,
      message
    );

    io.in(conversation._id.toString()).emit(
      SocketEvent.SV_SEND_CONVERSATION,
      conversation
    );

    io.in(conversation._id.toString()).emit(
      SocketEvent.SV_SEND_USER_LEAVE_CONVERSATION,
      {
        conversationId: conversation._id,
        userId,
      }
    );

    if (socket.currentUser._id.toString() !== userId) {
      socket.leave(conversation._id.toString());
    }
  } catch (error) {
    await session.abortTransaction();

    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};
