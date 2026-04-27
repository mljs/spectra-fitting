import type { NumberArray } from 'cheminfo-types';

import type { OptimizedPeakIDOrNot, Peak } from '../index.ts';

import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';

export function getFixedParametersResult<T extends Peak>(
  internalPeaks: InternalPeak[],
  normalizedY: Float64Array,
  x: NumberArray,
  globalInit: Float64Array,
  baseSumOfShapes: (parameters: number[]) => (x: number) => number,
  minMaxY: { min: number; max: number; range: number },
  shiftValue: number,
): {
  error: number;
  iterations: number;
  peaks: Array<OptimizedPeakIDOrNot<T>>;
} {
  const fittedValues = Array.from(globalInit);
  const newPeaks: Peak[] = [];
  for (const peak of internalPeaks) {
    const { id, shape, parameters, fromIndex } = peak;
    let newPeak = { x: 0, y: 0, shape };
    if (id) {
      //@ts-expect-error it is right step
      newPeak = { ...newPeak, id };
    }
    newPeak.x = fittedValues[fromIndex];
    newPeak.y = fittedValues[fromIndex + 1] * minMaxY.range + shiftValue;
    for (let i = 2; i < parameters.length; i++) {
      //@ts-expect-error it is right step
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
    peaks: newPeaks as Array<OptimizedPeakIDOrNot<T>>,
  };
}
