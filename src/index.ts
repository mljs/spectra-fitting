import { DataXY, DoubleArray } from 'cheminfo-types';
import { getShape1D, Shape1D } from 'ml-peak-shape-generator';

import { Peak1D } from './spectra-fitting';
import { checkInput } from './util/checkInput';
import { selectMethod } from './util/selectMethod';

type OptimizationParameter =
  | number
  | ArrayLike<number>
  | ((peak: Peak1D) => number);

export interface OptimizationOptions {
  /**
   * kind of algorithm. By default it's levenberg-marquardt
   */
  kind?: string;
  /**
   *  options of each parameter to be optimized e.g. For a gaussian shape
   *  it could have x, y and width properties, each of which could contain init, min, max and gradientDifference, those options will define the guess,
   *  the min and max value of the parameter (search space) and the step size to approximate the jacobian matrix respectively. Those options could be a number,
   *  array of numbers, callback, or array of callbacks. Each kind of shape has default parameters so it could be undefined
   */
  // not sure if parameters should be an array or one set of parameters only?
  parameters?:
    | {
        /** name of the parameter for which we define the followig parameters */
        name?: string;
        /** definition of the starting point of the parameter (the guess),
         *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the guess of the first peak and so on. */
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
        // TODO: clarify types of parameters
      }
    | any;
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
   * kind of shape used for fitting
   **/
  shape?: Shape1D;
  /**
   * the kind and options of the algorithm use to optimize parameters
   */
  optimization?: OptimizationOptions;
}

/**
 * Fits a set of points to the sum of a set of bell functions.
 *
 * @param data - An object containing the x and y data to be fitted.
 * @param peakList - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param options - Options.
 * @returns - An object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(
  data: DataXY<DoubleArray>,
  peakListInitial: Peak1D[],
  options: OptimizeOptions = {},
): {
  error: number;
  // not using Peak1D directly because it has additional parameters that we do not need
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

  // initial beginning index is set to zero
  let index = 0;
  for (const peak of peakList) {
    if (!peak.shape) {
      if (options.shape) {
        peak.shape = {};
        peak.shape.kind = options.shape.kind;
      } else {
        peak.shape = {};
        peak.shape.kind = 'gaussian';
      }
    }
    let kind = peak.shape.kind;
    peak.shape = getShape1D({ kind: peak.shape.kind });
    peak.shape.kind = kind;
    peak.parameters = ['height', 'x', ...peak.shape.getParameters()];

    peak.fromIndex = index;
    peak.toIndex = peak.fromIndex + peak.parameters.length - 1;
    index += peak.toIndex - peak.fromIndex + 1;
  }

  const { y, x, maxY, minY, peaks, sumOfShapes, optimization } = checkInput(
    data,
    peakList,
    options,
  );

  let parameters = optimization.parameters;

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

  let { algorithm, optimizationOptions } = selectMethod(optimization);

  optimizationOptions.minValues = pMin;
  optimizationOptions.maxValues = pMax;
  optimizationOptions.initialValues = pInit;
  optimizationOptions.gradientDifference = gradientDifference;
  optimizationOptions = { ...optimizationOptions };

  let pFit = algorithm({ x, y }, sumOfShapes, optimizationOptions);
  let { parameterError: error, iterations } = pFit;
  let result: any = { error, iterations };

  const newPeaks = JSON.parse(JSON.stringify(peaks));
  delete newPeaks.fromIndex;
  delete newPeaks.toIndex;
  for (let i = 0; i < nbShapes; i++) {
    for (let k = 0; k < keysOfParameters.length; k++) {
      const key = keysOfParameters[k];
      const value = pFit.parameterValues[i * keysOfParameters.length + k];
      if (key === 'x' || key === 'fwhm') {
        newPeaks[i][key] = value;
      } else if (key === 'y') {
        newPeaks[i][key] = value * maxY + minY;
      } else {
        newPeaks[i].shape[key] = value;
      }
    }
  }

  result.peaks = newPeaks;
  return result;
}
