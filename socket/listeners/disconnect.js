const User = require("../../models/User");
const { SocketEvent } = require("../constants");
module.exports = (io, socket) => async () => {
  try {
    const user = await User.findById(socket.currentUser._id);

    user.isOnline = false;
    await user.save();

    io.sockets.emit(SocketEvent.SV_SEND_USER_CHANGE_STATUS, user);
  } catch (error) {
    console.log(error.message);
  }
};
