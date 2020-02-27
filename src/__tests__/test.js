import Matrix from 'ml-matrix';

import { sumOfGaussianLorentzians } from '../sumOfGaussianLorentzians';
import { optimizeGaussianLorentzianSum } from '../optimizeGaussianLorentzianSum';
import { singleLorentzian } from '../singleLorentzian';
import { optimizeSingleLorentzian } from '../optimizeSingleLorentzian';
import { singleGaussian } from '../singleGaussian';
import { optimizeSingleGaussian } from '../optimizeSingleGaussian';

let nbPoints = 31;
let tFactor = 0.1;
let t = new Matrix(nbPoints, 1);
// let center = 0;
for (let i = 0; i < nbPoints; i++) {
  t[i][0] = (i - nbPoints / 2) * tFactor;
}

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', function() {
  it('group of two GL', function() {
    let pTrue = new Matrix([
      [-0.5],
      [0.5],
      [0.001],
      [0.001],
      [(tFactor * nbPoints) / 10],
      [(tFactor * nbPoints) / 10],
      [0.5],
      [0.1],
    ]);
    let yData = sumOfGaussianLorentzians(t, pTrue);
    let result = optimizeGaussianLorentzianSum(
      [t, yData],
      [
        { x: -0.51, y: 0.0009, width: (tFactor * nbPoints) / 6 },
        { x: 0.52, y: 0.0009, width: (tFactor * nbPoints) / 6 },
      ],
    );
    let nL = pTrue.length / 4;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i];
      expect(pFit[0][0]).toBeCloseTo(pTrue[i][0], 3);
      expect(pFit[1][0]).toBeCloseTo(pTrue[i + nL][0], 3);
      expect(pFit[2][0]).toBeCloseTo(pTrue[i + nL * 2][0], 3);
      expect(pFit[3][0]).toBeCloseTo(pTrue[i + nL * 3][0], 3);
    }
  });
});

describe('Optimize 4 parameters Lorentzian', function() {
  it('Should approximate the true parameters', function() {
    let pTrue = new Matrix([[0], [0.001], [(tFactor * nbPoints) / 10]]);
    let y = singleLorentzian(t, pTrue, []);
    //I moved the initial guess
    let result = optimizeSingleLorentzian([t, y], {
      x: 0.1,
      y: 0.0009,
      width: (tFactor * nbPoints) / 6,
    });
    expect(result[0][0]).toBeCloseTo(pTrue[0][0], 3);
    expect(result[1][0]).toBeCloseTo(pTrue[1][0], 3);
    expect(result[2][0]).toBeCloseTo(pTrue[2][0], 3);
  });
});

describe('Optimize 3 parameters Gaussian', function() {
  it('Should approximate the true parameters', function() {
    let pTrue = new Matrix([[0], [0.001], [(tFactor * nbPoints) / 10]]);
    let y = singleGaussian(t, pTrue, []);
    //I moved the initial guess
    let result = optimizeSingleGaussian([t, y], {
      x: 0.1,
      y: 0.0009,
      width: (tFactor * nbPoints) / 6,
    });

    expect(result[0][0]).toBeCloseTo(pTrue[0][0], 3);
    expect(result[1][0]).toBeCloseTo(pTrue[1][0], 3);
    expect(result[2][0]).toBeCloseTo(pTrue[2][0], 3);
  });
});
