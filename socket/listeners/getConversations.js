require("../../models/User");
const Conversation = require("../../models/Conversation");
const { SocketEvent } = require("../constants");

module.exports = (io, socket) => async () => {
  try {
    const conversations = await Conversation.find({
      members: socket.currentUser._id,
    })
      .sort("updatedAt")
      .populate({ path: "members", select: "-username -avatarId" })
      .populate({ path: "admin", select: "-username -avatarId" })
      .populate("lastMessage")
      .lean();

    const rooms = conversations.map((conversation) =>
      conversation._id.toString()
    );
    socket.join(rooms);
    socket.emit(SocketEvent.SV_SEND_CONVERSATIONS, conversations);
  } catch (error) {
    console.log(error);
    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  }
};
