import LM from 'ml-levenberg-marquardt';

import { parseData } from './parseData';
import { sumOfLorentzians } from './sumOfLorentzians';

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeLorentzianSum(xy, group, opts = {}) {
  let xy2 = parseData(xy, opts.percentage || 0);

  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nL = group.length;
  let pInit = [];
  let pMin = [];
  let pMax = [];
  let dx = [];
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

  let pFit = LM(data, sumOfLorentzians, opts);
  pFit = pFit.parameterValues;
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [pFit[i], pFit[i + nL] * maxY, pFit[i + 2 * nL]];
  }
  return result;
}
