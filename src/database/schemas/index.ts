import { boolean, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./_helpers";

export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  entitled: boolean("entitled").notNull().default(false),
  createdAt: timestamptz("created_at").notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamptz("expires_at").notNull(),
});

export const invites = pgTable("invites", {
  code: text("code").primaryKey().notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamptz("created_at").notNull(),
  usedAt: timestamptz("used_at"),
  createdBy: text("created_by"),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull().default(""),
  salary: text("salary").notNull(),
  tags: text("tags").array().notNull(),
  publishedAt: timestamptz("published_at").notNull(),
  link: text("link").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull().default("事业单位"),
  region: text("region").notNull().default("全国"),
  province: text("province").notNull().default(""),
  views: integer("views").notNull().default(0),
  applyLink: text("apply_link").notNull().default(""),
  sourceLink: text("source_link").notNull().default(""),
});

export const jobActions = pgTable(
  "job_actions",
  {
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    jobId: text("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    applied: boolean("applied").notNull().default(false),
    note: text("note").notNull().default(""),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jobId] })]
);
