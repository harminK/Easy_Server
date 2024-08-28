import mongoose, { Schema, model, Types } from "mongoose";

const chatSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    groupchat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Types.ObjectId,
      ref: "Users",
    },
    member: [
      {
        type: Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  { timestamps: true }
);

const Chats = mongoose.models.Chats || model("Chats", chatSchema);

export default Chats;
