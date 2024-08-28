import JWT from "jsonwebtoken";
import HTTP from "../controllers/httpStatusCode.js";
import ErrorHandler from "../utils/utilits.js";
import error from "./error.js";
import Users from "../models/user.js";

const isAuthetication = error.tryCa((req, res, next) => {
  const token = req.cookies["whatsapp-token"];

  if (!token) {
    return next(
      new ErrorHandler(HTTP.UNAUTHORIZED, "Please login to access this profile")
    );
  }

  const userData = JWT.verify(token, process.env.JWT_KEY);

  req.user = userData._id;

  next();
});

const adminOnley = (req, res, next) => {
  const token = req.cookies["whatsapp-admin-token"];

  if (!token) {
    return next(
      new ErrorHandler(HTTP.UNAUTHORIZED, "only Admin can access this route")
    );
  }

  const secretKey = JWT.verify(token, process.env.JWT_KEY);

  const adminSecretKey = process.env.ADMIN_SECRET_KEY;

  const isMatch = secretKey === adminSecretKey;

  if (!isMatch) {
    return next(new ErrorHandler(HTTP.UNAUTHORIZED, "Invalid Admin Key"));
  }

  next();
};

const socketAuthenticater = async (err, socket, next) => {
  try {
    if (err) {
      return next(err);
    }

    const authToken = socket.request.cookies["whatsapp-token"];

    if (!authToken) {
      return next(
        new ErrorHandler(
          HTTP.UNAUTHORIZED,
          "Please login to access this profile"
        )
      );
    }

    const decodedData = JWT.verify(authToken, process.env.JWT_KEY);

    const user = await Users.findById(decodedData._id);

    if (!user) {
      return next(new ErrorHandler(HTTP.UNAUTHORIZED, "User not found"));
    }

    socket.user = user;

    return next();
  } catch (error) {
    return next(
      new ErrorHandler(HTTP.UNAUTHORIZED, "Please login to access this profile")
    );
  }
};

export default { isAuthetication, adminOnley, socketAuthenticater };
