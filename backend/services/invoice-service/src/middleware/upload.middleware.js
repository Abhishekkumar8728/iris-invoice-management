import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const MAX_FILES = 5;

const UPLOAD_DIR =
  path.resolve(
    process.env.UPLOAD_DIR ||
      path.join(
        process.cwd(),
        "uploads"
      )
  );




fs.mkdirSync(
  UPLOAD_DIR,
  {
    recursive: true,
  }
);








const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        UPLOAD_DIR
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(
          file.originalname || ""
        ).toLowerCase();

      const randomName =
        crypto
          .randomBytes(24)
          .toString("hex");

      cb(
        null,
        `${Date.now()}-${randomName}${extension}`
      );
    },
  });









const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes =
    new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]);

  const allowedExtensions =
    new Set([
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
    ]);

  const extension =
    path
      .extname(
        file.originalname || ""
      )
      .toLowerCase();

  if (
    !allowedMimeTypes.has(
      file.mimetype
    )
  ) {
    const error =
  new Error(
    "Only PDF, JPEG and PNG files are allowed"
  );

error.statusCode = 400;
error.code =
  "INVALID_FILE";

return cb(error);
  }

  if (
    !allowedExtensions.has(
      extension
    )
  ) {
    return cb(
      new Error(
        "Invalid file extension"
      )
    );
  }

  cb(null, true);
};

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        MAX_FILE_SIZE,

      files:
        MAX_FILES,

      fields: 20,

      parts: 30,

      fieldNameSize: 100,

      fieldSize:
        1024 * 1024,
    },
  });

export {
  upload,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  MAX_FILES,
};

export default upload;