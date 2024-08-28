import express from "express";
import auth from "../middlewares/auth.js";
import multer from "../middlewares/multer.js";
import chat from "../controllers/chat.js";
import validators from "../lib/validators.js";

const router = express.Router();

router.use(auth.isAuthetication);

// Create a new group chat
router.post(
  "/new",
  validators.newGroupChatValidatores(),
  validators.validateHendler,
  chat.newGroupChat
);

// Get user personal chat
router.get("/my", chat.getMyChat);

// Get user group chat
router.get("/my/group", chat.getMyGroups);

//add member in group
router.put(
  "/addmember",
  validators.addMemberValidatores(),
  validators.validateHendler,
  chat.addmember
);

// remove member from a group
router.delete(
  "/removemember",
  validators.removeMemberValidatores(),
  validators.validateHendler,
  chat.removeMember
);

// leave from the group
router.delete(
  "/leave/:id",
  validators.chatIdValidatores(),
  validators.validateHendler,
  chat.leaveGroup
);

// send files
router.post(
  "/message",
  multer.attachmentsmulter,
  validators.sendAttachmentsValidatores(),
  validators.validateHendler,
  chat.sendAttachments
);

// getMessages
router.get(
  "/message/:id",
  validators.chatIdValidatores(),
  validators.validateHendler,
  chat.getMessages
);

// getChatDetails and RenameGroup and DeleteChat
router
  .route("/:id")
  .get(
    validators.chatIdValidatores(),
    validators.validateHendler,
    chat.getChatDetails
  )
  .put(
    validators.renameValidatores(),
    validators.validateHendler,
    chat.renameGroup
  )
  .delete(
    validators.chatIdValidatores(),
    validators.validateHendler,
    chat.deleteChat
  );

export default router;
