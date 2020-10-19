import { optimizeSum } from '../index';
import { sumOfGaussianLorentzians } from '../shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from '../shapes/sumOfGaussians';
import { sumOfLorentzians } from '../shapes/sumOfLorentzians';

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize sum of Lorentzian', function () {
  it('group of two GL', function () {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfLorentzians(pTrue);
    let result = optimizeSum(
      { x, y: x.map((i) => yData(i)) },
      [
        { x: -0.5, y: 0.0009, width: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, width: (xFactor * nbPoints) / 8 },
      ],
      { kind: 'lorentzian' },
    );
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i].parameters;
      expect(pFit[0]).toBeCloseTo(pTrue[i], 2);
      expect(pFit[1]).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit[2]).toBeCloseTo(pTrue[i + nL * 2], 2);
    }
  });
});

describe('Optimize sum of Gaussians', function () {
  it('group of two GL', function () {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfGaussians(pTrue);

    let result = optimizeSum(
      { x, y: x.map((i) => yData(i)) },
      [
        { x: -0.5, y: 0.0009, width: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, width: (xFactor * nbPoints) / 8 },
      ],
      { kind: 'gaussian' },
    );
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i].parameters;
      expect(pFit[0]).toBeCloseTo(pTrue[i], 2);
      expect(pFit[1]).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit[2]).toBeCloseTo(pTrue[i + nL * 2], 2);
    }
  });
});

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', function () {
  it('group of two GL', function () {
    let pTrue = [
      0,
      0,
      0.001,
      0.001,
      0.31,
      0.31,
      (xFactor * nbPoints) / 10,
      (xFactor * nbPoints) / 10,
    ];
    let yData = sumOfGaussianLorentzians(pTrue);
    let result = optimizeSum(
      { x, y: x.map(yData) },
      [
        { x: 0.1, y: 0.0009, width: (xFactor * nbPoints) / 6 },
        { x: 0.1, y: 0.0009, width: (xFactor * nbPoints) / 6 },
      ],
      { kind: 'pseudoVoigt' },
    );
    let nL = pTrue.length / 4;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i].parameters;
      expect(pFit[0]).toBeCloseTo(pTrue[i], 3);
      expect(pFit[1]).toBeCloseTo(pTrue[i + nL], 3);
      expect(pFit[2]).toBeCloseTo(pTrue[i + nL * 2], 3);
      expect(pFit[3]).toBeCloseTo(pTrue[i + nL * 3], 3);
    }
  });
});
