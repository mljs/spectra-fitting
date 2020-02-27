import Matrix from 'ml-matrix';

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

export function sumOfGaussianLorentzians(t, p) {
  let nL = p.length / 4;
  let factorG1;
  let factorG2;
  let factorL;
  let cols = t.rows;
  let p2;
  let result = Matrix.zeros(t.length, 1);
  for (let i = 0; i < nL; i++) {
    let xG = p[i + nL * 3][0];
    let xL = 1 - xG;
    p2 = Math.pow(p[i + nL * 2][0] / 2, 2);
    factorL = xL * p[i + nL][0] * p2;
    factorG1 = p[i + nL * 2][0] * p[i + nL * 2][0] * 2;
    factorG2 = xG * p[i + nL][0];
    for (let j = 0; j < cols; j++) {
      result[j][0] +=
        factorG2 * Math.exp(-Math.pow(t[j][0] - p[i][0], 2) / factorG1) +
        factorL / (Math.pow(t[j][0] - p[i][0], 2) + p2);
    }
  }
  return result;
}
