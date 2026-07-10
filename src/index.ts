import type { DataXY, DoubleArray } from 'cheminfo-types';
import type { Shape1D } from 'ml-peak-shape-generator';
import { xMaxAbsoluteValue } from 'ml-spectra-processing';

import { getSumOfShapes } from './shapes/getSumOfShapes.ts';
import { buildOptimizationLayout } from './util/buildOptimizationLayout.ts';
import { getFixedParametersResult } from './util/getFixedParametersResult.ts';
import { getInternalPeaks } from './util/internalPeaks/getInternalPeaks.ts';
import { reconstructPeaks } from './util/reconstructPeaks.ts';
import { selectMethod } from './util/selectMethod.ts';
import type { InternalDirectOptimizationOptions } from './util/wrappers/directOptimization.js';

type PublicDirectOptimizationOptions = Omit<
  InternalDirectOptimizationOptions,
  'minValues' | 'maxValues'
>;

export interface InitialParameter {
  init?: OptimizationParameter;
  /**
   * definition of the lower limit of the parameter.
   * If it is a callback, it receives the original peak provided by the user.
   */
  min?: OptimizationParameter;
  /**
   * definition of the upper limit of the parameter.
   * If it is a callback, it receives the original peak provided by the user.
   */
  max?: OptimizationParameter;
  /**
   * definition of the step size to approximate the jacobian matrix of the parameter.
   * If it is a callback, it receives the original peak provided by the user.
   */
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
  /**
   * number of max iterations
   * @default 100
   */
  maxIterations?: number;
}
export interface LMOptimizationOptions extends GeneralAlgorithmOptions {
  /** maximum time running before break in seconds */
  timeout?: number;
  /**
   * damping factor
   * @default 1.5
   */
  damping?: number;
  /**
   * error tolerance
   * @default 1e-8
   */
  errorTolerance?: number;
}

export interface DirectOptimizationOptions
  extends GeneralAlgorithmOptions, PublicDirectOptimizationOptions {}

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: 'lm' | 'levenbergMarquardt' | 'direct';

  /** options for the specific kind of algorithm */
  options?: DirectOptimizationOptions | LMOptimizationOptions;
}

export interface LinkedParameterPeak {
  id: number | string;
  factor?: number;
  offset?: number;
}

export interface LinkedParameter {
  parameter: string;
  peaks: LinkedParameterPeak[];
}

export interface OptimizeOptions {
  /**
   * Kind of shape used for fitting.
   */
  shape?: Shape1D;
  /**
   * Options of each parameter to be optimized. For example, for a pseudoVoigt
   * shape this can include x, y, fwhm and mu values.
   *
   * Each parameter can define init, min, max and gradientDifference to set the
   * initial guess, bounds and finite-difference step. These options can be
   * numbers or callbacks. Callback options receive the original peak values
   * provided by the user. Each shape has defaults, so this can be undefined.
   */
  parameters?: Record<string, InitialParameter>;
  /**
   * Links parameters from multiple peaks into a shared optimization variable.
   * The actual peak value is reconstructed as sharedVariable * factor + offset.
   */
  linkedParameters?: LinkedParameter[];
  /**
   * The kind and options of the algorithm use to optimize parameters.
   */
  optimization?: OptimizationOptions;
}

/**
 * Fits a set of points to the sum of a set of bell functions.
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

  const optimizationLayout = buildOptimizationLayout(
    internalPeaks,
    peaks,
    options,
    yScale,
    options.optimization?.kind !== 'direct',
  );

  const {
    freeIndices,
    variableMin,
    variableMax,
    variableInit,
    variableGrad,
    variables,
  } = optimizationLayout;

  const { algorithm, optimizationOptions } = selectMethod(options.optimization);

  const baseSumOfShapes = getSumOfShapes(internalPeaks);
  const sumOfShapesForVariables = (variableValues: DoubleArray) => {
    return baseSumOfShapes(
      optimizationLayout.variableToPeakValues(variableValues),
    );
  };

  if (freeIndices.length === 0) {
    return getFixedParametersResult<T>(
      internalPeaks,
      normalizedY,
      data.x,
      optimizationLayout.variableToPeakValues(variableInit),
      baseSumOfShapes,
      yScale,
    );
  }

  // prepare arrays to pass to the algorithm (reduced if needed)
  let minValues: DoubleArray;
  let maxValues: DoubleArray;
  let initialValues: DoubleArray;
  let gradientDifferences: DoubleArray;
  let sumOfShapesToUse = sumOfShapesForVariables;

  if (freeIndices.length === variables.length) {
    // nothing to reduce
    minValues = variableMin;
    maxValues = variableMax;
    initialValues = variableInit;
    gradientDifferences = variableGrad;
  } else {
    // wrapper that maps reduced (free) parameters into the full parameter vector
    const sumOfShapesForReduced = (reducedParameters: DoubleArray) => {
      const full = new Float64Array(variables.length);
      full.set(variableInit);
      for (let k = 0; k < freeIndices.length; k++) {
        full[freeIndices[k]] = reducedParameters[k];
      }
      return sumOfShapesForVariables(full);
    };

    minValues = new Float64Array(freeIndices.length);
    maxValues = new Float64Array(freeIndices.length);
    initialValues = new Float64Array(freeIndices.length);
    gradientDifferences = new Float64Array(freeIndices.length);
    for (let j = 0; j < freeIndices.length; j++) {
      const i = freeIndices[j];
      minValues[j] = variableMin[i];
      maxValues[j] = variableMax[i];
      initialValues[j] = variableInit[i];
      gradientDifferences[j] = variableGrad[i];
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

  let fittedVariableValues: DoubleArray;
  if (freeIndices.length === variables.length) {
    fittedVariableValues = fitted.parameterValues;
  } else {
    const full = variableInit.slice();
    for (let k = 0; k < freeIndices.length; k++) {
      full[freeIndices[k]] = fitted.parameterValues[k];
    }
    fittedVariableValues = full;
  }

  const fittedValues =
    optimizationLayout.variableToPeakValues(fittedVariableValues);

  return {
    error: fitted.parameterError,
    iterations: fitted.iterations,
    peaks: reconstructPeaks<T>(internalPeaks, fittedValues, yScale),
  };
}
