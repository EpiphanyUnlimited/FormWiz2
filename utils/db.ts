import { Pool } from 'pg';

let pool;

if (process.env.NETLIFY_DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // This is for local development, you would need to set up a local Postgres instance
  // and provide a connection string. For now, we'll just log a warning.
  console.warn("Database connection string not found. Please set NETLIFY_DATABASE_URL for production or configure a local database for development.");
}


export const getDb = () => {
  if (!pool) {
    throw new Error("Database not connected. Please check your environment variables.");
  }
  return pool;
};

export const setupDatabase = async () => {
  const db = getDb();
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        stripe_customer_id TEXT,
        subscription_status TEXT DEFAULT 'free'
      );
    `);
    console.log("Database setup successful.");
  } catch (error) {
    console.error("Error setting up the database:", error);
    throw error;
  }
};

// We can call setupDatabase() when the application starts, for example in a serverless function
// that is called upon user login, or we can have a separate setup script.
// For now, we will just define the function and call it from our serverless functions.
