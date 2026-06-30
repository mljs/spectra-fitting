import { xMean } from 'ml-spectra-processing';

import type {
  LinkedParameter,
  LinkedParameterPeak,
  OptimizeOptions,
  Peak,
} from '../index.ts';

import { assert } from './assert.ts';
import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';

/**
 * Represents a concrete parameter position for a specific peak.
 */
export interface ParameterSlot {
  /** Index in the flattened actual parameter vector. */
  actualIndex: number;
  /** Zero-based index of the peak this slot belongs to. */
  peakIndex: number;
  /** Optional peak identifier when available. */
  peakId?: string;
  /** Name of the parameter represented by this slot. */
  parameter: string;
  /** Initial parameter value. */
  init: number;
  /** Lower bound for the parameter. */
  min: number;
  /** Upper bound for the parameter. */
  max: number;
  /** Finite difference step used for gradients. */
  gradientDifference: number;
  /** Whether this slot participates in optimization. */
  optimize: boolean;
}

/**
 * Describes how an optimization variable maps to a slot.
 */
interface VariableMemberReference {
  /** Index in the flattened actual parameter vector. */
  actualIndex: number;
  /** Zero-based index of the peak this member refers to. */
  peakIndex: number;
  /** Name of the mapped parameter. */
  parameter: string;
  /** Multiplicative transform from variable value to slot value. */
  factor: number;
  /** Additive transform from variable value to slot value. */
  offset: number;
}

/**
 * Represents an optimizer variable, potentially shared by multiple slots.
 */
export interface OptimizationVariable {
  parameter: string;
  init: number;
  min: number;
  max: number;
  gradientDifference: number;
  optimize: boolean;
  members: VariableMemberReference[];
}

/**
 * Aggregates slots and variables used during optimization.
 */
export interface OptimizationLayout {
  /** Concrete parameter slots for all peaks. */
  slots: ParameterSlot[];
  /** Optimization variables, including shared/grouped ones. */
  variables: OptimizationVariable[];
  /** Indices of variables marked as optimizable. */
  freeIndices: number[];
  /** Lower bounds for each optimization variable. */
  variableMin: Float64Array;
  /** Upper bounds for each optimization variable. */
  variableMax: Float64Array;
  /** Initial values for each optimization variable. */
  variableInit: Float64Array;
  /** Gradient step values for each optimization variable. */
  variableGrad: Float64Array;
  /** Maps a variable vector back to per-slot peak values. */
  variableToPeakValues(variableValues: ArrayLike<number>): number[];
}

/**
 * Internal variable shape with an ordering key.
 */
interface SortableVariable extends OptimizationVariable {
  sortKey: number;
}

/**
 * Build an optimization layout mapping actual per-peak parameter slots
 * to optimizer variables. The layout describes slots, grouped/shared
 * variables, variable bounds/initials, and provides a helper to
 * materialize actual peak parameter values from a variable vector.
 * @param internalPeaks - normalized internal peaks with parameter indices
 * @param peaks - original peak objects (for per-peak optimize flags)
 * @param options - user `OptimizeOptions`, may contain `parameterGroups`
 * @param yScale - y normalization factor (used when converting offsets)
 * @returns an `OptimizationLayout` describing variables and slots
 */
export function buildOptimizationLayout(
  internalPeaks: InternalPeak[],
  peaks: Peak[],
  options: OptimizeOptions,
  yScale = 1,
): OptimizationLayout {
  const slots = buildParameterSlots(internalPeaks, peaks, options);
  const variables = buildOptimizationVariables(
    slots,
    options.linkedParameters,
    yScale,
  );

  const variableMin = new Float64Array(variables.length);
  const variableMax = new Float64Array(variables.length);
  const variableInit = new Float64Array(variables.length);
  const variableGrad = new Float64Array(variables.length);
  const freeIndices: number[] = [];

  for (let i = 0; i < variables.length; i++) {
    const variable = variables[i];
    variableMin[i] = variable.min;
    variableMax[i] = variable.max;
    variableInit[i] = variable.init;
    variableGrad[i] = variable.gradientDifference;
    if (variable.optimize) {
      freeIndices.push(i);
    }
  }

  return {
    slots,
    variables,
    freeIndices,
    variableMin,
    variableMax,
    variableInit,
    variableGrad,
    variableToPeakValues(variableValues: ArrayLike<number>) {
      const actualValues = new Array<number>(slots.length);
      for (let i = 0; i < variables.length; i++) {
        const variableValue = variableValues[i];
        const members = variables[i].members;
        for (const member of members) {
          actualValues[member.actualIndex] =
            variableValue * member.factor + member.offset;
        }
      }
      return actualValues;
    },
  };
}

/**
 * Builds concrete parameter slots for each peak parameter.
 * @param internalPeaks - normalized peaks containing parameter metadata
 * @param peaks - original peaks used to resolve optimize flags
 * @param options - optimization options with parameter settings
 * @returns flattened parameter slots across all peaks
 */
function buildParameterSlots(
  internalPeaks: InternalPeak[],
  peaks: Peak[],
  options: OptimizeOptions,
): ParameterSlot[] {
  const slots: ParameterSlot[] = [];

  for (let peakIndex = 0; peakIndex < internalPeaks.length; peakIndex++) {
    const internalPeak = internalPeaks[peakIndex];
    for (let i = 0; i < internalPeak.parameters.length; i++) {
      const parameter = internalPeak.parameters[i];
      slots.push({
        actualIndex: internalPeak.fromIndex + i,
        peakIndex,
        peakId: internalPeak.id,
        parameter,
        init: internalPeak.propertiesValues.init[i],
        min: internalPeak.propertiesValues.min[i],
        max: internalPeak.propertiesValues.max[i],
        gradientDifference: internalPeak.propertiesValues.gradientDifference[i],
        optimize: getOptimizeFlag(peaks[peakIndex], parameter, options),
      });
    }
  }

  return slots;
}

/**
 * Builds optimization variables from concrete parameter slots.
 * @param slots - flattened per-peak parameter slots
 * @param linkedParameters - optional linked parameter groups
 * @param yScale - y normalization factor for y-offset conversion
 * @returns sorted optimization variables ready for the optimizer
 */
function buildOptimizationVariables(
  slots: ParameterSlot[],
  linkedParameters: LinkedParameter[] | undefined,
  yScale: number,
): OptimizationVariable[] {
  const groupedActualIndices = new Set<number>();
  const variables: SortableVariable[] = [];
  const slotLookup = new Map<string, ParameterSlot>();
  const idToIndices = new Map<string, number[]>();
  for (const slot of slots) {
    slotLookup.set(getSlotKey(slot.peakIndex, slot.parameter), slot);
    if (slot.peakId) {
      const indices = idToIndices.get(slot.peakId) ?? [];
      if (!indices.includes(slot.peakIndex)) {
        indices.push(slot.peakIndex);
      }
      idToIndices.set(slot.peakId, indices);
    }
  }

  for (const linkedParameter of linkedParameters ?? []) {
    variables.push(
      buildLinkedVariable(
        linkedParameter,
        slotLookup,
        groupedActualIndices,
        idToIndices,
        yScale,
      ),
    );
  }

  for (const slot of slots) {
    if (groupedActualIndices.has(slot.actualIndex)) {
      continue;
    }

    variables.push({
      sortKey: slot.actualIndex,
      parameter: slot.parameter,
      init: slot.init,
      min: slot.min,
      max: slot.max,
      gradientDifference: slot.gradientDifference,
      optimize: slot.optimize,
      members: [
        {
          actualIndex: slot.actualIndex,
          peakIndex: slot.peakIndex,
          parameter: slot.parameter,
          factor: 1,
          offset: 0,
        },
      ],
    });
  }

  variables.sort((a, b) => a.sortKey - b.sortKey);
  return variables.map(({ sortKey: _sortKey, ...variable }) => variable);
}

function buildLinkedVariable(
  linkedParameter: LinkedParameter,
  slotLookup: Map<string, ParameterSlot>,
  groupedActualIndices: Set<number>,
  idToIndices: Map<string, number[]>,
  yScale: number,
): SortableVariable {
  if (linkedParameter.peaks.length === 0) {
    throw new Error(
      `Linked parameter for ${linkedParameter.parameter} must contain at least one peak`,
    );
  }

  const resolvedMembers = linkedParameter.peaks.map((peak) => {
    const slot = resolveLinkedSlot(
      peak,
      linkedParameter.parameter,
      slotLookup,
      idToIndices,
    );
    if (groupedActualIndices.has(slot.actualIndex)) {
      throw new Error(
        `Peak ${String(peak.id)} parameter ${linkedParameter.parameter} is already linked`,
      );
    }
    return {
      slot,
      factor: getFactor(peak, linkedParameter.parameter),
      offset: getOffset(peak, linkedParameter.parameter, yScale),
    };
  });

  const memberActualIndices = new Set<number>();
  for (const member of resolvedMembers) {
    if (memberActualIndices.has(member.slot.actualIndex)) {
      throw new Error(
        `Linked parameter for ${linkedParameter.parameter} contains the same peak more than once`,
      );
    }
    memberActualIndices.add(member.slot.actualIndex);
  }

  const firstMember = resolvedMembers[0];
  let sharedMin = Number.POSITIVE_INFINITY;
  let sharedMax = Number.NEGATIVE_INFINITY;
  const optimize = firstMember.slot.optimize;

  for (const member of resolvedMembers) {
    if (member.slot.optimize !== optimize) {
      throw new Error(
        `Linked parameter ${linkedParameter.parameter} must use a consistent optimize flag across all members`,
      );
    }

    sharedMin = Math.min(sharedMin, member.slot.min);
    sharedMax = Math.max(sharedMax, member.slot.max);
  }

  if (sharedMin > sharedMax) {
    throw new Error(
      `Linked parameter ${linkedParameter.parameter} has incompatible bounds across its members`,
    );
  }

  for (const member of resolvedMembers) {
    groupedActualIndices.add(member.slot.actualIndex);
  }

  return {
    sortKey: Math.min(
      ...resolvedMembers.map((member) => member.slot.actualIndex),
    ),
    parameter: linkedParameter.parameter,
    init: xMean(resolvedMembers.map((member) => member.slot.init)),
    min: sharedMin,
    max: sharedMax,
    gradientDifference: Math.min(
      ...resolvedMembers.map((m) =>
        Math.abs(m.slot.gradientDifference / m.factor),
      ),
    ),
    optimize,
    members: resolvedMembers.map((member) => ({
      actualIndex: member.slot.actualIndex,
      peakIndex: member.slot.peakIndex,
      parameter: member.slot.parameter,
      factor: member.factor,
      offset: member.offset,
    })),
  };
}

function resolveLinkedSlot(
  peak: LinkedParameterPeak,
  parameter: string,
  slotLookup: Map<string, ParameterSlot>,
  idToIndices: Map<string, number[]>,
): ParameterSlot {
  const peakIndex =
    typeof peak.id === 'number'
      ? peak.id
      : resolvePeakIndexById(peak.id, idToIndices);

  if (!Number.isInteger(peakIndex) || peakIndex < 0) {
    throw new Error(`Invalid peak reference ${String(peak.id)}`);
  }

  const slot = slotLookup.get(getSlotKey(peakIndex, parameter));
  if (!slot) {
    throw new Error(
      `Unknown parameter ${parameter} for peak ${String(peak.id)}`,
    );
  }

  return slot;
}

function resolvePeakIndexById(
  peakId: string,
  idToIndices: Map<string, number[]>,
): number {
  const indices = idToIndices.get(peakId);
  if (!indices || indices.length === 0) {
    throw new Error(`Unknown peak id ${peakId}`);
  }
  if (new Set(indices).size > 1) {
    throw new Error(
      `Peak id ${peakId} is ambiguous because it is used by multiple peaks`,
    );
  }

  return indices[0];
}

function getFactor(peak: LinkedParameterPeak, parameter: string): number {
  const factor = peak.factor ?? 1;
  if (!Number.isFinite(factor) || factor === 0) {
    throw new Error(
      `Linked parameter ${parameter} must use a non-zero finite factor`,
    );
  }
  return factor;
}

function getOffset(
  peak: LinkedParameterPeak,
  parameter: string,
  yScale: number,
): number {
  const offset = peak.offset ?? 0;
  if (!Number.isFinite(offset)) {
    throw new Error(`Linked parameter ${parameter} must use a finite offset`);
  }
  if (parameter === 'y') {
    return offset / yScale;
  }
  return offset;
}

function getOptimizeFlag(
  peak: Peak | undefined,
  parameter: string,
  options: OptimizeOptions,
): boolean {
  assert(peak);
  let optimizeFlag = true;
  const perPeakParam = peak.parameters?.[parameter];
  const globalParam = options.parameters?.[parameter];

  if (perPeakParam?.optimize !== undefined) {
    if (typeof perPeakParam.optimize === 'function') {
      optimizeFlag = perPeakParam.optimize(peak);
    } else {
      const { optimize = true } = perPeakParam;
      optimizeFlag = optimize;
    }
  } else if (globalParam?.optimize !== undefined) {
    if (typeof globalParam.optimize === 'function') {
      optimizeFlag = globalParam.optimize(peak);
    } else {
      const { optimize = true } = globalParam;
      optimizeFlag = optimize;
    }
  }

  return optimizeFlag;
}

function getSlotKey(peakIndex: number, parameter: string): string {
  return `${peakIndex}:${parameter}`;
}
