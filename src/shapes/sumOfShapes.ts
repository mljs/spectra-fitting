import { Gaussian, PseudoVoigt, Lorentzian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of different functions.
 * @param parameters - parameters
 */
export function sumOfShapes(parameters: number[], kind: string[]) {
  const pseudoVoigt = new PseudoVoigt();
  const lorentzian = new Lorentzian();
  const gaussian = new Gaussian();

  return (x: number) => {
    if (parameters && kind) {
      let nL = parameters.length / 4;
      let y = 0;

      for (let i = 0; i < nL; i++) {
        if (kind[i] === 'pseudovoigt') {
          pseudoVoigt.fwhm = parameters[i + nL * 2];
          pseudoVoigt.mu = parameters[i + nL * 3];
          y += parameters[i + nL] * pseudoVoigt.fct(x - parameters[i]);
        } else if (kind[i] === 'lorentzian') {
          lorentzian.fwhm = parameters[i + nL * 2];
          y += parameters[i + nL] * lorentzian.fct(x - parameters[i]);
        } else if (kind[i] === 'gaussian') {
          gaussian.fwhm = parameters[i + nL * 2];
          y += parameters[i + nL] * gaussian.fct(x - parameters[i]);
        }
      }
      return y;
    } else {
      return 0;
    }
  };
}
