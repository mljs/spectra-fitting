import { PseudoVoigt } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of linear combination of gaussian and lorentzian functions. The pseudo voigt
 * parameters are divided in 4 batches. 1st: centers; 2nd: heights; 3th: widths; 4th: mu's ;
 * @param parameters Lorentzian parameters
 */
export function sumOfPseudoVoigts(parameters: number[]) {
  const pseudoVoigt = new PseudoVoigt();
  return (x: number) => {
    let nL = parameters.length / 4;
    let y = 0;
    for (let i = 0; i < nL; i++) {
      pseudoVoigt.fwhm = parameters[i + nL * 2];
      pseudoVoigt.mu = parameters[i + nL * 3];
      y += parameters[i + nL] * pseudoVoigt.fct(x - parameters[i]);
    }
    return y;
  };
}
