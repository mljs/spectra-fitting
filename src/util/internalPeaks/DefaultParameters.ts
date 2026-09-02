import type {
  GeneralizedLorentzian,
  PseudoVoigt,
  Shape1DInstance,
  Shape1DParameter,
  SplitGaussian,
} from 'ml-peak-shape-generator';

import type { Peak } from '../../index.ts';

/** A parameter that can be optimized: the peak position, its height, or any parameter of its shape. */
export type Parameter = 'x' | 'y' | Shape1DParameter;

/** The bound or step of a parameter that the optimizer needs to know. */
export type Property = 'init' | 'min' | 'max' | 'gradientDifference';

/**
 * Defaults for one parameter. Declared with method syntax so that a shape-specific
 * `peakShape` (e.g. `PseudoVoigt` for `mu`) is accepted for the generic `Shape1DInstance`.
 */
interface ParameterDefaults {
  init(peak: Peak, peakShape: Shape1DInstance): number;
  min(peak: Peak, peakShape: Shape1DInstance): number;
  max(peak: Peak, peakShape: Shape1DInstance): number;
  gradientDifference(peak: Peak, peakShape: Shape1DInstance): number;
}

/** Shapes whose parameters are absent here are not supported by the optimizer. */
export const DefaultParameters: Partial<Record<Parameter, ParameterDefaults>> =
  {
    x: {
      init: (peak: Peak) => peak.x,
      min: (peak: Peak, peakShape: Shape1DInstance) =>
        peak.x - peakShape.fwhm * 2,
      max: (peak: Peak, peakShape: Shape1DInstance) =>
        peak.x + peakShape.fwhm * 2,
      gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 2e-3,
    },
    y: {
      init: (peak: Peak) => peak.y,
      min: (peak: Peak) => (peak.y < 0 ? -1.1 : 0),
      max: (peak: Peak) => (peak.y < 0 ? 0 : 1.1),
      gradientDifference: () => 1e-3,
    },
    fwhm: {
      init: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm,
      min: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.25,
      max: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 4,
      gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 2e-3,
    },
    fwhmG: {
      init: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.6,
      min: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 0.6 * 0.25,
      max: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.6 * 4,
      gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 0.6 * 2e-3,
    },
    fwhmL: {
      init: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.4,
      min: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 0.4 * 0.25,
      max: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.4 * 4,
      gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
        peakShape.fwhm * 0.4 * 2e-3,
    },
    fwhmLow: {
      init: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmLow,
      min: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmLow * 0.25,
      max: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmLow * 4,
      gradientDifference: (peak: Peak, peakShape: SplitGaussian) =>
        peakShape.fwhmLow * 2e-3,
    },
    fwhmHigh: {
      init: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmHigh,
      min: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmHigh * 0.25,
      max: (peak: Peak, peakShape: SplitGaussian) => peakShape.fwhmHigh * 4,
      gradientDifference: (peak: Peak, peakShape: SplitGaussian) =>
        peakShape.fwhmHigh * 2e-3,
    },
    mu: {
      init: (peak: Peak, peakShape: PseudoVoigt) => peakShape.mu,
      min: () => 0,
      max: () => 1,
      gradientDifference: () => 0.01,
    },
    gamma: {
      init: (peak: Peak, peakShape: GeneralizedLorentzian) =>
        peakShape.gamma || 0.5,
      min: () => -1,
      max: () => 2,
      gradientDifference: () => 0.01,
    },
  };
