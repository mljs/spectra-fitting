import LM from 'ml-curve-fitting';
import Matrix from 'ml-matrix';

import { sumOfGaussianLorentzians } from './sumOfGaussianLorentzians';
import { parseData } from './parseData';

export function optimizeGaussianLorentzianSum(xy, group, options = {}) {
  let {
    percentage = 0,
    LMOptions = [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  } = options;

  let xy2 = parseData(xy, percentage || 0);
  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / Math.sqrt(yData.dot(yData))];
  let consts = [];
  let nL = group.length;
  let pInit = new Matrix(nL * 4, 1);
  let pMin = new Matrix(nL * 4, 1);
  let pMax = new Matrix(nL * 4, 1);
  let dx = new Matrix(nL * 4, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);

  for (let i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = 1;
    pInit[i + 2 * nL][0] = group[i].width;
    pInit[i + 3 * nL][0] = 0.5;

    pMin[i][0] = group[i].x - dt;
    pMin[i + nL][0] = 0;
    pMin[i + 2 * nL][0] = group[i].width / 4;
    pMin[i + 3 * nL][0] = 0;

    pMax[i][0] = group[i].x + dt;
    pMax[i + nL][0] = 1.5;
    pMax[i + 2 * nL][0] = group[i].width * 4;
    pMax[i + 3 * nL][0] = 1;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
    dx[i + 3 * nL][0] = 0.0001;
  }
  let pFit = LM.optimize(
    sumOfGaussianLorentzians,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    LMOptions,
  );
  pFit = pFit.p;
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [
      pFit[i],
      [pFit[i + nL][0] * maxY],
      pFit[i + 2 * nL],
      pFit[i + 3 * nL],
    ];
  }
  return result;
}
