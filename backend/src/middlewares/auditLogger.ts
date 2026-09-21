import { prisma } from '../config/prisma';

export async function logAudit(params: {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        ipAddress: params.ipAddress,
        result: params.result,
        details: params.details,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
