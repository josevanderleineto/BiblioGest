import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const cwdEnv = path.resolve(process.cwd(), '.env');
const parentEnv = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
} else {
  dotenv.config();
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/bibliogest?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_bibliogest_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  // Used only when the initial administrator is created or explicitly reset.
  // Do not keep an administrator password in source code.
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME?.trim() || '',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || '',
};
