import express from 'express';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import { initDatabase } from './config/dbInit';
import { app } from './app';

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

export function startServer() {
  return app.listen(ENV.PORT, async () => {
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
}

// Em plataformas serverless (como Vercel), o módulo é importado pela Function.
// Somente o processo iniciado por `npm run start` deve abrir uma porta.
if (require.main === module) {
  startServer();
}

export { app };
