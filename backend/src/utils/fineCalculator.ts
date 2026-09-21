interface FineCalculationParams {
  dueDate: Date;
  returnDate?: Date;
  finePerDay: number;
  gracePeriodDays: number;
}

export interface FineCalculationResult {
  overdueDays: number;
  billableDays: number;
  fineAmount: number;
}

/**
 * Calculates fine for an overdue loan
 */
export function calculateOverdueFine(params: FineCalculationParams): FineCalculationResult {
  const { dueDate, returnDate = new Date(), finePerDay, gracePeriodDays } = params;

  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);

  const ret = new Date(returnDate);
  ret.setHours(0, 0, 0, 0);

  const diffTime = ret.getTime() - due.getTime();
  if (diffTime <= 0) {
    return { overdueDays: 0, billableDays: 0, fineAmount: 0 };
  }

  const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (overdueDays <= gracePeriodDays) {
    return { overdueDays, billableDays: 0, fineAmount: 0 };
  }

  const billableDays = overdueDays - gracePeriodDays;
  const fineAmount = parseFloat((billableDays * finePerDay).toFixed(2));

  return {
    overdueDays,
    billableDays,
    fineAmount,
  };
}
