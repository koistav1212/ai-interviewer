import { sql } from "@vercel/postgres";

// We expose the sql client so API routes can query the DB.
// Vercel Postgres automatically uses process.env.POSTGRES_URL
export const db = sql;
