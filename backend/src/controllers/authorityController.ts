import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { AuthorityType } from '@prisma/client';

export async function listAuthorities(req: AuthRequest, res: Response) {
  try {
    const { type, search } = req.query;

    const where: any = {};
    if (type) where.type = type as AuthorityType;
    if (search) {
      where.OR = [
        { heading: { contains: search as string, mode: 'insensitive' } },
        { seeAlso: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const authorities = await prisma.authority.findMany({
      where,
      orderBy: { heading: 'asc' },
    });

    return res.json(authorities);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar registros de autoridade.' });
  }
}

export async function createAuthority(req: AuthRequest, res: Response) {
  try {
    const { type, heading, seeAlso, notes } = req.body;

    if (!type || !heading) {
      return res.status(400).json({ error: 'Tipo e cabeçalho principal são obrigatórios.' });
    }

    const authority = await prisma.authority.create({
      data: { type, heading, seeAlso, notes },
    });

    return res.status(201).json(authority);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao criar autoridade: ' + err.message });
  }
}
