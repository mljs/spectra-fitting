import { DataXY, DoubleArray } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';
import { xMinMaxValues } from 'ml-spectra-processing';

import { OptimizeOptions, Peak1D } from '../index';
import { getSumOfShapes } from '../shapes/getSumOfShapes';

import { assignDeep } from './assignDeep';

let xObject = {
  init: (peak: Peak1D) => peak.x,
  max: (peak: Peak1D) => peak.x + peak.fwhm * 2,
  min: (peak: Peak1D) => peak.x - peak.fwhm * 2,
  gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
};

let yObject = {
  init: (peak: Peak1D) => peak.y,
  max: () => 1.5,
  min: () => 0,
  gradientDifference: () => 1e-3,
};

let fwhmObject = {
  init: (peak: Peak1D) => peak.fwhm,
  max: (peak: Peak1D) => peak.fwhm * 4,
  min: (peak: Peak1D) => peak.fwhm * 0.25,
  gradientDifference: (peak: Peak1D) => peak.fwhm * 2e-3,
};

let muObject = {
  init: (peak: Peak1D) =>
    peak.shape && (peak.shape as { mu: number }).mu !== undefined
      ? (peak.shape as { mu: number }).mu
      : 0.5,
  min: () => 0,
  max: () => 1,
  gradientDifference: () => 0.01,
};

/** Algorithm to check the input
 * @param data - Data to check
 * @param peakList - List of peaks
 * @param options - Options for optimization
 */
export function checkInput(
  data: DataXY<DoubleArray>,
  peakList: Peak1D[],
  options: OptimizeOptions,
) {
  let {
    optimization = {
      kind: 'lm',
    },
  } = options;

  let peaks: {
    x: number;
    y: number;
    width?: number;
    fwhm: number;
    shape: Shape1D;
    parameters: string[];
    fromIndex: number;
    toIndex: number;
  }[] = JSON.parse(JSON.stringify(peakList));

  let defaultParameters = {
    x: xObject,
    y: yObject,
    fwhm: fwhmObject,
    mu: muObject,
  };

  let x = data.x;

  let { min, max } = xMinMaxValues(data.y);
  let y = new Array<number>(x.length);

  for (let i = 0; i < y.length; i++) {
    y[i] = data.y[i];
  }

  for (let i = 0; i < x.length; i++) {
    y[i] = (y[i] - min) / (max - min);
  }
  peaks.forEach((peak: any) => {
    peak.y = (peak.y - min) / (max - min);
  });

  let sumOfShapes = getSumOfShapes(peaks);
  let parameters = assignDeep({}, defaultParameters, optimization.parameters);

  for (let key in parameters) {
    for (let par in parameters[key]) {
      if (!Array.isArray(parameters[key][par])) {
        parameters[key][par] = [parameters[key][par]];
      }
      if (![peaks.length, 1].includes(parameters[key][par].length)) {
        throw new Error(`The length of ${key}-${par} is not correct`);
      }
      for (let index = 0; index < parameters[key][par].length; index++) {
        if (typeof parameters[key][par][index] === 'number') {
          let value = parameters[key][par][index];
          parameters[key][par][index] = () => value;
        }
      }
    }
  }

  let newOptimization = JSON.parse(JSON.stringify(optimization));
  newOptimization.parameters = parameters;

  return {
    y,
    x,
    max,
    min,
    peaks,
    sumOfShapes,
    newOptimization,
  };
}
