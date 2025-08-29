import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Default to local PostgreSQL for Docker setup
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/keyword_generator";

console.log("🔗 Connecting to database:", databaseUrl.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

export const pool = new Pool({
  connectionString: databaseUrl,
  // Additional PostgreSQL configuration for better Docker networking
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

export const db = drizzle(pool, { schema });
