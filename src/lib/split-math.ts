/**
 * Splits `total` cents across the given weights using the largest-remainder
 * method, so the parts always sum exactly to `total` (no cent lost or invented).
 * Mirrors the backend's distribution. Works for negative totals too (discounts).
 * Ties are broken by index for determinism.
 */
export function distributeCents(total: number, weights: number[]): number[] {
  const result = new Array<number>(weights.length).fill(0);
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW === 0) return result;

  const fracs: { i: number; frac: number }[] = [];
  let assigned = 0;
  weights.forEach((w, i) => {
    const exact = (total * w) / sumW;
    const floor = Math.floor(exact);
    result[i] = floor;
    assigned += floor;
    fracs.push({ i, frac: exact - floor });
  });

  const leftover = total - assigned; // always 0..n thanks to flooring
  fracs.sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < leftover && k < fracs.length; k++) {
    result[fracs[k].i] += 1;
  }
  return result;
}
