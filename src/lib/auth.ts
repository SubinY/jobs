import { cookies } from "next/headers";
import { getDataStore } from "./store";
import type { User } from "./types";

const SESSION_COOKIE = "oa_session";
const SESSION_DAYS = 7;

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createUserSession(userId: string) {
  const store = await getDataStore();
  const expiresAt = getSessionExpiry();
  return store.createSession(userId, expiresAt.toISOString());
}

export function setSessionCookie(sessionId: string, expiresAt: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const store = await getDataStore();
  const session = await store.getSession(sessionId);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await store.deleteSession(session.id);
    return null;
  }

  return store.getUserById(session.userId);
}
