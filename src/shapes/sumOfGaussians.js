import { gaussianFct } from 'ml-peak-shape-generator';
/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: widths;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @returns {*}
 */
// export function sumOfGaussians(p) {
//   const factor = 2 * Math.sqrt(2 * Math.log(2));
//   return function (t) {
//     let nL = p.length / 3;
//     let result = 0;
//     for (let i = 0; i < nL; i++) {
//       let sd = p[i + nL * 2] / factor;
//       result += p[i + nL] * Math.exp(-Math.pow((t - p[i]) / sd, 2) / 2);
//     }
//     return result;
//   };
// }

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
