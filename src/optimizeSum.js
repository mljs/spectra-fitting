import getMaxValue from 'ml-array-max';
import LM from 'ml-levenberg-marquardt';

import { sumOfGaussianLorentzians } from './shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from './shapes/sumOfGaussians';
import { sumOfLorentzians } from './shapes/sumOfLorentzians';

/**
 *
 * @param {Object} data - A object containing the x and y data to be fitted.
 * @param {Array} group - A object of initial parameters to be optimized comming from a peak picking {x, y, width}.
 * @param {Object} [options = {}]
 * @param {String} [options.kind = 'gaussian'] - kind of shape used to fitting
 * @param {Object} [options.lmOptions = {}] - options of ml-levenberg-marquardt optimization package.
 * @returns {Array} - A set of objects of optimized parameters { parameters: [x, y, width], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimizeSum(data, group, options = {}) {
  let { kind = 'gaussian', lmOptions = {} } = options;

  let maxY = getMaxValue(data.y);
  data.y.forEach((_, i, arr) => (arr[i] /= maxY));

  let nbParams;
  let paramsFunc;
  switch (kind) {
    case 'lorentzian':
      nbParams = 3;
      paramsFunc = sumOfLorentzians;
      break;
    case 'pseudoVoigt':
      nbParams = 4;
      paramsFunc = sumOfGaussianLorentzians;
      break;
    default:
      nbParams = 3;
      paramsFunc = sumOfGaussians;
  }

  let nL = group.length;
  let pInit = new Float64Array(nL * nbParams);
  let pMin = new Float64Array(nL * nbParams);
  let pMax = new Float64Array(nL * nbParams);
  let dt = Math.abs(data.x[0] - data.x[1]);

  for (let i = 0; i < nL; i++) {
    let peak = group[i];
    for (let s = 0; s < nbParams; s++) {
      pInit[i + s * nL] = getValue(s, peak, 'init', dt);
      pMin[i + s * nL] = getValue(s, peak, 'min', dt);
      pMax[i + s * nL] = getValue(s, peak, 'max', dt);
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
  let pFit = LM(data, paramsFunc, lmOptions);

  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    pFit.parameterValues[i + nL] *= maxY;
    result[i] = { error: pFit.parameterError, parameters: new Array(nbParams) };
    for (let s = 0; s < nbParams; s++) {
      result[i].parameters[s] = pFit.parameterValues[i + s * nL];
    }
  }
  return result;
}

function getValue(s, peak, key, dt) {
  let value;
  switch (s) {
    case 0:
      value =
        key === 'init' ? peak.x : key === 'min' ? peak.x - dt : peak.x + dt;
      break;
    case 1:
      value = key === 'init' ? 1 : key === 'min' ? 0 : 1.5;
      break;
    case 2:
      value =
        key === 'init'
          ? peak.width
          : key === 'min'
          ? peak.width / 4
          : peak.width * 4;
      break;
    default:
      value = key === 'init' ? 0.5 : key === 'min' ? 0 : 1;
  }
  return value;
}
