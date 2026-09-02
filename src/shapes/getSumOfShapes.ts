import type { DoubleArray } from 'cheminfo-types';

import type { InternalPeak } from '../util/internalPeaks/getInternalPeaks.ts';

import { applyShapeParameters } from './applyShapeParameters.ts';

/**
 * This function returns the sumOfShapes function
 * This function gives sumOfShapes access to the peak list and the associated data
 * @param internalPeaks - The peaks being optimized.
 * @returns A function mapping a parameter vector to the sum of the shapes.
 */

export function getSumOfShapes(internalPeaks: InternalPeak[]) {
  return function sumOfShapes(parameters: DoubleArray) {
    applyShapeParameters(internalPeaks, parameters);
    return (x: number) => {
      let totalY = 0;
      for (const peak of internalPeaks) {
        const peakX = parameters[peak.fromIndex];
        const y = parameters[peak.fromIndex + 1];
        totalY += y * peak.shapeFct.fct(x - peakX);
      }
      return totalY;
    };
  };
}
