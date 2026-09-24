import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`A variável de ambiente ${name} é obrigatória.`);
  return value;
}

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
  DATABASE_URL: requiredEnvironmentValue('DATABASE_URL'),
  JWT_SECRET: requiredEnvironmentValue('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  // Used only when the initial administrator is created or explicitly reset.
  // Do not keep an administrator password in source code.
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME?.trim() || '',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || '',
  LOGIN_RATE_LIMIT_WINDOW_MS: positiveInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX: positiveInteger(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY?.trim() || '',
};
