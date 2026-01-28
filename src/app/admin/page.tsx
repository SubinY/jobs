import SiteHeader from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getDataStore } from "@/lib/store";
import { redirect } from "next/navigation";
import {
  createInviteAction,
  toggleEntitledAction,
  createJobAction,
  deleteJobAction,
} from "./actions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.role !== "admin") {
    redirect("/no-access");
  }

  const store = await getDataStore();
  const [users, invites, jobs] = await Promise.all([
    store.listUsers(),
    store.listInvites(),
    store.listJobs(),
  ]);

  return (
    <div className="page">
      <SiteHeader />
      <main className="container" style={{ padding: "50px 0 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <span className="badge">管理员控制台</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            权限与内容管理
          </h1>
          <p className="section-desc">
            管理邀请码、开通用户权限、维护招聘表格占位内容。
          </p>
        </div>

        <section className="admin-grid">
          <div className="admin-card">
            <h3>邀请码生成</h3>
            <form action={createInviteAction}>
              <div className="form-group">
                <label htmlFor="count">一次生成数量</label>
                <input id="count" name="count" type="number" min={1} defaultValue={1} />
              </div>
              <button className="btn btn-primary" type="submit">
                生成邀请码
              </button>
            </form>
          </div>

          <div className="admin-card">
            <h3>新增招聘岗位</h3>
            <form action={createJobAction}>
              <div className="form-group">
                <label htmlFor="title">岗位名称</label>
                <input id="title" name="title" required />
              </div>
              <div className="form-group">
                <label htmlFor="company">公司</label>
                <input id="company" name="company" required />
              </div>
              <div className="form-group">
                <label htmlFor="city">城市</label>
                <input id="city" name="city" />
              </div>
              <div className="form-group">
                <label htmlFor="salary">薪资</label>
                <input id="salary" name="salary" />
              </div>
              <div className="form-group">
                <label htmlFor="tags">标签（逗号分隔）</label>
                <input id="tags" name="tags" placeholder="React, 实习" />
              </div>
              <div className="form-group">
                <label htmlFor="link">外部链接</label>
                <input id="link" name="link" placeholder="https://" />
              </div>
              <button className="btn btn-primary" type="submit">
                保存岗位
              </button>
            </form>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">邀请码列表</h2>
          <div className="grid">
            {invites.length === 0 ? (
              <div className="notice">暂无邀请码，请先生成。</div>
            ) : (
              invites.map((invite) => (
                <div className="admin-card" key={invite.code}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{invite.code}</strong>
                    <span className="chip">
                      {invite.used ? "已使用" : "未使用"}
                    </span>
                  </div>
                  <p className="form-hint">创建时间：{invite.createdAt}</p>
                  {invite.usedAt ? (
                    <p className="form-hint">使用时间：{invite.usedAt}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">用户权限</h2>
          <div className="grid">
            {users.map((account) => (
              <div className="admin-card" key={account.id}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{account.email}</strong>
                  <span className="chip">{account.role === "admin" ? "管理员" : "用户"}</span>
                </div>
                <p className="form-hint">创建时间：{account.createdAt}</p>
                <form action={toggleEntitledAction}>
                  <input type="hidden" name="userId" value={account.id} />
                  <input
                    type="hidden"
                    name="entitled"
                    value={account.entitled ? "false" : "true"}
                  />
                  <button className="btn btn-ghost" type="submit">
                    {account.entitled ? "取消权限" : "开通权限"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">招聘表格内容</h2>
          <div className="grid">
            {jobs.map((job) => (
              <div className="admin-card" key={job.id}>
                <strong>{job.title}</strong>
                <p className="form-hint">
                  {job.company} · {job.city} · {job.salary}
                </p>
                <form action={deleteJobAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <button className="btn btn-ghost" type="submit">
                    删除
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
