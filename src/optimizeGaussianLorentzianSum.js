import LM from 'ml-levenberg-marquardt';

import { sumOfGaussianLorentzians } from './sumOfGaussianLorentzians';

export function optimizeGaussianLorentzianSum(xy, group, opts = {}) {
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

    dx[i] = -dt / 1000;
    dx[i + nL] = -1e-3;
    dx[i + 2 * nL] = -dt / 1000;
    dx[i + 3 * nL] = 0.0001;
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
  let pFit = LM(data, sumOfGaussianLorentzians, opts);
  pFit = pFit.parameterValues;
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [
      pFit[i],
      pFit[i + nL] * maxY,
      pFit[i + 2 * nL],
      pFit[i + 3 * nL],
    ];
  }
  return result;
}
