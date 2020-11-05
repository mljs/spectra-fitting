import { lorentzianFct } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

export function sumOfLorentzians(p) {
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      result += lorentzianFct(p[i], p[i + nL], p[i + nL * 2], t);
    }
    return result;
  };
}
