import type { DoubleArray } from 'cheminfo-types';
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
  propertiesValues: Record<Property, DoubleArray>;
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
  for (const originalPeak of peaks) {
    const normalizedPeak = {
      ...originalPeak,
      y: originalPeak.y / yScale,
    };
    const peak = normalizedPeak;
    const { id, shape = options.shape || { kind: 'gaussian' } } = peak;

    const shapeFct: Shape1DInstance = getShape1D(shape);

    const parameters: Parameter[] = ['x', 'y', ...shapeFct.getParameters()];

    const propertiesValuesInternal: Record<Property, number[]> = {
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

          propertiesValuesInternal[property].push(propertyValue);
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
            propertiesValuesInternal[property].push(generalParameterValue);
            continue;
          } else {
            // callbacks receive user-provided peak values (not Y-normalized)
            let value = generalParameterValue(originalPeak);
            value = getNormalizedValue(value, parameter, property, yScale);
            propertiesValuesInternal[property].push(value);
            continue;
          }
        }

        // we just need to take the default parameters
        assert(
          DefaultParameters[parameter],
          `No default parameter for ${parameter}`,
        );
        const defaultParameterValues = DefaultParameters[parameter][property];
        propertiesValuesInternal[property].push(
          //@ts-expect-error parameters and shape instance are guaranteed to be present in the defaultParameterValues function
          defaultParameterValues(peak, shapeFct),
        );
      }
    }

    const fromIndex = index;
    const toIndex = fromIndex + parameters.length - 1;
    index += toIndex - fromIndex + 1;

    const propertiesValues: Record<Property, DoubleArray> = {
      min: propertiesValuesInternal.min,
      max: propertiesValuesInternal.max,
      init: propertiesValuesInternal.init,
      gradientDifference: propertiesValuesInternal.gradientDifference,
    };

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
