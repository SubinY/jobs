import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function ServicesPage() {
  return (
    <div className="page">
      <SiteHeader />
      <main className="container">
        <section className="hero" style={{ paddingBottom: 40 }}>
          <span className="badge">服务内容</span>
          <h1 className="hero-title">
            上岸助手的 <span>策略清单</span>
          </h1>
          <p className="hero-subtitle">
            我们聚焦大学生校招与实习场景，把信息整理成可追踪的岗位入口，
            让你用更少的时间捕捉关键机会。
          </p>
        </section>

        <section className="section">
          <div className="grid grid-3">
            <div className="card">
              <h3>招聘表格入口</h3>
              <p>精选岗位信息，字段规范清晰，方便快速定位目标岗位。</p>
            </div>
            <div className="card">
              <h3>节奏提醒与说明</h3>
              <p>提供校招关键时间线，避免错过投递窗口。</p>
            </div>
            <div className="card">
              <h3>资料整理入口</h3>
              <p>将常见资料整合成统一入口，减少反复查找的时间。</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">使用说明</h2>
          <div className="steps">
            <div className="step">
              <span>1</span>
              <h3>获取邀请码</h3>
              <p>通过购买资源获得一次性邀请码。</p>
            </div>
            <div className="step">
              <span>2</span>
              <h3>注册并登录</h3>
              <p>完成账号注册后即可登录平台。</p>
            </div>
            <div className="step">
              <span>3</span>
              <h3>进入表格</h3>
              <p>管理员开通权限后可查看完整招聘表格。</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">常见问题</h2>
          <div className="grid">
            <div className="card">
              <h3>邀请码可以重复使用吗？</h3>
              <p>不可以。邀请码为一次性长码，注册成功后即失效。</p>
            </div>
            <div className="card">
              <h3>为什么注册后还不能进入表格？</h3>
              <p>需要管理员手动开通权限，请联系客服或小红书私信确认。</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
