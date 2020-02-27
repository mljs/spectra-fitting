import Matrix from 'ml-matrix';

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */
export function sumOfLorentzians(t, p) {
  let nL = p.length / 3;
  let factor;
  let j;
  let p2;
  let cols = t.rows;
  let result = Matrix.zeros(t.length, 1);

  for (let i = 0; i < nL; i++) {
    p2 = Math.pow(p[i + nL * 2][0] / 2, 2);
    factor = p[i + nL][0] * p2;
    for (j = 0; j < cols; j++) {
      result[j][0] += factor / (Math.pow(t[j][0] - p[i][0], 2) + p2);
    }
  }
  return result;
}
