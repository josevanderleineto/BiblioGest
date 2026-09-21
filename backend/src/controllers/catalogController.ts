import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { generateCallNumber } from '../utils/cutter';
import { validateMarcRecord, getMarc21Template, exportMarcToText } from '../utils/marc21';
import { MaterialType } from '@prisma/client';

export async function listCatalog(req: AuthRequest, res: Response) {
  try {
    const { search, materialType, cdd, author, year, availableOnly } = req.query;

    const where: any = {};
    if (materialType) where.materialType = materialType as MaterialType;
    if (cdd) where.cddNotation = { startsWith: cdd as string };
    if (author) where.authors = { contains: author as string, mode: 'insensitive' };
    if (year) where.publicationYear = parseInt(year as string, 10);

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { subtitle: { contains: search as string, mode: 'insensitive' } },
        { authors: { contains: search as string, mode: 'insensitive' } },
        { isbn: { contains: search as string, mode: 'insensitive' } },
        { issn: { contains: search as string, mode: 'insensitive' } },
        { subjects: { contains: search as string, mode: 'insensitive' } },
        { callNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (availableOnly === 'true') {
      where.items = {
        some: {
          status: 'DISPONIVEL',
        },
      };
    }

    const records = await prisma.bibliographicRecord.findMany({
      where,
      include: {
        items: {
          include: { library: true },
        },
        authorities: {
          include: { authority: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao listar acervo bibliográfico: ' + err.message });
  }
}

export async function getCatalogById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const record = await prisma.bibliographicRecord.findUnique({
      where: { id },
      include: {
        items: {
          include: { library: true },
        },
        authorities: {
          include: { authority: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro bibliográfico não encontrado.' });
    }

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar detalhes da obra.' });
  }
}

export async function createCatalogRecord(req: AuthRequest, res: Response) {
  try {
    const {
      materialType,
      title,
      subtitle,
      authors,
      statementOfResp,
      publicationYear,
      publisher,
      placeOfPublication,
      edition,
      isbn,
      issn,
      language,
      summary,
      subjects,
      cddNotation,
      cduNotation,
      cutterNotation,
      coverUrl,
      marcData,
      rdaData,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título principal da obra é obrigatório.' });
    }

    // Validate MARC21 if provided
    if (marcData && Array.isArray(marcData)) {
      const validation = validateMarcRecord(marcData);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Erros de validação MARC21', details: validation.errors });
      }
    }

    // Auto-generate Call Number if CDD/CDU and Author available
    const generatedCallNumber = generateCallNumber(
      cddNotation || cduNotation || '',
      authors || '',
      title,
      publicationYear ? parseInt(publicationYear, 10) : undefined
    );

    const record = await prisma.bibliographicRecord.create({
      data: {
        materialType: materialType || MaterialType.LIVRO,
        title,
        subtitle,
        authors,
        statementOfResp,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        publisher,
        placeOfPublication,
        edition,
        isbn,
        issn,
        language: language || 'por',
        summary,
        subjects,
        cddNotation,
        cduNotation,
        cutterNotation,
        callNumber: generatedCallNumber,
        coverUrl,
        marcData,
        rdaData,
      },
    });

    return res.status(201).json(record);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao catalogar obra: ' + err.message });
  }
}

export async function updateCatalogRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      materialType,
      title,
      subtitle,
      authors,
      statementOfResp,
      publicationYear,
      publisher,
      placeOfPublication,
      edition,
      isbn,
      issn,
      language,
      summary,
      subjects,
      cddNotation,
      cduNotation,
      cutterNotation,
      callNumber,
      coverUrl,
      marcData,
      rdaData,
    } = req.body;

    const generatedCallNumber = callNumber || generateCallNumber(
      cddNotation || cduNotation || '',
      authors || '',
      title,
      publicationYear ? parseInt(publicationYear, 10) : undefined
    );

    const record = await prisma.bibliographicRecord.update({
      where: { id },
      data: {
        materialType,
        title,
        subtitle,
        authors,
        statementOfResp,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        publisher,
        placeOfPublication,
        edition,
        isbn,
        issn,
        language,
        summary,
        subjects,
        cddNotation,
        cduNotation,
        cutterNotation,
        callNumber: generatedCallNumber,
        coverUrl,
        marcData,
        rdaData,
      },
    });

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar registro bibliográfico.' });
  }
}

export async function deleteCatalogRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.bibliographicRecord.delete({ where: { id } });
    return res.json({ message: 'Registro bibliográfico removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir registro bibliográfico.' });
  }
}

export async function getMarcTemplate(req: AuthRequest, res: Response) {
  const { materialType } = req.params;
  const template = getMarc21Template(materialType || 'LIVRO');
  return res.json(template);
}

export async function exportCatalogRecord(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'marc', 'json', 'ris', 'bibtex'

    const record = await prisma.bibliographicRecord.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Registro não encontrado.' });

    if (format === 'marc' && record.marcData) {
      const text = exportMarcToText(record.marcData as any);
      res.setHeader('Content-Type', 'text/plain');
      return res.send(text);
    }

    if (format === 'ris') {
      const ris = `TY  - BOOK\nTI  - ${record.title}\nAU  - ${record.authors || ''}\nPY  - ${record.publicationYear || ''}\nPB  - ${record.publisher || ''}\nSN  - ${record.isbn || ''}\nER  -\n`;
      res.setHeader('Content-Type', 'text/plain');
      return res.send(ris);
    }

    if (format === 'bibtex') {
      const bib = `@book{biblio_${record.id.substring(0, 8)},\n  title={${record.title}},\n  author={${record.authors || ''}},\n  year={${record.publicationYear || ''}},\n  publisher={${record.publisher || ''}}\n}\n`;
      res.setHeader('Content-Type', 'text/plain');
      return res.send(bib);
    }

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao exportar registro.' });
  }
}
