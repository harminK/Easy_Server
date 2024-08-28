import express from "express";
import uplodeFile from "../middlewares/multer.js";
import user from "../controllers/user.js";
import auth from "../middlewares/auth.js";
import validators from "../lib/validators.js";

const router = express.Router();

//New user router
router.post(
  "/new",
  uplodeFile.singleavatar,
  validators.registerValidatores(),
  validators.validateHendler,
  user.newUsers
);
//login router
router.post(
  "/login",
  validators.loginValidatores(),
  validators.validateHendler,
  user.login
);

router.post("/otp", user.otpVerification);
router.post("/userverified", user.userverified);
router.post("/forgetpassword", user.forgotPassword);
router.post("/verifyfrogetotp", user.verifyFrogetOtp);

router.use(auth.isAuthetication);

router.get("/me", user.getMyProfile);
router.get("/logout", user.logOut);
router.get("/search", user.serachUser);
router.put(
  "/sendrequest",
  validators.sendRequestValidatores(),
  validators.validateHendler,
  user.sendFriendRequest
);

router.put(
  "/acceptrequest",
  validators.acceptRequestValidatores(),
  validators.validateHendler,
  user.acceptFriendRequest
);

router.get("/notification", user.getMyNotifications);

router.get("/friend", user.getMyFriend);

export default router;
