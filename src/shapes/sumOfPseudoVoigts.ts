import { PseudoVoigt } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of linear combination of gaussian and lorentzian functions. The pseudo voigt
 * parameters are divided in 4 batches. 1st: centers; 2nd: heights; 3th: widths; 4th: mu's ;
 * @param t Ordinate value
 * @param p Lorentzian parameters
 * @returns {*}
 */

// const pseudoVoigtFct = PseudoVoigt.fct;

export function sumOfPseudoVoigts(p: number[]) {
  const pseudoVoigt = new PseudoVoigt();
  return (t: number) => {
    let nL = p.length / 4;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      pseudoVoigt.fwhm = p[i + nL * 2];
      pseudoVoigt.mu = p[i + nL * 3];
      result += p[i + nL] * pseudoVoigt.fct(t - p[i]);
    }
    return result;
  };
}
