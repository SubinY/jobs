import fs from "fs";
import path from "path";
import { and, desc, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { DataStore } from "./types";
import type { Invite, Job, JobAction, Session, User } from "../types";
import { createId, hashPassword } from "../crypto";
import { db } from "@/database";
import { invites, jobActions, jobs, sessions, users } from "@/database/schemas";

let schemaReady: Promise<void> | null = null;
let adminSeeded = false;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const migrationsFolder = path.join(process.cwd(), "src/database/migrations");
      const hasMigrations =
        fs.existsSync(migrationsFolder) &&
        fs.readdirSync(migrationsFolder).some((file) => file.endsWith(".sql"));
      if (hasMigrations) {
        await migrate(db, { migrationsFolder });
        return;
      }

      await db.execute(sql`
        create table if not exists users (
          id text primary key,
          email text unique not null,
          password_hash text not null,
          role text not null,
          entitled boolean not null default false,
          created_at timestamptz not null
        );
      `);
      await db.execute(sql`
        create table if not exists sessions (
          id text primary key,
          user_id text not null references users(id) on delete cascade,
          expires_at timestamptz not null
        );
      `);
      await db.execute(sql`
        create table if not exists invites (
          code text primary key,
          used boolean not null default false,
          created_at timestamptz not null,
          used_at timestamptz,
          created_by text
        );
      `);
      await db.execute(sql`
        create table if not exists jobs (
          id text primary key,
          title text not null,
          company text not null,
          city text not null,
          district text not null default '',
          salary text not null,
          tags text[] not null,
          published_at timestamptz not null,
          link text not null,
          status text not null,
          category text not null default '事业单位',
          region text not null default '全国',
          province text not null default '',
          views integer not null default 0,
          apply_link text not null default '',
          source_link text not null default ''
        );
      `);
      await db.execute(sql`
        create table if not exists job_actions (
          user_id text not null references users(id) on delete cascade,
          job_id text not null references jobs(id) on delete cascade,
          applied boolean not null default false,
          note text not null default '',
          updated_at timestamptz not null,
          primary key (user_id, job_id)
        );
      `);
    })();
  }
  await schemaReady;
}

async function ensureAdminUser() {
  if (adminSeeded) return;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shangan.ai";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  if (rows.length === 0) {
    const passwordHash = await hashPassword(adminPassword);
    const adminId = createId();
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      passwordHash,
      role: "admin",
      entitled: true,
      createdAt: new Date(),
    });
  }
  adminSeeded = true;
}

type UserRow = typeof users.$inferSelect;
type SessionRow = typeof sessions.$inferSelect;
type InviteRow = typeof invites.$inferSelect;
type JobRow = typeof jobs.$inferSelect;
type JobActionRow = typeof jobActions.$inferSelect;

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as User["role"],
    entitled: row.entitled,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt.toISOString(),
  };
}

function mapInvite(row: InviteRow): Invite {
  return {
    code: row.code,
    used: row.used,
    createdAt: row.createdAt.toISOString(),
    usedAt: row.usedAt ? row.usedAt.toISOString() : undefined,
    createdBy: row.createdBy ?? undefined,
  };
}

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    city: row.city,
    district: row.district ?? "",
    salary: row.salary,
    tags: row.tags ?? [],
    publishedAt: row.publishedAt.toISOString(),
    link: row.link,
    status: row.status as Job["status"],
    category: row.category ?? "事业单位",
    region: row.region ?? "全国",
    province: row.province ?? "",
    views: typeof row.views === "number" ? row.views : 0,
    applyLink: row.applyLink || row.link,
    sourceLink: row.sourceLink || row.link,
  };
}

function mapJobAction(row: JobActionRow): JobAction {
  return {
    userId: row.userId,
    jobId: row.jobId,
    applied: row.applied,
    note: row.note ?? "",
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createPgStore(): Promise<DataStore> {
  await ensureSchema();
  await ensureAdminUser();

  return {
    async getUserByEmail(email) {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return rows[0] ? mapUser(rows[0]) : null;
    },
    async getUserById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return rows[0] ? mapUser(rows[0]) : null;
    },
    async createUser(user) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        entitled: user.entitled,
        createdAt: new Date(user.createdAt),
      });
      return user;
    },
    async listUsers() {
      const rows = await db.select().from(users).orderBy(desc(users.createdAt));
      return rows.map(mapUser);
    },
    async updateUserEntitled(userId, entitled) {
      await db.update(users).set({ entitled }).where(eq(users.id, userId));
    },
    async createSession(userId, expiresAt) {
      const session = { id: createId(), userId, expiresAt };
      await db.insert(sessions).values({
        id: session.id,
        userId: session.userId,
        expiresAt: new Date(session.expiresAt),
      });
      return session;
    },
    async getSession(id) {
      const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return rows[0] ? mapSession(rows[0]) : null;
    },
    async deleteSession(id) {
      await db.delete(sessions).where(eq(sessions.id, id));
    },
    async createInvite(invite) {
      await db.insert(invites).values({
        code: invite.code,
        used: invite.used,
        createdAt: new Date(invite.createdAt),
        usedAt: invite.usedAt ? new Date(invite.usedAt) : null,
        createdBy: invite.createdBy ?? null,
      });
      return invite;
    },
    async getInvite(code) {
      const rows = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
      return rows[0] ? mapInvite(rows[0]) : null;
    },
    async useInvite(code) {
      const rows = await db
        .update(invites)
        .set({ used: true, usedAt: new Date() })
        .where(and(eq(invites.code, code), eq(invites.used, false)))
        .returning();
      return rows[0] ? mapInvite(rows[0]) : null;
    },
    async listInvites() {
      const rows = await db.select().from(invites).orderBy(desc(invites.createdAt));
      return rows.map(mapInvite);
    },
    async listJobs() {
      const rows = await db.select().from(jobs).orderBy(desc(jobs.publishedAt));
      return rows.map(mapJob);
    },
    async createJob(job) {
      await db.insert(jobs).values({
        id: job.id,
        title: job.title,
        company: job.company,
        city: job.city,
        district: job.district ?? "",
        salary: job.salary,
        tags: job.tags,
        publishedAt: new Date(job.publishedAt),
        link: job.link,
        status: job.status,
        category: job.category,
        region: job.region,
        province: job.province,
        views: job.views,
        applyLink: job.applyLink,
        sourceLink: job.sourceLink,
      });
      return job;
    },
    async deleteJob(jobId) {
      await db.delete(jobs).where(eq(jobs.id, jobId));
    },
    async listJobActions(userId) {
      const rows = await db
        .select()
        .from(jobActions)
        .where(eq(jobActions.userId, userId))
        .orderBy(desc(jobActions.updatedAt));
      return rows.map(mapJobAction);
    },
    async upsertJobAction(action) {
      const updatedAt = action.updatedAt || new Date().toISOString();
      const rows = await db
        .insert(jobActions)
        .values({
          userId: action.userId,
          jobId: action.jobId,
          applied: action.applied,
          note: action.note ?? "",
          updatedAt: new Date(updatedAt),
        })
        .onConflictDoUpdate({
          target: [jobActions.userId, jobActions.jobId],
          set: {
            applied: action.applied,
            note: action.note ?? "",
            updatedAt: new Date(updatedAt),
          },
        })
        .returning();
      return rows[0] ? mapJobAction(rows[0]) : action;
    },
  };
}
