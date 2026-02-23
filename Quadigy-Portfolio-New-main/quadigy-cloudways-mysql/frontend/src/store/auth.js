// src/store/auth.js
import { create } from "zustand";

const ADMIN_USER = process.env.REACT_APP_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || "password";
const SESSION_SECONDS = Number(process.env.REACT_APP_ADMIN_SESSION_SECONDS || 3600);
const KEY = "legacy_admin_session_v2";

function makeToken() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint32Array(4)).join("-");
  }
  return Math.random().toString(36).slice(2) + "-" + Date.now();
}

function loadStored() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.token || !s?.expiresAt) return null;
    if (Date.now() >= s.expiresAt) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function saveStored(session) {
  try {
    if (!session) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export const useAuth = create((set, get) => ({
  session: loadStored(), // { token, user, startedAt, expiresAt }

  isAuthed: () => Boolean(get().session?.token),

  login: async (username, password) => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = makeToken();
      const startedAt = Date.now();
      const expiresAt = startedAt + SESSION_SECONDS * 1000;
      const session = { token, user: { username }, startedAt, expiresAt };
      saveStored(session);
      set({ session });
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials" };
  },

  logout: () => {
    saveStored(null);
    set({ session: null });
  },
}));
