/**
 * Single 4 parameter lorentzian function
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */

export function singleLorentzian(p) {
  return function (t) {
    let factor = p[1] * Math.pow(p[2] / 2, 2);
    let rows = t.length;
    if (!rows) return factor / (Math.pow(t - p[0], 2) + Math.pow(p[2] / 2, 2));
    let result = new Float64Array(rows);
    for (let i = 0; i < rows; i++) {
      result[i] = factor / (Math.pow(t[i] - p[0], 2) + Math.pow(p[2] / 2, 2));
    }
    return result;
  };
}
