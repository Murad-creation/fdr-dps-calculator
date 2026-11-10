import { calcDPS } from './dps.js';
import { calcFDR } from './fdr.js';
import { calcTBSD } from './tbsd.js';

export { calcDPS, calcFDR, calcTBSD };
export { calcSourceTax, taxRatePct } from './tax.js';
export { dutyForBalance, exciseByYear } from './excise.js';
export { toPaisa } from './money.js';

// Product registry: add a new deposit product by registering one function (input, config) -> result.
const registry = { dps: calcDPS, fdr: calcFDR, tbsd: calcTBSD };
export const registerProduct = (name, fn) => { registry[name] = fn; };
export function calculate(product, input, cfg) {
  const fn = registry[product];
  if (!fn) throw new Error(`Unknown product: ${product}`);
  return fn(input, cfg);
}
