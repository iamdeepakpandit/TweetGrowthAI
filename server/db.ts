import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use REPLIT_DB_URL if DATABASE_URL is not set
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

if (databaseUrl) {
  // Use PostgreSQL/Neon if database URL is available
  export const pool = new Pool({ connectionString: databaseUrl });
  export const db = drizzleNeon({ client: pool, schema });
} else {
  // Fallback to SQLite for local development
  console.log('No PostgreSQL database URL found, using SQLite fallback');
  const sqlite = new Database('local.db');
  export const db = drizzleSqlite({ client: sqlite, schema });
  export const pool = null; // Not used with SQLite
}