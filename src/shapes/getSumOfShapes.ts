import { InternalPeak } from '../util/internalPeaks/getInternalPeaks';

/**
 * This function returns the sumOfShapes function
 * This function gives sumOfShapes access to the peak list and the associated data
 * @param parameters - parameters
 */

export function getSumOfShapes(internalPeaks: InternalPeak[]) {
  return function sumOfShapes(parameters: number[]) {
    return (x: number) => {
      let totalY = 0;
      for (const peak of internalPeaks) {
        const peakX = parameters[peak.fromIndex];
        const y = parameters[peak.fromIndex + 1];
        for (let i = 2; i < parameters.length; i++) {
          //@ts-expect-error Not simply to solve the issue
          peak.shapeFct[peak.parameters[i]] = parameters[peak.fromIndex + i];
        }
        totalY += y * peak.shapeFct.fct(x - peakX);
      }
      return totalY;
    };
  };
}
