import { gaussianFct } from 'ml-peak-shape-generator';
/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: widths;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @returns {*}
 */

export function sumOfGaussians(p) {
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let func = gaussianFct({
        x: p[i],
        y: p[i + nL],
        width: p[i + nL * 2],
      });
      result += func(t);
    }
    return result;
  };
}
