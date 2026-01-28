import Link from "next/link";
import type { Job, JobAction } from "@/lib/types";
import { toggleAppliedAction, updateNoteAction } from "@/app/job/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "./utils";

type JobsTableProps = {
  jobs: Job[];
  canAccess: boolean;
  isLoggedIn: boolean;
  actionMap: Map<string, JobAction>;
};

export default function JobsTable({
  jobs,
  canAccess,
  isLoggedIn,
  actionMap,
}: JobsTableProps) {
  const renderApplyLink = (job: Job) => {
    if (!isLoggedIn) {
      return (
        <Link className="btn btn-mini btn-outline" href="/auth/login">
          登录查看
        </Link>
      );
    }
    if (!canAccess) {
      return <span className="lock-text">未授权</span>;
    }
    if (!job.applyLink || job.applyLink === "#") {
      return <span className="lock-text">暂无链接</span>;
    }
    return (
      <div className="apply-link">
        <a href={job.applyLink} target="_blank" rel="noreferrer">
          打开投递
        </a>
        <span className="apply-link-raw">{job.applyLink}</span>
      </div>
    );
  };

  const renderAppliedToggle = (job: Job, action?: JobAction) => {
    if (!isLoggedIn) {
      return (
        <Link className="status-pill unapplied" href="/auth/login">
          登录标记
        </Link>
      );
    }
    if (!canAccess) {
      return <span className="status-pill unapplied">未授权</span>;
    }
    const applied = action?.applied ?? false;
    return (
      <form action={toggleAppliedAction} className="applied-form">
        <input type="hidden" name="jobId" value={job.id} />
        <input type="hidden" name="applied" value={applied ? "false" : "true"} />
        <button
          type="submit"
          className={cn("status-pill", applied ? "applied" : "unapplied")}
          aria-label={applied ? "取消标记已投递" : "标记已投递"}
        >
          {applied ? "已投递" : "未投递"}
        </button>
      </form>
    );
  };

  const renderMemberActions = (job: Job, action?: JobAction) => {
    if (!isLoggedIn) {
      return (
        <Link className="btn btn-mini btn-outline" href="/auth/login">
          登录解锁
        </Link>
      );
    }
    if (!canAccess) {
      return (
        <div className="member-locked-inline">
          <span className="lock-pill">未授权</span>
          <span className="lock-text">需管理员开通权限</span>
        </div>
      );
    }

    const note = action?.note ?? "";
    return (
      <div className="member-actions-inline">
        <a
          className="btn btn-mini btn-outline"
          href={job.sourceLink}
          target="_blank"
          rel="noreferrer"
        >
          原文
        </a>
        <details className="note-details">
          <summary>备注</summary>
          <form action={updateNoteAction} className="note-form">
            <input type="hidden" name="jobId" value={job.id} />
            <textarea
              name="note"
              placeholder="记录面试进度、联系人、提醒…"
              defaultValue={note}
            />
            <button className="btn btn-mini btn-ghost" type="submit">
              保存
            </button>
          </form>
        </details>
      </div>
    );
  };

  return (
    <>
      <Table className="job-table">
        <TableHeader>
          <TableRow>
            <TableHead>更新时间</TableHead>
            <TableHead>公司名称</TableHead>
            <TableHead>投递岗位</TableHead>
            <TableHead>工作城市</TableHead>
            <TableHead>浏览量</TableHead>
            <TableHead>投递链接</TableHead>
            <TableHead>投递状态</TableHead>
            <TableHead>会员操作区</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="empty-state">暂无符合条件的岗位，请调整筛选条件。</div>
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => {
              const action = actionMap.get(job.id);
              return (
                <TableRow key={job.id}>
                  <TableCell>{formatDate(job.publishedAt)}</TableCell>
                  <TableCell>
                    <div className="company-cell">
                      <strong>{job.company}</strong>
                      <span>{job.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="role-cell">
                      <span>{job.title}</span>
                      <div className="tag-row">
                        {job.tags.map((tag) => (
                          <span key={tag} className="pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="city-cell">
                      <span>{job.city}</span>
                      <em>{job.province}</em>
                    </div>
                  </TableCell>
                  <TableCell>{job.views}</TableCell>
                  <TableCell>{renderApplyLink(job)}</TableCell>
                  <TableCell className="status-cell">
                    {renderAppliedToggle(job, action)}
                  </TableCell>
                  <TableCell className="actions-cell">
                    {renderMemberActions(job, action)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="jobs-card-grid">
        {jobs.length === 0 ? (
          <div className="empty-state">暂无符合条件的岗位，请调整筛选条件。</div>
        ) : (
          jobs.map((job) => {
            const action = actionMap.get(job.id);
            return (
              <div className="job-card" key={job.id}>
                <div className="job-card-header">
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.company} · {job.city}
                    </p>
                  </div>
                  <span className="chip">{formatDate(job.publishedAt)}</span>
                </div>
                <div className="job-card-tags">
                  <span className="pill">{job.category}</span>
                  {job.tags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="job-card-meta">
                  <span>浏览量 {job.views}</span>
                  <span>{job.region}</span>
                </div>
                <div className="job-card-link">
                  <strong>投递链接</strong>
                  {renderApplyLink(job)}
                </div>
                <div className="job-card-link">
                  <strong>投递状态</strong>
                  {renderAppliedToggle(job, action)}
                </div>
                <div className="job-card-actions">
                  <strong>会员操作区</strong>
                  {renderMemberActions(job, action)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
