import type { InternalPeak } from './internalPeaks/getInternalPeaks.ts';
import type { OptimizeOptions, Peak } from '../index.ts';

export interface GlobalParameterVectors {
  freeIndices: number[];
  globalMin: Float64Array;
  globalMax: Float64Array;
  globalInit: Float64Array;
  globalGrad: Float64Array;
}

export function getGlobalParameterVectors(
  internalPeaks: InternalPeak[],
  peaks: Peak[],
  options: OptimizeOptions,
): GlobalParameterVectors {
  const nbParams = internalPeaks[internalPeaks.length - 1].toIndex + 1;
  const globalMin = new Float64Array(nbParams);
  const globalMax = new Float64Array(nbParams);
  const globalInit = new Float64Array(nbParams);
  const globalGrad = new Float64Array(nbParams);
  const isOptimizable = new Array<boolean>(nbParams);

  let index = 0;
  for (let pIndex = 0; pIndex < internalPeaks.length; pIndex++) {
    const peak = internalPeaks[pIndex];
    for (let i = 0; i < peak.parameters.length; i++) {
      const paramName = peak.parameters[i];
      globalMin[index] = peak.propertiesValues.min[i];
      globalMax[index] = peak.propertiesValues.max[i];
      globalInit[index] = peak.propertiesValues.init[i];
      globalGrad[index] = peak.propertiesValues.gradientDifference[i];

      let optimizeFlag = true;
      const perPeakParam = peaks[pIndex]?.parameters?.[paramName];
      const globalParam = options.parameters?.[paramName];

      if (perPeakParam?.optimize !== undefined) {
        if (typeof perPeakParam.optimize === 'function') {
          optimizeFlag = perPeakParam.optimize(peaks[pIndex]);
        } else {
          const { optimize = true } = perPeakParam;
          optimizeFlag = optimize;
        }
      } else if (globalParam?.optimize !== undefined) {
        if (typeof globalParam.optimize === 'function') {
          optimizeFlag = globalParam.optimize(peaks[pIndex]);
        } else {
          const { optimize = true } = globalParam;
          optimizeFlag = optimize;
        }
      }

      isOptimizable[index] = optimizeFlag;
      index++;
    }
  }

  const freeIndices: number[] = [];
  for (let i = 0; i < nbParams; i++) {
    if (isOptimizable[i]) freeIndices.push(i);
  }

  return { freeIndices, globalMin, globalMax, globalInit, globalGrad };
}
