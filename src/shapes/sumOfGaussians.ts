import { Gaussian } from 'ml-peak-shape-generator';

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: widths;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @returns {*}
 */

export function sumOfGaussians(p: number[]) {
  const nL = p.length / 3;
  const gaussian = new Gaussian();
  return (t: number) => {
    let result = 0;
    for (let i = 0; i < nL; i++) {
      gaussian.fwhm = p[i + nL * 2];
      result += p[i + nL] * gaussian.fct(t - p[i]);
    }
    return result;
  };
}
