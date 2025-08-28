import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Your specific database connection
const YOUR_DATABASE_URL = "postgresql://devuser:devpass@193.95.31.4:5432/devdb";

console.log('🔄 Connecting to YOUR database at 193.95.31.4:5432/devdb...');

export const pool = new Pool({ 
  connectionString: YOUR_DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: false
});

export const db = drizzle({ client: pool, schema });

// Test connection and confirm database details
pool.connect()
  .then(async (client) => {
    try {
      const result = await client.query('SELECT version(), current_database(), inet_server_addr(), inet_server_port()');
      const dbInfo = result.rows[0];
      
      console.log('✅ SUCCESS: Connected to YOUR database!');
      console.log(`📊 Database: ${dbInfo.current_database} at ${dbInfo.inet_server_addr}:${dbInfo.inet_server_port}`);
      console.log(`🔧 PostgreSQL: ${dbInfo.version.split(' ')[0]} ${dbInfo.version.split(' ')[1]}`);
      console.log('🎯 All data operations are using YOUR specific database');
      
      client.release();
    } catch (err) {
      console.error('Error getting database info:', err.message);
      client.release();
    }
  })
  .catch(err => {
    console.error('❌ Connection to your database failed:', err.message);
    console.error('🔧 Check your firewall settings and database configuration');
  });