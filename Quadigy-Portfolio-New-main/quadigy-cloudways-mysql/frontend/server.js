// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const mime = require("mime"); // npm i mime
const { exec } = require("child_process");

const app = express();

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(__dirname, "uploads");

// make sure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// middleware
app.use(cors({ origin: true }));
app.use(express.json());

// serve uploads with permissive headers
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.type(mime.getType(filePath) || "application/octet-stream");
      res.setHeader("Accept-Ranges", "bytes");
      res.removeHeader?.("Content-Disposition");
    },
  })
);

// ---------------- MULTER SETUP ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    cb(null, `${Date.now()}-${safeBase}${ext.toLowerCase()}`);
  },
});

const ACCEPT = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

const fileFilter = (req, file, cb) => {
  if (ACCEPT.has(file.mimetype)) return cb(null, true);
  return cb(null, true); // allow all anyway
};

const upload = multer({ storage, fileFilter });

// ---------------- ROUTES ----------------
app.get("/", (_, res) => {
  res.send("Uploader running.");
});

/**
 * POST /api/upload
 * Supports multiple files, auto converts Office docs to PDF for preview
 */
app.post("/api/upload", upload.array("files", 15), async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const files = [];

  for (const f of req.files) {
    const originalUrl = `${baseUrl}/uploads/${f.filename}`;
    let previewUrl = originalUrl;

    const ext = path.extname(f.originalname).toLowerCase();
    if ([".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx"].includes(ext)) {
      const outDir = path.dirname(f.path);

      // run LibreOffice to convert to PDF
      await new Promise((resolve) => {
        exec(
          `soffice --headless --convert-to pdf --outdir "${outDir}" "${f.path}"`,
          (err) => {
            if (err) console.error("LibreOffice convert error:", err);
            resolve();
          }
        );
      });

      // LibreOffice usually names file with same base but .pdf
      const pdfName =
        path.basename(f.originalname, ext) + ".pdf";
      const pdfPath = path.join(outDir, pdfName);

      if (fs.existsSync(pdfPath)) {
        previewUrl = `${baseUrl}/uploads/${pdfName}`;
      }
    }

    files.push({
      name: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      original: originalUrl,
      preview: previewUrl, // embeddable in iframe
    });
  }

  res.json({ ok: true, files });
});

// ---------------- START ----------------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving uploads from ${UPLOAD_DIR}`);
});
