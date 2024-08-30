import { compare } from "bcrypt";
import Users from "../models/user.js";
import HTTP from "./httpStatusCode.js";
import err from "../middlewares/error.js";
import features from "../utils/features.js";
import ErrorHandler from "../utils/utilits.js";
import Requests from "../models/request.js";
import Chats from "../models/chat.js";
import event from "../constants/event.js";
import helper from "../lib/helper.js";
import Otp from "../models/otp.js";
import bcrypt from "bcrypt";

//User login
const login = err.tryCa(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await Users.findOne({ username }).select("+password");

  if (!user) {
    return next(
      new ErrorHandler(HTTP.NOT_FOUND, "Invalied Username or Password")
    );
  }

  const meatchPassword = await compare(password, user.password);

  if (!meatchPassword) {
    return next(
      new ErrorHandler(HTTP.NOT_FOUND, "Invalied Username or Password")
    );
  }

  if (!user.userverified) {
    await Otp.deleteMany({ email: user.email });

    const otpcode = helper.generateOtp();

    await Otp.create({ email: user.email, category: "register", otp: otpcode });

    features.sendMail(otpcode, user.email);

    return next(new ErrorHandler(HTTP.NOT_FOUND, "Please Verify Your Email"));
  }

  features.sendToken(res, req, user, HTTP.SUCCESS, "User Login Successs Fully");
});
// Creating  new User and save cookie
const newUsers = err.tryCa(async (req, res, next) => {
  const { name, username, password, bio, email } = req.body;

  const file = req.file;

  if (!file) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Please Upload Profile Photo")
    );
  }

  const nameExists = await Users.findOne({ name }).select(
    "-password -avatar -username -bio -_id -createdAt -updatedAt -__v"
  );

  const emailExists = await Users.findOne({ email }).select(
    "-password -avatar -bio -name -_id -createdAt -updatedAt -__v -name -username"
  );

  const usernameExists = await Users.findOne({ username }).select(
    "-password -avatar -bio -name -_id -createdAt -updatedAt -__v -name -email"
  );

  if (nameExists) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "User Already Exists"));
  }

  if (emailExists) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "User Already Exists"));
  }

  if (usernameExists) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "User Already Exists"));
  }

  if (password.length < 8) {
    return next(
      new ErrorHandler(
        HTTP.BAD_REQUEST,
        "Password must be at least 8 characters"
      )
    );
  }

  const result = await features.uploadFilesToCloudeinary([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const otpcode = helper.generateOtp();

  features.sendMail(otpcode, email);

  const category = "register";

  const user = await Users.create({
    name,
    bio,
    username,
    password,
    avatar,
    email,
  });

  await Otp.deleteMany({ email: user.email });

  await Otp.create({
    email,
    category,
    otp: otpcode,
  });

  res.status(HTTP.CREATED).json({
    success: true,
    user,
    category,
    message: "User Created Successs Fully",
  });
});

const otpVerification = err.tryCa(async (req, res, next) => {
  const { email, category, otP } = req.body;

  if (!email || !category || !otP) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Please Provide All Fields")
    );
  }

  const otp = await Otp.findOne({ email, category });

  if (!otp) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "OTP not found"));
  }

  if (otp.otp !== otP) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "Invalid OTP"));
  }

  await Users.findOneAndUpdate(
    { email },
    {
      userverified: true,
    }
  );

  const user = await Users.findOne({ email });

  await Otp.deleteMany({ email });

  features.sendToken(
    res,
    req,
    user,
    HTTP.CREATED,
    "User Created Successs Fully"
  );
});

const userverified = err.tryCa(async (req, res, next) => {
  const { username, otP } = req.body;

  console.log(username, otP);

  const users = await Users.findOne({ username });

  const otp = await Otp.findOne({ email: users.email, category: "register" });

  if (!otp) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "OTP not found"));
  }

  if (otp.otp !== otP) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "Invalid OTP"));
  }

  const user = await Users.findOneAndUpdate(
    { username },
    { userverified: true }
  );

  await Otp.deleteMany({ email: users.email });

  features.sendToken(res, req, user, HTTP.SUCCESS, "User Login Successs Fully");
});

const forgotPassword = err.tryCa(async (req, res, next) => {
  const { email, username, conformpassword } = req.body;

  const user = await Users.findOne({ email, username });

  if (!user) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "User Not Found"));
  }

  if (conformpassword.length < 8) {
    return next(
      new ErrorHandler(
        HTTP.BAD_REQUEST,
        "Password must be at least 8 characters"
      )
    );
  }

  await Otp.deleteMany({ email: user.email });

  const otp = helper.generateOtp();

  features.sendMail(otp, email);

  await Otp.create({ email: user.email, category: "forget-password", otp });

  res.status(HTTP.SUCCESS).json({
    success: true,
    message: "OTP Sent SuccessFully",
  });
});

const verifyFrogetOtp = err.tryCa(async (req, res, next) => {
  const { email, otP, conformpassword } = req.body;

  const otp = await Otp.findOne({ email, category: "forget-password" });

  if (!otp) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "OTP not found"));
  }

  if (otp.otp !== otP) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "Invalid OTP"));
  }

  await Otp.deleteMany({ email, category: "forget-password" });

  const password = await bcrypt.hash(conformpassword, 10);

  await Users.findOneAndUpdate({ email }, { password });

  await res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Password Updated SuccessFully",
  });
});

const getMyProfile = err.tryCa(async (req, res) => {
  const user = await Users.findById(req.user);

  if (!user) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "User not found"));
  }

  res.status(HTTP.SUCCESS).json({
    success: true,
    message: user,
  });
});
const logOut = (req, res) => {
  res
    .status(HTTP.SUCCESS)
    .cookie("whatsapp-token", "", { ...features.cookieOptiones, maxAge: 0 })
    .json({
      success: true,
      message: "Logout Success fully",
    });
};

const serachUser = err.tryCa(async (req, res, next) => {
  const { name = "" } = req.query;

  // finding all my chats
  const myChats = await Chats.find({
    groupchat: false,
    member: req.user,
  });

  // extracting all users from my chats means friends or people i have chatted with
  const allUsersFromMyChats = myChats.flatMap((i) => i.member);

  // finding all users except me and my friend
  const allUserExceptMeAndFriends = await Users.find({
    _id: { $nin: allUsersFromMyChats.concat(req.user) }, // _id: { $nin: allUsersFromMyChats }
    name: { $regex: name, $options: "i" },
    userverified: true,
  });

  // modifying the response
  const users = allUserExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: users,
  });
});

const sendFriendRequest = err.tryCa(async (req, res, next) => {
  const { userId } = req.body;

  const request = await Requests.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });

  if (request) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "Request already sent"));
  }

  await Requests.create({
    sender: req.user,
    receiver: userId,
  });

  features.emitE(req, event.NEW_REQUEST, [userId]);

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Friend Request Sent",
  });
});

const acceptFriendRequest = err.tryCa(async (req, res, next) => {
  const { requestId, accept } = req.body;

  const request = await Requests.findById(requestId).populate("sender", "name");

  if (!request) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Request not found"));
  }

  if (request.receiver._id.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler(
        HTTP.UNAUTHORIZED,
        "You are not authorized to accept this request"
      )
    );
  }

  if (!accept) {
    await request.deleteOne();

    return res.status(HTTP.SUCCESS).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }

  const member = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chats.create({
      member,
      name: `${request.sender._id} - ${request.receiver._id}`,
    }),
    request.deleteOne(),
  ]);

  features.emitE(req, event.REFETCH_CHATS, member);

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getMyNotifications = err.tryCa(async (req, res, next) => {
  const request = await Requests.find({
    receiver: req.user,
  }).populate("sender", "name avatar");

  const allRequest = request.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: allRequest,
  });
});

const getMyFriend = err.tryCa(async (req, res, next) => {
  const chatId = req.query.chatId;

  const chat = await Chats.find({
    member: req.user,
    groupchat: false,
  }).populate("member", "name avatar");

  const friend = chat.map((chats) => {
    const otherUser = helper.getOtherMember(chats.member, req.user);

    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
  });

  if (chatId) {
    const chat = await Chats.findById(chatId);

    const availableFriends = friend.filter(
      (friends) => !chat.member.includes(friends._id)
    );

    return res.status(HTTP.SUCCESS).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    return res.status(HTTP.SUCCESS).json({
      success: true,
      friend,
    });
  }
});

export default {
  login,
  newUsers,
  getMyProfile,
  logOut,
  serachUser,
  sendFriendRequest,
  acceptFriendRequest,
  getMyNotifications,
  getMyFriend,
  otpVerification,
  userverified,
  forgotPassword,
  verifyFrogetOtp,
};
