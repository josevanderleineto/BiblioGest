import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRouter from './routes/api';

const app = express();

const allowAnyOrigin = ENV.CORS_ORIGIN.includes('*');
const allowedOrigins = ENV.CORS_ORIGIN.filter((origin) => origin !== '*');

// O pacote "cors" nao combina "*" com credentials: true. O frontend envia JSON
// e autentica por token no header Authorization, nunca por cookie, entao
// dispense o credentials e use o wildcard estatico, que o pacote emite.
app.use(cors({
  origin: allowAnyOrigin ? '*' : allowedOrigins,
  credentials: !allowAnyOrigin,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check. Precisa vir antes do router: o /api do router exige token, e
// o path /api/health existe justamente para o diagnostico da Function.
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    system: 'BiblioGest',
    timestamp: new Date().toISOString(),
    turnstileConfigured: Boolean(ENV.TURNSTILE_SITE_KEY && ENV.TURNSTILE_SECRET_KEY),
  });
});

// API Router
app.use('/api', apiRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Erro interno no servidor.', details: err.message });
});

export { app };
export default app;
