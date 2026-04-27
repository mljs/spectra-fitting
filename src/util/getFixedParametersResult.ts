import type { NumberArray } from 'cheminfo-types';
import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';
import type { OptimizedPeakIDOrNot, Peak } from '../index.ts';

export function getFixedParametersResult(
  internalPeaks: InternalPeak[],
  normalizedY: Float64Array,
  x: NumberArray,
  globalInit: Float64Array,
  baseSumOfShapes: (parameters: number[]) => (x: number) => number,
  minMaxY: { min: number; max: number; range: number },
  shiftValue: number,
) {
  const fittedValues = Array.from(globalInit);
  const newPeaks = [];
  for (const peak of internalPeaks) {
    const { id, shape, parameters, fromIndex } = peak;
    let newPeak = { x: 0, y: 0, shape } as OptimizedPeakIDOrNot<Peak>;
    if (id) newPeak = { ...newPeak, id };

    newPeak.x = fittedValues[fromIndex];
    newPeak.y = fittedValues[fromIndex + 1] * minMaxY.range + shiftValue;
    for (let i = 2; i < parameters.length; i++) {
      newPeak.shape[parameters[i]] = fittedValues[fromIndex + i];
    }
    newPeaks.push(newPeak);
  }

  const fct = baseSumOfShapes(fittedValues);
  let error = 0;
  for (let i = 0; i < normalizedY.length; i++) {
    error += (normalizedY[i] - fct(x[i])) ** 2;
  }

  return {
    error,
    iterations: 0,
    peaks: newPeaks,
  };
}
