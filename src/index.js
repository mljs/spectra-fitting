import { getKind } from 'ml-peak-shape-generator';

import { scaleData } from './scaleData';
import { selectMethod } from './selectMethod';
import { sumOfGaussianLorentzians } from './shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from './shapes/sumOfGaussians';
import { sumOfLorentzians } from './shapes/sumOfLorentzians';

const STATE_INIT = 0;
const STATE_MIN = 1;
const STATE_MAX = 2;

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
 * @returns {object} - A object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(data, peaks, options = {}) {
  let {
    shape = { kind: 'gaussian' },
    optimization = {
      kind: 'lm',
    },
  } = options;

  peaks = JSON.parse(JSON.stringify(peaks));
  data = { x: data.x.slice(), y: data.y.slice() };

  let kind = getKind(shape.kind);

  let scaled = scaleData(data, peaks);

  let nbParams;
  let paramsFunc;
  switch (kind) {
    case 1:
      nbParams = 3;
      paramsFunc = sumOfGaussians;
      break;
    case 2:
      nbParams = 3;
      paramsFunc = sumOfLorentzians;
      break;
    case 3:
      nbParams = 4;
      paramsFunc = sumOfGaussianLorentzians;
      break;
    default:
      throw new Error('kind of shape is not supported');
  }

  let nbShapes = scaled.peaks.length;
  let initialValues = new Float64Array(nbShapes * nbParams);
  let minValues = new Float64Array(nbShapes * nbParams);
  let maxValues = new Float64Array(nbShapes * nbParams);
  let deltaX = Math.abs(scaled.data.x[0] - scaled.data.x[1]);

  for (let i = 0; i < nbShapes; i++) {
    let peak = scaled.peaks[i];
    for (let s = 0; s < nbParams; s++) {
      initialValues[i + s * nbShapes] = getValue(s, peak, STATE_INIT, deltaX);
      minValues[i + s * nbShapes] = getValue(s, peak, STATE_MIN, deltaX);
      maxValues[i + s * nbShapes] = getValue(s, peak, STATE_MAX, deltaX);
    }
  }

  let { algorithm, optimizationOptions } = selectMethod(optimization);

  Object.assign(optimizationOptions, {
    minValues,
    maxValues,
    initialValues,
  });

  let pFit = algorithm(scaled.data, paramsFunc, optimizationOptions);

  let { parameterError: error, iterations, parameterValues } = pFit;

  let result = { error, iterations, peaks };
  for (let i = 0; i < peaks.length; i++) {
    for (let s = 0; s < nbParams; s++) {
      result.peaks[i][keys[s]] = parameterValues[i + s * peaks.length];
    }
  }

  result.peaks = scaleData(scaled.data, result.peaks, {
    scaleXY: false,
    reverse: true,
    minX: scaled.oldMinX,
    maxX: scaled.oldMaxX,
    maxY: scaled.oldMaxY,
  }).peaks;

  return result;
}

function getValue(parameterIndex, peak, key, dt) {
  let value;
  switch (parameterIndex) {
    case 0:
      value =
        key === STATE_INIT
          ? peak.x
          : key === STATE_MIN
          ? peak.x - dt
          : peak.x + dt;
      break;
    case 1:
      value = key === STATE_INIT ? peak.y : key === STATE_MIN ? 0 : 1.5;
      break;
    case 2:
      value =
        key === STATE_INIT
          ? peak.width
          : key === STATE_MIN
          ? peak.width / 4
          : peak.width * 4;
      break;
    default:
      value = key === STATE_INIT ? 0.5 : key === STATE_MIN ? 0 : 1;
  }
  return value;
}
