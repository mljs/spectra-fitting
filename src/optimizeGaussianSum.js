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
  let pInit = new Float64Array(nL * 3);
  let pMin = new Float64Array(nL * 3);
  let pMax = new Float64Array(nL * 3);
  let dt = Math.abs(t[0] - t[1]);

  for (let i = 0; i < 4; i++) {
    for (let j = i; j < nL; j++) {
      pInit[j] = group[j].x;
      pMin[j] = group[j].x - dt;
      pMax[j] = group[j].x + dt;
    }
    for (let j = i; j < nL; j++) {
      pInit[j + 2] = group[j].y / maxY;
      pMin[j + 2] = (group[j].y * 0.8) / maxY;
      pMax[j + 2] = (group[j].y * 1.2) / maxY;
    }
    for (let j = i; j < nL; j++) {
      pInit[j + 4] = group[j].width;
      pMin[j + 4] = group[j].width / 2;
      pMax[j + 4] = group[j].width * 2;
    }
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

  opts = Object.assign({}, opts, lmOptions);

  let pFit = LM(data, sumOfGaussians, opts);
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
