import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { PatronCategory } from '@prisma/client';

function userWithoutPassword<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const { search, category, isActive, roleId } = req.query;

    const where: any = {};
    if (category) where.category = category as PatronCategory;
    if (roleId) where.roleId = roleId as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { cpf: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        library: true,
      },
      orderBy: { name: 'asc' },
    });

    const result = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      socialName: u.socialName,
      email: u.email,
      cpf: u.cpf,
      rg: u.rg,
      phone: u.phone,
      registrationNumber: u.registrationNumber,
      category: u.category,
      role: u.role.name,
      roleId: u.roleId,
      library: u.library?.name,
      libraryId: u.libraryId,
      isActive: u.isActive,
      validUntil: u.validUntil,
      createdAt: u.createdAt,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        library: true,
        loans: {
          include: {
            item: {
              include: { biblio: true },
            },
          },
        },
        fines: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(userWithoutPassword(user));
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar detalhes do usuário.' });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const {
      username,
      password,
      name,
      socialName,
      cpf,
      rg,
      birthDate,
      gender,
      email,
      phone,
      address,
      zipCode,
      city,
      state,
      registrationNumber,
      category,
      roleId,
      libraryId,
      notes,
    } = req.body;

    if (!username || !password || !email || !name || !registrationNumber || !roleId) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (username, senha, email, name, matricula, roleId).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve possuir pelo menos 6 caracteres.' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { registrationNumber }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este username, e-mail ou matrícula.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        mustChangePassword: true,
        name,
        socialName,
        cpf,
        rg,
        birthDate,
        gender,
        email,
        phone,
        address,
        zipCode,
        city,
        state,
        registrationNumber,
        category: category || PatronCategory.ALUNO,
        roleId,
        libraryId,
        notes,
      },
    });

    return res.status(201).json(userWithoutPassword(user));
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao criar usuário: ' + err.message });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      socialName,
      cpf,
      rg,
      birthDate,
      gender,
      email,
      phone,
      address,
      zipCode,
      city,
      state,
      category,
      roleId,
      libraryId,
      isActive,
      notes,
    } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        socialName,
        cpf,
        rg,
        birthDate,
        gender,
        email,
        phone,
        address,
        zipCode,
        city,
        state,
        category,
        roleId,
        libraryId,
        isActive,
        notes,
      },
    });

    return res.json(userWithoutPassword(user));
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar dados do usuário.' });
  }
}

export async function listRoles(req: AuthRequest, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar funções de usuário.' });
  }
}

export async function listPermissions(req: AuthRequest, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { category: 'asc' },
    });
    return res.json(permissions);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar permissões.' });
  }
}
