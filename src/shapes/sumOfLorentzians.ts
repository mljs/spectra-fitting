import { Lorentzian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param parameters - Lorentzian parameters
 */
export function sumOfLorentzians(parameters: number[]) {
  const lorentzian = new Lorentzian();
  return (x: number) => {
    let nL = parameters.length / 3;
    let y = 0;
    for (let i = 0; i < nL; i++) {
      lorentzian.fwhm = parameters[i + nL * 2];
      y += parameters[i + nL] * lorentzian.fct(x - parameters[i]);
    }
    return y;
  };
}
