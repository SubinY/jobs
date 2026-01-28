import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="auth-wrap">
        <div className="auth-card">
          <h2 className="section-title">邀请码注册</h2>
          <p className="section-desc">邀请码为一次性长码，注册成功后自动失效。</p>
          <RegisterForm />
          <p className="form-hint" style={{ marginTop: 12 }}>
            已有账号？ <Link href="/auth/login">直接登录</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
