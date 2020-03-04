import { optimizeGaussianSum, sumOfGaussians } from '../index';

let nbPoints = 31;
let tFactor = 0.1;
let t = new Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  t[i] = (i - nbPoints / 2) * tFactor;
}
describe('Optimize sum of Gaussians', function() {
  it('group of two GL', function() {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfGaussians(pTrue);

    let result = optimizeGaussianSum(
      [t, yData(t)],
      [
        { x: -0.51, y: 0.0009, width: (tFactor * nbPoints) / 6 },
        { x: 0.52, y: 0.0009, width: (tFactor * nbPoints) / 6 },
      ],
    );
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result[i];
      expect(pFit[0]).toBeCloseTo(pTrue[i], 3);
      expect(pFit[1]).toBeCloseTo(pTrue[i + nL], 3);
      expect(pFit[2]).toBeCloseTo(pTrue[i + nL * 2], 3);
    }
  });
});
