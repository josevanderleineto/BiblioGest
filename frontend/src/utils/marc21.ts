export interface MarcSubfield {
  code: string;
  value: string;
}

export interface MarcField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubfield[];
}

/**
 * Validates MARC21 field structure
 */
export function validateMarcRecord(fields: MarcField[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!fields || !Array.isArray(fields)) {
    return { valid: false, errors: ['O registro MARC21 deve ser uma lista de campos.'] };
  }

  const tag245 = fields.find((f) => f.tag === '245');
  if (!tag245) {
    errors.push('Campo obrigatório MARC21 245 (Título Principal) está ausente.');
  } else {
    const subfieldA = tag245.subfields?.find((s) => s.code === 'a' && s.value.trim().length > 0);
    if (!subfieldA) {
      errors.push('Campo MARC21 245 deve ter o subcampo $a com o título da obra.');
    }
  }

  for (const field of fields) {
    if (!/^\d{3}$/.test(field.tag)) {
      errors.push(`Tag inválida: ${field.tag}. Deve ser composta por 3 dígitos numéricos.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extracts Title from MARC21 record (tag 245 $a $b)
 */
export function getTitleFromMarc(fields: MarcField[]): { title: string; subtitle?: string } {
  const f245 = fields.find((f) => f.tag === '245');
  if (!f245) return { title: 'Sem Título' };
  
  const a = f245.subfields.find((s) => s.code === 'a')?.value || '';
  const b = f245.subfields.find((s) => s.code === 'b')?.value || '';
  
  return {
    title: a.replace(/[:\\/]$/, '').trim(),
    subtitle: b.replace(/[\\/]$/, '').trim() || undefined,
  };
}

/**
 * Converts MARC21 JSON fields into standard text format for export
 */
export function exportMarcToText(fields: MarcField[]): string {
  return fields
    .map((f) => {
      const subs = f.subfields.map((s) => `$${s.code} ${s.value}`).join(' ');
      return `${f.tag} ${f.ind1 || ' '}${f.ind2 || ' '} ${subs}`;
    })
    .join('\n');
}

/**
 * Default MARC21 templates for Livro, Periódico, TCC, Audiovisual
 */
export function getMarc21Template(materialType: string): MarcField[] {
  const common = [
    { tag: '001', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'BG-NEW' }] },
    { tag: '008', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '240921s2026    ba a   b    000 0 por d' }] },
    { tag: '020', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }] },
    { tag: '100', ind1: '1', ind2: ' ', subfields: [{ code: 'a', value: '' }, { code: 'e', value: 'autor.' }] },
    { tag: '245', ind1: '1', ind2: '0', subfields: [{ code: 'a', value: '' }, { code: 'b', value: '' }, { code: 'c', value: '' }] },
    { tag: '260', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }, { code: 'b', value: '' }, { code: 'c', value: '' }] },
    { tag: '300', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }, { code: 'b', value: '' }, { code: 'c', value: '' }] },
    { tag: '650', ind1: ' ', ind2: '4', subfields: [{ code: 'a', value: '' }] },
  ];

  if (materialType === 'PERIODICO') {
    return [
      { tag: '001', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'BG-PER' }] },
      { tag: '022', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }] },
      { tag: '245', ind1: '0', ind2: '0', subfields: [{ code: 'a', value: '' }] },
      { tag: '260', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }, { code: 'b', value: '' }] },
      { tag: '310', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'Mensal' }] },
      { tag: '650', ind1: ' ', ind2: '4', subfields: [{ code: 'a', value: '' }] },
    ];
  }

  return common;
}
