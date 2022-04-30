import { levenbergMarquardt } from 'ml-levenberg-marquardt';

import { OptimizationOptions } from '../index';

/** Algorithm to select the method.
 * @param optimizationOptions - Optimization options
 * @returns - The algorithm and optimization options
 */
export function selectMethod(optimizationOptions: OptimizationOptions = {}) {
  let { kind = 'lm', options } = optimizationOptions;

  switch (kind) {
    case 'lm':
    case 'levenbergMarquardt':
      return {
        algorithm: levenbergMarquardt,
        optimizationOptions: {
          damping: 1.5,
          maxIterations: 100,
          errorTolerance: 1e-8,
          ...options,
        },
      };
    default:
      throw new Error(`Unknown fitting algorithm`);
  }
}
