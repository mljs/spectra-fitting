import LM from 'ml-levenberg-marquardt';
//import LM from 'ml-curve-fitting';

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

  opts = Object.create(
    opts.LMOptions || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  let dt = Math.abs(t[0] - t[1]);
  let pInit = [peak.x, 1, peak.width];
  let pMin = [peak.x - dt, 0.75, peak.width / 4];
  let pMax = [peak.x + dt, 1.25, peak.width * 4];
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
  let pFit = LM(data, singleLorentzian, lmOptions);
  pFit = pFit.parameterValues;
  return [pFit[0], pFit[1] * maxY, pFit[2]];
}