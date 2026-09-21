import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const totalUsers = await prisma.user.count({ where: { isActive: true } });
    const totalBiblios = await prisma.bibliographicRecord.count();
    const totalItems = await prisma.item.count();
    const availableItems = await prisma.item.count({ where: { status: 'DISPONIVEL' } });
    const activeLoans = await prisma.loan.count({ where: { status: 'ATIVO' } });
    const overdueLoans = await prisma.loan.count({
      where: {
        dueDate: { lt: new Date() },
        status: { in: ['ATIVO', 'ATRASADO'] },
      },
    });
    const totalReservations = await prisma.reservation.count({ where: { status: 'AGUARDANDO' } });
    const pendingFinesSum = await prisma.fine.aggregate({
      where: { status: 'PENDENTE' },
      _sum: { amount: true },
    });

    const recentLoans = await prisma.loan.findMany({
      take: 5,
      orderBy: { checkoutDate: 'desc' },
      include: { user: true, item: { include: { biblio: true } } },
    });

    return res.json({
      totalUsers,
      totalBiblios,
      totalItems,
      availableItems,
      activeLoans,
      overdueLoans,
      totalReservations,
      totalPendingFinesAmount: pendingFinesSum._sum.amount || 0,
      recentLoans,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao carregar estatísticas do painel: ' + err.message });
  }
}

export async function getOverdueReport(req: AuthRequest, res: Response) {
  try {
    const overdues = await prisma.loan.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { in: ['ATIVO', 'ATRASADO'] },
      },
      include: {
        user: true,
        item: { include: { biblio: true, library: true } },
        fines: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(overdues);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao gerar relatório de atrasos.' });
  }
}
