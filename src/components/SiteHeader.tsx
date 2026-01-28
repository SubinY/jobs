import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand">
          <span className="brand-badge">岸</span>
          上岸助手
        </Link>
        <NavLinks />
        <div className="nav-actions">
          {user ? (
            <>
              <span className="chip">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" href="/auth/login">
                登录
              </Link>
              <Link className="btn btn-primary" href="/auth/register">
                邀请码注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
