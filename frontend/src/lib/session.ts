import { useSyncExternalStore } from "react";

export type SessionUser = {
  id?: string;
  nombre?: string;
  email?: string;
  rol?: string;
  // The user must set a new password before using the dashboard
  debe_cambiar_password?: boolean;
};

const TOKEN_KEY = "invergrasas_access_token";
const USER_KEY = "invergrasas_user";
const EXPIRES_KEY = "invergrasas_session_expires_at";
const SESSION_DURATION_MS = 60 * 60 * 1000;
// Fired on this tab when the session changes (the storage event covers other tabs)
const SESSION_EVENT = "invergrasas-session";

export type Session = { token: string; user: SessionUser; expiresAt: number };

function avisarCambio() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user ?? {}));
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + SESSION_DURATION_MS));
  avisarCambio();
}

// Updates the stored user without touching the token or its expiry.
export function updateSessionUser(changes: Partial<SessionUser>) {
  const session = getSession();
  if (!session) return;
  localStorage.setItem(USER_KEY, JSON.stringify({ ...session.user, ...changes }));
  avisarCambio();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
  avisarCambio();
}

export function getSession(): Session | null {
  const token =
    localStorage.getItem(TOKEN_KEY) ??
    localStorage.getItem("access_token") ??
    localStorage.getItem("token");
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? "0");

  if (!token || !expiresAt || Date.now() >= expiresAt) {
    clearSession();
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);
  const user = rawUser ? (JSON.parse(rawUser) as SessionUser) : {};

  return {
    token,
    user,
    expiresAt,
  };
}

export function getUserInitials(user?: SessionUser | null) {
  const source = user?.nombre?.trim() || user?.email?.trim() || "Usuario";
  const parts = source.split(/\s+/).filter(Boolean);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : source.slice(0, 2);

  return initials.toUpperCase();
}

// Same object while the stored values do not change, as useSyncExternalStore needs
let snapshotKey: string | null = null;
let snapshotValue: Session | null = null;

function sessionSnapshot() {
  const key = [TOKEN_KEY, USER_KEY, EXPIRES_KEY, "access_token", "token"]
    .map((k) => localStorage.getItem(k) ?? "")
    .join("\u0000");
  if (key !== snapshotKey) {
    snapshotKey = key;
    snapshotValue = getSession();
  }
  return snapshotValue;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

/**
 * The session lives in localStorage, which the server cannot read. undefined
 * while it is unknown (server render and hydration), null when there is none.
 * Reading it in a useState initializer made the server and client render
 * different trees (React error #418).
 */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, sessionSnapshot, () => undefined);
}
