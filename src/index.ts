import { DataXY, DoubleArray } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';
import { xMinMaxValues } from 'ml-spectra-processing';

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

export interface OptimizedPeak {
  x: number;
  y: number;
  shape: Shape1D;
}

type OptimizationParameter = number | ((peak: Peak) => number);

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: 'lm' | 'levenbergMarquardt';

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
   * baseline value to shift the intensity of data and peak
   */
  baseline?: number;
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
  peaks: OptimizedPeak[];
  iterations: number;
} {
  // rescale data
  let temp = xMinMaxValues(data.y);
  const minMaxY = { ...temp, range: temp.max - temp.min };

  console.log('peaks', JSON.parse(JSON.stringify(peaks)))
  const internalPeaks = getInternalPeaks(peaks, minMaxY, options);
  console.log(internalPeaks);
  console.log({ temp });
  
  // need to rescale what is related to Y
  const { baseline: shiftValue = minMaxY.min } = options;
  console.log({ shiftValue });
  let normalizedY = new Float64Array(data.y.length);
  for (let i = 0; i < data.y.length; i++) {
    normalizedY[i] = (data.y[i] - shiftValue) / minMaxY.range;
  }

  console.log(xMinMaxValues(normalizedY));
  const nbParams = internalPeaks[internalPeaks.length - 1].toIndex + 1;
  const minValues = new Float64Array(nbParams);
  const maxValues = new Float64Array(nbParams);
  const initialValues = new Float64Array(nbParams);
  const gradientDifferences = new Float64Array(nbParams);
  let index = 0;
  for (const peak of internalPeaks) {
    for (let i = 0; i < peak.parameters.length; i++) {
      minValues[index] = peak.propertiesValues.min[i];
      maxValues[index] = peak.propertiesValues.max[i];
      initialValues[index] = peak.propertiesValues.init[i];
      gradientDifferences[index] = peak.propertiesValues.gradientDifference[i];
      index++;
    }
  }
  let { algorithm, optimizationOptions } = selectMethod(options.optimization);

  let sumOfShapes = getSumOfShapes(internalPeaks);

  let fitted = algorithm({ x: data.x, y: normalizedY }, sumOfShapes, {
    minValues,
    maxValues,
    initialValues,
    gradientDifference: gradientDifferences,
    ...optimizationOptions,
  });
  const fittedValues = fitted.parameterValues;
  console.log({fittedValues});
  

  let newPeaks: OptimizedPeak[] = [];
  for (let peak of internalPeaks) {
    const newPeak = {
      x: 0,
      y: 0,
      shape: peak.shape,
    };
    newPeak.x = fittedValues[peak.fromIndex];
    newPeak.y = fittedValues[peak.fromIndex + 1] * minMaxY.range// + shiftValue;
    for (let i = 2; i < peak.parameters.length; i++) {
      //@ts-expect-error should be fixed once
      newPeak.shape[peak.parameters[i]] = fittedValues[peak.fromIndex + i];
    }

    newPeaks.push(newPeak);
  }

  return {
    error: fitted.parameterError,
    iterations: fitted.iterations,
    peaks: newPeaks,
  };
}
