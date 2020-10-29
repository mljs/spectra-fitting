'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var getMaxValue = require('ml-array-max');
var LM = require('ml-levenberg-marquardt');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var getMaxValue__default = /*#__PURE__*/_interopDefaultLegacy(getMaxValue);
var LM__default = /*#__PURE__*/_interopDefaultLegacy(LM);

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

function sumOfGaussianLorentzians(p) {
  return function (t) {
    let nL = p.length / 4;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let xG = p[i + nL * 3];
      let xL = 1 - xG;
      let p2 = Math.pow(p[i + nL * 2] / 2, 2);
      let factorL = xL * p[i + nL] * p2;
      let factorG1 = p[i + nL * 2] * p[i + nL * 2] * 2;
      let factorG2 = xG * p[i + nL];
      result +=
        factorG2 * Math.exp(-Math.pow(t - p[i], 2) / factorG1) +
        factorL / (Math.pow(t - p[i], 2) + p2);
    }
    return result;
  };
}

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function sumOfGaussians(p) {
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      result +=
        p[i + nL] * Math.exp(-Math.pow((t - p[i]) / p[i + nL * 2], 2) / 2);
    }
    return result;
  };
}

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

function sumOfLorentzians(p) {
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let p2 = Math.pow(p[i + nL * 2] / 2, 2);
      let factor = p[i + nL] * p2;
      result += factor / (Math.pow(t - p[i], 2) + p2);
    }
    return result;
  };
}

/**
 *
 * @param {Object} data - A object containing the x and y data to be fitted.
 * @param {Array} group - A object of initial parameters to be optimized comming from a peak picking {x, y, width}.
 * @param {Object} [options = {}]
 * @param {String} [options.kind = 'gaussian'] - kind of shape used to fitting
 * @param {Object} [options.lmOptions = {}] - options of ml-levenberg-marquardt optimization package.
 * @returns {Array} - A set of objects of optimized parameters { parameters: [x, y, width], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
function optimizeSum(data, group, options = {}) {
  let { kind = 'gaussian', lmOptions = {} } = options;

  let maxY = getMaxValue__default['default'](data.y);
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

  lmOptions = Object.assign({}, lmOptions, {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  });
  let pFit = LM__default['default'](data, paramsFunc, lmOptions);

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

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */

function optimize(data, peak, options = {}) {
  let result = optimizeSum(data, [peak], options);
  return result[0];
}

exports.optimize = optimize;
exports.optimizeSum = optimizeSum;
