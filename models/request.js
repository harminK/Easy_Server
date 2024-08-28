import mongoose, { Schema, model, Types } from "mongoose";

const requestSchema = new Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },

    sender: {
      type: Types.ObjectId,
      ref: "Users",
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Users",
    },
    receiver: { type: Types.ObjectId, ref: "Chats", required: true },
  },
  { timestamps: true }
);

const Requests = mongoose.models.Requests || model("Requests", requestSchema);

export default Requests;
