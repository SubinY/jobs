import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="auth-wrap">
        <div className="auth-card">
          <h2 className="section-title">登录</h2>
          <p className="section-desc">使用购买后获得的账号登录即可进入招聘表格。</p>
          <LoginForm />
          <p className="form-hint" style={{ marginTop: 12 }}>
            还没有账号？ <Link href="/auth/register">邀请码注册</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
