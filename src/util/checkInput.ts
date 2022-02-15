import { DataXY, DoubleArray } from 'cheminfo-types';
import getMaxValue from 'ml-array-max';

import { sumOfGaussians } from '../shapes/sumOfGaussians';
import { sumOfLorentzians } from '../shapes/sumOfLorentzians';
import { sumOfPseudoVoigts } from '../shapes/sumOfPseudoVoigts';
import { OptimizeOptions, Peak1D } from '../spectra-fitting';

import { assignDeep } from './assignDeep';

/** Algorithm to check the input
 * @param data - Data to check
 * @param peakList - List of peaks
 * @param options - Options for optimization
 */
export function checkInput(
  data: DataXY<DoubleArray>,
  peakList: Peak1D[],
  options: OptimizeOptions,
) {
  let {
    shape = { kind: 'gaussian' },
    optimization = {
      kind: 'lm',
    },
  } = options;

  let peaks: Peak1D[] = JSON.parse(JSON.stringify(peakList));

  if (typeof shape.kind !== 'string') {
    throw new Error('kind should be a string');
  }

  // removing the letters by nothing
  let kind = shape.kind.toLowerCase().replace(/[^a-z]/g, '');

  let paramsFunc;
  let defaultParameters;
  switch (kind) {
    case 'gaussian':
      paramsFunc = sumOfGaussians;
      /*
      export interface Peak1D {
        x: number;
        y: number;
        width?: number;
        fwhm: number;
        shape?: Shape1D | { kind: string };
      }
      */
      defaultParameters = {
        x: {
          init: (peak: Peak1D) => peak.x,
          max: (peak: Peak1D) => peak.x + peak.fwhm * 2,
          min: (peak: Peak1D) => peak.x - peak.fwhm * 2,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
        y: {
          init: (peak: Peak1D) => peak.y,
          max: () => 1.5,
          min: () => 0,
          gradientDifference: () => 1e-3,
        },
        fwhm: {
          init: (peak: Peak1D) => peak.fwhm,
          max: (peak: Peak1D) => peak.fwhm * 4,
          min: (peak: Peak1D) => peak.fwhm * 0.25,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
      };
      break;
    case 'lorentzian':
      paramsFunc = sumOfLorentzians;
      defaultParameters = {
        x: {
          init: (peak: Peak1D) => peak.x,
          max: (peak: Peak1D) => peak.x + peak.fwhm * 2,
          min: (peak: Peak1D) => peak.x - peak.fwhm * 2,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
        y: {
          init: (peak: Peak1D) => peak.y,
          max: () => 1.5,
          min: () => 0,
          gradientDifference: () => 1e-3,
        },
        fwhm: {
          init: (peak: Peak1D) => peak.fwhm,
          max: (peak: Peak1D) => peak.fwhm * 4,
          min: (peak: Peak1D) => peak.fwhm * 0.25,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
      };
      break;
    case 'pseudovoigt':
      paramsFunc = sumOfPseudoVoigts;
      defaultParameters = {
        x: {
          init: (peak: Peak1D) => peak.x,
          max: (peak: Peak1D) => peak.x + peak.fwhm * 2,
          min: (peak: Peak1D) => peak.x - peak.fwhm * 2,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
        y: {
          init: (peak: Peak1D) => peak.y,
          max: () => 1.5,
          min: () => 0,
          gradientDifference: () => 1e-3,
        },
        fwhm: {
          init: (peak: Peak1D) => peak.fwhm,
          max: (peak: Peak1D) => peak.fwhm * 4,
          min: (peak: Peak1D) => peak.fwhm * 0.25,
          gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
        },
        mu: {
          // when peak.shape.mu exists
          init: (peak: Peak1D) =>
            peak.shape && (peak.shape as { mu: number }).mu !== undefined
              ? (peak.shape as { mu: number }).mu
              : 0.5,
          min: () => 0,
          max: () => 1,
          gradientDifference: () => 0.01,
        },
      };
      break;
    default:
      throw new Error('kind of shape is not supported');
  }

  // x coordinates for data
  let x = data.x;
  // maximum of y values
  let maxY = getMaxValue(data.y);
  let y = new Array<number>(x.length);
  // where we normalize the y from 0 to 1
  for (let i = 0; i < x.length; i++) {
    y[i] = data.y[i] / maxY;
  }

  // peaks is Peak1D[]
  peaks.forEach((peak) => {
    // normalizing by the maximum in data.y
    peak.y /= maxY;
    peak.shape = {
      // parameter of function
      kind: shape.kind,
      ...peak.shape,
    };
  });

  // defaultParameters depending on shape.kind
  // adding to the default parameters the parameters of the optimization option
  let parameters = assignDeep({}, defaultParameters, optimization.parameters);

  for (let key in parameters) {
    // for defaultParameters par is a function
    for (let par in parameters[key]) {
      // if element is not an array
      if (!Array.isArray(parameters[key][par])) {
        parameters[key][par] = [parameters[key][par]];
      }
      // suppose the array does not include the length of the corresponding element in parameters
      if (![peaks.length, 1].includes(parameters[key][par].length)) {
        throw new Error(`The length of ${key}-${par} is not correct`);
      }
      // iterating over the array at key-par
      for (let index = 0; index < parameters[key][par].length; index++) {
        if (typeof parameters[key][par][index] === 'number') {
          let value = parameters[key][par][index];
          // function always returns the value
          parameters[key][par][index] = () => value;
        }
      }
    }
  }
  // parameters to which we added the the default parameters
  optimization.parameters = parameters;

  return {
    // data.y divided by maxY
    y,
    // data.x
    x,
    maxY,
    // peaks
    peaks,
    // summing function for distribution
    paramsFunc,
    // optimization options
    optimization,
  };
}
