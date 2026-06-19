const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createStorage = (folder) =>
  multer.diskStorage({
    destination(req, file, cb) {
      const uploadPath = path.join("uploads", folder);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },

    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, fileName);
    },
  });

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only image and PDF files are allowed"), false);
  }

  cb(null, true);
};

exports.uploadProduct = multer({
  storage: createStorage("products"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadInvoice = multer({
  storage: createStorage("invoices"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadReturn = multer({
  storage: createStorage("returns"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});