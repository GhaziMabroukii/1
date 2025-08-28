import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Test the connection
pool.connect()
  .then(client => {
    console.log('✓ Database connection established successfully');
    client.release();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });