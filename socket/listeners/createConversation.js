const mongoose = require("mongoose");
const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const { SocketEvent, SocketMessage } = require("../constants");

module.exports = (io, socket) => async (req) => {
  try {
    const { type } = req;
    let newMembers = [...req.newMembers];
    let title = req.title;
    const user = await User.findById(socket.currentUser._id);
    const admin = [user];

    if (type === "group" && newMembers.length <= 2) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.CONVERSATION_CREATION_FAILED,
      });
    }

    if (type === "private") {
      if (newMembers.length > 2) {
        return socket.emit(SocketEvent.ERROR, {
          message: SocketMessage.CONVERSATION_CREATION_FAILED,
        });
      }

      const oldConversation = await Conversation.find({
        members: { $all: newMembers },
        type: "private",
      });

      if (oldConversation) {
        return socket.emit(SocketEvent.ERROR, {
          message: SocketMessage.CONVERSATION_CREATION_FAILED,
        });
      }
    }

    const users = await User.find({ _id: { $in: newMembers } }).lean();
    newMembers = users.map((user) => user._id);

    if (!title) {
      const displaynameMembers = members.map((member) => member.displayname);
      title = displaynameMembers.join(", ");
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const conversationArr = await Conversation.create(
        [
          {
            type,
            members: newMembers,
            title,
            admin,
          },
        ],
        { session }
      );
      const conversation = conversationArr[0];

      const messageArr = await Message.create(
        [
          {
            conversation: conversation._id,
            text: `${user.displayname} has created this conversation.`,
            type: "system",
          },
        ],
        { session }
      );
      const message = messageArr[0];

      conversation.lastMessage = message._id;
      await conversation.save();
      await session.commitTransaction();

      io.sockets.emit(SocketEvent.SV_SEND_INVITATIONS_JOIN_CONVERSATION, {
        conversationId: conversation._id,
        newMembers: conversation.members,
      });
    } catch (error) {
      await session.abortTransaction();

      socket.emit(SocketEvent.ERROR, {
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  }
};
