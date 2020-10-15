'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var LM = require('ml-levenberg-marquardt');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

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
    let factorG1;
    let factorG2;
    let factorL;
    let rows = t.length;
    let p2;
    let result = rows === undefined ? 0 : new Float64Array(rows).fill(0);
    for (let i = 0; i < nL; i++) {
      let xG = p[i + nL * 3];
      let xL = 1 - xG;
      p2 = Math.pow(p[i + nL * 2] / 2, 2);
      factorL = xL * p[i + nL] * p2;
      factorG1 = p[i + nL * 2] * p[i + nL * 2] * 2;
      factorG2 = xG * p[i + nL];
      if (rows === undefined) {
        result +=
          factorG2 * Math.exp(-Math.pow(t - p[i], 2) / factorG1) +
          factorL / (Math.pow(t - p[i], 2) + p2);
      } else {
        for (let j = 0; j < rows; j++) {
          result[j] +=
            factorG2 * Math.exp(-Math.pow(t[j] - p[i], 2) / factorG1) +
            factorL / (Math.pow(t[j] - p[i], 2) + p2);
        }
      }
    }
    return result;
  };
}

function optimizeGaussianLorentzianSum(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let nL = group.length;
  let pInit = new Float64Array(nL * 4);
  let pMin = new Float64Array(nL * 4);
  let pMax = new Float64Array(nL * 4);
  let dt = Math.abs(t[0] - t[1]);

  for (let i = 0; i < nL; i++) {
    pInit[i] = group[i].x;
    pInit[i + nL] = 1;
    pInit[i + 2 * nL] = group[i].width;
    pInit[i + 3 * nL] = 0.5;

    pMin[i] = group[i].x - dt;
    pMin[i + nL] = 0;
    pMin[i + 2 * nL] = group[i].width / 4;
    pMin[i + 3 * nL] = 0;

    pMax[i] = group[i].x + dt;
    pMax[i + nL] = 1.5;
    pMax[i + 2 * nL] = group[i].width * 4;
    pMax[i + 3 * nL] = 1;
  }

  let data = {
    x: t,
    y: yData,
  };

  let result = new Array(nL);

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };
  opts = Object.assign({}, lmOptions, opts);
  let pFit = LM__default['default'](data, sumOfGaussianLorentzians, opts);
  for (let i = 0; i < nL; i++) {
    result[i] = {
      parameters: [
        pFit.parameterValues[i],
        pFit.parameterValues[i + nL] * maxY,
        pFit.parameterValues[i + 2 * nL],
        pFit.parameterValues[i + 3 * nL],
      ],
      error: pFit.parameterError,
    };
  }
  return result;
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
    let factor;
    let rows = t.length;
    let result = rows === undefined ? 0 : new Float64Array(rows).fill(0);
    for (let i = 0; i < nL; i++) {
      factor = Math.pow(p[i + nL * 2], 2) * 2;
      if (rows === undefined) {
        result += p[i + nL] * Math.exp(-Math.pow(t - p[i], 2) / factor);
      } else {
        for (let j = 0; j < rows; j++) {
          result[j] += p[i + nL] * Math.exp(-Math.pow(t[j] - p[i], 2) / factor);
        }
      }
    }
    return result;
  };
}

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
function optimizeGaussianSum(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let nL = group.length;
  let pInit = new Float64Array(nL * 3);
  let pMin = new Float64Array(nL * 3);
  let pMax = new Float64Array(nL * 3);
  let dt = Math.abs(t[0] - t[1]);

  for (let i = 0; i < nL; i++) {
    pInit[i] = group[i].x;
    pInit[i + nL] = group[i].y / maxY;
    pInit[i + 2 * nL] = group[i].width;

    pMin[i] = group[i].x - dt;
    pMin[i + nL] = 0;
    pMin[i + 2 * nL] = group[i].width / 4;

    pMax[i] = group[i].x + dt;
    pMax[i + nL] = (group[i].y * 1.2) / maxY;
    pMax[i + 2 * nL] = group[i].width * 4;
  }

  let data = {
    x: t,
    y: yData,
  };
  let result = new Array(nL);

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };

  opts = Object.assign({}, lmOptions, opts);

  let pFit = LM__default['default'](data, sumOfGaussians, opts);
  for (let i = 0; i < nL; i++) {
    result[i] = {
      parameters: [
        pFit.parameterValues[i],
        pFit.parameterValues[i + nL] * maxY,
        pFit.parameterValues[i + nL * 2],
      ],
      error: pFit.parameterError,
    };
  }
  return result;
}

/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */

function singleGaussian(p) {
  return function (t) {
    let factor2 = (p[2] * p[2]) / 2;
    let rows = t.length;
    if (!rows) return p[1] * Math.exp((-(t - p[0]) * (t - p[0])) / factor2);
    let result = new Float64Array(t.length);
    for (let i = 0; i < t.length; i++) {
      result[i] = p[1] * Math.exp((-(t[i] - p[0]) * (t[i] - p[0])) / factor2);
    }
    return result;
  };
}

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
function optimizeSingleGaussian(xy, peak, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let dt = Math.abs(t[0] - t[1]);
  let pInit = new Float64Array([peak.x, 1, peak.width]);
  let pMin = new Float64Array([peak.x - dt, 0, peak.width / 4]);
  let pMax = new Float64Array([peak.x + dt, 1.25, peak.width * 4]);

  let data = {
    x: t,
    y: yData,
  };

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };

  opts = Object.assign({}, lmOptions, opts);
  let pFit = LM__default['default'](data, singleGaussian, opts);
  return {
    parameters: [
      pFit.parameterValues[0],
      pFit.parameterValues[1] * maxY,
      pFit.parameterValues[2],
    ],
    error: pFit.parameterError,
  };
}

/*
 peaks on group should sorted
 */
function optimizeGaussianTrain(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let currentIndex = 0;
  let nbPoints = t.length;
  let nextX;
  let tI, yI;
  let result = [];
  let current;
  for (let i = 0; i < group.length; i++) {
    nextX = group[i].x - group[i].width * 1.5;
    while (t[currentIndex++] < nextX && currentIndex < nbPoints);
    nextX = group[i].x + group[i].width * 1.5;
    tI = [];
    yI = [];
    while (t[currentIndex] <= nextX && currentIndex < nbPoints) {
      tI.push(t[currentIndex]);
      yI.push(yData[currentIndex] * maxY);
      currentIndex++;
    }
    current = optimizeSingleGaussian([tI, yI], group[i], opts);
    if (current) {
      result.push({
        x: current.parameters[0],
        y: current.parameters[1],
        width: current.parameters[2],
        opt: true,
      });
    } else {
      result.push({
        x: group[i].x,
        y: group[i].y,
        width: group[i].width,
        opt: false,
      });
    }
  }
  return result;
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
    let factor;
    let p2;
    let rows = t.length;
    let result = rows === undefined ? 0 : new Float64Array(rows).fill(0);
    for (let i = 0; i < nL; i++) {
      p2 = Math.pow(p[i + nL * 2] / 2, 2);
      factor = p[i + nL] * p2;
      if (rows === undefined) {
        result += factor / (Math.pow(t - p[i], 2) + p2);
      } else {
        for (let j = 0; j < rows; j++) {
          result[j] += factor / (Math.pow(t[j] - p[i], 2) + p2);
        }
      }
    }
    return result;
  };
}

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
function optimizeLorentzianSum(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));

  let nL = group.length;
  let pInit = new Float64Array(nL * 3);
  let pMin = new Float64Array(nL * 3);
  let pMax = new Float64Array(nL * 3);
  let dt = Math.abs(t[0] - t[1]);

  for (let i = 0; i < nL; i++) {
    pInit[i] = group[i].x;
    pInit[i + nL] = 1;
    pInit[i + 2 * nL] = group[i].width;

    pMin[i] = group[i].x - dt;
    pMin[i + nL] = 0;
    pMin[i + 2 * nL] = group[i].width / 4;

    pMax[i] = group[i].x + dt;
    pMax[i + nL] = 1.5;
    pMax[i + 2 * nL] = group[i].width * 4;
  }

  let data = {
    x: t,
    y: yData,
  };

  let result = new Array(nL);

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };

  opts = Object.assign({}, lmOptions, opts);

  let pFit = LM__default['default'](data, sumOfLorentzians, opts);
  for (let i = 0; i < nL; i++) {
    result[i] = {
      parameters: [
        pFit.parameterValues[i],
        pFit.parameterValues[i + nL] * maxY,
        pFit.parameterValues[i + nL * 2],
      ],
      error: pFit.parameterError,
    };
  }
  return result;
}

/**
 * Single 4 parameter lorentzian function
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */

function singleLorentzian(p) {
  return function (t) {
    let factor = p[1] * Math.pow(p[2] / 2, 2);
    let rows = t.length;
    if (!rows) return factor / (Math.pow(t - p[0], 2) + Math.pow(p[2] / 2, 2));
    let result = new Float64Array(rows);
    for (let i = 0; i < rows; i++) {
      result[i] = factor / (Math.pow(t[i] - p[0], 2) + Math.pow(p[2] / 2, 2));
    }
    return result;
  };
}

/**
 * * Fits a set of points to a Lorentzian function. Returns the center of the peak, the width at half height, and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
function optimizeSingleLorentzian(xy, peak, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let dt = Math.abs(t[0] - t[1]);
  let pInit = new Float64Array([peak.x, 1, peak.width]);
  let pMin = new Float64Array([peak.x - dt, 0.75, peak.width / 4]);
  let pMax = new Float64Array([peak.x + dt, 1.25, peak.width * 4]);

  let data = {
    x: t,
    y: yData,
  };

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };
  opts = Object.assign({}, lmOptions, opts);
  let pFit = LM__default['default'](data, singleLorentzian, opts);
  return {
    parameters: [
      pFit.parameterValues[0],
      pFit.parameterValues[1] * maxY,
      pFit.parameterValues[2],
    ],
    error: pFit.parameterError,
  };
}

/*
 peaks on group should sorted
 */
function optimizeLorentzianTrain(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let currentIndex = 0;
  let nbPoints = t.length;
  let nextX;
  let tI, yI;
  let result = [];
  let current;
  for (let i = 0; i < group.length; i++) {
    nextX = group[i].x - group[i].width * 1.5;
    while (t[currentIndex++] < nextX && currentIndex < nbPoints);
    nextX = group[i].x + group[i].width * 1.5;
    tI = [];
    yI = [];
    while (t[currentIndex] <= nextX && currentIndex < nbPoints) {
      tI.push(t[currentIndex]);
      yI.push(yData[currentIndex] * maxY);
      currentIndex++;
    }
    current = optimizeSingleLorentzian([tI, yI], group[i], opts);
    if (current) {
      result.push({
        x: current.parameters[0],
        y: current.parameters[1],
        width: current.parameters[2],
        opt: true,
      });
    } else {
      result.push({
        x: group[i].x,
        y: group[i].y,
        width: group[i].width,
        opt: false,
      });
    }
  }
  return result;
}

exports.optimizeGaussianLorentzianSum = optimizeGaussianLorentzianSum;
exports.optimizeGaussianSum = optimizeGaussianSum;
exports.optimizeGaussianTrain = optimizeGaussianTrain;
exports.optimizeLorentzianSum = optimizeLorentzianSum;
exports.optimizeLorentzianTrain = optimizeLorentzianTrain;
exports.optimizeSingleGaussian = optimizeSingleGaussian;
exports.optimizeSingleLorentzian = optimizeSingleLorentzian;
exports.singleGaussian = singleGaussian;
exports.singleLorentzian = singleLorentzian;
exports.sumOfGaussianLorentzians = sumOfGaussianLorentzians;
exports.sumOfGaussians = sumOfGaussians;
exports.sumOfLorentzians = sumOfLorentzians;
