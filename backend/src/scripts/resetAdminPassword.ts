import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

async function main() {
  if (!ENV.DEFAULT_ADMIN_USERNAME || !ENV.DEFAULT_ADMIN_PASSWORD) {
    throw new Error('Defina DEFAULT_ADMIN_USERNAME e DEFAULT_ADMIN_PASSWORD no ambiente antes de continuar.');
  }

  const admin = await prisma.user.findUnique({
    where: { username: ENV.DEFAULT_ADMIN_USERNAME },
    select: { id: true },
  });

  if (!admin) {
    throw new Error('O administrador configurado não foi encontrado. Execute a inicialização do banco primeiro.');
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(ENV.DEFAULT_ADMIN_PASSWORD, 10),
      mustChangePassword: true,
    },
  });

  console.log('Senha do administrador redefinida. A troca de senha será exigida no próximo acesso.');
}

main()
  .catch((error: Error) => {
    console.error(`Não foi possível redefinir a senha do administrador: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
