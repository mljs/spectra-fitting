import { optimize } from '../index';
import { sumOfGaussians } from '../shapes/sumOfGaussians';
import { sumOfLorentzians } from '../shapes/sumOfLorentzians';

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize 4 parameters Lorentzian', function () {
  it('Should approximate the true parameters', function () {
    let pTrue = [0, 0.001, (xFactor * nbPoints) / 10];
    let yData = sumOfLorentzians(pTrue);
    let result = optimize(
      { x, y: x.map((i) => yData(i)) },
      {
        x: 0.1,
        y: 0.0009,
        width: (xFactor * nbPoints) / 6,
      },
      { kind: 'lorentzian' },
    );
    expect(result.parameters.x).toBeCloseTo(pTrue[0], 3);
    expect(result.parameters.y).toBeCloseTo(pTrue[1], 3);
    expect(result.parameters.width).toBeCloseTo(pTrue[2], 2);
  });
});

describe('Optimize 3 parameters Gaussian', function () {
  it('Should approximate the true parameters', function () {
    let pTrue = [0, 0.001, (xFactor * nbPoints) / 10];
    let yData = sumOfGaussians(pTrue);
    let result = optimize(
      { x, y: x.map((i) => yData(i)) },
      {
        x: 0.1,
        y: 0.0009,
        width: (xFactor * nbPoints) / 6,
      },
      { kind: 'gaussian' },
    );
    expect(result.parameters.x).toBeCloseTo(pTrue[0], 3);
    expect(result.parameters.y).toBeCloseTo(pTrue[1], 3);
    expect(result.parameters.width).toBeCloseTo(pTrue[2], 3);
  });
});
