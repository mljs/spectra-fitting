/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import LM, {
  Data,
  FittedFunction,
  Options,
  Result,
} from 'ml-levenberg-marquardt';

import { OptimizationOptions } from '../spectra-fitting';

const LEVENBERG_MARQUARDT = 1;

export function selectMethod(optimizationOptions: OptimizationOptions = {}): {
  algorithm: (
    d: Data,
    fn: FittedFunction,
    o?: Partial<Options> | undefined,
  ) => Result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optimizationOptions: any;
} {
  let { kind, options } = optimizationOptions;
  kind = getKind(kind);
  switch (kind) {
    case LEVENBERG_MARQUARDT:
      return {
        algorithm: LM,
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
) {
  // eslint-disable-next-line default-case
  switch (kind) {
    case LEVENBERG_MARQUARDT:
      return Object.assign({}, lmOptions, options);
  }
}

function getKind(kind?: string | number) {
  if (typeof kind !== 'string') return kind;
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
