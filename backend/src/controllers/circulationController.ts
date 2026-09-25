import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { calculateOverdueFine } from '../utils/fineCalculator';
import { LoanStatus, ItemStatus, FineStatus, ReservationStatus } from '@prisma/client';

export async function checkout(req: AuthRequest, res: Response) {
  try {
    const { registrationNumber, barcode, loanDaysOverride, requireUserPassword, userPassword } = req.body;

    if (!registrationNumber || !barcode) {
      return res.status(400).json({ error: 'Matrícula do usuário e código de barras do exemplar são obrigatórios.' });
    }

    // 1. Find User
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ registrationNumber }, { cpf: registrationNumber }, { username: registrationNumber }],
      },
      include: {
        fines: { where: { status: 'PENDENTE' } },
        loans: { where: { status: { in: ['ATIVO', 'ATRASADO'] } } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    // A senha é opcional para permitir a circulação rápida, mas, quando o
    // atendente a exigir, ela deve ser conferida no servidor contra o usuário
    // informado — nunca apenas no navegador.
    if (requireUserPassword) {
      if (typeof userPassword !== 'string' || !userPassword) {
        return res.status(400).json({ error: 'Informe a senha do usuário para confirmar o empréstimo.' });
      }
      const passwordMatches = await bcrypt.compare(userPassword, user.passwordHash);
      if (!passwordMatches) {
        return res.status(400).json({ error: 'Senha do usuário incorreta. Empréstimo não realizado.' });
      }
    }

    // Check pending fines block
    if (user.fines.length > 0) {
      const totalPending = user.fines.reduce((acc, f) => acc + f.amount, 0);
      return res.status(400).json({
        error: `Usuário possui multas pendentes no valor total de R$ ${totalPending.toFixed(2)}. Regularize a pendência antes de realizar novo empréstimo.`,
      });
    }

    // 2. Find Item
    const item = await prisma.item.findUnique({
      where: { barcode },
      include: { biblio: true },
    });

    if (!item) {
      return res.status(404).json({ error: 'Exemplar não encontrado.' });
    }

    if (item.status !== ItemStatus.DISPONIVEL) {
      return res.status(400).json({ error: `O exemplar não está disponível para empréstimo. Status atual: ${item.status}` });
    }

    // 3. Find Circulation Rule for User Category & Material Type
    const rule = await prisma.circulationRule.findUnique({
      where: {
        userCategory_materialType: {
          userCategory: user.category,
          materialType: item.biblio.materialType,
        },
      },
    });

    const maxLoans = rule ? rule.maxLoans : 3;
    const defaultDays = rule ? rule.loanDays : 7;

    // Check active loans limit
    if (user.loans.length >= maxLoans) {
      return res.status(400).json({
        error: `Usuário atingiu o limite máximo de ${maxLoans} empréstimos simultâneos para a categoria ${user.category}.`,
      });
    }

    const loanDays = loanDaysOverride ? parseInt(loanDaysOverride, 10) : defaultDays;

    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(checkoutDate.getDate() + loanDays);

    // Create Loan & Update Item status transaction
    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          userId: user.id,
          itemId: item.id,
          checkoutDate,
          dueDate,
          status: LoanStatus.ATIVO,
        },
        include: { user: true, item: { include: { biblio: true } } },
      }),
      prisma.item.update({
        where: { id: item.id },
        data: { status: ItemStatus.EMPRESTADO },
      }),
    ]);

    return res.status(201).json(loan);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao realizar empréstimo: ' + err.message });
  }
}

export async function returnItem(req: AuthRequest, res: Response) {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras ou tombo do exemplar é obrigatório.' });
    }

    const item = await prisma.item.findFirst({
      where: { OR: [{ barcode }, { tombo: barcode }] },
      include: { biblio: true },
    });

    if (!item) {
      return res.status(404).json({ error: 'Exemplar não encontrado.' });
    }

    const activeLoan = await prisma.loan.findFirst({
      where: {
        itemId: item.id,
        status: { in: [LoanStatus.ATIVO, LoanStatus.ATRASADO] },
      },
      include: {
        user: true,
      },
    });

    if (!activeLoan) {
      return res.status(400).json({ error: 'Este exemplar não possui empréstimo ativo pendente de devolução.' });
    }

    const returnDate = new Date();

    // Check circulation rule for fine rate
    const rule = await prisma.circulationRule.findUnique({
      where: {
        userCategory_materialType: {
          userCategory: activeLoan.user.category,
          materialType: item.biblio.materialType,
        },
      },
    });

    const finePerDay = rule ? rule.finePerDay : 1.0;
    const gracePeriodDays = rule ? rule.gracePeriodDays : 0;

    const fineCalc = calculateOverdueFine({
      dueDate: activeLoan.dueDate,
      returnDate,
      finePerDay,
      gracePeriodDays,
    });

    let fineRecord = null;
    if (fineCalc.fineAmount > 0) {
      fineRecord = await prisma.fine.create({
        data: {
          userId: activeLoan.userId,
          loanId: activeLoan.id,
          amount: fineCalc.fineAmount,
          status: FineStatus.PENDENTE,
          reason: `Devolução em atraso de ${fineCalc.overdueDays} dias. Exemplar: ${barcode}`,
        },
      });
    }

    // Check pending reservations for this biblio record
    const nextReservation = await prisma.reservation.findFirst({
      where: {
        biblioId: item.biblioId,
        status: ReservationStatus.AGUARDANDO,
      },
      orderBy: { requestDate: 'asc' },
    });

    const newStatus = nextReservation ? ItemStatus.RESERVADO : ItemStatus.DISPONIVEL;

    if (nextReservation) {
      await prisma.reservation.update({
        where: { id: nextReservation.id },
        data: {
          status: ReservationStatus.DISPONIVEL_PARA_RETIRADA,
          itemId: item.id,
        },
      });
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: activeLoan.id },
        data: {
          returnDate,
          status: LoanStatus.DEVOLVIDO,
        },
      }),
      prisma.item.update({
        where: { id: item.id },
        data: { status: newStatus },
      }),
    ]);

    return res.json({
      message: 'Devolução realizada com sucesso.',
      overdueDays: fineCalc.overdueDays,
      fineGenerated: fineCalc.fineAmount > 0 ? fineCalc.fineAmount : 0,
      fineRecord,
      itemStatus: newStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao devolver exemplar: ' + err.message });
  }
}

export async function renewLoan(req: AuthRequest, res: Response) {
  try {
    const { loanId } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        item: { include: { biblio: true } },
      },
    });

    if (!loan || loan.status === LoanStatus.DEVOLVIDO) {
      return res.status(400).json({ error: 'Empréstimo não encontrado ou já devolvido.' });
    }

    const rule = await prisma.circulationRule.findUnique({
      where: {
        userCategory_materialType: {
          userCategory: loan.user.category,
          materialType: loan.item.biblio.materialType,
        },
      },
    });

    const maxRenewals = rule ? rule.maxRenewals : 2;
    const loanDays = rule ? rule.loanDays : 7;

    if (loan.renewalCount >= maxRenewals) {
      return res.status(400).json({ error: `Limite máximo de ${maxRenewals} renovações atingido.` });
    }

    // Check if there are active holds/reservations on this work
    const pendingHolds = await prisma.reservation.count({
      where: {
        biblioId: loan.item.biblioId,
        status: ReservationStatus.AGUARDANDO,
      },
    });

    if (pendingHolds > 0) {
      return res.status(400).json({ error: 'Não é possível renovar. Existe reserva pendente para esta obra.' });
    }

    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + loanDays);

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewalCount: loan.renewalCount + 1,
        status: LoanStatus.ATIVO,
      },
    });

    return res.json({
      message: 'Empréstimo renovado com sucesso.',
      newDueDate,
      renewalCount: updated.renewalCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao renovar empréstimo: ' + err.message });
  }
}

export async function listLoans(req: AuthRequest, res: Response) {
  try {
    const { userId, status, overdueOnly } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (status) where.status = status as LoanStatus;

    if (overdueOnly === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['ATIVO', 'ATRASADO'] };
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        user: true,
        item: { include: { biblio: true, library: true } },
        fines: true,
      },
      orderBy: { checkoutDate: 'desc' },
    });

    return res.json(loans);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar empréstimos.' });
  }
}

export async function createReservation(req: AuthRequest, res: Response) {
  try {
    const { userId, biblioId } = req.body;

    if (!userId || !biblioId) {
      return res.status(400).json({ error: 'Usuário e Obra são obrigatórios.' });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        biblioId,
        status: ReservationStatus.AGUARDANDO,
      },
      include: { user: true, biblio: true },
    });

    return res.status(201).json(reservation);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao criar reserva: ' + err.message });
  }
}

export async function listReservations(req: AuthRequest, res: Response) {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: true, biblio: true, item: true },
      orderBy: { requestDate: 'desc' },
    });
    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar reservas.' });
  }
}
