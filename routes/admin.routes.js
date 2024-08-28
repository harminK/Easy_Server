import express from "express";
import admin from "../controllers/admin.js";
import validators from "../lib/validators.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/verify",
  validators.adminLoginValidatores(),
  validators.validateHendler,
  admin.adminLogin
);

router.get("/logout", admin.adminLoout);

// Onley Admin Access

router.use(auth.adminOnley);

router.get("/", admin.adminTrue);

router.get("/user", admin.allUsers);
router.get("/chat", admin.allChats);
router.get("/message", admin.allMessage);
router.get("/stats", admin.getDashboardStsts);
export default router;
