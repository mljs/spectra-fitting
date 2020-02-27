import Matrix from 'ml-matrix';

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function sumOfGaussians(t, p) {
  let nL = p.length / 3;
  let factor;

  let cols = t.rows;
  let result = Matrix.zeros(t.length, 1);
  for (let i = 0; i < nL; i++) {
    factor = Math.pow(p[i + nL * 2][0], 2) * 2;
    for (let j = 0; j < cols; j++) {
      result[j][0] +=
        p[i + nL][0] * Math.exp(-Math.pow(t[j][0] - p[i][0], 2) / factor);
    }
  }
  return result;
}
