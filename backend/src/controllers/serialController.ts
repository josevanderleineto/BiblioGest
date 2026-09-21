import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function listSerials(req: AuthRequest, res: Response) {
  try {
    const serials = await prisma.serial.findMany({
      include: { issues: true },
      orderBy: { title: 'asc' },
    });
    return res.json(serials);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar periódicos.' });
  }
}

export async function createSerial(req: AuthRequest, res: Response) {
  try {
    const { issn, title, publisher, frequency, location, notes } = req.body;

    if (!issn || !title) {
      return res.status(400).json({ error: 'ISSN e Título são obrigatórios.' });
    }

    const serial = await prisma.serial.create({
      data: { issn, title, publisher, frequency, location, notes },
    });

    return res.status(201).json(serial);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar periódico: ' + err.message });
  }
}

export async function createIssue(req: AuthRequest, res: Response) {
  try {
    const { serialId, volume, number, year, publishedAt, notes } = req.body;

    if (!serialId) {
      return res.status(400).json({ error: 'ID do periódico é obrigatório.' });
    }

    const issue = await prisma.serialIssue.create({
      data: {
        serialId,
        volume,
        number,
        year: year ? parseInt(year, 10) : undefined,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        notes,
      },
    });

    return res.status(201).json(issue);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar fascículo: ' + err.message });
  }
}
