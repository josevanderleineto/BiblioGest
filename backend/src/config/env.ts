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

const NODE_ENV = process.env.NODE_ENV || 'development';

// O frontend e a API sao publicados no mesmo dominio da Vercel, entao o
// proprio host do deploy precisa ser aceito sem depender de CORS_ORIGIN.
function normalizeOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '*') return undefined;
  // O pacote "cors" compara a origem recebida como texto exato. A Vercel
  // expoe os dominios sem esquema, enquanto o navegador sempre envia o scheme.
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const VERCEL_PROJECT_PROD_URL = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
const VERCEL_BRANCH_URL = normalizeOrigin(process.env.VERCEL_BRANCH_URL);

function definedValues(values: Array<string | undefined> | undefined): string[] {
  return (values ?? []).filter((value): value is string => Boolean(value));
}

function defaultCorsOrigins(): string[] {
  if (NODE_ENV === 'production') {
    // Um wildcard evita que o login quebre quando o dominio do preview muda a
    // cada deploy. O app envia JSON e autentica por token no header, nunca por
    // cookie, entao nao ha exposicao de CSRF por credencial.
    return ['*', ...definedValues([VERCEL_PROJECT_PROD_URL, VERCEL_BRANCH_URL])];
  }
  return ['http://localhost:3000', 'http://localhost:5173'];
}

function resolveCorsOrigins(): string[] {
  const configured = definedValues(process.env.CORS_ORIGIN?.split(',').map(normalizeOrigin));

  // Sem configuracao explicita em producao, liberamos o dominio do proprio
  // deploy. Um CORS_ORIGIN apontando so para localhost mantem o erro original,
  // porque nenhum item casaria com a origem real do navegador.
  if (configured.length === 0) return defaultCorsOrigins();

  const fromVercel = definedValues([VERCEL_PROJECT_PROD_URL, VERCEL_BRANCH_URL]);
  return [...new Set([...configured, ...fromVercel])];
}

export const ENV = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: requiredEnvironmentValue('DATABASE_URL'),
  JWT_SECRET: requiredEnvironmentValue('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: resolveCorsOrigins(),
  // Used only when the initial administrator is created or explicitly reset.
  // Do not keep an administrator password in source code.
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME?.trim() || '',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || '',
  LOGIN_RATE_LIMIT_WINDOW_MS: positiveInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX: positiveInteger(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  // The site key is public, but keeping its presence here lets the API detect
  // an incomplete Turnstile setup before it silently blocks every login.
  TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY?.trim() || '',
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY?.trim() || '',
};
