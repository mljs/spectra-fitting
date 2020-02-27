import Matrix from 'ml-matrix';
import LM from 'ml-curve-fitting';

import { parseData } from './parseData';
import { sumOfLorentzians } from './sumOfLorentzians';

let math = LM.Matrix.algebra;

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeLorentzianSum(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / math.sqrt(yData.dot(yData))];
  opts = Object.create(
    opts || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  let consts = [];

  let nL = group.length;
  let pInit = new Matrix(nL * 3, 1);
  let pMin = new Matrix(nL * 3, 1);
  let pMax = new Matrix(nL * 3, 1);
  let dx = new Matrix(nL * 3, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);
  for (let i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = 1;
    pInit[i + 2 * nL][0] = group[i].width;

    pMin[i][0] = group[i].x - dt;
    pMin[i + nL][0] = 0;
    pMin[i + 2 * nL][0] = group[i].width / 4;

    pMax[i][0] = group[i].x + dt;
    pMax[i + nL][0] = 1.5;
    pMax[i + 2 * nL][0] = group[i].width * 4;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
  }

  dx = -Math.abs(t[0][0] - t[1][0]) / 10000;
  let pFit = LM.optimize(
    sumOfLorentzians,
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
  for (let i = 0; i < nL; i++) {
    result[i] = [pFit[i], [pFit[i + nL][0] * maxY], pFit[i + 2 * nL]];
  }
  return result;
}
