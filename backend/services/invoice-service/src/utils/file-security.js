import fs from "fs/promises";
import path from "path";

import { fileTypeFromFile } from "file-type";

const ALLOWED_FILE_TYPES = new Map([
  ["application/pdf", [".pdf"]],
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
]);

const createFileError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "INVALID_FILE";
  return error;
};

const safeDeleteFile = async (filePath) => {
  try {
    if (filePath) {
      await fs.unlink(filePath);
    }
  } catch (error) {

  }
};

const validatePdfHeader = async (filePath) => {
  const handle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(5);
    await handle.read(buffer, 0, 5, 0);
    return buffer.toString("ascii") === "%PDF-";
  } finally {
    await handle.close();
  }
};

const validateUploadedFile = async (file) => {
  if (!file) {
    throw createFileError("Uploaded file is required");
  }

  if (!file.path) {
    throw createFileError("Uploaded file could not be stored");
  }

  const uploadDirectory = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")
  );

  const filePath = path.resolve(file.path);
  const relativePath = path.relative(uploadDirectory, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    await safeDeleteFile(filePath);
    throw createFileError("Invalid upload path");
  }

  const stats = await fs.stat(filePath);

  if (!stats.isFile() || stats.size === 0) {
    await safeDeleteFile(filePath);
    throw createFileError("Uploaded file is empty or invalid");
  }

  const detected = await fileTypeFromFile(filePath);

  if (!detected) {
    await safeDeleteFile(filePath);
    throw createFileError("Unable to determine file type");
  }

  if (detected.mime === "application/pdf") {
    const validPdf = await validatePdfHeader(filePath);

    if (!validPdf) {
      await safeDeleteFile(filePath);
      throw createFileError("Invalid PDF file");
    }
  }

  const allowedExtensions = ALLOWED_FILE_TYPES.get(detected.mime);

  if (!allowedExtensions) {
    await safeDeleteFile(filePath);
    throw createFileError("File type is not allowed");
  }

  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    await safeDeleteFile(filePath);
    throw createFileError("File extension does not match the actual file type");
  }

  if (file.mimetype !== detected.mime) {
    await safeDeleteFile(filePath);
    throw createFileError("File MIME type does not match its actual content");
  }

  return {
    mime: detected.mime,
    extension: detected.ext,
    size: stats.size,
    path: filePath,
  };
};

export {
  validateUploadedFile,
  safeDeleteFile,
  validatePdfHeader,
  createFileError,
};