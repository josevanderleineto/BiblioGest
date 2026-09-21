import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ENV } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  if (!ENV.DEFAULT_ADMIN_USERNAME || !ENV.DEFAULT_ADMIN_PASSWORD) {
    throw new Error('Defina DEFAULT_ADMIN_USERNAME e DEFAULT_ADMIN_PASSWORD no arquivo .env antes de continuar.');
  }

  const admin = await prisma.user.findUnique({
    where: { username: ENV.DEFAULT_ADMIN_USERNAME },
  });

  if (!admin) {
    throw new Error(`O administrador '${ENV.DEFAULT_ADMIN_USERNAME}' não foi encontrado. Execute o seed inicial para criá-lo.`);
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(ENV.DEFAULT_ADMIN_PASSWORD, 10),
      mustChangePassword: true,
    },
  });

  console.log(`Senha do administrador '${ENV.DEFAULT_ADMIN_USERNAME}' atualizada. A troca de senha será exigida no próximo acesso.`);
}

main()
  .catch((error) => {
    console.error(`Erro ao redefinir a senha do administrador: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
