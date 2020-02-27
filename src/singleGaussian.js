import Matrix from 'ml-matrix';

/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function singleGaussian(t, p) {
  let factor2 = (p[2][0] * p[2][0]) / 2;
  let rows = t.rows;
  let result = new Matrix(t.rows, t.columns);
  for (let i = 0; i < rows; i++) {
    result[i][0] =
      p[1][0] *
      Math.exp((-(t[i][0] - p[0][0]) * (t[i][0] - p[0][0])) / factor2);
  }
  return result;
}
