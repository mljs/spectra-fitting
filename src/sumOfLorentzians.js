/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

export function sumOfLorentzians(p) {
  return function(t) {
    let nL = p.length / 3;
    let factor;
    let p2;
    let cols = t.length;
    let result = new Array(cols).fill(0);
    for (let i = 0; i < nL; i++) {
      p2 = Math.pow(p[i + nL * 2] / 2, 2);
      factor = p[i + nL] * p2;
      for (let j = 0; j < cols; j++) {
        result[j] += factor / (Math.pow(t[j] - p[i], 2) + p2);
      }
    }
    return result;
  };
}
