// frontend/src/store/useProducts.js
import create from "zustand";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function adminHeaders() {
  const u = process.env.REACT_APP_ADMIN_USER || "";
  const p = process.env.REACT_APP_ADMIN_PASS || "";
  return { "x-admin-user": u, "x-admin-pass": p };
}

function safeParseJsonMaybe(v, fallback) {
  if (v == null) return fallback;
  if (Array.isArray(v) || typeof v === "object") return v;
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function normalizeRow(row) {
  return {
    ...row,
    image: row.image || row.image_url || "",
    image_url: row.image_url || row.image || "",
    skills: safeParseJsonMaybe(row.skills, []),
    docs: safeParseJsonMaybe(row.docs, []),
  };
}

async function readJsonSafe(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

/**
 * ✅ Central API fetch wrapper
 * - Backend off / network error → throws "API_OFFLINE"
 * - HTTP errors → throws readable message
 */
async function apiFetch(path, opts = {}) {
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, opts);

    if (!res.ok) {
      const data = await readJsonSafe(res);

      // Common cases
      if (res.status === 401) throw new Error("Unauthorized (401). Admin credentials mismatch.");
      if (res.status === 413) throw new Error("Payload too large (413). Try smaller image or increase server limit.");
      if (res.status >= 500) throw new Error(`Server error (${res.status}). Check backend logs.`);

      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }

    // ok response
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  } catch (err) {
    // fetch() network errors (backend off / DNS / CORS etc)
    const msg = (err && err.message) ? err.message : "";
    const isNetwork =
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ERR_CONNECTION_REFUSED");

    if (isNetwork) {
      const e = new Error("API_OFFLINE");
      e.code = "API_OFFLINE";
      throw e;
    }
    throw err;
  }
}

export const useProducts = create((set, get) => ({
  items: [],
  apiStatus: "unknown", // "ok" | "offline" | "error"
  apiMessage: "",

  getById: (id) => {
    const n = Number(id);
    return get().items.find((x) => Number(x.id) === n) || null;
  },

  load: async () => {
    try {
      set({ apiStatus: "unknown", apiMessage: "" });
      const data = await apiFetch("/api/projects");
      const items = Array.isArray(data) ? data.map(normalizeRow) : [];
      set({ items, apiStatus: "ok", apiMessage: "" });
    } catch (e) {
      if (e?.code === "API_OFFLINE" || e?.message === "API_OFFLINE") {
        set({ apiStatus: "offline", apiMessage: "Backend server is not running. Start Node API (port 5000)." });
        return; // ✅ don't crash UI
      }
      set({ apiStatus: "error", apiMessage: e?.message || "Unknown API error" });
      // still don't crash UI
    }
  },

  add: async (payload) => {
    try {
      const created = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify(payload),
      });
      const item = normalizeRow(created);
      set({ items: [item, ...get().items], apiStatus: "ok", apiMessage: "" });
      return item;
    } catch (e) {
      if (e?.code === "API_OFFLINE" || e?.message === "API_OFFLINE") {
        set({ apiStatus: "offline", apiMessage: "Backend server is not running. Start Node API (port 5000)." });
        throw new Error("Backend not connected. Start the API server and try again.");
      }
      set({ apiStatus: "error", apiMessage: e?.message || "Add failed" });
      throw e;
    }
  },

  update: async (id, payload) => {
    try {
      const updated = await apiFetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify(payload),
      });
      const item = normalizeRow(updated);
      set({
        items: get().items.map((x) => (Number(x.id) === Number(id) ? item : x)),
        apiStatus: "ok",
        apiMessage: "",
      });
      return item;
    } catch (e) {
      if (e?.code === "API_OFFLINE" || e?.message === "API_OFFLINE") {
        set({ apiStatus: "offline", apiMessage: "Backend server is not running. Start Node API (port 5000)." });
        throw new Error("Backend not connected. Start the API server and try again.");
      }
      set({ apiStatus: "error", apiMessage: e?.message || "Update failed" });
      throw e;
    }
  },

  remove: async (id) => {
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { ...adminHeaders() },
      });
      set({
        items: get().items.filter((x) => Number(x.id) !== Number(id)),
        apiStatus: "ok",
        apiMessage: "",
      });
      return true;
    } catch (e) {
      if (e?.code === "API_OFFLINE" || e?.message === "API_OFFLINE") {
        set({ apiStatus: "offline", apiMessage: "Backend server is not running. Start Node API (port 5000)." });
        throw new Error("Backend not connected. Start the API server and try again.");
      }
      set({ apiStatus: "error", apiMessage: e?.message || "Delete failed" });
      throw e;
    }
  },
}));
