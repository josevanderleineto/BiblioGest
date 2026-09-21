import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roleId: string;
    roleName: string;
    mustChangePassword: boolean;
    permissions: string[];
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Usuário inativo ou não encotrado.' });
    }

    const permissionCodes = user.role.permissions.map((rp) => rp.permission.code);

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      mustChangePassword: user.mustChangePassword,
      permissions: permissionCodes,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Enforces mandatory password change for first-time login
 */
export function requirePasswordChangeCheck(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.mustChangePassword && req.path !== '/change-password' && req.path !== '/me') {
    return res.status(428).json({
      error: 'Troca de senha obrigatória.',
      mustChangePassword: true,
      message: 'Por segurança, você deve alterar sua senha antes de continuar utilizando o sistema.',
    });
  }
  next();
}

/**
 * Checks fine-grained RBAC permission codes
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    // Admin role bypass
    if (req.user.roleName === 'Administrador' || req.user.permissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({
      error: `Permissão negada. É necessária a permissão '${permissionCode}'.`,
    });
  };
}
