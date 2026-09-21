import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import apiRouter from './routes/api';
import { initDatabase } from './config/dbInit';

const app = express();

app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: 'BiblioGest', timestamp: new Date().toISOString() });
});

// Serve frontend static build if frontend/dist exists (Deploy Unificado)
const possibleFrontendPaths = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../public'),
];

let frontendDistPath: string | null = null;
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    frontendDistPath = p;
    break;
  }
}

if (frontendDistPath) {
  console.log(`📦 Frontend estático detectado em: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  
  // SPA fallback (qualquer rota que não seja /api ou /health serve o index.html)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath!, 'index.html'));
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Erro interno no servidor.', details: err.message });
});

const server = app.listen(ENV.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 BiblioGest Servidor Unificado rodando em http://localhost:${ENV.PORT}`);
  console.log(`📌 Ambiente: ${ENV.NODE_ENV}`);
  if (frontendDistPath) {
    console.log(`🌐 Frontend & Backend integrados disponíveis na mesma porta!`);
  }
  console.log(`=======================================================`);
  
  // Executar checagem e inicialização automática do banco de dados (local ou nuvem)
  await initDatabase();
});

export { app, server };

