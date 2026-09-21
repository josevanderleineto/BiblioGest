import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

export async function checkSystemSetupStatus(req: Request, res: Response) {
  try {
    let isDbConnected = false;
    let hasAdminUser = false;
    let totalBiblios = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbConnected = true;

      const admin = await prisma.user.findFirst({
        where: { username: ENV.DEFAULT_ADMIN_USERNAME },
      });
      hasAdminUser = !!admin;

      totalBiblios = await prisma.bibliographicRecord.count();
    } catch (err) {
      isDbConnected = false;
    }

    return res.json({
      isDbConnected,
      hasAdminUser,
      totalBiblios,
      initialized: isDbConnected && hasAdminUser,
      initialAdmin: {
        username: ENV.DEFAULT_ADMIN_USERNAME,
        mustChangePassword: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao checar status de instalação: ' + err.message });
  }
}
