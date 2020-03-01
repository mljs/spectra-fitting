import { sumOfGaussianLorentzians } from '../sumOfGaussianLorentzians';
import { optimizeGaussianLorentzianSum } from '../optimizeGaussianLorentzianSum';
import { singleLorentzian } from '../singleLorentzian';
import { optimizeSingleLorentzian } from '../optimizeSingleLorentzian';
import { singleGaussian } from '../singleGaussian';
import { optimizeSingleGaussian } from '../optimizeSingleGaussian';

let nbPoints = 31;
let tFactor = 0.1;
let t = new Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  t[i] = (i - nbPoints / 2) * tFactor;
}

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', function() {
  it('group of two GL', function() {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31, 0.5, 0.1];
    let yData = sumOfGaussianLorentzians(pTrue);

    let result = optimizeGaussianLorentzianSum(
      [t, yData(t)],
      [
        { x: -0.51, y: 0.0009, width: (tFactor * nbPoints) / 6 },
        { x: 0.52, y: 0.0009, width: (tFactor * nbPoints) / 6 },
      ],
    );
    let nL = pTrue.length / 4;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i];
      expect(pFit[0]).toBeCloseTo(pTrue[i], 3);
      expect(pFit[1]).toBeCloseTo(pTrue[i + nL], 3);
      expect(pFit[2]).toBeCloseTo(pTrue[i + nL * 2], 3);
      expect(pFit[3]).toBeCloseTo(pTrue[i + nL * 3], 3);
    }
  });
});

describe('Optimize 4 parameters Lorentzian', function() {
  it('Should approximate the true parameters', function() {
    let pTrue = [0, 0.001, (tFactor * nbPoints) / 10];
    let yData = singleLorentzian(pTrue);
    //I moved the initial guess
    let result = optimizeSingleLorentzian([t, yData(t)], {
      x: 0.1,
      y: 0.0009,
      width: (tFactor * nbPoints) / 6,
    });
    expect(result[0]).toBeCloseTo(pTrue[0], 3);
    expect(result[1]).toBeCloseTo(pTrue[1], 3);
    expect(result[2]).toBeCloseTo(pTrue[2], 3);
  });
});

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
