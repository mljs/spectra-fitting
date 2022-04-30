import { DataXY, DoubleArray } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';
import { xMinMaxValues } from 'ml-spectra-processing';

import { OptimizeOptions, Peak1D } from '../index';
import { getSumOfShapes } from '../shapes/getSumOfShapes';

import { assignDeep } from './assignDeep';

/**
 * We will normalize the inputs add add missing
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
  let parameters = assignDeep({}, DefaultParameters, optimization.parameters);

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
    x,
    y,
    min,
    max,
    peaks,
    sumOfShapes,
    newOptimization,
  };
}
