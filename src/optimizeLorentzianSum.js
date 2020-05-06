import LM from 'ml-levenberg-marquardt';

import { sumOfLorentzians } from './sumOfLorentzians';

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeLorentzianSum(xy, group, opts = {}) {
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
    gradientDifference: 10e-2,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };

  opts = Object.assign({}, lmOptions, opts);

  let pFit = LM(data, sumOfLorentzians, opts);
  for (let i = 0; i < nL; i++) {
    result[i] = {
      parameters: [
        pFit.parameterValues[i],
        pFit.parameterValues[i + nL] * maxY,
        pFit.parameterValues[i + nL + 2],
      ],
      error: pFit.parameterError,
    };
  }
  return result;
}
