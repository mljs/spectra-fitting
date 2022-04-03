import { DataXY, DoubleArray } from 'cheminfo-types';
import { getShape1D, Shape1D } from 'ml-peak-shape-generator';

import { checkInput } from './util/checkInput';
import { selectMethod } from './util/selectMethod';

export interface Peak1D {
  x: number;
  y: number;
  width?: number;
  fwhm?: number;
  shape?: Shape1D;
}

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: string;
  /**
   *  options of each parameter to be optimized e.g. For a gaussian shape
   *  it could have x, y, fwhm and mu properties, each of which could contain init, min, max and gradientDifference, those options will define the guess,
   *  the min and max value of the parameter (search space) and the step size to approximate the jacobian matrix respectively. Those options could be a number,
   *  array of numbers, callback, or array of callbacks. Each kind of shape has default parameters so it could be undefined
   */
  parameters?: {
    /** name of the parameter for which we define the followig parameters */
    name: string;
    /** definition of the starting point of the parameter (the guess),
     *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the guess of the first peak and so on. */
    init: number | ((peak: Peak1D) => number) | (() => number);
    /** definition of the lower limit of the parameter,
     *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the min of the first peak and so on. */
    min: number | ((peak: Peak1D) => number) | (() => number);
    /** definition of the upper limit of the parameter,
     *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the max of the first peak and so on. */
    max: number | ((peak: Peak1D) => number) | (() => number);
    /** definition of  the step size to approximate the jacobian matrix of the parameter,
     *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the gradientDifference of the first peak and so on. */
    gradientDifference: number | ((peak: Peak1D) => number) | (() => number);
  }[];
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
  shape?: Shape1D;
  optimization?: OptimizationOptions;
}

/**
 * Fits a set of points to the sum of a set of bell functions.
 *
 * @param data - An object containing the x and y data to be fitted.
 * @param peakList - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param options - Options for optimize
 * @returns - An object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(
  data: DataXY<DoubleArray>,
  peakListInitial: Peak1D[],
  options: OptimizeOptions = {},
): {
  error: number;
  peaks: {
    x: number;
    y: number;
    width?: number;
    fwhm: number;
    shape: Shape1D;
    parameters: string[];
    fromIndex: number;
    toIndex: number;
  }[];
  iterations: number;
} {
  let peakList = JSON.parse(JSON.stringify(peakListInitial));
  let index = 0;
  for (const peak of peakList) {
    if (!peak.shape) {
      if (options.shape) {
        peak.shape = {};
        peak.shape.kind = options.shape.kind;
        peak.shape.fwhm = options.shape.fwhm;
      } else {
        peak.shape = {};
        peak.shape.kind = 'gaussian';
        peak.shape.fwhm = 0.5;
      }
    }
    let kind = peak.shape.kind;
    peak.fwhm = peak.shape.fwhm;
    peak.shape = getShape1D({ kind: peak.shape.kind });
    peak.shape.kind = kind;
    peak.parameters = ['x', 'y', ...peak.shape.getParameters()];

    peak.fromIndex = index;
    peak.toIndex = peak.fromIndex + peak.parameters.length - 1;
    index += peak.toIndex - peak.fromIndex + 1;
  }

  const { y, x, max, min, peaks, sumOfShapes, newOptimization } = checkInput(
    data,
    peakList,
    options,
  );

  let parameters = newOptimization.parameters;
  let nbShapes = peaks.length;
  let keysOfParameters = Object.keys(parameters);
  let nbParams = nbShapes * keysOfParameters.length;
  let pMin = new Float64Array(nbParams);
  let pMax = new Float64Array(nbParams);
  let pInit = new Float64Array(nbParams);
  let gradientDifference = new Float64Array(nbParams);

  for (let i = 0; i < nbShapes; i++) {
    let peak = peaks[i];
    for (let k = 0; k < keysOfParameters.length; k++) {
      let key = keysOfParameters[k];
      let init = parameters[key].init;
      let min = parameters[key].min;
      let max = parameters[key].max;
      let gradientDifferenceValue = parameters[key].gradientDifference;
      pInit[i * keysOfParameters.length + k] = init[i % init.length](peak);
      pMin[i * keysOfParameters.length + k] = min[i % min.length](peak);
      pMax[i * keysOfParameters.length + k] = max[i % max.length](peak);
      gradientDifference[i * keysOfParameters.length + k] =
        gradientDifferenceValue[i % gradientDifferenceValue.length](peak);
    }
  }

  let { algorithm, optimizationOptions } = selectMethod(newOptimization);

  optimizationOptions.minValues = pMin;
  optimizationOptions.maxValues = pMax;
  optimizationOptions.initialValues = pInit;
  optimizationOptions.gradientDifference = gradientDifference;
  optimizationOptions = { ...optimizationOptions };

  let pFit = algorithm({ x, y }, sumOfShapes, optimizationOptions);

  let { parameterError: error, iterations } = pFit;
  let result: any = { error, iterations };

  const newPeaks = JSON.parse(JSON.stringify(peaks));
  for (let i = 0; i < nbShapes; i++) {
    delete newPeaks[i].fromIndex;
    delete newPeaks[i].toIndex;
    delete newPeaks[i].fwhm;
    delete newPeaks[i].parameters;
    let parametersOfPeak = keysOfParameters.filter((x) =>
      peaks[i].parameters.includes(x),
    );
    for (let k = 0; k < parametersOfPeak.length; k++) {
      const key = parametersOfPeak[k];
      const value = pFit.parameterValues[i * keysOfParameters.length + k];
      if (key === 'x') {
        newPeaks[i][key] = value;
      } else if (key === 'y') {
        newPeaks[i][key] = value * (max - min) + min;
      } else {
        newPeaks[i].shape[key] = value;
      }
    }
  }

  result.peaks = newPeaks;
  return result;
}
