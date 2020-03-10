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

  for (let i = 0; i < 4; i++) {
    for (let j = i; j < nL; j++) {
      pInit[j] = group[j].x;
      pMin[j] = group[j].x - dt;
      pMax[j] = group[j].x + dt;
    }
    for (let j = i; j < nL; j++) {
      pInit[j + 2] = 1;
      pMin[j + 2] = 0;
      pMax[j + 2] = 1.5;
    }
    for (let j = i; j < nL; j++) {
      pInit[j + 4] = group[j].width;
      pMin[j + 4] = group[i].width / 4;
      pMax[j + 4] = group[i].width * 4;
    }
    for (let j = i; j < nL + 6; j++) {
      pInit[j + 6] = 0.5;
      pMin[j + 6] = 0;
      pMax[i + 6] = 1;
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
    errorTolerance: 10e-3,
  };

  opts = Object.assign({}, opts, lmOptions);
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
