import multer from "multer";

const uplodeFile = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

const singleavatar = uplodeFile.single("avatar");

const attachmentsmulter = uplodeFile.array("files", 5);

export default { singleavatar, attachmentsmulter };
