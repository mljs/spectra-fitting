import type { Shape1D, Shape1DInstance } from 'ml-peak-shape-generator';
import { getShape1D } from 'ml-peak-shape-generator';

import type { OptimizeOptions, Peak } from '../../index.ts';
import { assert } from '../assert.ts';

import { DefaultParameters } from './DefaultParameters.ts';

type Parameter = 'x' | 'y' | 'fwhm' | 'mu' | 'gamma' | 'fwhmG' | 'fwhmL';

type Property = 'init' | 'min' | 'max' | 'gradientDifference';
const properties: Property[] = ['init', 'min', 'max', 'gradientDifference'];
export interface InternalPeak {
  id?: string;
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
 * @param minMaxY
 * @param yScale
 * @param options
 * @returns
 */
export function getInternalPeaks(
  peaks: Peak[],
  yScale: number,
  options: OptimizeOptions = {},
) {
  let index = 0;
  const internalPeaks: InternalPeak[] = [];

  const normalizedPeaks = peaks.map((peak) => {
    return {
      ...peak,
      y: peak.y / yScale,
    };
  });

  for (const peak of normalizedPeaks) {
    const { id, shape = options.shape || { kind: 'gaussian' } } = peak;

    const shapeFct: Shape1DInstance = getShape1D(shape);

    const parameters: Parameter[] = ['x', 'y', ...shapeFct.getParameters()];

    const propertiesValues: Record<Property, number[]> = {
      min: [],
      max: [],
      init: [],
      gradientDifference: [],
    };

    for (const parameter of parameters) {
      for (const property of properties) {
        // check if the property is specified in the peak
        let propertyValue = peak?.parameters?.[parameter]?.[property];
        if (propertyValue !== undefined) {
          propertyValue = getNormalizedValue(
            propertyValue,
            parameter,
            property,
            yScale,
          );

          propertiesValues[property].push(propertyValue);
          continue;
        }
        // check if there are some global option, it could be a number or a callback

        let generalParameterValue =
          options?.parameters?.[parameter]?.[property];
        if (generalParameterValue !== undefined) {
          if (typeof generalParameterValue === 'number') {
            generalParameterValue = getNormalizedValue(
              generalParameterValue,
              parameter,
              property,
              yScale,
            );
            propertiesValues[property].push(generalParameterValue);
            continue;
          } else {
            let value = generalParameterValue(peak);
            value = getNormalizedValue(value, parameter, property, yScale);
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
      id,
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
  yScale: number,
): number {
  if (parameter === 'y') {
    if (property === 'gradientDifference') {
      return value;
    } else {
      return value / yScale;
    }
  }
  return value;
}
