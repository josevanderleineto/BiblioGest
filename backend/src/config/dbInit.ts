import { execSync } from 'child_process';
import path from 'path';
import { prisma } from './prisma';
import { ENV } from './env';

export async function initDatabase() {
  const isCloud = ENV.DATABASE_URL.includes('render.com') || 
                  ENV.DATABASE_URL.includes('supabase') || 
                  ENV.DATABASE_URL.includes('neon.tech') || 
                  ENV.DATABASE_URL.includes('railway') || 
                  !ENV.DATABASE_URL.includes('localhost') && !ENV.DATABASE_URL.includes('127.0.0.1');

  console.log('-------------------------------------------------------');
  console.log(`🔍 Checando banco de dados (${isCloud ? 'Nuvem PostgreSQL' : 'PostgreSQL Local'})...`);

  try {
    // 1. Tentar realizar query simples para verificar se tabelas existem
    const userCount = await prisma.user.count();
    console.log(`✅ Banco de dados conectado com sucesso! Total de usuários cadastrados: ${userCount}`);
    
    if (userCount === 0) {
      console.log('🌱 Banco conectado porém sem registros. Executando seed inicial...');
      runSeed();
    }
  } catch (error: any) {
    console.log('⚠️ Estrutura de tabelas pendente. Inicializando banco de dados...');
    
    try {
      const backendDir = path.resolve(process.cwd());
      
      console.log('⚙️ Gerando cliente Prisma e sincronizando tabelas...');
      execSync('npx prisma generate', {
        cwd: backendDir,
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: ENV.DATABASE_URL },
      });
      
      try {
        execSync('npx prisma db push', {
          cwd: backendDir,
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: ENV.DATABASE_URL },
        });
      } catch (pushErr) {
        execSync('npx prisma migrate deploy', {
          cwd: backendDir,
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: ENV.DATABASE_URL },
        });
      }

      console.log('🌱 Executando povoamento inicial de dados (Seed)...');
      runSeed();
      console.log('🎉 Banco de dados inicializado e configurado com sucesso!');
    } catch (initErr: any) {
      console.error('❌ Falha ao inicializar banco de dados automaticamente:', initErr.message);
      console.log('💡 Dica: Verifique se o serviço PostgreSQL está rodando localmente ou se a string do .env está correta.');
    }
  }
  console.log('-------------------------------------------------------');
}

function runSeed() {
  const backendDir = path.resolve(process.cwd());
  try {
    execSync('npx ts-node prisma/seed.ts', {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: ENV.DATABASE_URL },
    });
  } catch (e: any) {
    console.error('⚠️ Erro ao executar seed:', e.message);
  }
}
