import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { ItemStatus } from '@prisma/client';

export async function listItems(req: AuthRequest, res: Response) {
  try {
    const { biblioId, libraryId, status, barcode, tombo } = req.query;

    const where: any = {};
    if (biblioId) where.biblioId = biblioId as string;
    if (libraryId) where.libraryId = libraryId as string;
    if (status) where.status = status as ItemStatus;
    if (barcode) where.barcode = barcode as string;
    if (tombo) where.tombo = tombo as string;

    const items = await prisma.item.findMany({
      where,
      include: {
        biblio: true,
        library: true,
      },
      orderBy: { barcode: 'asc' },
    });

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar exemplares.' });
  }
}

export async function createItem(req: AuthRequest, res: Response) {
  try {
    const { biblioId, libraryId, barcode, tombo, location, shelf, price, source, notes } = req.body;

    if (!biblioId || !libraryId || !barcode || !tombo) {
      return res.status(400).json({ error: 'Obra, biblioteca, código de barras e tombo são obrigatórios.' });
    }

    const existingBarcode = await prisma.item.findUnique({ where: { barcode } });
    if (existingBarcode) {
      return res.status(400).json({ error: 'Código de barras já está em uso.' });
    }

    const existingTombo = await prisma.item.findUnique({ where: { tombo } });
    if (existingTombo) {
      return res.status(400).json({ error: 'Número de tombo já está em uso.' });
    }

    const item = await prisma.item.create({
      data: {
        biblioId,
        libraryId,
        barcode,
        tombo,
        location,
        shelf,
        price: price ? parseFloat(price) : undefined,
        source,
        notes,
        status: ItemStatus.DISPONIVEL,
      },
      include: { biblio: true, library: true },
    });

    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar exemplar: ' + err.message });
  }
}

export async function updateItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { libraryId, location, shelf, status, price, source, notes } = req.body;

    const item = await prisma.item.update({
      where: { id },
      data: { libraryId, location, shelf, status, price, source, notes },
      include: { biblio: true, library: true },
    });

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar exemplar.' });
  }
}

export async function getItemByBarcode(req: AuthRequest, res: Response) {
  try {
    const { barcode } = req.params;
    const item = await prisma.item.findUnique({
      where: { barcode },
      include: {
        biblio: true,
        library: true,
        loans: {
          where: { status: 'ATIVO' },
          include: { user: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Exemplar não encontrado para este código de barras.' });
    }

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar exemplar.' });
  }
}

export async function getItemLabels(req: AuthRequest, res: Response) {
  try {
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : [];
    const biblioId = typeof req.query.biblioId === 'string' ? req.query.biblioId : undefined;
    if (!ids.length && !biblioId) return res.status(400).json({ error: 'Informe os exemplares ou a obra para gerar as etiquetas.' });

    const items = await prisma.item.findMany({
      where: ids.length ? { id: { in: ids } } : { biblioId },
      include: { biblio: true, library: true },
      orderBy: { barcode: 'asc' },
    });
    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao gerar dados das etiquetas: ' + err.message });
  }
}
