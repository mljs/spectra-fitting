import { optimizeSum } from './optimizeSum';

/**
 * Fits a set of points to a bell function.
 * @param {Object} data - A object containing the x and y data to be fitted.
 * @param {Array} peak - A object of initial parameters to be optimized comming from a peak picking {x, y, width}.
 * @param {Object} [options = {}]
 * @param {String} [options.kind = 'gaussian'] - kind of shape used to fitting, lorentzian, gaussian and pseudovoigt are supported.
 * @param {Object} [options.lmOptions = {}] - options of ml-levenberg-marquardt optimization package.
 * @returns {Object} - A object with fitting error and the list of optimized parameters { parameters: [x, y, width], error } if the kind of shape is pseudoVoigt mu parameter is optimized.{Array} - A set of objects of optimized parameters { parameters: [x, y, width], error } if the kind of shape is pseudoVoigt mu parameter is optimized.
 */
export function optimize(data, peak, options = {}) {
  let result = optimizeSum(data, [peak], options);
  let { error, parameters } = result;
  return { error, parameters: parameters[0] };
}
