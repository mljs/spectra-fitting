import { optimizeSingleGaussian, singleGaussian } from '../index';

let nbPoints = 31;
let tFactor = 0.1;
let t = new Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  t[i] = (i - nbPoints / 2) * tFactor;
}

describe('Optimize 3 parameters Gaussian', function() {
  it('Should approximate the true parameters', function() {
    let pTrue = [0, 0.001, (tFactor * nbPoints) / 10];
    let yData = singleGaussian(pTrue);
    //I moved the initial guess
    let result = optimizeSingleGaussian([t, yData(t)], {
      x: 0.1,
      y: 0.0009,
      width: (tFactor * nbPoints) / 6,
    });
    expect(result[0]).toBeCloseTo(pTrue[0], 3);
    expect(result[1]).toBeCloseTo(pTrue[1], 3);
    expect(result[2]).toBeCloseTo(pTrue[2], 3);
  });
});
