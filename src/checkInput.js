import getMaxValue from 'ml-array-max';

import { sumOfGaussianLorentzians } from './shapes/sumOfGaussianLorentzians';
import { sumOfGaussians } from './shapes/sumOfGaussians';
import { sumOfLorentzians } from './shapes/sumOfLorentzians';

export function checkInput(data, options) {
  let {
    shape = { kind: 'gaussian' },
    optimization = {
      kind: 'lm',
    },
  } = options;

  if (typeof shape.kind !== 'string') {
    throw new Error('kind should be a string');
  }

  let kind = shape.kind.toLowerCase().replace(/[^a-z]/g, '');

  let nbParams;
  let paramsFunc;
  switch (kind) {
    case 'gaussian':
      nbParams = 3;
      paramsFunc = sumOfGaussians;
      break;
    case 'lorentzian':
      nbParams = 3;
      paramsFunc = sumOfLorentzians;
      break;
    case 'pseudovoigt':
      nbParams = 4;
      paramsFunc = sumOfGaussianLorentzians;
      break;
    default:
      throw new Error('kind of shape is not supported');
  }

  let x = data.x;
  let maxY = getMaxValue(data.y);
  let y = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    y[i] = data.y[i] / maxY;
  }

  let {
    minFactorWidth = 0.25,
    maxFactorWidth = 4,
    minFactorX = 2,
    maxFactorX = 2,
    minFactorY = 0,
    maxFactorY = 1.5,
    minMuValue = 0,
    maxMuValue = 1,
    xGradientDifference,
    yGradientDifference = 1e-3,
    widthGradientDifference,
    muGradientDifference = 0.01,
  } = optimization;

  if (minFactorX === maxFactorX && minFactorX === 1) {
    xGradientDifference = 0;
  }

  if (minFactorY === maxFactorY && minFactorY === 1) {
    yGradientDifference = 0;
  }

  if (minFactorWidth === maxFactorWidth && minFactorWidth === 1) {
    widthGradientDifference = 0;
  }

  const getValueOptions = {
    maxY,
    minFactorX,
    maxFactorX,
    minFactorY,
    maxFactorY,
    minMuValue,
    maxMuValue,
    minFactorWidth,
    maxFactorWidth,
    xGradientDifference,
    yGradientDifference,
    widthGradientDifference,
    muGradientDifference,
  };

  return {
    y,
    x,
    maxY,
    nbParams,
    paramsFunc,
    optimization,
    getValueOptions,
  };
}
