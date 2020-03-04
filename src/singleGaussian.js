/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */

export function singleGaussian(p) {
  return function(t) {
    let factor2 = (p[2] * p[2]) / 2;
    let rows = t.length;
    if (!rows) return p[1] * Math.exp((-(t - p[0]) * (t - p[0])) / factor2);
    let result = new Array(t.length);
    for (let i = 0; i < t.length; i++) {
      result[i] = p[1] * Math.exp((-(t[i] - p[0]) * (t[i] - p[0])) / factor2);
    }
    return result;
  };
}
