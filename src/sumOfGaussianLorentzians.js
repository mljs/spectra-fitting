/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

export function sumOfGaussianLorentzians(p) {
  return function(t) {
    let nL = p.length / 4;
    let factorG1;
    let factorG2;
    let factorL;
    let rows = t.length;
    let p2;
    let result = rows === undefined ? 0 : new Float64Array(rows).fill(0);
    for (let i = 0; i < nL; i++) {
      let xG = p[i + nL * 3];
      let xL = 1 - xG;
      p2 = Math.pow(p[i + nL * 2] / 2, 2);
      factorL = xL * p[i + nL] * p2;
      factorG1 = p[i + nL * 2] * p[i + nL * 2] * 2;
      factorG2 = xG * p[i + nL];
      if (rows === undefined) {
        result +=
          factorG2 * Math.exp(-Math.pow(t - p[i], 2) / factorG1) +
          factorL / (Math.pow(t - p[i], 2) + p2);
      } else {
        for (let j = 0; j < rows; j++) {
          result[j] +=
            factorG2 * Math.exp(-Math.pow(t[j] - p[i], 2) / factorG1) +
            factorL / (Math.pow(t[j] - p[i], 2) + p2);
        }
      }
    }
    // console.log(result);
    return result;
  };
}
