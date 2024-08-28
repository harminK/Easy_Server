import mongoose, { Schema, model } from "mongoose";

const OtpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["register", "forget-password"],
      required: true,
    },
    otp: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.models.Otp || model("Otp", OtpSchema);

export default Otp;
