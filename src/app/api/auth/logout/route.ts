import { NextResponse } from "next/server";
import { clearSessionCookie, sessionCookieName } from "@/lib/auth";
import { getDataStore } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(sessionCookieName())?.value;
  if (sessionId) {
    const store = await getDataStore();
    await store.deleteSession(sessionId);
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
