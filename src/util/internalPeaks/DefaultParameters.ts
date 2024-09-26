import {
  Shape1DInstance,
  PseudoVoigt,
  GeneralizedLorentzian,
} from 'ml-peak-shape-generator';

import { Peak } from '../../index';

export const DefaultParameters = {
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
