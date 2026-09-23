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
    // A conexão deve ser testada sem consultar uma tabela da aplicação: ela pode
    // ainda não existir em uma instalação nova.
    await prisma.$queryRaw`SELECT 1`;
    const tables: Array<{ users: string | null }> = await prisma.$queryRaw`
      SELECT to_regclass('public.users')::text AS users
    `;

    if (!tables[0]?.users) {
      console.warn('⚠️ As tabelas do BiblioGest ainda não foram instaladas. Nenhuma alteração foi feita automaticamente.');
      console.warn('   Execute "npm run db:migrate --prefix backend" para instalar a estrutura com segurança.');
      return;
    }

    const userCount = await prisma.user.count();
    console.log(`✅ Banco de dados conectado com sucesso! Total de usuários cadastrados: ${userCount}`);
  } catch (error: any) {
    console.error('❌ Não foi possível validar o banco de dados:', error.message);
    console.log('💡 Confirme a DATABASE_URL no arquivo backend/.env e execute a migração manualmente quando necessário.');
  }
  console.log('-------------------------------------------------------');
}
