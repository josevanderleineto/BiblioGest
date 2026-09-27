import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { PatronCategory } from '@prisma/client';
import { logAudit } from '../middlewares/auditLogger';

const ADMIN_ROLE = 'Administrador';
const LIBRARIAN_ROLE = 'Bibliotecário';
const ASSISTANT_ROLE = 'Auxiliar de Biblioteca';

function userWithoutPassword<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * There is no separate "reader" role in the existing schema: patron accounts
 * use the Auxiliar de Biblioteca role. A supervisor may reset those accounts;
 * an auxiliary may reset only non-staff patrons, never another staff account.
 */
function canResetTargetPassword(actorRole: string, target: { role: { name: string }; category: PatronCategory }) {
  if (target.role.name !== ASSISTANT_ROLE) return false;
  if (actorRole === ADMIN_ROLE || actorRole === LIBRARIAN_ROLE) return true;
  return actorRole === ASSISTANT_ROLE && target.category !== PatronCategory.SERVIDOR;
}

export async function listPasswordResetTargets(req: AuthRequest, res: Response) {
  try {
    const actorRole = req.user?.roleName;
    if (!actorRole) return res.status(401).json({ error: 'Não autenticado.' });

    const where: any = { role: { name: ASSISTANT_ROLE } };
    if (actorRole === ASSISTANT_ROLE) {
      where.category = { not: PatronCategory.SERVIDOR };
    } else if (actorRole !== ADMIN_ROLE && actorRole !== LIBRARIAN_ROLE) {
      return res.status(403).json({ error: 'Seu perfil não pode redefinir senhas de outras pessoas.' });
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        registrationNumber: true,
        category: true,
        role: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(users.map((user) => ({ ...user, role: user.role.name })));
  } catch {
    return res.status(500).json({ error: 'Erro ao listar contas para redefinição de senha.' });
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response) {
  try {
    const actor = req.user;
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!actor) return res.status(401).json({ error: 'Não autenticado.' });
    if (actor.id === id) {
      return res.status(400).json({ error: 'Para alterar sua própria senha, use a opção de troca de senha do seu perfil.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve possuir pelo menos 6 caracteres.' });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (!canResetTargetPassword(actor.roleName, target)) {
      return res.status(403).json({ error: 'Seu perfil não pode redefinir a senha desta conta.' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        mustChangePassword: true,
      },
    });

    await logAudit({
      userId: actor.id,
      action: 'USER_PASSWORD_RESET',
      module: 'USERS',
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Senha temporária definida para a conta ${target.username}.`,
    });

    return res.json({ message: 'Senha temporária definida. A pessoa deverá criar uma nova senha no próximo acesso.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao redefinir a senha do usuário.' });
  }
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
