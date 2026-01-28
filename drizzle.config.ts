import type { Config } from "drizzle-kit";

export default {
  schema: "./src/database/schemas/index.ts",
  out: "./src/database/migrations",
  dialect: "postgresql",
  strict: true,
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
