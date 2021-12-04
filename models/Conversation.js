const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    title: String,
    type: {
      type: String,
      required: [true, "type is required"],
      enum: {
        values: ["private", "group"],
        message: "type {VALUE} is not supported",
      },
      default: "private",
    },
    photoLink: {
      type: String,
      default:
        "https://drive.google.com/uc?id=1mYv3V2__mOIbEvg8C2B4_HvS-yl0z0mh",
    },
    photoId: String,
    members: [{ type: Schema.Types.ObjectId, ref: "users" }],
    admin: [{ type: Schema.Types.ObjectId, ref: "users" }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "messages",
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({
  title: "text",
});

module.exports = mongoose.model("conversations", ConversationSchema);
