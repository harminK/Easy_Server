import err from "../middlewares/error.js";
import ErrorHandler from "../utils/utilits.js";
import HTTP from "./httpStatusCode.js";
import Chats from "../models/chat.js";
import Users from "../models/user.js";
import event from "../constants/event.js";
import features from "../utils/features.js";
import helper from "../lib/helper.js";
import Messages from "../models/message.js";

const newGroupChat = err.tryCa(async (req, res, next) => {
  const { name, member } = req.body;

  if (member.length <= 2) {
    return next(
      new ErrorHandler(
        HTTP.BAD_REQUEST,
        "Group chat must have at least 3 members"
      )
    );
  }

  const allMember = [...member, req.user];

  await Chats.create({
    name,
    groupchat: true,
    creator: req.user,
    member: allMember,
  });

  features.emitE(req, event.ALERT, allMember, `Welcome to ${name} group`);
  features.emitE(req, event.REFETCH_CHATS, allMember);

  return res.status(HTTP.CREATED).json({
    success: true,
    message: "Group Create",
  });
});

const getMyChat = err.tryCa(async (req, res, next) => {
  const chat = await Chats.find({ member: req.user }).populate(
    "member",
    "name avatar"
  );

  const trnasformedChat = chat.map(({ _id, name, member, groupchat }) => {
    const otherMember = helper.getOtherMember(member, req.user);

    return {
      _id,
      groupchat,
      avatar: groupchat
        ? member.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupchat ? name : otherMember.name,
      member: member.reduce((prev, curr, i) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res.status(HTTP.SUCCESS).json({
    success: true,
    chats: trnasformedChat,
  });
});

const getMyGroups = err.tryCa(async (req, res, next) => {
  const chats = await Chats.find({
    member: req.user,
    groupchat: true,
    creator: req.user,
  }).populate("member", "name avatar");

  const group = chats.map(({ member, _id, groupchat, name }) => ({
    _id,
    groupchat,
    name,
    avatar: member.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: group,
  });
});

const addmember = err.tryCa(async (req, res, next) => {
  const { chatId, member } = req.body;

  if (!member || member.length < 1) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "Please provide member"));
  }

  const chat = await Chats.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
  }

  if (!chat.groupchat) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "This is not a group Chat"));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler(HTTP.FORBIDDEN, "You are not allowed to add members")
    );
  }

  const allNewMembersPromise = member.map((i) => Users.findById(i, "name"));
  const allNewMember = await Promise.all(allNewMembersPromise);

  const uniquemember = allNewMember.filter((i) =>
    chat.member.includes(i._id.toString())
  );

  if (uniquemember.length > 0) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Member is alredy in group")
    );
  }

  chat.member.push(...member);

  if (chat.member.length > 100) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Group members limit reached")
    );
  }

  await chat.save();

  const allUsersName = allNewMember.map((i) => i.name).join(",");

  features.emitE(
    req,
    event.ALERT,
    chat.member,
    `${allUsersName} has been added in the group`
  );

  features.emitE(req, event.REFETCH_CHATS, chat.member);

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Members added Success fully",
  });
});

const removeMember = err.tryCa(async (req, res, next) => {
  const { userId, chatId } = req.body;

  const [chat, userThatWillBeRemove] = await Promise.all([
    Chats.findById(chatId),
    Users.findById(userId, "name"),
  ]);

  if (userId === chat.creator.toString()) {
    return next(
      new ErrorHandler(
        HTTP.BAD_REQUEST,
        "You can't remove creator of the group"
      )
    );
  }

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not Found"));
  }

  if (!chat.groupchat) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "This is not a group Chat"));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler(
        HTTP.FORBIDDEN,
        "You are not allowed to Add or Delete the members"
      )
    );
  }

  if (chat.member.length <= 3) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Group chat have at least 3 member")
    );
  }

  const allCM = chat.member.map((i) => i.toString());

  chat.member = chat.member.filter(
    (member) => member.toString() !== userId.toString()
  );

  // const unique = chat.member.filter((i) => i === userId);

  // console.log(unique.length);

  // if (unique.length <= 0) {
  //   return next(
  //     new ErrorHandler(HTTP.BAD_REQUEST, "member not there in the group")
  //   );
  // }

  await chat.save();

  features.emitE(req, event.ALERT, chat.member, {
    message: `${userThatWillBeRemove} has been removed from the group`,
    chatId,
  });

  features.emitE(req, event.REFETCH_CHATS, allCM);

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Members remove Successfully",
  });
});

const leaveGroup = err.tryCa(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chats.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not Found"));
  }

  if (!chat.groupchat) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "This is not a group Chat"));
  }

  const remainingMember = chat.member.filter(
    (member) => member.toString() !== req.user.toString()
  );

  if (chat.creator.toString() === req.user.toString()) {
    // rendom creatore
    // const rendomCreator = Math.floor(Math.rendom() * remainingMember.length);

    chat.creator = remainingMember[0];
  }

  chat.member = remainingMember;

  const [user] = await Promise.all([
    Users.findById(req.user, "name"),
    chat.save(),
  ]);

  features.emitE(req, event.ALERT, chat.member, {
    chatId,
    message: `User ${user.name} has left the group`,
  });

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Leave Group Successfully",
  });
});

const sendAttachments = err.tryCa(async (req, res, next) => {
  const { chatId } = req.body;

  const files = req.files || [];

  if (files.length < 1) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Please provide attachments")
    );
  }

  if (files.length > 5) {
    return next(
      new ErrorHandler(HTTP.BAD_REQUEST, "Attachmentes con't more then 5")
    );
  }

  const [chat, me] = await Promise.all([
    Chats.findById(chatId),
    Users.findById(req.user, "name"),
  ]);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not Found"));
  }

  const attachments = await features.uploadFilesToCloudeinary(files);

  const messageForDb = {
    content: "",
    attachments,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDb,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };

  const message = await Messages.create(messageForDb);

  features.emitE(req, event.NEW_MESSAGE, chat.member, {
    message: messageForRealTime,
    chatId,
  });

  features.emitE(req, event.NEW_MESSAGE_ALERT, chat.member, {
    chatId,
  });

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message,
  });
});

const getChatDetails = err.tryCa(async (req, res, next) => {
  if (req.query.populate === "true") {
    const chat = await Chats.findById(req.params.id)
      .populate("member", "name avatar")
      .lean();

    if (!chat) {
      return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
    }

    chat.member = chat.member.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res.status(HTTP.SUCCESS).json({
      success: true,
      chat,
    });
  } else {
    const chat = await Chats.findById(req.params.id);

    if (!chat) {
      return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
    }

    return res.status(HTTP.SUCCESS).json({
      success: true,
      chat,
    });
  }
});

const renameGroup = err.tryCa(async (req, res, next) => {
  const { name } = req.body;

  const chat = await Chats.findById(req.params.id);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
  }

  if (!chat.groupchat) {
    return next(new ErrorHandler(HTTP.BAD_REQUEST, "This is not a group Chat"));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler(HTTP.FORBIDDEN, "You are not allowed rename Group")
    );
  }

  chat.name = name;

  await chat.save();

  features.emitE(req, event.REFETCH_CHATS, chat.member);

  return res.status(HTTP.SUCCESS).json({
    success: true,
    message: "Group rename successfully",
  });
});

const deleteChat = err.tryCa(async (req, res, next) => {
  const chat = await Chats.findById(req.params.id);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
  }

  const member = chat.member;

  if (chat.groupchat && chat.creator.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler(
        HTTP.FORBIDDEN,
        "You are not allowed to delete the group"
      )
    );
  }

  if (!chat.groupchat && !chat.member.includes(req.user.toString())) {
    return next(
      new ErrorHandler(
        HTTP.FORBIDDEN,
        "You are not allowed to delete the group"
      )
    );
  }

  //Here we have to delete all message as well as attchments of files form cloudinary

  const messageWithAttchments = await Messages.find({
    chat: req.params.id,
    attachments: { $exists: true, $ne: [] },
  });

  const public_ids = [];

  messageWithAttchments.forEach(({ attachments }) => {
    attachments.forEach(({ public_id }) => {
      public_ids.push(public_id);
    });
  });

  await Promise.all([
    features.deleteFilesFromCludeinary(public_ids),
    chat.deleteOne(),
    Messages.deleteMany({ chat: req.params.id }),
  ]);

  features.emitE(req, event.REFETCH_CHATS, member);

  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
});

const getMessages = err.tryCa(async (req, res, next) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;

  const limit = 20;
  const skip = (page - 1) * limit;

  const chat = await Chats.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler(HTTP.NOT_FOUND, "Chat not found"));
  }

  if (!chat.member.includes(req.user.toString())) {
    return next(
      new ErrorHandler(
        HTTP.FORBIDDEN,
        "You are not allowed to access this chat"
      )
    );
  }

  const [message, totalMessageCount] = await Promise.all([
    Messages.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name")
      .lean(),
    Messages.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessageCount / limit);

  return res.status(200).json({
    success: true,
    message: message.reverse(),
    totalPages,
  });
});

export default {
  newGroupChat,
  getMyChat,
  getMyGroups,
  addmember,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
};
