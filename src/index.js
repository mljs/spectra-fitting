import getMaxValue from 'ml-array-max';
import LM from 'ml-levenberg-marquardt';

import { sumOfGaussianLorentzians } from './shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from './shapes/sumOfGaussians';
import { sumOfLorentzians } from './shapes/sumOfLorentzians';

const STATE_INIT = 0;
const STATE_MIN = 1;
const STATE_MAX = 2;

const keys = ['x', 'y', 'width', 'mu'];
/**
 * Fits a set of points to the sum of a set of bell functions.
 * @param {Object} data - An object containing the x and y data to be fitted.
 * @param {Array} peakList - A list of initial parameters to be optimized. e.g. coming from a peak picking [{x, y, width}].
 * @param {Object} [options = {}]
 * @param {String} [options.kind = 'gaussian'] - kind of shape used to fitting, lorentzian, gaussian and pseudovoigt are supported.
 * @param {Object} [options.lmOptions = {}] - options of ml-levenberg-marquardt optimization package.
 * @returns {Object} - A object with fitting error and the list of optimized parameters { parameters: [ {x, y, width} ], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(data, peakList, options = {}) {
  let { kind = 'gaussian', lmOptions = {} } = options;

  let x = data.x;
  let maxY = getMaxValue(data.y);
  let y = data.y.map((e) => (e /= maxY));
  let peaks = peakList.map((peak) => {
    peak.y /= maxY;
    return peak;
  });

  let nbParams;
  let paramsFunc;
  switch (kind.toLowerCase()) {
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

  lmOptions = Object.assign(
    {
      damping: 1.5,
      initialValues: pInit,
      minValues: pMin,
      maxValues: pMax,
      gradientDifference: dt / 10000,
      maxIterations: 100,
      errorTolerance: 10e-5,
    },
    lmOptions,
  );
  let pFit = LM({ x, y }, paramsFunc, lmOptions);

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
