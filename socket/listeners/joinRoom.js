const { SocketEvent, SocketMessage } = require("../constants");
const Conversation = require("../../models/Conversation");

module.exports = (io, socket) => async (req) => {
  try {
    const { conversationId } = req;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: socket.currentUser._id,
    })
      .populate({ path: "members", select: "-username -avatarId" })
      .populate({ path: "admin", select: "-username -avatarId" })
      .populate("lastMessage")
      .lean();

    if (!conversation) {
      return socket.emit(SocketEvent.ERROR, {
        message: SocketMessage.CONVERSATION_NOT_FOUND,
      });
    }

    socket.join(conversation._id.toString());
    socket.emit(SocketEvent.SV_SEND_CONVERSATION, conversation);
  } catch (error) {
    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  }
};
