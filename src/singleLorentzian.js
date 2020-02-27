import Matrix from 'ml-matrix';

/**
 * Single 4 parameter lorentzian function
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function singleLorentzian(t, p) {
  let factor = p[1][0] * Math.pow(p[2][0] / 2, 2);
  let rows = t.rows;
  let result = new Matrix(t.rows, t.columns);
  for (let i = 0; i < rows; i++) {
    result[i][0] =
      factor / (Math.pow(t[i][0] - p[0][0], 2) + Math.pow(p[2][0] / 2, 2));
  }
  return result;
}
