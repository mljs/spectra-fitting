import { DataXY, DoubleArray } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';

import { getSumOfShapes } from './shapes/getSumOfShapes';
import { getInternalPeaks } from './util/internalPeaks/getInternalPeaks';
import { selectMethod } from './util/selectMethod';

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
}

export interface Peak {
  x: number;
  y: number;
  shape?: Shape1D;
  parameters?: Record<
    string,
    { init?: number; min?: number; max?: number; gradientDifference?: number }
  >;
}

type OptimizationParameter = number | ((peak: Peak) => number);

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: string;

  /** options for the specific kind of algorithm */
  options?: {
    /** maximum time running before break in seconds */
    timeout?: number;
    /** damping factor
     * @default 1.5
     */
    damping?: number;
    /** number of max iterations
     * @default 100
     */
    maxIterations?: number;
    /** error tolerance
     * @default 1e-8
     */
    errorTolerance?: number;
  };
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
export function optimize(
  data: DataXY<DoubleArray>,
  peaks: Peak[],
  options: OptimizeOptions = {},
): {
  error: number;
  peaks: Peak[];
  iterations: number;
} {
  const internalPeaks = getInternalPeaks(peaks, options);

  const nbParams = internalPeaks[internalPeaks.length - 1].toIndex + 1;
  const minValues = new Float64Array(nbParams);
  const maxValues = new Float64Array(nbParams);
  const initValues = new Float64Array(nbParams);
  const gradientDifferences = new Float64Array(nbParams);
  let index = 0;
  for (const peak of internalPeaks) {
    for (let i = 0; i < peak.parameters.length; i++) {
      minValues[index] = peak.propertiesValues.min[i];
      maxValues[index] = peak.propertiesValues.max[i];
      initValues[index] = peak.propertiesValues.init[i];
      gradientDifferences[index] = peak.propertiesValues.gradientDifference[i];
      index++;
    }
  }

  let { algorithm, optimizationOptions } = selectMethod(options.optimization);

  optimizationOptions.minValues = minValues;
  optimizationOptions.maxValues = maxValues;
  optimizationOptions.initialValues = initValues;
  optimizationOptions.gradientDifference = gradientDifferences;
  optimizationOptions = { ...optimizationOptions };

  let sumOfShapes = getSumOfShapes(internalPeaks);

  let fitted = algorithm(data, sumOfShapes, optimizationOptions);
  const fittedValues = fitted.parameterValues;
  let newPeaks: Peak[] = [];
  for (let peak of internalPeaks) {
    const newPeak = {
      x: 0,
      y: 0,
      shape: peak.shape,
    };
    for (let i = 0; i < peak.parameters.length; i++) {
      if (i < 2) {
        newPeak[peak.parameters[i]] = fittedValues[peak.fromIndex + i];
      } else {
        newPeak.shape[peak.parameters[i]] = fittedValues[peak.fromIndex + i];
      }
    }

    newPeaks.push(newPeak);
  }

  return {
    error: fitted.parameterError,
    iterations: fitted.iterations,
    peaks: newPeaks,
  };
}
