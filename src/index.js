import getMaxValue from 'ml-array-max';
import { getKind } from 'ml-peak-shape-generator';

import { choiceMethod } from './choiceMethod';
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
 * @param {array} peakList - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param {object} [options = {}]
 * @param {number|string} [options.kind = 'gaussian'] - kind of shape used to fitting, lorentzian, gaussian and pseudovoigt are supported.
 * @param {object} [options.optimization = { kind: 'lm' }] - optimization options.
 * @returns {object} - A object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(data, peakList, options = {}) {
  let {
    shape = { kind: 'gaussian' },
    optimization = {
      kind: 'lm',
    },
  } = options;

  shape.kind = getKind(shape.kind);

  let x = data.x;
  let maxY = getMaxValue(data.y);
  let y = data.y.map((e) => (e /= maxY));
  let peaks = peakList.map((peak) => {
    peak.y /= maxY;
    return peak;
  });

  let nbParams;
  let paramsFunc;
  switch (shape.kind) {
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

  let nL = peaks.length;
  let pInit = new Float64Array(nL * nbParams);
  let pMin = new Float64Array(nL * nbParams);
  let pMax = new Float64Array(nL * nbParams);
  let dt = Math.abs(data.x[0] - data.x[1]);

  for (let i = 0; i < nL; i++) {
    let peak = peaks[i];
    for (let s = 0; s < nbParams; s++) {
      pInit[i + s * nL] = getValue(s, peak, STATE_INIT, dt);
      pMin[i + s * nL] = getValue(s, peak, STATE_MIN, dt);
      pMax[i + s * nL] = getValue(s, peak, STATE_MAX, dt);
    }
  }

  let { algorithm, optOptions } = choiceMethod(optimization);

  optOptions.minValues = pMin;
  optOptions.maxValues = pMax;
  optOptions.initialValues = pInit;

  let pFit = algorithm({ x, y }, paramsFunc, optOptions);

  let { parameterError: error, iterations } = pFit;
  let result = { error, iterations, peaks: new Array(nL) };
  for (let i = 0; i < nL; i++) {
    let peak = {};
    pFit.parameterValues[i + nL] *= maxY;
    for (let s = 0; s < nbParams; s++) {
      peak[keys[s]] = pFit.parameterValues[i + s * nL];
    }
    result.peaks[i] = peak;
  }
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
