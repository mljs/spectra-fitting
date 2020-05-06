import LM from 'ml-levenberg-marquardt';

import { sumOfGaussianLorentzians } from './sumOfGaussianLorentzians';

export function optimizeGaussianLorentzianSum(xy, group, opts = {}) {
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
    gradientDifference: 10e-2,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };
  opts = Object.assign({}, lmOptions, opts);
  let pFit = LM(data, sumOfGaussianLorentzians, opts);
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
