import app from "../app.js";

const getOtherMember = (member, userId) => {
  return member.find((member) => member._id.toString() !== userId.toString());
};

const getSockets = (user = []) => {
  const sockets = user.map((users) => app.userSocketIds.get(users.toString()));

  return sockets;
};

const getBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const generateOtp = () => {
  // const OTP = Math.floor(100000 + Math.random() * 900000);

  let numbers = "0123456789";
  let OTP = "";

  for (let i = 0; i < 6; i++) {
    OTP += numbers[Math.floor(Math.random() * 10)];
  }

  return OTP;
};

export default { getOtherMember, getSockets, getBase64, generateOtp };
