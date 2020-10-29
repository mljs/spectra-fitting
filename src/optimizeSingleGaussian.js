import LM from 'ml-levenberg-marquardt';

import { singleGaussian } from './singleGaussian';

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleGaussian(xy, peak, options = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let dt = Math.abs(t[0] - t[1]);
  let pInit = new Float64Array([peak.x, 1, peak.width]);
  let pMin = new Float64Array([peak.x - dt, 0, peak.width / 4]);
  let pMax = new Float64Array([peak.x + dt, 1.25, peak.width * 4]);

  let data = {
    x: t,
    y: yData,
  };

  let lmOptions = {
    damping: 1.5,
    initialValues: pInit,
    minValues: pMin,
    maxValues: pMax,
    gradientDifference: dt / 10000,
    maxIterations: 100,
    errorTolerance: 10e-5,
  };

  options = Object.assign({}, lmOptions, options);
  let pFit = LM(data, singleGaussian, options);
  return {
    parameters: [
      pFit.parameterValues[0],
      pFit.parameterValues[1] * maxY,
      pFit.parameterValues[2],
    ],
    error: pFit.parameterError,
  };
}
