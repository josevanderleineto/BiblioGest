import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function scanInventoryItem(req: AuthRequest, res: Response) {
  try {
    const { sessionId, libraryId, barcode } = req.body;

    if (!sessionId || !libraryId || !barcode) {
      return res.status(400).json({ error: 'Sessão, biblioteca e código de barras são obrigatórios.' });
    }

    const item = await prisma.item.findUnique({
      where: { barcode },
      include: { biblio: true },
    });

    let statusFound = 'ENCONTRADO';
    if (!item) {
      statusFound = 'NAO_ENCONTRADO';
    } else if (item.status === 'EMPRESTADO') {
      statusFound = 'EMPRESTADO';
    } else if (item.libraryId !== libraryId) {
      statusFound = 'INESPERADO';
    }

    const scan = await prisma.inventoryScan.create({
      data: {
        sessionId,
        libraryId,
        barcodeScanned: barcode,
        statusFound,
      },
    });

    return res.json({
      scan,
      item,
      statusFound,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao registrar leitura de inventário: ' + err.message });
  }
}

export async function getInventorySummary(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;

    const scans = await prisma.inventoryScan.findMany({
      where: { sessionId },
    });

    const summary = {
      totalScanned: scans.length,
      encontrados: scans.filter((s) => s.statusFound === 'ENCONTRADO').length,
      emprestados: scans.filter((s) => s.statusFound === 'EMPRESTADO').length,
      inesperados: scans.filter((s) => s.statusFound === 'INESPERADO').length,
      naoCadastrados: scans.filter((s) => s.statusFound === 'NAO_ENCONTRADO').length,
    };

    return res.json({ sessionId, summary, scans });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter relatório de inventário.' });
  }
}
