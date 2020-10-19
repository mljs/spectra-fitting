/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

export function sumOfGaussianLorentzians(p) {
  return function (t) {
    let nL = p.length / 4;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let xG = p[i + nL * 3];
      let xL = 1 - xG;
      let p2 = Math.pow(p[i + nL * 2] / 2, 2);
      let factorL = xL * p[i + nL] * p2;
      let factorG1 = p[i + nL * 2] * p[i + nL * 2] * 2;
      let factorG2 = xG * p[i + nL];
      result +=
        factorG2 * Math.exp(-Math.pow(t - p[i], 2) / factorG1) +
        factorL / (Math.pow(t - p[i], 2) + p2);
    }
    return result;
  };
}
