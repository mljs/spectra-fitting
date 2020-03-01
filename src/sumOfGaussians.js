/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function sumOfGaussians(p) {
  return function(t) {
    let nL = p.length / 4;
    let factor;
    let cols = t.length;
    let result = new Array(cols).fill(0);
    for (let i = 0; i < nL; i++) {
      factor = Math.pow(p[i + nL * 2], 2) * 2;
      for (let j = 0; j < cols; j++) {
        result[j] += p[i + nL] * Math.exp(-Math.pow(t[j] - p[i], 2) / factor);
      }
    }
    return result;
  };
}
