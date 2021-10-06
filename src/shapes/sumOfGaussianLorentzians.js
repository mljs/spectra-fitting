import { pseudoVoigt } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of linear combination of gaussian and lorentzian functions. The pseudo voigt
 * parameters are divided in 4 batches. 1st: centers; 2nd: heights; 3th: widths; 4th: mu's ;
 * @param t Ordinate value
 * @param p Lorentzian parameters
 * @returns {*}
 */

const { fct: pseudoVoigtFct } = pseudoVoigt;

export function sumOfGaussianLorentzians(p) {
  return (t) => {
    let nL = p.length / 4;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      result +=
        p[i + nL] * pseudoVoigtFct(t - p[i], p[i + nL * 2], p[i + nL * 3]);
    }
    return result;
  };
}
