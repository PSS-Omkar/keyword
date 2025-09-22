import { defineConfig } from "drizzle-kit";

// Default to local PostgreSQL for Docker setup
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/keyword_generator";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
