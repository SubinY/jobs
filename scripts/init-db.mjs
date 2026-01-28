import fs from "fs";
import path from "path";
import { Client, Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.argv[2] ||
  "postgres://postgres:123456@localhost:5432/job";

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const dbName = url.pathname.replace("/", "") || "job";
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = "/postgres";

async function ensureDatabase() {
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const result = await client.query(
    "select 1 from pg_database where datname = $1",
    [dbName]
  );
  if (result.rowCount === 0) {
    await client.query(`create database "${dbName}"`);
  }
  await client.end();
}

async function bootstrapSchema(db) {
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
}

async function runMigrations() {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  const migrationsFolder = path.join(process.cwd(), "src/database/migrations");
  const hasMigrations =
    fs.existsSync(migrationsFolder) &&
    fs.readdirSync(migrationsFolder).some((file) => file.endsWith(".sql"));

  if (hasMigrations) {
    await migrate(db, { migrationsFolder });
  } else {
    await bootstrapSchema(db);
  }

  return pool;
}

async function main() {
  await ensureDatabase();
  const pool = await runMigrations();
  await seedData(pool);
  await pool.end();
  console.log("Database initialized.");
}

main().catch((error) => {
  console.error("Init DB failed:", error);
  process.exit(1);
});

function stripTrailingCommas(raw) {
  return raw.replace(/,\s*(\]|\})/g, "$1");
}

async function readJsonFile(filePath) {
  const raw = await fs.promises.readFile(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    const cleaned = stripTrailingCommas(raw);
    if (cleaned !== raw) {
      return JSON.parse(cleaned);
    }
    throw error;
  }
}

async function getTableCount(pool, tableName) {
  const result = await pool.query(`select count(*)::int as count from ${tableName}`);
  return result.rows[0]?.count ?? 0;
}

function normalizeJob(job) {
  const applyLink = job.applyLink || job.link || "";
  const sourceLink = job.sourceLink || job.link || "";
  const views = typeof job.views === "number" ? job.views : Number(job.views ?? 0);
  return {
    ...job,
    category: job.category || "事业单位",
    region: job.region || "全国",
    province: job.province || job.city || "",
    district: job.district || "",
    views: Number.isFinite(views) ? views : 0,
    applyLink,
    sourceLink,
  };
}

async function seedUsers(pool, usersPath) {
  if (!fs.existsSync(usersPath)) return;
  const count = await getTableCount(pool, "users");
  if (count > 0) return;
  const users = await readJsonFile(usersPath);
  if (!Array.isArray(users) || users.length === 0) return;
  for (const user of users) {
    if (!user?.id || !user?.email || !user?.passwordHash) continue;
    await pool.query(
      `insert into users (id, email, password_hash, role, entitled, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict do nothing`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.role || "user",
        user.entitled ?? false,
        user.createdAt ? new Date(user.createdAt) : new Date(),
      ]
    );
  }
}

async function seedJobs(pool, jobsPath) {
  if (!fs.existsSync(jobsPath)) return;
  const count = await getTableCount(pool, "jobs");
  if (count > 0) return;
  const jobs = await readJsonFile(jobsPath);
  if (!Array.isArray(jobs) || jobs.length === 0) return;
  for (const rawJob of jobs) {
    if (!rawJob?.id || !rawJob?.title || !rawJob?.company) continue;
    const job = normalizeJob(rawJob);
    await pool.query(
      `insert into jobs (
        id, title, company, city, district, salary, tags, published_at, link, status,
        category, region, province, views, apply_link, source_link
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
      on conflict do nothing`,
      [
        job.id,
        job.title,
        job.company,
        job.city || "",
        job.district || "",
        job.salary || "",
        Array.isArray(job.tags) ? job.tags : [],
        job.publishedAt ? new Date(job.publishedAt) : new Date(),
        job.link || "",
        job.status || "open",
        job.category || "事业单位",
        job.region || "全国",
        job.province || "",
        typeof job.views === "number" ? job.views : 0,
        job.applyLink || "",
        job.sourceLink || "",
      ]
    );
  }
}

async function seedData(pool) {
  const dataDir = path.join(process.cwd(), "data");
  await seedUsers(pool, path.join(dataDir, "users.json"));
  await seedJobs(pool, path.join(dataDir, "jobs.json"));
}
