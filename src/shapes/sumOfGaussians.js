/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function sumOfGaussians(p) {
  const factor = 2 / Math.sqrt(2 * Math.log(2));
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let sd = p[i + nL * 2] / factor;
      result += p[i + nL] * Math.exp(-Math.pow((t - p[i]) / sd, 2) / 2);
    }
    return result;
  };
}
