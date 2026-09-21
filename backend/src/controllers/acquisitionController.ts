import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function listAcquisitions(req: AuthRequest, res: Response) {
  try {
    const acquisitions = await prisma.acquisition.findMany({
      orderBy: { receivedDate: 'desc' },
    });
    return res.json(acquisitions);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar aquisições.' });
  }
}

export async function createAcquisition(req: AuthRequest, res: Response) {
  try {
    const { title, author, isbn, supplier, acquisitionType, quantity, unitValue, invoiceNumber, notes } = req.body;

    if (!title || !acquisitionType) {
      return res.status(400).json({ error: 'Título e tipo de aquisição são obrigatórios.' });
    }

    const qty = quantity ? parseInt(quantity, 10) : 1;
    const price = unitValue ? parseFloat(unitValue) : 0;

    const acquisition = await prisma.acquisition.create({
      data: {
        title,
        author,
        isbn,
        supplier,
        acquisitionType,
        quantity: qty,
        unitValue: price,
        totalValue: qty * price,
        invoiceNumber,
        notes,
      },
    });

    return res.status(201).json(acquisition);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar aquisição: ' + err.message });
  }
}

export async function listDisposals(req: AuthRequest, res: Response) {
  try {
    const disposals = await prisma.disposal.findMany({
      include: { item: { include: { biblio: true } } },
      orderBy: { disposalDate: 'desc' },
    });
    return res.json(disposals);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar descartes.' });
  }
}

export async function createDisposal(req: AuthRequest, res: Response) {
  try {
    const { itemId, reason, authorizedBy, destination, notes } = req.body;

    if (!itemId || !reason || !authorizedBy) {
      return res.status(400).json({ error: 'Exemplar, motivo e responsável são obrigatórios.' });
    }

    const disposal = await prisma.$transaction([
      prisma.disposal.create({
        data: { itemId, reason, authorizedBy, destination, notes },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: { status: 'DESCARTADO' },
      }),
    ]);

    return res.status(201).json(disposal[0]);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar descarte: ' + err.message });
  }
}
