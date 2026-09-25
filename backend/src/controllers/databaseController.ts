import { Response } from 'express';
import ExcelJS from 'exceljs';
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

/**
 * Dados que formam o acervo. Este recorte não leva credenciais, dados pessoais
 * de usuários, empréstimos ou logs de auditoria. Assim pode ser guardado como
 * cópia do catálogo e entregue a outro sistema para migração.
 */
async function readCatalogData() {
  const [libraries, authorities, biblios, bibliographicAuthorities, items, serials, serialIssues] = await Promise.all([
    prisma.library.findMany(),
    prisma.authority.findMany(),
    prisma.bibliographicRecord.findMany(),
    prisma.bibliographicAuthority.findMany(),
    prisma.item.findMany(),
    prisma.serial.findMany(),
    prisma.serialIssue.findMany(),
  ]);

  return { libraries, authorities, biblios, bibliographicAuthorities, items, serials, serialIssues };
}

const asExcelText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // Evita que um título ou valor MARC seja interpretado como fórmula ao abrir
  // a planilha no Excel ou LibreOffice.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const asJson = (value: unknown) => value === null || value === undefined ? '' : JSON.stringify(value);

type MarcField = { tag?: unknown; ind1?: unknown; ind2?: unknown; subfields?: Array<{ code?: unknown; value?: unknown }> };

function fallbackMarcFields(biblio: any): MarcField[] {
  const fields: MarcField[] = [{ tag: '001', subfields: [{ value: biblio.id }] }];
  if (biblio.isbn) fields.push({ tag: '020', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: biblio.isbn }] });
  if (biblio.issn) fields.push({ tag: '022', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: biblio.issn }] });
  if (biblio.authors) fields.push({ tag: '100', ind1: '1', ind2: ' ', subfields: [{ code: 'a', value: biblio.authors }] });
  fields.push({ tag: '245', ind1: '1', ind2: '0', subfields: [{ code: 'a', value: biblio.title }, ...(biblio.subtitle ? [{ code: 'b', value: biblio.subtitle }] : []), ...(biblio.statementOfResp ? [{ code: 'c', value: biblio.statementOfResp }] : [])] });
  if (biblio.publisher || biblio.placeOfPublication || biblio.publicationYear) fields.push({ tag: '264', ind1: ' ', ind2: '1', subfields: [...(biblio.placeOfPublication ? [{ code: 'a', value: biblio.placeOfPublication }] : []), ...(biblio.publisher ? [{ code: 'b', value: biblio.publisher }] : []), ...(biblio.publicationYear ? [{ code: 'c', value: String(biblio.publicationYear) }] : [])] });
  if (biblio.subjects) fields.push({ tag: '650', ind1: ' ', ind2: '4', subfields: biblio.subjects.split(',').map((subject: string) => ({ code: 'a', value: subject.trim() })).filter((subfield: any) => subfield.value) });
  if (biblio.cddNotation) fields.push({ tag: '082', ind1: '0', ind2: '4', subfields: [{ code: 'a', value: biblio.cddNotation }] });
  return fields;
}

/** Cria um registro MARC21 ISO 2709 (.mrc), formato de intercâmbio aceito
 * pelos principais sistemas de biblioteca. */
function toMarcIso2709(biblio: any): Buffer {
  const sourceFields = Array.isArray(biblio.marcData) && biblio.marcData.length ? biblio.marcData as MarcField[] : fallbackMarcFields(biblio);
  const encodedFields = sourceFields
    .filter((field) => /^\d{3}$/.test(String(field?.tag || '')))
    .map((field) => {
      const tag = String(field.tag);
      const subfields = Array.isArray(field.subfields) ? field.subfields : [];
      let content: string;
      if (Number(tag) < 10) {
        content = subfields.map((subfield) => String(subfield?.value || '')).join(' ');
      } else {
        const ind1 = String(field.ind1 ?? ' ').slice(0, 1) || ' ';
        const ind2 = String(field.ind2 ?? ' ').slice(0, 1) || ' ';
        content = `${ind1}${ind2}${subfields.map((subfield) => `\x1F${String(subfield?.code || 'a').slice(0, 1)}${String(subfield?.value || '')}`).join('')}`;
      }
      return { tag, value: Buffer.from(`${content}\x1E`, 'utf8') };
    });

  const directoryLength = encodedFields.length * 12;
  const baseAddress = 24 + directoryLength + 1;
  let offset = 0;
  const directory = encodedFields.map((field) => {
    const entry = `${field.tag}${String(field.value.length).padStart(4, '0')}${String(offset).padStart(5, '0')}`;
    offset += field.value.length;
    return entry;
  }).join('');
  const recordLength = baseAddress + offset + 1;
  const leader = `00000nam a2200000   4500`.split('');
  String(recordLength).padStart(5, '0').split('').forEach((character, index) => { leader[index] = character; });
  String(baseAddress).padStart(5, '0').split('').forEach((character, index) => { leader[index + 12] = character; });
  return Buffer.concat([Buffer.from(leader.join(''), 'ascii'), Buffer.from(`${directory}\x1E`, 'ascii'), ...encodedFields.map((field) => field.value), Buffer.from('\x1D', 'ascii')]);
}

function addWorksheetHeader(sheet: ExcelJS.Worksheet, headers: string[]) {
  sheet.addRow(headers);
  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C5C' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
}

function formatWorksheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
    }
  });
}

/** Exportação legível do acervo. Preserva tanto a ficha consolidada quanto
 * todos os campos MARC21 de forma normalizada em uma aba própria. */
export async function exportCatalogSpreadsheet(req: AuthRequest, res: Response) {
  try {
    const data = await readCatalogData();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BiblioGest';
    workbook.created = new Date();
    workbook.modified = new Date();

    const instructions = workbook.addWorksheet('Instruções');
    instructions.getColumn(1).width = 28;
    instructions.getColumn(2).width = 115;
    instructions.addRows([
      ['Backup do acervo catalogado', 'BiblioGest'],
      ['Exportado em', new Date()],
      ['Obras catalogadas', data.biblios.length],
      ['Exemplares', data.items.length],
      ['Como usar', 'A aba Acervo mostra uma ficha por obra e exemplar. A aba MARC21 guarda todos os campos, indicadores e subcampos preenchidos, sem resumir ou descartar dados.'],
      ['Proteção dos dados', 'Guarde esta planilha em local seguro. O backup completo JSON do BiblioGest continua disponível para restauração técnica do sistema.'],
    ]);
    instructions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    instructions.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C5C' } };
    instructions.getCell('B2').numFmt = 'dd/mm/yyyy hh:mm';
    instructions.getColumn(2).alignment = { vertical: 'top', wrapText: true };
    instructions.views = [{ showGridLines: false }];

    const acervo = workbook.addWorksheet('Acervo');
    const acervoHeaders = [
      'ID da obra', 'Tipo de material', 'Título', 'Subtítulo', 'Autores', 'Responsabilidade', 'Ano', 'Editora', 'Local de publicação', 'Edição', 'ISBN', 'ISSN', 'Idioma', 'Resumo', 'Assuntos', 'CDD', 'CDU', 'Cutter', 'Número de chamada', 'Dados RDA (JSON)', 'Dados MARC21 (JSON)', 'ID do exemplar', 'Código de barras', 'Tombo', 'Biblioteca', 'Localização', 'Estante', 'Situação', 'Número de chamada do exemplar', 'Data de aquisição', 'Preço', 'Origem', 'Observações', 'Criado em', 'Atualizado em',
    ];
    addWorksheetHeader(acervo, acervoHeaders);
    const librariesById = new Map(data.libraries.map((library: any) => [library.id, library]));
    const itemsByBiblio = new Map<string, any[]>();
    data.items.forEach((item: any) => itemsByBiblio.set(item.biblioId, [...(itemsByBiblio.get(item.biblioId) || []), item]));
    data.biblios.forEach((biblio: any) => {
      const copies = itemsByBiblio.get(biblio.id) || [null];
      copies.forEach((item) => {
        const library = item ? librariesById.get(item.libraryId) : null;
        acervo.addRow([
          asExcelText(biblio.id), asExcelText(biblio.materialType), asExcelText(biblio.title), asExcelText(biblio.subtitle), asExcelText(biblio.authors), asExcelText(biblio.statementOfResp), biblio.publicationYear ?? '', asExcelText(biblio.publisher), asExcelText(biblio.placeOfPublication), asExcelText(biblio.edition), asExcelText(biblio.isbn), asExcelText(biblio.issn), asExcelText(biblio.language), asExcelText(biblio.summary), asExcelText(biblio.subjects), asExcelText(biblio.cddNotation), asExcelText(biblio.cduNotation), asExcelText(biblio.cutterNotation), asExcelText(biblio.callNumber), asExcelText(asJson(biblio.rdaData)), asExcelText(asJson(biblio.marcData)), item ? asExcelText(item.id) : '', item ? asExcelText(item.barcode) : '', item ? asExcelText(item.tombo) : '', asExcelText(library?.name), item ? asExcelText(item.location) : '', item ? asExcelText(item.shelf) : '', item ? asExcelText(item.status) : '', item ? asExcelText(item.callNumber) : '', item?.acquisitionDate || '', item?.price ?? '', item ? asExcelText(item.source) : '', item ? asExcelText(item.notes) : '', biblio.createdAt || '', biblio.updatedAt || '',
        ]);
      });
    });
    formatWorksheet(acervo, [22, 18, 36, 28, 28, 28, 10, 22, 22, 14, 18, 18, 10, 42, 30, 12, 12, 12, 22, 32, 40, 22, 20, 18, 24, 20, 20, 16, 24, 16, 12, 18, 30, 18, 18]);
    ['AD', 'AH', 'AI'].forEach((column) => acervo.getColumn(column).numFmt = 'dd/mm/yyyy');

    const marc = workbook.addWorksheet('MARC21');
    addWorksheetHeader(marc, ['ID da obra', 'Título', 'Tag', 'Indicador 1', 'Indicador 2', 'Subcampo', 'Valor']);
    data.biblios.forEach((biblio: any) => {
      const fields = Array.isArray(biblio.marcData) ? biblio.marcData : [];
      fields.forEach((field: any) => {
        const subfields = Array.isArray(field?.subfields) && field.subfields.length ? field.subfields : [{ code: '', value: '' }];
        subfields.forEach((subfield: any) => marc.addRow([
          asExcelText(biblio.id), asExcelText(biblio.title), asExcelText(field?.tag), asExcelText(field?.ind1), asExcelText(field?.ind2), asExcelText(subfield?.code), asExcelText(subfield?.value),
        ]));
      });
    });
    formatWorksheet(marc, [22, 38, 10, 12, 12, 12, 70]);

    const authorities = workbook.addWorksheet('Autoridades');
    addWorksheetHeader(authorities, ['ID', 'Tipo', 'Cabeçalho autorizado', 'Ver também', 'Notas', 'Criado em']);
    data.authorities.forEach((authority: any) => authorities.addRow([asExcelText(authority.id), asExcelText(authority.type), asExcelText(authority.heading), asExcelText(authority.seeAlso), asExcelText(authority.notes), authority.createdAt || '']));
    formatWorksheet(authorities, [22, 20, 40, 40, 50, 18]);
    authorities.getColumn(6).numFmt = 'dd/mm/yyyy';

    const authorityLinks = workbook.addWorksheet('Vínculos de autoridades');
    addWorksheetHeader(authorityLinks, ['ID da obra', 'Título da obra', 'ID da autoridade', 'Cabeçalho autorizado', 'Tipo da autoridade']);
    const bibliosById = new Map(data.biblios.map((biblio: any) => [biblio.id, biblio]));
    const authoritiesById = new Map(data.authorities.map((authority: any) => [authority.id, authority]));
    data.bibliographicAuthorities.forEach((link: any) => {
      const biblio = bibliosById.get(link.biblioId) as any;
      const authority = authoritiesById.get(link.authorityId) as any;
      authorityLinks.addRow([asExcelText(link.biblioId), asExcelText(biblio?.title), asExcelText(link.authorityId), asExcelText(authority?.heading), asExcelText(authority?.type)]);
    });
    formatWorksheet(authorityLinks, [22, 42, 22, 42, 20]);

    const libraries = workbook.addWorksheet('Bibliotecas');
    addWorksheetHeader(libraries, ['ID', 'Código', 'Nome', 'Endereço', 'Cidade', 'UF', 'CEP', 'Telefone', 'E-mail', 'Horário de funcionamento', 'Ativa']);
    data.libraries.forEach((library: any) => libraries.addRow([asExcelText(library.id), asExcelText(library.code), asExcelText(library.name), asExcelText(library.address), asExcelText(library.city), asExcelText(library.state), asExcelText(library.zipCode), asExcelText(library.phone), asExcelText(library.email), asExcelText(library.openingHours), library.isActive ? 'Sim' : 'Não']));
    formatWorksheet(libraries, [22, 14, 36, 42, 20, 10, 14, 18, 30, 28, 10]);

    const serials = workbook.addWorksheet('Periódicos');
    addWorksheetHeader(serials, ['ID', 'ISSN', 'Título', 'Editora', 'Frequência', 'Localização', 'Notas', 'Criado em']);
    data.serials.forEach((serial: any) => serials.addRow([asExcelText(serial.id), asExcelText(serial.issn), asExcelText(serial.title), asExcelText(serial.publisher), asExcelText(serial.frequency), asExcelText(serial.location), asExcelText(serial.notes), serial.createdAt || '']));
    formatWorksheet(serials, [22, 18, 42, 28, 18, 28, 45, 18]);
    serials.getColumn(8).numFmt = 'dd/mm/yyyy';

    const issues = workbook.addWorksheet('Fascículos');
    addWorksheetHeader(issues, ['ID', 'ID do periódico', 'Título do periódico', 'Volume', 'Número', 'Ano', 'Publicado em', 'Recebido em', 'Notas']);
    const serialsById = new Map(data.serials.map((serial: any) => [serial.id, serial]));
    data.serialIssues.forEach((issue: any) => issues.addRow([asExcelText(issue.id), asExcelText(issue.serialId), asExcelText((serialsById.get(issue.serialId) as any)?.title), asExcelText(issue.volume), asExcelText(issue.number), issue.year ?? '', issue.publishedAt || '', issue.receivedAt || '', asExcelText(issue.notes)]));
    formatWorksheet(issues, [22, 22, 42, 14, 14, 10, 18, 18, 50]);
    issues.getColumn(7).numFmt = 'dd/mm/yyyy';
    issues.getColumn(8).numFmt = 'dd/mm/yyyy';

    const buffer = await workbook.xlsx.writeBuffer();
    await logAudit({ userId: req.user?.id, action: 'CATALOG_SPREADSHEET_BACKUP', module: 'DATABASE', result: 'SUCCESS', details: 'Planilha do acervo catalogado exportada.' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=bibliogest_acervo_${Date.now()}.xlsx`);
    return res.send(Buffer.from(buffer));
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao gerar planilha do acervo: ' + err.message }); }
}

export async function exportCatalogMarc21(req: AuthRequest, res: Response) {
  try {
    const { biblios } = await readCatalogData();
    const content = Buffer.concat(biblios.map((biblio: any) => toMarcIso2709(biblio)));
    await logAudit({ userId: req.user?.id, action: 'CATALOG_MARC21_EXPORT', module: 'DATABASE', result: 'SUCCESS', details: 'Acervo exportado em MARC21 ISO 2709.' });
    res.setHeader('Content-Type', 'application/marc');
    res.setHeader('Content-Disposition', `attachment; filename=bibliogest_acervo_${Date.now()}.mrc`);
    return res.send(content);
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao exportar acervo em MARC21: ' + err.message }); }
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

export async function exportCatalogBackup(req: AuthRequest, res: Response) {
  try {
    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: '2.1.0',
        system: 'BiblioGest',
        scope: 'catalog',
        description: 'Acervo catalogado: obras, MARC21/RDA, autoridades, bibliotecas, exemplares e periódicos.',
      },
      data: await readCatalogData(),
    };
    await logAudit({ userId: req.user?.id, action: 'CATALOG_BACKUP', module: 'DATABASE', result: 'SUCCESS', details: 'Backup do acervo catalogado exportado.' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=bibliogest_acervo_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao gerar backup do acervo: ' + err.message }); }
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
    const { backupData, targetLibraryId } = req.body as { backupData?: BackupPayload; targetLibraryId?: string };
    if (!validBackup(backupData)) return res.status(400).json({ error: 'Arquivo de importação inválido.' });
    if (targetLibraryId) {
      const targetLibrary = await prisma.library.findUnique({ where: { id: targetLibraryId } });
      if (!targetLibrary || !targetLibrary.isActive) return res.status(400).json({ error: 'Biblioteca de destino não encontrada ou inativa.' });
    }
    const dataToImport = targetLibraryId ? {
      ...backupData.data,
      items: arrayFrom(backupData.data, 'items').map((item) => ({ ...item, libraryId: targetLibraryId })),
    } : backupData.data;
    await writeApplicationData(dataToImport, false);
    await logAudit({ userId: req.user?.id, action: 'DATABASE_IMPORT', module: 'DATABASE', result: 'SUCCESS', details: `Dados colaborativos incorporados sem apagar os existentes.${targetLibraryId ? ' Exemplares direcionados à biblioteca selecionada.' : ''}` });
    return res.json({ message: `✓ Dados importados. Registros já existentes foram preservados.${targetLibraryId ? ' Os exemplares foram direcionados à biblioteca escolhida.' : ''}` });
  } catch (err: any) { return res.status(500).json({ error: 'Erro ao importar dados: ' + err.message }); }
}
