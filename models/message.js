import mongoose, { Schema, model, Types } from "mongoose";

const messageSchema = new Schema(
  {
    content: String,
    attachments: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    sender: {
      type: Types.ObjectId,
      ref: "Users",
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chats",
      required: true,
    },
  },
  { timestamps: true }
);

const Messages = mongoose.models.Messages || model("Messages", messageSchema);

export default Messages;
