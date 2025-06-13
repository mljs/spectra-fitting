import type { InternalPeak } from '../util/internalPeaks/getInternalPeaks.ts';

/**
 * This function returns the sumOfShapes function
 * This function gives sumOfShapes access to the peak list and the associated data
 * @param internalPeaks
 */

export function getSumOfShapes(internalPeaks: InternalPeak[]) {
  return function sumOfShapes(parameters: number[]) {
    return (x: number) => {
      let totalY = 0;
      for (const peak of internalPeaks) {
        const peakX = parameters[peak.fromIndex];
        const y = parameters[peak.fromIndex + 1];
        for (let i = 2; i < parameters.length; i++) {
          type Parameter = (typeof peak.parameters)[number];
          const shapeFctKey = peak.parameters[i] as Extract<
            Parameter,
            keyof typeof peak.shapeFct
          >;
          peak.shapeFct[shapeFctKey] = parameters[peak.fromIndex + i];
        }
        totalY += y * peak.shapeFct.fct(x - peakX);
      }
      return totalY;
    };
  };
}
