import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRouter from './routes/api';

const app = express();

app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Router
app.use('/api', apiRouter);

// Health check endpoint. The /api path is used by the Vercel Function.
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'OK', system: 'BiblioGest', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Erro interno no servidor.', details: err.message });
});

export { app };
export default app;
