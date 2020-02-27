import Matrix from 'ml-matrix';
import LM from 'ml-curve-fitting';

import { parseData } from './parseData';
import { sumOfGaussians } from './sumOfGaussians';

let math = LM.Matrix.algebra;

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeGaussianSum(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;
  let i;

  let weight = new Matrix(nbPoints, 1);
  let k = nbPoints / math.sqrt(yData.dot(yData));
  for (i = 0; i < nbPoints; i++) {
    weight[i][0] = k;
  }

  opts = Object.create(
    opts || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 2],
  );

  let consts = [];

  let nL = group.length;
  let pInit = new Matrix(nL * 3, 1);
  let pMin = new Matrix(nL * 3, 1);
  let pMax = new Matrix(nL * 3, 1);
  let dx = new Matrix(nL * 3, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);
  for (i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = group[i].y / maxY;
    pInit[i + 2 * nL][0] = group[i].width;

    pMin[i][0] = group[i].x - dt;
    pMin[i + nL][0] = (group[i].y * 0.8) / maxY;
    pMin[i + 2 * nL][0] = group[i].width / 2;

    pMax[i][0] = group[i].x + dt;
    pMax[i + nL][0] = (group[i].y * 1.2) / maxY;
    pMax[i + 2 * nL][0] = group[i].width * 2;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
  }

  let pFit = LM.optimize(
    sumOfGaussians,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    opts,
  );
  pFit = pFit.p;
  let result = new Array(nL);
  for (i = 0; i < nL; i++) {
    result[i] = [pFit[i], [pFit[i + nL][0] * maxY], pFit[i + 2 * nL]];
  }
  return result;
}
