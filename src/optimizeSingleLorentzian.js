import LM from 'ml-curve-fitting';
import Matrix from 'ml-matrix';

import { singleLorentzian } from './singleLorentzian';
import { parseData } from './parseData';

/**
 * * Fits a set of points to a Lorentzian function. Returns the center of the peak, the width at half height, and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleLorentzian(xy, peak, opts) {
  opts = opts || {};
  let xy2 = parseData(xy, opts.percentage || 0);

  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / Math.sqrt(yData.dot(yData))];

  opts = Object.create(
    opts.LMOptions || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  let consts = [];
  let dt = Math.abs(t[0][0] - t[1][0]);
  let dx = new Matrix([[-dt / 10000], [-1e-3], [-dt / 10000]]);
  let pInit = new Matrix([[peak.x], [1], [peak.width]]);
  let pMin = new Matrix([[peak.x - dt], [0.75], [peak.width / 4]]);
  let pMax = new Matrix([[peak.x + dt], [1.25], [peak.width * 4]]);

  let pFit = LM.optimize(
    singleLorentzian,
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
  return [pFit[0], [pFit[1][0] * maxY], pFit[2]];
}
