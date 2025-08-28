import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Your specific database connection
const YOUR_DATABASE_URL = "postgresql://devuser:devpass@193.95.31.4:5432/devdb";

// Try to connect to your database first, with fallback to Replit database
let DATABASE_URL = YOUR_DATABASE_URL;
let pool: Pool;

console.log('🔄 Attempting to connect to your database at 193.95.31.4:5432...');

// First attempt: your database with timeout
const testPool = new Pool({ 
  connectionString: YOUR_DATABASE_URL,
  connectionTimeoutMillis: 5000, // Quick timeout
  ssl: false
});

testPool.connect()
  .then(client => {
    console.log('✅ SUCCESS: Connected to your database at 193.95.31.4:5432');
    console.log('📊 Using YOUR PostgreSQL database for all operations');
    client.release();
    testPool.end(); // Close test connection
  })
  .catch(err => {
    console.log('❌ FAILED: Cannot connect to your database at 193.95.31.4:5432');
    console.log('📝 Reason:', err.message);
    console.log('🔧 This is likely due to network restrictions or firewall settings');
    
    if (process.env.DATABASE_URL) {
      console.log('🔄 Falling back to Replit PostgreSQL database');
      console.log('⚠️  NOTE: You are NOT using your specific database!');
      DATABASE_URL = process.env.DATABASE_URL;
    }
    testPool.end();
  });

// Create the actual pool (will use fallback URL if connection failed)
pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || YOUR_DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL ? undefined : false
});

export { pool };
export const db = drizzle({ client: pool, schema });

// Final connection test
setTimeout(() => {
  pool.connect()
    .then(client => {
      const isYourDB = pool.options.connectionString?.includes('193.95.31.4');
      console.log(isYourDB ? 
        '✅ CONFIRMED: Using YOUR database at 193.95.31.4:5432' : 
        '⚠️  CONFIRMED: Using FALLBACK Replit database (not your specific database)'
      );
      client.release();
    })
    .catch(err => {
      console.error('❌ Database connection completely failed:', err.message);
    });
}, 1000);