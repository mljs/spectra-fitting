import type { NumberArray } from 'cheminfo-types';

import type { OptimizedPeakIDOrNot, Peak } from '../index.ts';

import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';
import { reconstructPeaks } from './reconstructPeaks.ts';

/**
 * Build result when no parameters are free to optimize.
 * Computes the fit error using the provided `globalInit` parameter vector
 * and reconstructs the output peak objects from `internalPeaks`.
 * @template T - input Peak type
 * @param internalPeaks - internal representation of peaks (with parameter indices)
 * @param normalizedY - observed Y values normalized by the global scale
 * @param x - X axis values
 * @param globalInit - full parameter vector (actual-space) used to evaluate the model
 * @param baseSumOfShapes - function that returns the spectrum function given parameters
 * @param yScale - the scale factor used to normalize Y (used to reconstruct peak amplitudes)
 * @returns an object containing `error`, `iterations` (0) and the reconstructed `peaks`
 */
export function getFixedParametersResult<T extends Peak>(
  internalPeaks: InternalPeak[],
  normalizedY: Float64Array,
  x: NumberArray,
  globalInit: Float64Array,
  baseSumOfShapes: (parameters: number[]) => (x: number) => number,
  yScale: number,
): {
  error: number;
  iterations: number;
  peaks: Array<OptimizedPeakIDOrNot<T>>;
} {
  const fittedValues = Array.from(globalInit);

  const fct = baseSumOfShapes(fittedValues);
  let error = 0;
  for (let i = 0; i < normalizedY.length; i++) {
    error += (normalizedY[i] - fct(x[i])) ** 2;
  }

  return {
    error,
    iterations: 0,
    peaks: reconstructPeaks<T>(internalPeaks, fittedValues, yScale),
  };
}
