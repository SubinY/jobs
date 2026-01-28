import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NoAccessPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="container" style={{ padding: "80px 0" }}>
        <div className="card" style={{ maxWidth: 560 }}>
          <h2 className="section-title">尚未开通权限</h2>
          <p className="section-desc">
            你的账号还没有开通招聘表格权限，请联系管理员或小红书客服确认。
          </p>
          <div className="cta-group" style={{ justifyContent: "flex-start" }}>
            <Link className="btn btn-primary" href="/">
              返回首页
            </Link>
            <Link className="btn btn-ghost" href="/auth/login">
              重新登录
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
