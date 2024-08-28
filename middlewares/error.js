import HTTP from "../controllers/httpStatusCode.js";

const erromiddleware = (err, req, res, next) => {
  (err.message ||= "Internal Server Error"),
    (err.statusCode ||= HTTP.INTERNAL_SERVER_ERROR);

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    err.message = `Duplicate field - ${error}`;
    err.statusCode = HTTP.BAD_REQUEST;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    (err.message = `Invalid Format of ${errorPath}`),
      (err.statusCode = HTTP.BAD_REQUEST);
  }

  return res.status(err.statusCode).json({
    status: false,
    message: err.message,
  });
};

const tryCa = (passfunction) => async (req, res, next) => {
  try {
    await passfunction(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default { erromiddleware, tryCa };
