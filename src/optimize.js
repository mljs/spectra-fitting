import { optimizeSum } from './optimizeSum';

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */

export function optimize(data, peak, options = {}) {
  let result = optimizeSum(data, [peak], options);
  return result[0];
}
