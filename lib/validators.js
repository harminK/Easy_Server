import { body, check, param, validationResult } from "express-validator";
import HTTP from "../controllers/httpStatusCode.js";
import ErrorHandler from "../utils/utilits.js";

const validateHendler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessage = errors
    .array()
    .map(({ msg }) => msg)
    .join(",");

  if (errors.isEmpty()) {
    return next();
  } else {
    console.log(errorMessage);
    next(new ErrorHandler(HTTP.BAD_REQUEST, errorMessage));
  }
};

const registerValidatores = () => [
  body("name", "Please Enter name").notEmpty(),
  body("username", "Please Enter username").notEmpty(),
  body("password", "Please Enter password").notEmpty(),
  body("bio", "Please Enter bio").notEmpty(),
  body("email", "Please Enter email").notEmpty(),
];

const loginValidatores = () => [
  body("username", "Please Enter username").notEmpty(),
  body("password", "Please Enter password").notEmpty(),
];

const newGroupChatValidatores = () => [
  body("name", "Please Enter name").notEmpty(),
  body("member")
    .notEmpty()
    .withMessage("Please Enter member")
    .isArray({ min: 2, max: 100 })
    .withMessage("member must be 2-100"),
];

const addMemberValidatores = () => [
  body("chatId", "Please Enter ChatId").notEmpty(),
  body("member")
    .notEmpty()
    .withMessage("Please Enter member")
    .isArray({ min: 1, max: 97 })
    .withMessage("member must be 1-97"),
];

const removeMemberValidatores = () => [
  body("chatId", "Please Enter ChatId").notEmpty(),
  body("userId", "Please Enter userId").notEmpty(),
];

const sendAttachmentsValidatores = () => [
  body("chatId", "Please Enter ChatId").notEmpty(),
];

const chatIdValidatores = () => [param("id", "Please Enter ChatId").notEmpty()];

const renameValidatores = () => [
  param("id", "Please Enter ChatId").notEmpty(),
  body("name", "Please Enter New name").notEmpty(),
];

const sendRequestValidatores = () => [
  body("userId", "Please Enter UserId").notEmpty(),
];

const acceptRequestValidatores = () => [
  body("requestId", "Please Enter requestId").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Enter accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];
const adminLoginValidatores = () => [
  body("secretKey", "Please Enter Secret Key").notEmpty(),
];

export default {
  registerValidatores,
  validateHendler,
  loginValidatores,
  newGroupChatValidatores,
  addMemberValidatores,
  removeMemberValidatores,
  sendAttachmentsValidatores,
  chatIdValidatores,
  renameValidatores,
  sendRequestValidatores,
  acceptRequestValidatores,
  adminLoginValidatores,
};
