import type { DoubleArray } from 'cheminfo-types';

import type { OptimizationLayout } from '../util/buildOptimizationLayout.ts';
import type { InternalPeak } from '../util/internalPeaks/getInternalPeaks.ts';

import { applyShapeParameters } from './applyShapeParameters.ts';

/**
 * How one optimization variable feeds one peak parameter slot.
 */
interface VariableMember {
  /** Index of the slot in the flattened parameter vector. */
  actualIndex: number;
  /** Multiplicative transform from the variable to the slot (linked parameters). */
  factor: number;
}

/**
 * Build the analytical Jacobian of the sum of shapes, in the form
 * `ml-levenberg-marquardt` expects: given the variable vector, return a function
 * that yields the partial derivatives of the model at an x, one per variable.
 *
 * Every shape exposes a closed-form `derivative`, so the whole Jacobian costs one
 * shape evaluation per peak and per point, instead of one extra evaluation of the
 * complete model per parameter that finite differences need.
 * @param internalPeaks - The peaks being optimized.
 * @param layout - The mapping between optimizer variables and peak parameters.
 * @param freeIndices - Indices of the variables handed to the optimizer.
 * @returns A jacobian function for `ml-levenberg-marquardt`.
 */
export function getJacobian(
  internalPeaks: InternalPeak[],
  layout: OptimizationLayout,
  freeIndices: number[],
) {
  const { variables, variableInit } = layout;
  const isReduced = freeIndices.length !== variables.length;

  const membersPerVariable: VariableMember[][] = [];
  for (const variableIndex of freeIndices) {
    const members = variables[variableIndex].members;
    const mapped = new Array<VariableMember>(members.length);
    for (let i = 0; i < members.length; i++) {
      mapped[i] = {
        actualIndex: members[i].actualIndex,
        factor: members[i].factor,
      };
    }
    membersPerVariable.push(mapped);
  }

  let nbSlots = 0;
  for (const peak of internalPeaks) {
    nbSlots += peak.parameters.length;
  }

  // Reused across calls: ml-levenberg-marquardt copies the partials into its
  // matrix before asking for the next point, so a single buffer is enough.
  const slotPartials = new Float64Array(nbSlots);
  const gradient = new Array<number>(freeIndices.length);
  const fullVariables = new Float64Array(variables.length);

  return function jacobian(variableValues: DoubleArray) {
    let allVariables = variableValues;
    if (isReduced) {
      fullVariables.set(variableInit);
      for (let index = 0; index < freeIndices.length; index++) {
        fullVariables[freeIndices[index]] = variableValues[index];
      }
      allVariables = fullVariables;
    }

    const parameters = layout.variableToPeakValues(allVariables);
    applyShapeParameters(internalPeaks, parameters);

    return (x: number) => {
      for (const peak of internalPeaks) {
        const { fromIndex, shapeFct } = peak;
        const peakX = parameters[fromIndex];
        const y = parameters[fromIndex + 1];
        const derivative = shapeFct.derivative(x - peakX);

        // the shape is evaluated at (x - peakX), so d/dPeakX = -d/dt
        slotPartials[fromIndex] = -y * derivative.dx;
        slotPartials[fromIndex + 1] = derivative.fct;
        for (let i = 2; i < peak.parameters.length; i++) {
          slotPartials[fromIndex + i] = y * derivative.parameters[i - 2];
        }
      }

      for (
        let variableIndex = 0;
        variableIndex < membersPerVariable.length;
        variableIndex++
      ) {
        let total = 0;
        for (const member of membersPerVariable[variableIndex]) {
          total += member.factor * slotPartials[member.actualIndex];
        }
        gradient[variableIndex] = total;
      }
      return gradient;
    };
  };
}
