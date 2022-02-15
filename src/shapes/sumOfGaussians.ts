import { Gaussian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: widths;
 * @param parameters - Gaussian parameters
 * @returns {*}
 */
export function sumOfGaussians(parameters: number[]) {
  // 1st batch are the x, 2nd batch are the y, 3rd batch are the widths fwhm
  // nL indicates the number of values by batch
  const nL = parameters.length / 3;
  const gaussian = new Gaussian();
  // return a function
  return (x: number) => {
    let y = 0;
    // summing over the different possible gaussians
    for (let i = 0; i < nL; i++) {
      // nL*2 indicates the 3rd batch so the fwhm widths, for the different gaussians
      gaussian.fwhm = parameters[i + nL * 2];
      // y_parameter_for_ith_gaussian * gaussianFunction(x - center_for_ith_gaussian)
      // fct reference :
      // export function gaussianFct(x: number, fwhm: number) {
      // return Math.exp(GAUSSIAN_EXP_FACTOR * Math.pow(x / fwhm, 2));
      // }
      // export const GAUSSIAN_EXP_FACTOR = -4 * Math.LN2;
      y += parameters[i + nL] * gaussian.fct(x - parameters[i]);
    }
    return y;
  };
}
