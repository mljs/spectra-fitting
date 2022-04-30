import { Shape1DInstance, PseudoVoigt } from 'ml-peak-shape-generator';

import { Peak } from '../../index';

export const DefaultParameters = {
  x: {
    init: (peak: Peak) => peak.x,
    max: (peak: Peak, peakShape: Shape1DInstance) =>
      peak.x + peakShape.fwhm * 2,
    min: (peak: Peak, peakShape: Shape1DInstance) =>
      peak.x - peakShape.fwhm * 2,
    gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
      peakShape.fwhm * 2e-3,
  },
  y: {
    init: (peak: Peak) => peak.y,
    max: () => 1.5,
    min: () => 0,
    gradientDifference: () => 1e-3,
  },
  fwhm: {
    init: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm,
    max: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 4,
    min: (peak: Peak, peakShape: Shape1DInstance) => peakShape.fwhm * 0.25,
    gradientDifference: (peak: Peak, peakShape: Shape1DInstance) =>
      peakShape.fwhm * 2e-3,
  },
  mu: {
    init: (peak: Peak, peakShape: PseudoVoigt) => peakShape.mu,
    min: () => 0,
    max: () => 1,
    gradientDifference: () => 0.01,
  },
};
