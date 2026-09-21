import { describe, it, expect } from 'vitest';
import { calculateOverdueFine } from '../utils/fineCalculator';
import { generateCutterNotation, generateCallNumber } from '../utils/cutter';
import { validateMarcRecord, getMarc21Template } from '../utils/marc21';

describe('BiblioGest Logic & Utility Tests', () => {
  it('calculates overdue fines correctly with grace period', () => {
    const dueDate = new Date('2026-09-10T23:59:59');
    const returnDate = new Date('2026-09-13T10:00:00'); // 3 days late

    const fineResult = calculateOverdueFine({
      dueDate,
      returnDate,
      finePerDay: 1.5,
      gracePeriodDays: 0,
    });

    expect(fineResult.overdueDays).toBe(3);
    expect(fineResult.fineAmount).toBe(4.5);
  });

  it('generates Cutter notation and Call Numbers', () => {
    const cutter = generateCutterNotation('Silva, Edson', 'Introdução à Ciência da Informação');
    expect(cutter).toMatch(/^S\d{3}i$/);

    const callNum = generateCallNumber('005.133', 'Silva, Edson', 'Introdução à Ciência da Informação', 2026);
    expect(callNum).toContain('005.133');
    expect(callNum).toContain('2026');
  });

  it('validates MARC21 records correctly', () => {
    const validMarc = getMarc21Template('LIVRO');
    validMarc.find((f) => f.tag === '245')!.subfields.push({ code: 'a', value: 'Livro Teste MARC' });

    const result = validateMarcRecord(validMarc);
    expect(result.valid).toBe(true);
  });
});
