import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../middlewares/auditLogger';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        library: true,
      },
    });

    if (!user || !user.isActive) {
      await logAudit({
        action: 'USER_LOGIN',
        module: 'AUTH',
        ipAddress: req.ip,
        result: 'FAILURE',
        details: `Tentativa de login falhou para o usuário: ${username}`,
      });
      return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAudit({
        userId: user.id,
        action: 'USER_LOGIN',
        module: 'AUTH',
        ipAddress: req.ip,
        result: 'FAILURE',
        details: `Senha incorreta para usuário: ${username}`,
      });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });

    const permissions = user.role.permissions.map((rp) => rp.permission.code);

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      module: 'AUTH',
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Login bem sucedido.`,
    });

    return res.json({
      token,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        category: user.category,
        role: user.role.name,
        library: user.library?.name,
        permissions,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno ao realizar autenticação.' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve possuir pelo menos 6 caracteres.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHashedPassword,
        mustChangePassword: false,
      },
    });

    await logAudit({
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: 'Senha alterada com sucesso.',
    });

    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        library: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      registrationNumber: user.registrationNumber,
      category: user.category,
      mustChangePassword: user.mustChangePassword,
      role: user.role.name,
      library: user.library?.name,
      permissions: req.user.permissions,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao consultar dados do usuário.' });
  }
}
