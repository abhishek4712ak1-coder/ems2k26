import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads/id-cards");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${req.user.userId}-${Date.now()}${safeExt}`);
  },
});

export const uploadIdCard = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("ID card must be a JPG, PNG, or WEBP image."));
  },
});

export const handleUploadError = (error, _req, res, next) => {
  if (!error) {
    next();
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "ID card image must be 5MB or smaller.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unable to upload ID card image.",
    });
  }

  if (error.message?.includes("ID card")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};
