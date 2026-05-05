import type { DataXY } from 'cheminfo-types';
import type { Shape1D } from 'ml-peak-shape-generator';
import { xMaxAbsoluteValue } from 'ml-spectra-processing';

import { getSumOfShapes } from './shapes/getSumOfShapes.ts';
import { getFixedParametersResult } from './util/getFixedParametersResult.ts';
import { getGlobalParameterVectors } from './util/getGlobalParameterVectors.ts';
import { getInternalPeaks } from './util/internalPeaks/getInternalPeaks.ts';
import { selectMethod } from './util/selectMethod.ts';
import type { InternalDirectOptimizationOptions } from './util/wrappers/directOptimization.js';

export interface InitialParameter {
  init?: OptimizationParameter;
  /** definition of the lower limit of the parameter,
   *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the min of the first peak and so on. */
  min?: OptimizationParameter;
  /** definition of the upper limit of the parameter,
   *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the max of the first peak and so on. */
  max?: OptimizationParameter;
  /** definition of  the step size to approximate the jacobian matrix of the parameter,
   *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the gradientDifference of the first peak and so on. */
  gradientDifference?: OptimizationParameter;
  /** whether this parameter should be optimized (true by default) */
  optimize?: OptimizeFlag;
}

export type OptimizeFlag = boolean | ((peak: Peak) => boolean);

export interface Peak {
  id?: string;
  x: number;
  y: number;
  shape?: Shape1D;
  parameters?: Record<
    string,
    {
      init?: number;
      min?: number;
      max?: number;
      gradientDifference?: number;
      optimize?: OptimizeFlag;
    }
  >;
}

export interface OptimizedPeak {
  x: number;
  y: number;
  shape: Shape1D;
}

export type OptimizedPeakIDOrNot<T extends Peak> = T extends { id: string }
  ? OptimizedPeak & { id: string }
  : OptimizedPeak;

type OptimizationParameter = number | ((peak: Peak) => number);

interface GeneralAlgorithmOptions {
  /** number of max iterations
   * @default 100
   */
  maxIterations?: number;
}
export interface LMOptimizationOptions extends GeneralAlgorithmOptions {
  /** maximum time running before break in seconds */
  timeout?: number;
  /** damping factor
   * @default 1.5
   */
  damping?: number;
  /** error tolerance
   * @default 1e-8
   */
  errorTolerance?: number;
}

export interface DirectOptimizationOptions
  extends GeneralAlgorithmOptions, InternalDirectOptimizationOptions {}

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: 'lm' | 'levenbergMarquardt' | 'direct';

  /** options for the specific kind of algorithm */
  options?: DirectOptimizationOptions | LMOptimizationOptions;
}

export interface OptimizeOptions {
  /**
   * Kind of shape used for fitting.
   **/
  shape?: Shape1D;
  /**
   *  options of each parameter to be optimized e.g. For a pseudovoigt shape
   *  it could have x, y, fwhm and mu properties, each of which could contain init, min, max and gradientDifference, those options will define the guess,
   *  the min and max value of the parameter (search space) and the step size to approximate the jacobian matrix respectively. Those options could be a number,
   *  array of numbers, callback, or array of callbacks. Each kind of shape has default parameters so it could be undefined
   */
  parameters?: Record<string, InitialParameter>;
  /**
   * The kind and options of the algorithm use to optimize parameters.
   */
  optimization?: OptimizationOptions;
}

/**
 * Fits a set of points to the sum of a set of bell functions.
 *
 * @param data - An object containing the x and y data to be fitted.
 * @param peaks - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param options - Options for optimize
 * @returns - An object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize<T extends Peak>(
  data: DataXY,
  peaks: T[],
  options: OptimizeOptions = {},
): {
  error: number;
  peaks: Array<OptimizedPeakIDOrNot<T>>;
  iterations: number;
} {
  // rescale data so the maximum Y value becomes 1
  const max = xMaxAbsoluteValue(data.y);
  const yScale = max === 0 ? 1 : max;

  const internalPeaks = getInternalPeaks(peaks, yScale, options);

  // need to rescale what is related to Y
  const normalizedY = new Float64Array(data.y.length);
  for (let i = 0; i < data.y.length; i++) {
    normalizedY[i] = data.y[i] / yScale;
  }

  const { freeIndices, globalMin, globalMax, globalInit, globalGrad } =
    getGlobalParameterVectors(internalPeaks, peaks, options);
  const nbParams = globalInit.length;

  const { algorithm, optimizationOptions } = selectMethod(options.optimization);

  const baseSumOfShapes = getSumOfShapes(internalPeaks);

  if (freeIndices.length === 0) {
    return getFixedParametersResult<T>(
      internalPeaks,
      normalizedY,
      data.x,
      globalInit,
      baseSumOfShapes,
      yScale,
    );
  }

  // wrapper that maps reduced (free) parameters into the full parameter vector
  const sumOfShapesForReduced = (reducedParameters: number[]) => {
    const full = new Float64Array(nbParams);
    full.set(globalInit);
    for (let k = 0; k < freeIndices.length; k++) {
      full[freeIndices[k]] = reducedParameters[k];
    }
    return baseSumOfShapes(Array.from(full));
  };

  // prepare arrays to pass to the algorithm (reduced if needed)
  let minValues: Float64Array;
  let maxValues: Float64Array;
  let initialValues: Float64Array;
  let gradientDifferences: Float64Array;
  let sumOfShapesToUse = baseSumOfShapes;

  if (freeIndices.length === nbParams) {
    // nothing to reduce
    minValues = globalMin;
    maxValues = globalMax;
    initialValues = globalInit;
    gradientDifferences = globalGrad;
  } else {
    minValues = new Float64Array(freeIndices.length);
    maxValues = new Float64Array(freeIndices.length);
    initialValues = new Float64Array(freeIndices.length);
    gradientDifferences = new Float64Array(freeIndices.length);
    for (let j = 0; j < freeIndices.length; j++) {
      const i = freeIndices[j];
      minValues[j] = globalMin[i];
      maxValues[j] = globalMax[i];
      initialValues[j] = globalInit[i];
      gradientDifferences[j] = globalGrad[i];
    }
    sumOfShapesToUse = sumOfShapesForReduced;
  }

  const fitted = algorithm({ x: data.x, y: normalizedY }, sumOfShapesToUse, {
    minValues,
    maxValues,
    initialValues,
    gradientDifference: gradientDifferences,
    ...optimizationOptions,
  });

  // reconstruct full parameter vector
  let fittedValues: number[];
  if (freeIndices.length === nbParams) {
    fittedValues = fitted.parameterValues;
  } else {
    const full = Array.from(globalInit);
    for (let k = 0; k < freeIndices.length; k++) {
      full[freeIndices[k]] = fitted.parameterValues[k];
    }
    fittedValues = full;
  }

  const newPeaks = [];
  for (const peak of internalPeaks) {
    const { id, shape, parameters, fromIndex } = peak;

    let newPeak = { x: 0, y: 0, shape } as OptimizedPeakIDOrNot<T>;

    if (id) {
      newPeak = { ...newPeak, id };
    }

    newPeak.x = fittedValues[fromIndex];
    newPeak.y = fittedValues[fromIndex + 1] * yScale;
    for (let i = 2; i < parameters.length; i++) {
      //@ts-expect-error should be fixed once
      newPeak.shape[parameters[i]] = fittedValues[fromIndex + i];
    }
    newPeaks.push(newPeak);
  }

  return {
    error: fitted.parameterError,
    iterations: fitted.iterations,
    peaks: newPeaks,
  };
}
