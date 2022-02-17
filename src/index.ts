import { DataXY, DoubleArray } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';

import { Peak1D } from './spectra-fitting';
import { checkInput } from './util/checkInput';
import { selectMethod } from './util/selectMethod';

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
  peakList: Peak1D[],
  options: {
    /**
     * kind of shape used for fitting
     **/
    shape?: Shape1D;
    /**
     * the kind and options of the algorithm use to optimize parameters
     */
    optimization?: {
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
      parameters?: {
        /** options for x parameter */
        x?: {
          /** definition of the starting point of the parameter (the guess),
           *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the guess of the first peak and so on. */
          init?: number;
          /** definition of the lower limit of the parameter,
           *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the min of the first peak and so on. */
          min?: number;
          /** definition of the upper limit of the parameter,
           *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the max of the first peak and so on. */
          max?: number;
          /** definition of  the step size to approximate the jacobian matrix of the parameter,
           *  if it is a callback the method pass the peak as the unique input, if it is an array the first element define the gradientDifference of the first peak and so on. */
          gradientDifference?: number;
        };
      };
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
    };
  } = {},
): {
  error: number;
  peaks: Peak1D[];
  iterations: number;
} {
  if (!options.shape) {
    options = { ...options, ...{ shape: { kind: 'gaussian' } } };
  }
  const { y, x, maxY, minY, peaks, paramsFunc, optimization } = checkInput(
    data,
    peakList,
    options,
  );

  let parameters = optimization.parameters;

  let nbShapes = peaks.length;
  let parameterKey = Object.keys(parameters);
  let nbParams = nbShapes * parameterKey.length;
  let pMin = new Float64Array(nbParams);
  let pMax = new Float64Array(nbParams);
  let pInit = new Float64Array(nbParams);
  let gradientDifference = new Float64Array(nbParams);

  for (let i = 0; i < nbShapes; i++) {
    let peak = peaks[i];
    for (let k = 0; k < parameterKey.length; k++) {
      let key = parameterKey[k];
      let init = parameters[key].init;
      let min = parameters[key].min;
      let max = parameters[key].max;
      let gradientDifferenceValue = parameters[key].gradientDifference;
      pInit[i + k * nbShapes] = init[i % init.length](peak);
      pMin[i + k * nbShapes] = min[i % min.length](peak);
      pMax[i + k * nbShapes] = max[i % max.length](peak);
      gradientDifference[i + k * nbShapes] =
        gradientDifferenceValue[i % gradientDifferenceValue.length](peak);
    }
  }

  let { algorithm, optimizationOptions } = selectMethod(optimization);

  optimizationOptions.minValues = pMin;
  optimizationOptions.maxValues = pMax;
  optimizationOptions.initialValues = pInit;
  optimizationOptions.gradientDifference = gradientDifference;

  let pFit = algorithm({ x, y }, paramsFunc, optimizationOptions);

  let { parameterError: error, iterations } = pFit;
  let result = { error, iterations, peaks };
  for (let i = 0; i < nbShapes; i++) {
    for (let k = 0; k < parameterKey.length; k++) {
      const key = parameterKey[k];
      const value = pFit.parameterValues[i + k * nbShapes];
      if (key === 'x' || key === 'fwhm') {
        peaks[i][key] = value;
      } else if (key === 'y') {
        peaks[i][key] = value * maxY + minY;
      } else {
        (peaks[i].shape as any)[key] = value;
      }
    }
  }

  return result;
}
