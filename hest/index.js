let Matrix = require('ml-matrix');

/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function singleGaussian(t) {
  let rows = t.rows;
  let result = new Matrix(t.rows, t.columns);
  return function(p) {
    let factor2 = (p[2][0] * p[2][0]) / 2;
    for (let i = 0; i < rows; i++) {
      result[i][0] =
        p[1][0] *
        Math.exp((-(t[i][0] - p[0][0]) * (t[i][0] - p[0][0])) / factor2);
    }
    return result;
  };
}
let length = 13;
let t = Matrix.columnVector(new Array(length).fill(0).map((a, b) => a + b));
console.log(t);
let gaussianFunction = singleGaussian(t, [[5], [10], [1]]);
console.log(gaussianFunction([[5], [10], [1]]));
console.log('________', singleGaussian(t, [[5], [10], [1]]));
