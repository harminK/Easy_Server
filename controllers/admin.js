import err from "../middlewares/error.js";
import Users from "../models/user.js";
import Chats from "../models/chat.js";
import Message from "../models/message.js";
import HTTP from "./httpStatusCode.js";
import ErrorHandler from "../utils/utilits.js";
import JWT from "jsonwebtoken";
import features from "../utils/features.js";

const adminLogin = err.tryCa(async (req, res, next) => {
  const { secretKey } = req.body;

  const adminSecretKey = process.env.ADMIN_SECRET_KEY || "6packprogrammer";

  const isMatch = secretKey === adminSecretKey;

  if (!isMatch) {
    return next(new ErrorHandler(HTTP.UNAUTHORIZED, "Invalid Admin Key"));
  }

  const token = JWT.sign(secretKey, process.env.JWT_KEY);

  return res
    .status(HTTP.SUCCESS)
    .cookie("whatsapp-admin-token", token, {
      ...features.cookieOptiones,
      maxAge: 1000 * 60 * 15,
    })
    .json({
      success: true,
      message: "Welcome BOSS",
    });
});

const allUsers = err.tryCa(async (req, res) => {
  const user = await Users.find();

  const transFromUsers = await Promise.all(
    user.map(async ({ name, username, avatar, _id }) => {
      const [groupCount, friendCount] = await Promise.all([
        Chats.countDocuments({ groupchat: true, member: _id }),
        Chats.countDocuments({ groupchat: false, member: _id }),
      ]);

      return {
        name,
        username,
        _id,
        avatar: avatar.url,
        groupCount,
        friendCount,
      };
    })
  );

  return res.status(HTTP.SUCCESS).json({
    success: "success",
    allUsers: transFromUsers,
  });
});

const allChats = err.tryCa(async (req, res) => {
  const chat = await Chats.find({})
    .populate("member", "name avatar")
    .populate("creator", "name avatar");

  const transFromChat = await Promise.all(
    chat.map(async ({ member, _id, groupchat, name, creator }) => {
      const totalMessage = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupchat,
        name,
        avatar: member.slice(0, 3).map((member) => member.avatar.url),
        member: member.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMember: member.length,
        totalMessage,
      };
    })
  );

  return res.status(HTTP.SUCCESS).json({
    status: "success",
    chat: transFromChat,
  });
});

const allMessage = err.tryCa(async (req, res) => {
  const message = await Message.find({})
    .populate("chat", "name groupchat")
    .populate("sender", "name avatar");

  const transFromMessage = message.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat?._id,
      groupchat: chat?.groupchat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    })
  );

  return res.status(HTTP.SUCCESS).json({
    status: "success",
    message: transFromMessage,
  });
});

const adminLoout = err.tryCa(async (req, res, next) => {
  return res
    .status(HTTP.SUCCESS)
    .cookie("whatsapp-admin-token", "", {
      ...features.cookieOptiones,
      maxAge: 0,
    })
    .json({
      success: true,
      message: "Logout successfully",
    });
});

const getDashboardStsts = err.tryCa(async (req, res) => {
  const [groupCount, userCount, messageCount, totalChatCount] =
    await Promise.all([
      Chats.countDocuments({ groupchat: true }),
      Users.countDocuments(),
      Message.countDocuments(),
      Chats.countDocuments(),
    ]);

  const today = new Date();

  const last7Day = new Date();

  last7Day.setDate(last7Day.getDate() - 7);

  const last7DayMessage = await Message.find({
    createdAt: {
      $gte: last7Day,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);

  const dayInMilisecond = 1000 * 60 * 60 * 24;

  last7DayMessage.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMilisecond;

    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupCount,
    userCount,
    messageCount,
    totalChatCount,
    messageChart: messages,
  };

  return res.status(HTTP.SUCCESS).json({
    status: "success",
    stats,
  });
});

const adminTrue = err.tryCa(async (req, res) => {
  return res.status(HTTP.SUCCESS).json({
    admin: true,
  });
});

export default {
  allUsers,
  allChats,
  allMessage,
  getDashboardStsts,
  adminLogin,
  adminLoout,
  adminTrue,
};
