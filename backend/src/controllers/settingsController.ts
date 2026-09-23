import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../middlewares/auditLogger';

const editableKeys = ['SYSTEM_NAME', 'LIBRARY_NAME', 'INFORMATION_UNIT_NAME', 'OPAC_DESCRIPTION'];

export async function getPublicLibraryIdentity(req: AuthRequest, res: Response) {
  try {
    const settings = await prisma.systemSetting.findMany({ where: { key: { in: editableKeys } } });
    return res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao consultar a identidade da biblioteca.' }); }
}

export async function getSettings(req: AuthRequest, res: Response) {
  try {
    const settings = await prisma.systemSetting.findMany({ where: { key: { in: editableKeys } } });
    return res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao consultar configurações: ' + err.message }); }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const changes = Object.entries(req.body || {}).filter(([key, value]) => editableKeys.includes(key) && typeof value === 'string');
    if (!changes.length) return res.status(400).json({ error: 'Nenhuma configuração válida foi informada.' });
    if (changes.some(([, value]) => !(value as string).trim() || (value as string).length > 500)) return res.status(400).json({ error: 'Os textos de configuração devem ter entre 1 e 500 caracteres.' });
    await prisma.$transaction(changes.map(([key, value]) => prisma.systemSetting.upsert({ where: { key }, create: { key, value: value as string }, update: { value: value as string } })));
    await logAudit({ userId: req.user?.id, action: 'SETTINGS_UPDATE', module: 'SETTINGS', result: 'SUCCESS', details: 'Identidade da biblioteca atualizada.' });
    return getSettings(req, res);
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao salvar configurações: ' + err.message }); }
}
