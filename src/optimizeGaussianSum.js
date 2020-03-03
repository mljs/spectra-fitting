import LM from 'ml-levenberg-marquardt';

import { sumOfGaussians } from './sumOfGaussians';

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeGaussianSum(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let nL = group.length;
  let pInit = [];
  let pMin = [];
  let pMax = [];
  let dx = [];
  let dt = Math.abs(t[0] - t[1]);
  for (let i = 0; i < nL; i++) {
    pInit[i] = group[i].x;
    pInit[i + nL] = group[i].y / maxY;
    pInit[i + 2 * nL] = group[i].width;

    pMin[i] = group[i].x - dt;
    pMin[i + nL] = (group[i].y * 0.8) / maxY;
    pMin[i + 2 * nL] = group[i].width / 2;

    pMax[i] = group[i].x + dt;
    pMax[i + nL] = (group[i].y * 1.2) / maxY;
    pMax[i + 2 * nL] = group[i].width * 2;

    dx[i] = -dt / 1000;
    dx[i + nL] = -1e-3;
    dx[i + 2 * nL] = -dt / 1000;
  }

  let data = {
    x: t,
    y: yData,
  };
  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: 10e-2,
    maxIterations: 100,
    errorTolerance: 10e-3,
  };
  opts = Object.assign({}, opts, lmOptions);
  let pFit = LM(data, sumOfGaussians, opts);
  pFit = pFit.parameterValues;
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [pFit[i], pFit[i + nL] * maxY, pFit[i + 2 * nL]];
  }
  return result;
}
