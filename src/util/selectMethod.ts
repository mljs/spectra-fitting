import { levenbergMarquardt } from 'ml-levenberg-marquardt';

import { OptimizationOptions } from '../index';

import { directOptimization } from './wrappers/directOptimization';

/** Algorithm to select the method.
 * @param optimizationOptions - Optimization options
 * @returns - The algorithm and optimization options
 */
export function selectMethod(optimizationOptions: OptimizationOptions = {}) {
  const { kind = 'lm', options } = optimizationOptions;

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
    case 'direct': {
      return {
        algorithm: directOptimization,
        optimizationOptions: {
          iterations: 20,
          epsilon: 1e-4,
          tolerance: 1e-16,
          tolerance2: 1e-12,
          initialState: {},
          ...options,
        },
      };
    }
    default:
      throw new Error(`Unknown fitting algorithm`);
  }
}
