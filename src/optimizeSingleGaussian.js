import LM from 'ml-levenberg-marquardt';

import { singleGaussian } from './singleGaussian';
import { parseData } from './parseData';

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleGaussian(xy, peak, opts) {
  opts = opts || {};
  let xy2 = parseData(xy, opts.percentage || 0);

  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];

  // let nbPoints = t.rows;

  // let weight = [nbPoints / Math.sqrt(yData.dot(yData))];

  opts = Object.create(
    opts.LMOptions || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  // let consts = [];
  let dt = Math.abs(t[0] - t[1]);
  // let dx = new Matrix([[-dt / 10000], [-1e-3], [-dt / 10000]]);

  let pInit = [peak.x, 1, peak.width];
  let pMin = [peak.x - dt, 0.75, peak.width / 4];
  let pMax = [peak.x + dt, 1.25, peak.width * 4];

  let data = {
    x: Array.from(t),
    y: Array.from(yData),
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
  let pFit = LM(data, singleGaussian, lmOptions);
  pFit = pFit.parameterValues;
  return [pFit[0], pFit[1] * maxY, pFit[2]];
}
