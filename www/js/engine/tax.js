import { toPaisa, mulDivR } from './money.js';

/** Source-tax percentage for a status ('submitted' | 'not_submitted'), from config. */
export function taxRatePct(status, cfg) {
  return status === 'submitted' ? cfg.tax.submitted : cfg.tax.notSubmitted;
}

/** Source Tax = gross interest x rate. Applied to interest only, never principal. Paisa in, paisa out. */
export function calcSourceTax(interestPaisa, status, cfg) {
  if (!(interestPaisa > 0)) return 0;
  return mulDivR(interestPaisa, toPaisa(taxRatePct(status, cfg)), 10000, cfg.rounding);
}
