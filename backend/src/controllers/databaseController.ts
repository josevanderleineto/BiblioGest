import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../middlewares/auditLogger';

type BackupPayload = { meta?: { system?: string; version?: string }; data?: Record<string, unknown> };
const arrayFrom = (data: Record<string, unknown>, key: string): any[] => Array.isArray(data[key]) ? data[key] as any[] : [];

async function readApplicationData() {
  const [roles, permissions, rolePermissions, libraries, users, authorities, biblios, bibliographicAuthorities, items, rules, loans, reservations, fines, serials, serialIssues, acquisitions, disposals, inventoryScans, auditLogs, settings] = await Promise.all([
    prisma.role.findMany(), prisma.permission.findMany(), prisma.rolePermission.findMany(), prisma.library.findMany(), prisma.user.findMany(), prisma.authority.findMany(), prisma.bibliographicRecord.findMany(), prisma.bibliographicAuthority.findMany(), prisma.item.findMany(), prisma.circulationRule.findMany(), prisma.loan.findMany(), prisma.reservation.findMany(), prisma.fine.findMany(), prisma.serial.findMany(), prisma.serialIssue.findMany(), prisma.acquisition.findMany(), prisma.disposal.findMany(), prisma.inventoryScan.findMany(), prisma.auditLog.findMany(), prisma.systemSetting.findMany(),
  ]);
  return { roles, permissions, rolePermissions, libraries, users, authorities, biblios, bibliographicAuthorities, items, rules, loans, reservations, fines, serials, serialIssues, acquisitions, disposals, inventoryScans, auditLogs, settings };
}

async function writeApplicationData(data: Record<string, unknown>, replace: boolean) {
  await prisma.$transaction(async (tx) => {
    if (replace) {
      await tx.auditLog.deleteMany(); await tx.fine.deleteMany(); await tx.loan.deleteMany(); await tx.reservation.deleteMany(); await tx.disposal.deleteMany(); await tx.item.deleteMany(); await tx.bibliographicAuthority.deleteMany(); await tx.authority.deleteMany(); await tx.bibliographicRecord.deleteMany(); await tx.serialIssue.deleteMany(); await tx.serial.deleteMany(); await tx.acquisition.deleteMany(); await tx.inventoryScan.deleteMany(); await tx.circulationRule.deleteMany(); await tx.user.deleteMany(); await tx.rolePermission.deleteMany(); await tx.permission.deleteMany(); await tx.role.deleteMany(); await tx.library.deleteMany(); await tx.systemSetting.deleteMany();
    }
    const add = async (key: string, createMany: (args: { data: any[]; skipDuplicates: boolean }) => Promise<unknown>) => {
      const rows = arrayFrom(data, key);
      if (rows.length) await createMany({ data: rows, skipDuplicates: true });
    };
    await add('roles', tx.role.createMany.bind(tx.role));
    await add('permissions', tx.permission.createMany.bind(tx.permission));
    await add('libraries', tx.library.createMany.bind(tx.library));
    await add('rolePermissions', tx.rolePermission.createMany.bind(tx.rolePermission));
    await add('users', tx.user.createMany.bind(tx.user));
    await add('authorities', tx.authority.createMany.bind(tx.authority));
    await add('biblios', tx.bibliographicRecord.createMany.bind(tx.bibliographicRecord));
    await add('bibliographicAuthorities', tx.bibliographicAuthority.createMany.bind(tx.bibliographicAuthority));
    await add('items', tx.item.createMany.bind(tx.item));
    await add('rules', tx.circulationRule.createMany.bind(tx.circulationRule));
    await add('loans', tx.loan.createMany.bind(tx.loan));
    await add('reservations', tx.reservation.createMany.bind(tx.reservation));
    await add('fines', tx.fine.createMany.bind(tx.fine));
    await add('serials', tx.serial.createMany.bind(tx.serial));
    await add('serialIssues', tx.serialIssue.createMany.bind(tx.serialIssue));
    await add('acquisitions', tx.acquisition.createMany.bind(tx.acquisition));
    await add('disposals', tx.disposal.createMany.bind(tx.disposal));
    await add('inventoryScans', tx.inventoryScan.createMany.bind(tx.inventoryScan));
    await add('settings', tx.systemSetting.createMany.bind(tx.systemSetting));
    await add('auditLogs', tx.auditLog.createMany.bind(tx.auditLog));
  }, { timeout: 30000 });
}

function validBackup(payload: BackupPayload | undefined): payload is Required<Pick<BackupPayload, 'data'>> {
  return Boolean(payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data));
}

export async function testDatabaseConnection(req: AuthRequest, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ success: true, message: '✓ Conexão realizada com sucesso.' });
  } catch (err: any) {
    console.error('Database connection test failed:', err);
    return res.status(500).json({ success: false, message: '✕ Não foi possível conectar ao PostgreSQL.' });
  }
}

export async function exportBackup(req: AuthRequest, res: Response) {
  try {
    const backupData = { meta: { exportedAt: new Date().toISOString(), version: '2.0.0', system: 'BiblioGest' }, data: await readApplicationData() };
    await logAudit({ userId: req.user?.id, action: 'DATABASE_BACKUP', module: 'DATABASE', result: 'SUCCESS', details: 'Backup completo exportado.' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=bibliogest_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao gerar backup: ' + err.message }); }
}

export async function restoreBackup(req: AuthRequest, res: Response) {
  try {
    const { confirmation, backupData } = req.body as { confirmation?: string; backupData?: BackupPayload };
    if (confirmation !== 'RESTAURAR') return res.status(400).json({ error: 'Confirmação inválida. Digite RESTAURAR para autorizar a substituição dos dados.' });
    if (!validBackup(backupData)) return res.status(400).json({ error: 'Arquivo de backup inválido ou corrompido.' });
    await writeApplicationData(backupData.data, true);
    await logAudit({ action: 'DATABASE_RESTORE', module: 'DATABASE', result: 'SUCCESS', details: 'Restauração completa executada.' });
    return res.json({ message: '✓ Restauração concluída com sucesso.' });
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao restaurar backup: ' + err.message }); }
}

export async function importCollaborativeData(req: AuthRequest, res: Response) {
  try {
    const { backupData } = req.body as { backupData?: BackupPayload };
    if (!validBackup(backupData)) return res.status(400).json({ error: 'Arquivo de importação inválido.' });
    await writeApplicationData(backupData.data, false);
    await logAudit({ userId: req.user?.id, action: 'DATABASE_IMPORT', module: 'DATABASE', result: 'SUCCESS', details: 'Dados colaborativos incorporados sem apagar os existentes.' });
    return res.json({ message: '✓ Dados importados. Registros já existentes foram preservados.' });
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao importar dados: ' + err.message }); }
}
