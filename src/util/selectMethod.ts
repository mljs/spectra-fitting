import { levenbergMarquardt } from 'ml-levenberg-marquardt';

import { OptimizationOptions } from '..';

const LEVENBERG_MARQUARDT = 'LEVENBERG_MARQUARDT';

/** Algorithm to select the method.
 * @param optimizationOptions - Optimization options
 * @returns - The algorithm and optimization options
 */
export function selectMethod(optimizationOptions: OptimizationOptions = {}) {
  let { kind, options } = optimizationOptions;
  kind = getKind(kind);
  switch (kind) {
    case LEVENBERG_MARQUARDT:
      return {
        algorithm: levenbergMarquardt,
        optimizationOptions: checkOptions(kind, options),
      };
    default:
      throw new Error(`Unknown kind algorithm`);
  }
}

function checkOptions(
  kind: string | number,
  options: {
    timeout?: number;
    damping?: number;
    maxIterations?: number;
    errorTolerance?: number;
  } = {},
): any {
  switch (kind) {
    case LEVENBERG_MARQUARDT:
      return Object.assign({}, lmOptions, options);
    default:
      throw new Error(`unknown kind: ${kind}`);
  }
}

function getKind(kind = '') {
  switch (kind.toLowerCase().replace(/[^a-z]/g, '')) {
    case 'lm':
    case 'levenbergmarquardt':
      return LEVENBERG_MARQUARDT;
    default:
      throw new Error(`Unknown kind algorithm`);
  }
}

const lmOptions = {
  damping: 1.5,
  maxIterations: 100,
  errorTolerance: 1e-8,
};
