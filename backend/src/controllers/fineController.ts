import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { FineStatus } from '@prisma/client';

export async function listFines(req: AuthRequest, res: Response) {
  try {
    const { userId, status } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (status) where.status = status as FineStatus;

    const fines = await prisma.fine.findMany({
      where,
      include: {
        user: true,
        loan: { include: { item: { include: { biblio: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return res.json(fines);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar multas.' });
  }
}

export async function payFine(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const fine = await prisma.fine.update({
      where: { id },
      data: {
        status: FineStatus.PAGO,
        paidAt: new Date(),
      },
    });

    return res.json({ message: 'Multa quitada com sucesso.', fine });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao registrar pagamento da multa.' });
  }
}

export async function cancelFine(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const fine = await prisma.fine.update({
      where: { id },
      data: {
        status: FineStatus.CANCELADO,
      },
    });

    return res.json({ message: 'Multa cancelada com sucesso.', fine });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cancelar multa.' });
  }
}
