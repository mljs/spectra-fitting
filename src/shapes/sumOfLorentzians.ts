import { Lorentzian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @returns {*}
 */

// const lorentzianFct = Lorentzian.fct;

export function sumOfLorentzians(p: number[]) {
  const lorentzian = new Lorentzian();
  return (t: number) => {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      lorentzian.fwhm = p[i + nL * 2];
      result += p[i + nL] * lorentzian.fct(t - p[i]);
    }
    return result;
  };
}
