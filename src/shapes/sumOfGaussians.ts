import { Gaussian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: widths;
 * @param parameters - Gaussian parameters
 */
export function sumOfGaussians(parameters: number[]) {
  const nL = parameters.length / 3;
  const gaussian = new Gaussian();
  return (x: number) => {
    let y = 0;
    for (let i = 0; i < nL; i++) {
      gaussian.fwhm = parameters[i + nL * 2];
      y += parameters[i + nL] * gaussian.fct(x - parameters[i]);
    }
    return y;
  };
}
