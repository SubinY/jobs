import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/store";
import { createId, hashPassword } from "@/lib/crypto";
import { createUserSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { inviteCode, email, password } = await request.json();

  if (!inviteCode || !email || !password) {
    return NextResponse.json({ message: "请填写完整信息" }, { status: 400 });
  }

  const store = await getDataStore();
  const existing = await store.getUserByEmail(String(email).trim());
  if (existing) {
    return NextResponse.json({ message: "该邮箱已注册" }, { status: 409 });
  }

  const invite = await store.useInvite(String(inviteCode).trim());
  if (!invite) {
    return NextResponse.json({ message: "邀请码无效或已使用" }, { status: 403 });
  }

  const passwordHash = await hashPassword(String(password));
  const user = {
    id: createId(),
    email: String(email).trim(),
    passwordHash,
    role: "user",
    entitled: false,
    createdAt: new Date().toISOString(),
  };

  await store.createUser(user);

  const session = await createUserSession(user.id);
  setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({ ok: true });
}
