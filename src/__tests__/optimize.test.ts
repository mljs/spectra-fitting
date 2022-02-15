import { optimize } from '../index';
import { sumOfGaussians } from '../shapes/sumOfGaussians';
import { sumOfLorentzians } from '../shapes/sumOfLorentzians';
import { sumOfPseudoVoigts } from '../shapes/sumOfPseudoVoigts';

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  // from -nbPoints/2*xFactor to nbPoints/2*xFactor
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize sum of Lorentzian', () => {
  it('group of two GL', () => {
    // centers are -0.5 and 0.5
    // heights are 0.001, 0.001
    // fwhm are 0.31, 0.31
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    // sum of two lorentzians with the parameters above
    let yData = sumOfLorentzians(pTrue);
    // 0.1*31/8
    let peakList = [
      { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
    ];
    // function yData
    let result = optimize({ x, y: x.map((i) => yData(i)) }, peakList, {
      shape: { kind: 'lorentzian' },
    });

    // In this case nL = 2, nL is presumably number of Lorentzians
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 2);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 2);
      expect(peakList).toStrictEqual([
        { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      ]);
    }
  });
});

describe('Optimize sum of Gaussians', () => {
  it('group of two GL', () => {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfGaussians(pTrue);
    let result = optimize(
      { x, y: x.map((i) => yData(i)) },
      [
        { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      ],
      { shape: { kind: 'gaussian' } },
    );
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 2);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 2);
    }
  });
});

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', () => {
  it('group of two GL', () => {
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
    let func = sumOfPseudoVoigts(pTrue);
    let result = optimize(
      { x, y: x.map(func) },
      [
        { x: 0.1, y: 0.0009, fwhm: (xFactor * nbPoints) / 6 },
        { x: 0.1, y: 0.0009, fwhm: (xFactor * nbPoints) / 6 },
      ],
      {
        shape: { kind: 'pseudoVoigt' },
        optimization: {
          kind: 'lm',
          options: { maxIterations: 300, damping: 0.5, errorTolerance: 1e-8 },
        },
      },
    );

    let nL = pTrue.length / 4;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 3);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 3);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 3);
      expect((pFit.shape as { mu: number }).mu).toBeCloseTo(
        pTrue[i + nL * 3],
        3,
      );
    }
  });
});

describe('shape do not supported', () => {
  it('throw', () => {
    expect(() => {
      optimize({ x: [0, 1, 2], y: [1, 2, 1] }, [], {
        shape: { kind: 'wrongKindOfShape' },
      });
    }).toThrow('kind of shape is not supported');
  });
});
