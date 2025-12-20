import { Pool } from 'pg';



const pools: Record<string, Pool> = {};

const createPool = (database: string) => {
  return new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: database,
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });
};

export const getDb = (databaseName: string = process.env.POSTGRES_DB || 'learning_db') => {
  if (!pools[databaseName]) {
    pools[databaseName] = createPool(databaseName);
  }
  return pools[databaseName];
};

export const query = (text: string, params?: any[], databaseName?: string) => {
  const db = getDb(databaseName);
  return db.query(text, params);
};
