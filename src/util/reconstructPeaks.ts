import type { DoubleArray } from 'cheminfo-types';

import type { OptimizedPeakIDOrNot, Peak } from '../index.ts';

import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';

/**
 * Reconstruct user-facing peak objects from internal peaks and a full
 * actual-parameter vector.
 * @template T - original Peak type
 * @param internalPeaks - internal peaks produced by `getInternalPeaks`
 * @param actualValues - flattened actual parameter values (not normalized for Y)
 * @param yScale - normalization factor previously applied to Y values
 * @returns array of optimized peaks with reconstructed shapes and ids
 */

export function reconstructPeaks<T extends Peak>(
  internalPeaks: InternalPeak[],
  actualValues: DoubleArray,
  yScale: number,
): Array<OptimizedPeakIDOrNot<T>> {
  const newPeaks: Array<OptimizedPeakIDOrNot<T>> = [];

  for (const peak of internalPeaks) {
    const { id, shape, parameters, fromIndex } = peak;

    let newPeak = { x: 0, y: 0, shape } as OptimizedPeakIDOrNot<T>;

    if (id) {
      newPeak = { ...newPeak, id };
    }

    newPeak.x = actualValues[fromIndex];
    newPeak.y = actualValues[fromIndex + 1] * yScale;
    for (let i = 2; i < parameters.length; i++) {
      //@ts-expect-error should be fixed once
      newPeak.shape[parameters[i]] = actualValues[fromIndex + i];
    }
    newPeaks.push(newPeak);
  }

  return newPeaks;
}
