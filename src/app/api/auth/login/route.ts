import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/store";
import { verifyPassword } from "@/lib/crypto";
import { createUserSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: "请输入邮箱与密码" }, { status: 400 });
  }

  const store = await getDataStore();
  const user = await store.getUserByEmail(String(email).trim());

  if (!user) {
    return NextResponse.json({ message: "账号不存在" }, { status: 401 });
  }

  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "密码错误" }, { status: 401 });
  }

  const session = await createUserSession(user.id);
  setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({ ok: true });
}
