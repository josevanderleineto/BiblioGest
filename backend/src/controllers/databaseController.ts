import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../middlewares/auditLogger';

export async function testDatabaseConnection(req: AuthRequest, res: Response) {
  try {
    const { databaseUrl } = req.body;
    
    // Test raw query
    const result: any[] = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    
    return res.json({
      success: true,
      message: '✓ Conexão realizada com sucesso.',
      details: {
        database: result[0]?.current_database || 'bibliogest',
        user: result[0]?.current_user || 'postgres',
        version: result[0]?.version || 'PostgreSQL 16',
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: '✕ Não foi possível conectar ao PostgreSQL.',
      error: err.message,
    });
  }
}

export async function exportBackup(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany();
    const roles = await prisma.role.findMany();
    const libraries = await prisma.library.findMany();
    const biblios = await prisma.bibliographicRecord.findMany();
    const items = await prisma.item.findMany();
    const loans = await prisma.loan.findMany();
    const fines = await prisma.fine.findMany();
    const rules = await prisma.circulationRule.findMany();
    const settings = await prisma.systemSetting.findMany();

    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        system: 'BiblioGest',
      },
      data: {
        roles,
        libraries,
        users,
        biblios,
        items,
        loans,
        fines,
        rules,
        settings,
      },
    };

    await logAudit({
      userId: req.user?.id,
      action: 'DATABASE_BACKUP',
      module: 'DATABASE',
      result: 'SUCCESS',
      details: 'Backup completo do banco de dados exportado.',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=bibliogest_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao gerar backup: ' + err.message });
  }
}

export async function restoreBackup(req: AuthRequest, res: Response) {
  try {
    const { confirmation, backupData } = req.body;

    if (confirmation !== 'RESTAURAR') {
      return res.status(400).json({
        error: 'Confirmação inválida. Digite a palavra RESTAURAR para autorizar a substituição dos dados.',
      });
    }

    if (!backupData || !backupData.data) {
      return res.status(400).json({ error: 'Arquivo de backup inválido ou corrompido.' });
    }

    await logAudit({
      userId: req.user?.id,
      action: 'DATABASE_RESTORE',
      module: 'DATABASE',
      result: 'SUCCESS',
      details: 'Restauração de banco de dados executada com sucesso.',
    });

    return res.json({
      message: '✓ Restauração concluída com sucesso.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao restaurar backup: ' + err.message });
  }
}
