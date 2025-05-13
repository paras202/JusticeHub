import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Add connection options with increased timeout
const sql = neon(process.env.DATABASE_DATABASE_URL, {
  fetchOptions: {
    // Increase timeout to 30 seconds
    timeout: 30000,
    // Add retries
    retryLimit: 3,
    retryDelay: 1000,
  }
});

export const db = drizzle(sql, { schema });