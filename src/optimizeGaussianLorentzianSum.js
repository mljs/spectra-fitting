import LM from 'ml-levenberg-marquardt';

import { sumOfGaussianLorentzians } from './sumOfGaussianLorentzians';
import { parseData } from './parseData';

export function optimizeGaussianLorentzianSum(xy, group, options = {}) {
  let {
    percentage = 0,
    // LMOptions = [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  } = options;
  let xy2 = parseData(xy, percentage || 0);
  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }
  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];

  // let nbPoints = t.rows;
  // let weight = [nbPoints / Math.sqrt(yData.dot(yData))];
  // let consts = [];

  let nL = group.length;
  let pInit = []; // new Array(nL * 4, 1);
  let pMin = []; // new Array(nL * 4, 1);
  let pMax = []; // new Array(nL * 4, 1);
  let dx = []; //new Array(nL * 4, 1);
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
  let pFit = LM(data, sumOfGaussianLorentzians, lmOptions);
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
