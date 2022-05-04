import { getShape1D, Shape1D, Shape1DInstance } from 'ml-peak-shape-generator';

import { Peak, OptimizeOptions } from '../../index';
import { assert } from '../assert';

import { DefaultParameters } from './DefaultParameters';

type Parameter = 'x' | 'y' | 'fwhm' | 'mu';

type Property = 'init' | 'min' | 'max' | 'gradientDifference';
const properties: Property[] = ['init', 'min', 'max', 'gradientDifference'];
export interface InternalPeak {
  shape: Shape1D;
  shapeFct: Shape1DInstance;
  parameters: Parameter[];
  propertiesValues: Record<Property, number[]>;
  fromIndex: number;
  toIndex: number;
}

/**
 * Return an array of internalPeaks that contains the exact init, min, max values based on the options
 * @param peaks
 * @param options
 * @returns
 */
export function getInternalPeaks(
  peaks: Peak[],
  minMaxY: { min: number; max: number; range: number },
  options: OptimizeOptions = {},
) {
  let index = 0;
  let internalPeaks: InternalPeak[] = [];
  for (const peak of peaks) {
    const shape: Shape1D = peak.shape
      ? peak.shape
      : options.shape
      ? options.shape
      : { kind: 'gaussian' };

    const shapeFct: Shape1DInstance = getShape1D(shape);

    //@ts-expect-error Should disappear with next release of peak-shape-generator
    const parameters: Parameter[] = ['x', 'y', ...shapeFct.getParameters()];

    const propertiesValues: Record<Property, number[]> = {
      min: [],
      max: [],
      init: [],
      gradientDifference: [],
    };

    for (let parameter of parameters) {
      for (let property of properties) {
        // check if the property is specified in the peak
        let propertyValue =
          peak.parameters &&
          peak.parameters[parameter] &&
          peak.parameters[parameter][property];
        if (propertyValue) {
          propertyValue = getNormalizedValue(
            propertyValue,
            parameter,
            property,
            minMaxY,
          );

          propertiesValues[property].push(propertyValue);
          continue;
        }
        // check if there are some global option, it could be a number or a callback

        let generalParameterValue =
          options.parameters &&
          options.parameters[parameter] &&
          options.parameters[parameter][property];
        if (generalParameterValue) {
          if (typeof generalParameterValue === 'number') {
            generalParameterValue = getNormalizedValue(
              generalParameterValue,
              parameter,
              property,
              minMaxY,
            );
            propertiesValues[property].push(generalParameterValue);
            continue;
          } else {
            let value = generalParameterValue(peak);
            value = getNormalizedValue(value, parameter, property, minMaxY);
            propertiesValues[property].push(value);
            continue;
          }
        }

        // we just need to take the default parameters
        assert(
          DefaultParameters[parameter],
          `No default parameter for ${parameter}`,
        );
        const defaultParameterValues = DefaultParameters[parameter][property];
        //@ts-expect-error should never happen
        propertiesValues[property].push(defaultParameterValues(peak, shapeFct));
      }
    }

    const fromIndex = index;
    const toIndex = fromIndex + parameters.length - 1;
    index += toIndex - fromIndex + 1;

    internalPeaks.push({
      shape,
      shapeFct,
      parameters,
      propertiesValues,
      fromIndex,
      toIndex,
    });
  }
  return internalPeaks;
}

function getNormalizedValue(
  value: number,
  parameter: string,
  property: string,
  minMaxY: { min: number; max: number; range: number },
): number {
  if (parameter === 'y') {
    if (property === 'gradientDifference') {
      return value / minMaxY.range;
    } else {
      return (value - minMaxY.min) / minMaxY.range;
    }
  }
  return value;
}
