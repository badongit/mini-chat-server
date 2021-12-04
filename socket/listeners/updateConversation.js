const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const { SocketEvent, SocketMessage } = require("../constants");
const {
  SV_SEND_INVITATIONS_JOIN_CONVERSATION,
} = require("../constants/SocketEvent");

module.exports = (io, socket) => async (req) => {
  try {
    const { conversationId, title } = req;
    let newMembers = req.newMembers;

    const conversation = await Conversation.findById(conversationId);

    if (conversation.type === "private") {
      return socket.emit(SocketEvent.ERROR, {
        messsage: SocketMessage.CONVERSATION_IS_PRIVATE,
      });
    }

    if (title) {
      conversation.title = title;
    }

    newMembers = newMembers.filter(
      (newMember) => !conversation.members.includes(newMember)
    );

    const users = await User.find({ _id: { $in: newMembers } }).lean();

    newMembers = users.map((user) => user._id);

    conversation.members = conversation.members.concat(newMembers);
    await conversation.save();

    await conversation.populate([
      { path: "members", select: "-username -avatarId" },
      { path: "admin", select: "-username -avatarId" },
      "lastMessage",
    ]);

    io.sockets.emit(SV_SEND_INVITATIONS_JOIN_CONVERSATION, {
      conversationId: conversation._id,
      newMembers,
    });

    io.in(conversation._id.toString()).emit(
      SocketEvent.SV_SEND_CONVERSATION,
      conversation
    );
  } catch (error) {
    socket.emit(SocketEvent.ERROR, {
      message: error.message,
    });
  }
};
