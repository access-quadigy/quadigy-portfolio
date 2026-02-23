// backend/server.js
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// --- middlewares ---
app.use(cors());

// ✅ increase body limit (base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// (optional) serve uploads if you later use multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, uploadDir)));

// --- MySQL pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quadigy_portfolio", // ✅ proper default db name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --- admin auth ---
function requireAdmin(req, res, next) {
  const u = req.headers["x-admin-user"];
  const p = req.headers["x-admin-pass"];

  if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// --- health check ---
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, error: e.message });
  }
});

// --- routes ---
app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM projects ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/projects", requireAdmin, async (req, res) => {
  try {
    const p = req.body;

    // ✅ support both keys: image_url or image (fallback)
    const imageUrl = p.image_url || p.image || "";

    const [r] = await pool.query(
      `INSERT INTO projects (title, category, image_url, client, services, url, description, skills, video, docs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.title || "",
        p.category || "",
        imageUrl,
        p.client || "",
        p.services || "",
        p.url || "",
        p.description || "",
        // store arrays/objects safely as JSON
        typeof p.skills === "string" ? p.skills : JSON.stringify(p.skills || []),
        p.video || "",
        typeof p.docs === "string" ? p.docs : JSON.stringify(p.docs || []),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM projects WHERE id=?", [r.insertId]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = req.body;

    const imageUrl = p.image_url || p.image || "";

    await pool.query(
      `UPDATE projects
       SET title=?, category=?, image_url=?, client=?, services=?, url=?, description=?, skills=?, video=?, docs=?
       WHERE id=?`,
      [
        p.title || "",
        p.category || "",
        imageUrl,
        p.client || "",
        p.services || "",
        p.url || "",
        p.description || "",
        typeof p.skills === "string" ? p.skills : JSON.stringify(p.skills || []),
        p.video || "",
        typeof p.docs === "string" ? p.docs : JSON.stringify(p.docs || []),
        id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM projects WHERE id=?", [id]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM projects WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
