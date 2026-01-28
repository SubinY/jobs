import { promises as fs } from "fs";
import path from "path";
import type { DataStore } from "./types";
import type { Invite, Job, JobAction, Session, User } from "../types";
import { createId, hashPassword } from "../crypto";

const dataDir = path.join(process.cwd(), "data");
const files = {
  users: path.join(dataDir, "users.json"),
  sessions: path.join(dataDir, "sessions.json"),
  invites: path.join(dataDir, "invites.json"),
  jobs: path.join(dataDir, "jobs.json"),
  jobActions: path.join(dataDir, "job-actions.json"),
};

const defaultJobs: Job[] = [
  {
    id: createId(),
    title: "政策研究员",
    company: "城市治理研究院",
    city: "上海",
    district: "全市",
    salary: "10-14k",
    tags: ["政策分析", "写作能力"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/policy",
    status: "open",
    category: "事业单位",
    region: "华东",
    province: "上海",
    views: 84,
    applyLink: "https://example.com/apply/policy",
    sourceLink: "https://example.com/policy",
  },
  {
    id: createId(),
    title: "选调生岗位",
    company: "省级组织部",
    city: "南京",
    district: "全市",
    salary: "8-12k",
    tags: ["选调", "党建"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/xd",
    status: "open",
    category: "选调生",
    region: "华东",
    province: "江苏",
    views: 126,
    applyLink: "https://example.com/apply/xd",
    sourceLink: "https://example.com/xd",
  },
  {
    id: createId(),
    title: "人民医院临床岗",
    company: "市人民医院",
    city: "武汉",
    district: "全市",
    salary: "12-18k",
    tags: ["规培", "临床"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/hospital",
    status: "open",
    category: "医疗",
    region: "华中",
    province: "湖北",
    views: 96,
    applyLink: "https://example.com/apply/hospital",
    sourceLink: "https://example.com/hospital",
  },
  {
    id: createId(),
    title: "事业单位综合岗",
    company: "市公共服务中心",
    city: "成都",
    district: "全市",
    salary: "7-10k",
    tags: ["综合管理", "笔试"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/public-service",
    status: "open",
    category: "事业单位",
    region: "西南",
    province: "四川",
    views: 64,
    applyLink: "https://example.com/apply/public-service",
    sourceLink: "https://example.com/public-service",
  },
  {
    id: createId(),
    title: "中学教师编制",
    company: "市教育局",
    city: "北京",
    district: "全市",
    salary: "10-15k",
    tags: ["教师资格", "编制"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/teacher",
    status: "open",
    category: "教师",
    region: "华北",
    province: "北京",
    views: 178,
    applyLink: "https://example.com/apply/teacher",
    sourceLink: "https://example.com/teacher",
  },
  {
    id: createId(),
    title: "国企管培生",
    company: "能源集团",
    city: "西安",
    district: "全市",
    salary: "9-13k",
    tags: ["管培生", "国企"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/soe",
    status: "open",
    category: "国企",
    region: "西北",
    province: "陕西",
    views: 103,
    applyLink: "https://example.com/apply/soe",
    sourceLink: "https://example.com/soe",
  },
  {
    id: createId(),
    title: "银行客户经理",
    company: "城市商业银行",
    city: "郑州",
    district: "全市",
    salary: "8-12k",
    tags: ["金融", "客户运营"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/bank",
    status: "open",
    category: "银行",
    region: "华中",
    province: "河南",
    views: 74,
    applyLink: "https://example.com/apply/bank",
    sourceLink: "https://example.com/bank",
  },
  {
    id: createId(),
    title: "军队文职助理",
    company: "某部队机关",
    city: "沈阳",
    district: "全市",
    salary: "9-12k",
    tags: ["文职", "政审"],
    publishedAt: new Date().toISOString(),
    link: "https://example.com/military",
    status: "open",
    category: "军队文职",
    region: "东北",
    province: "辽宁",
    views: 52,
    applyLink: "https://example.com/apply/military",
    sourceLink: "https://example.com/military",
  },
];

const defaultJobActions: JobAction[] = [];

function normalizeJob(job: Job): Job {
  const applyLink = job.applyLink || job.link || "#";
  const sourceLink = job.sourceLink || job.link || "#";
  const views = typeof job.views === "number" ? job.views : Number(job.views ?? 0);
  return {
    ...job,
    category: job.category || "事业单位",
    region: job.region || "全国",
    province: job.province || job.city || "未知",
    district: job.district || "全市",
    views: Number.isFinite(views) ? views : 0,
    applyLink,
    sourceLink,
  };
}

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    await writeJson(filePath, fallback);
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

let adminSeeded = false;

async function ensureAdminUser() {
  if (adminSeeded) return;
  const users = await readJson<User[]>(files.users, []);
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shangan.ai";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const existing = users.find((user) => user.email === adminEmail);
  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    users.push({
      id: createId(),
      email: adminEmail,
      passwordHash,
      role: "admin",
      entitled: true,
      createdAt: new Date().toISOString(),
    });
    await writeJson(files.users, users);
  }
  adminSeeded = true;
}

export async function createJsonStore(): Promise<DataStore> {
  await ensureDir();
  await ensureAdminUser();
  await readJson(files.sessions, [] as Session[]);
  await readJson(files.invites, [] as Invite[]);
  await readJson(files.jobs, defaultJobs);
  await readJson(files.jobActions, defaultJobActions);

  return {
    async getUserByEmail(email) {
      const users = await readJson<User[]>(files.users, []);
      return users.find((user) => user.email === email) || null;
    },
    async getUserById(id) {
      const users = await readJson<User[]>(files.users, []);
      return users.find((user) => user.id === id) || null;
    },
    async createUser(user) {
      const users = await readJson<User[]>(files.users, []);
      users.push(user);
      await writeJson(files.users, users);
      return user;
    },
    async listUsers() {
      return readJson<User[]>(files.users, []);
    },
    async updateUserEntitled(userId, entitled) {
      const users = await readJson<User[]>(files.users, []);
      const next = users.map((user) =>
        user.id === userId ? { ...user, entitled } : user
      );
      await writeJson(files.users, next);
    },
    async createSession(userId, expiresAt) {
      const sessions = await readJson<Session[]>(files.sessions, []);
      const session = { id: createId(), userId, expiresAt };
      sessions.push(session);
      await writeJson(files.sessions, sessions);
      return session;
    },
    async getSession(id) {
      const sessions = await readJson<Session[]>(files.sessions, []);
      return sessions.find((session) => session.id === id) || null;
    },
    async deleteSession(id) {
      const sessions = await readJson<Session[]>(files.sessions, []);
      await writeJson(
        files.sessions,
        sessions.filter((session) => session.id !== id)
      );
    },
    async createInvite(invite) {
      const invites = await readJson<Invite[]>(files.invites, []);
      invites.push(invite);
      await writeJson(files.invites, invites);
      return invite;
    },
    async getInvite(code) {
      const invites = await readJson<Invite[]>(files.invites, []);
      return invites.find((invite) => invite.code === code) || null;
    },
    async useInvite(code) {
      const invites = await readJson<Invite[]>(files.invites, []);
      let usedInvite: Invite | null = null;
      const next = invites.map((invite) => {
        if (invite.code === code && !invite.used) {
          usedInvite = { ...invite, used: true, usedAt: new Date().toISOString() };
          return usedInvite;
        }
        return invite;
      });
      if (usedInvite) {
        await writeJson(files.invites, next);
      }
      return usedInvite;
    },
    async listInvites() {
      return readJson<Invite[]>(files.invites, []);
    },
    async listJobs() {
      const jobs = await readJson<Job[]>(files.jobs, defaultJobs);
      return jobs.map(normalizeJob);
    },
    async createJob(job) {
      const jobs = await readJson<Job[]>(files.jobs, defaultJobs);
      jobs.unshift(normalizeJob(job));
      await writeJson(files.jobs, jobs);
      return normalizeJob(job);
    },
    async deleteJob(jobId) {
      const jobs = await readJson<Job[]>(files.jobs, defaultJobs);
      await writeJson(
        files.jobs,
        jobs.filter((job) => job.id !== jobId)
      );
    },
    async listJobActions(userId) {
      const actions = await readJson<JobAction[]>(files.jobActions, defaultJobActions);
      return actions.filter((action) => action.userId === userId);
    },
    async upsertJobAction(action) {
      const actions = await readJson<JobAction[]>(files.jobActions, defaultJobActions);
      const next = actions.filter(
        (item) => !(item.userId === action.userId && item.jobId === action.jobId)
      );
      next.unshift(action);
      await writeJson(files.jobActions, next);
      return action;
    },
  };
}
