/**
 * Parses a recipe ingredient amount string into a number.
 * Handles decimals ("0.5", "1.5"), simple fractions ("1/2", "3/4"),
 * and mixed numbers ("1 1/2", "2 3/4").
 */
export function parseAmount(val: string): number {
  const s = val.trim();
  // "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // "1/2"
  const fraction = s.match(/^(\d+)\/(\d+)$/);
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2]);
  return parseFloat(s) || 0;
}
