import type { DoubleArray } from 'cheminfo-types';

import type { InternalPeak } from '../util/internalPeaks/getInternalPeaks.ts';

/**
 * Copy the shape parameters out of the flattened parameter vector into the shape
 * instances, so `fct` and `derivative` evaluate the current candidate.
 * @param internalPeaks - The peaks being optimized.
 * @param parameters - Flattened per-peak parameter values.
 */
export function applyShapeParameters(
  internalPeaks: InternalPeak[],
  parameters: DoubleArray,
) {
  for (const peak of internalPeaks) {
    for (let i = 2; i < peak.parameters.length; i++) {
      type Parameter = (typeof peak.parameters)[number];
      const shapeFctKey = peak.parameters[i] as Extract<
        Parameter,
        keyof typeof peak.shapeFct
      >;
      peak.shapeFct[shapeFctKey] = parameters[peak.fromIndex + i];
    }
  }
}
