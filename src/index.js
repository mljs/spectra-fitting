import getMaxValue from 'ml-array-max';

import { selectMethod } from './selectMethod';
import { sumOfGaussianLorentzians } from './shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from './shapes/sumOfGaussians';
import { sumOfLorentzians } from './shapes/sumOfLorentzians';

const STATE_INIT = 0;
const STATE_MIN = 1;
const STATE_MAX = 2;
const STATE_GRADIENT_DIFFERENCE = 3;

const X = 0;
const Y = 1;
const WIDTH = 2;
const MU = 3;

const keys = ['x', 'y', 'width', 'mu'];
/**
 * Fits a set of points to the sum of a set of bell functions.
 * @param {object} data - An object containing the x and y data to be fitted.
 * @param {array} peaks - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param {object} [options = {}]
 * @param {object} [options.shape={}] - it's specify the kind of shape used to fitting.
 * @param {string} [options.shape.kind = 'gaussian'] - kind of shape; lorentzian, gaussian and pseudovoigt are supported.
 * @param {object} [options.optimization = {}] - it's specify the kind and options of the algorithm use to optimize parameters.
 * @param {object} [options.optimization.kind = 'lm'] - kind of algorithm. By default it's levenberg-marquardt.
 * @param {object} [options.optimization.options = {}] - options for the specific kind of algorithm.
 * @param {number} [options.optimization.options.timeout] - maximum time running before break in seconds.
 * @param {number} [options.optimization.options.damping=1.5]
 * @param {number} [options.optimization.options.maxIterations=100]
 * @param {number} [options.optimization.options.errorTolerance=1e-8]
 * @returns {object} - A object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(data, peaks, options = {}) {
  let {
    minFactorWidth = 0.25,
    maxFactorWidth = 4,
    minFactorX = 2,
    maxFactorX = 2,
    minFactorY = 0,
    maxFactorY = 1.5,
    minMuValue = 0,
    maxMuValue = 1,
    xGradientDifference,
    yGradientDifference,
    widthGradientDifference,
    muGradientDifference = 0.01,
    shape = { kind: 'gaussian' },
    optimization = {
      kind: 'lm',
    },
  } = options;

  peaks = JSON.parse(JSON.stringify(peaks));

  if (typeof shape.kind !== 'string') {
    throw new Error('kind should be a string');
  }

  let kind = shape.kind.toLowerCase().replace(/[^a-z]/g, '');

  let x = data.x;
  let maxY = getMaxValue(data.y);
  let y = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    y[i] = data.y[i] / maxY;
  }

  let nbParams;
  let paramsFunc;
  switch (kind) {
    case 'gaussian':
      nbParams = 3;
      paramsFunc = sumOfGaussians;
      break;
    case 'lorentzian':
      nbParams = 3;
      paramsFunc = sumOfLorentzians;
      break;
    case 'pseudovoigt':
      nbParams = 4;
      paramsFunc = sumOfGaussianLorentzians;
      break;
    default:
      throw new Error('kind of shape is not supported');
  }

  const getValueOptions = {
    maxY,
    minFactorX,
    maxFactorX,
    minFactorY,
    maxFactorY,
    minMuValue,
    maxMuValue,
    minFactorWidth,
    maxFactorWidth,
    xGradientDifference,
    yGradientDifference,
    widthGradientDifference,
    muGradientDifference,
  };

  let nbShapes = peaks.length;
  let pMin = new Float64Array(nbShapes * nbParams);
  let pMax = new Float64Array(nbShapes * nbParams);
  let pInit = new Float64Array(nbShapes * nbParams);
  let gradientDifference = new Float64Array(nbShapes * nbParams);
  for (let i = 0; i < nbShapes; i++) {
    let peak = peaks[i];
    for (let s = 0; s < nbParams; s++) {
      pInit[i + s * nbShapes] = getValue(s, peak, STATE_INIT, getValueOptions);
      pMin[i + s * nbShapes] = getValue(s, peak, STATE_MIN, getValueOptions);
      pMax[i + s * nbShapes] = getValue(s, peak, STATE_MAX, getValueOptions);
      gradientDifference[i + s * nbShapes] = getValue(
        s,
        peak,
        STATE_GRADIENT_DIFFERENCE,
        getValueOptions,
      );
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
  for (let i = 0; i < peaks.length; i++) {
    pFit.parameterValues[i + peaks.length] *= maxY;
    for (let s = 0; s < nbParams; s++) {
      // we modify the optimized parameters
      peaks[i][keys[s]] = pFit.parameterValues[i + s * peaks.length];
    }
  }
  return result;
}

function getValue(parameterIndex, peak, state, options) {
  let maxY = options.maxY;
  switch (state) {
    case STATE_INIT:
      switch (parameterIndex) {
        case X:
          return peak.x;
        case Y:
          return peak.y / maxY;
        case WIDTH:
          return peak.width;
        case MU:
          return peak.mu || 0.5;
        default:
          throw new Error('The parameter is not supported');
      }
    case STATE_GRADIENT_DIFFERENCE:
      switch (parameterIndex) {
        case X:
          return options.xGradientDifference || peak.width / 2000;
        case Y:
          return options.yGradientDifference || 1e-3;
        case WIDTH:
          return options.widthGradientDifference || peak.width / 2000;
        case MU:
          return options.muGradientDifference;
        default:
          throw new Error('The parameter is not supported');
      }
    case STATE_MIN:
      switch (parameterIndex) {
        case X:
          return peak.x - peak.width * options.minFactorX;
        case Y:
          return (peak.y / maxY) * options.minFactorY;
        case WIDTH:
          return peak.width * options.minFactorWidth;
        case MU:
          return options.minMuValue;
        default:
          throw new Error('The parameter is not supported');
      }
    case STATE_MAX:
      switch (parameterIndex) {
        case X:
          return peak.x + peak.width * options.maxFactorX;
        case Y:
          return (peak.y / maxY) * options.maxFactorY;
        case WIDTH:
          return peak.width * options.maxFactorWidth;
        case MU:
          return options.maxMuValue;
        default:
          throw new Error('The parameter is not supported');
      }
    default:
      throw Error('the state is not supported');
  }
}
