export type SessionUser = {
  id?: string;
  nombre?: string;
  email?: string;
  rol?: string;
};

const TOKEN_KEY = "invergrasas_access_token";
const USER_KEY = "invergrasas_user";
const EXPIRES_KEY = "invergrasas_session_expires_at";
const SESSION_DURATION_MS = 60 * 60 * 1000;

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user ?? {}));
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + SESSION_DURATION_MS));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
}

export function getSession() {
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
