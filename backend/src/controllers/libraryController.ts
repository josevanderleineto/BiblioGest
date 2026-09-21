import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export async function listLibraries(req: AuthRequest, res: Response) {
  try {
    const libraries = await prisma.library.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(libraries);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar unidades de biblioteca.' });
  }
}

export async function createLibrary(req: AuthRequest, res: Response) {
  try {
    const { code, name, address, city, state, zipCode, phone, email, openingHours } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Código e nome da biblioteca são obrigatórios.' });
    }

    const library = await prisma.library.create({
      data: { code, name, address, city, state, zipCode, phone, email, openingHours },
    });

    return res.status(201).json(library);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar unidade: ' + err.message });
  }
}

export async function updateLibrary(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { code, name, address, city, state, zipCode, phone, email, openingHours, isActive } = req.body;

    const library = await prisma.library.update({
      where: { id },
      data: { code, name, address, city, state, zipCode, phone, email, openingHours, isActive },
    });

    return res.json(library);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar biblioteca.' });
  }
}
