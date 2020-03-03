import LM from 'ml-levenberg-marquardt';

import { singleGaussian } from './singleGaussian';

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleGaussian(xy, peak, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
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

  opts = Object.assign({}, opts, lmOptions);
  // console.log(data, singleGaussian, opts);
  let pFit = LM(data, singleGaussian, opts);
  pFit = pFit.parameterValues;
  return [pFit[0], pFit[1] * maxY, pFit[2]];
}
