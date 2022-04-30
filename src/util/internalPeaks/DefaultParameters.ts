import { Shape1DInstance, PseudoVoigt } from 'ml-peak-shape-generator';

import { Peak1D } from '../../index';

export const DefaultParameters = {
  x: {
    init: (peak: Peak1D) => peak.x,
    max: (peak: Peak1D, peakShape: Shape1DInstance) =>
      peak.x + peakShape.fwhm * 2,
    min: (peak: Peak1D, peakShape: Shape1DInstance) =>
      peak.x - peakShape.fwhm * 2,
    gradientDifference: (peak: Peak1D, peakShape: Shape1DInstance) =>
      peakShape.fwhm * 2e-3,
  },
  y: {
    init: (peak: Peak1D) => peak.y,
    max: () => 1.5,
    min: () => 0,
    gradientDifference: () => 1e-3,
  },
  fwhm: {
    init: (peak: Peak1D, peakShape: Shape1DInstance) => peakShape.fwhm,
    max: (peak: Peak1D, peakShape: Shape1DInstance) => peakShape.fwhm * 4,
    min: (peak: Peak1D, peakShape: Shape1DInstance) => peakShape.fwhm * 0.25,
    gradientDifference: (peak: Peak1D, peakShape: Shape1DInstance) =>
      peakShape.fwhm * 2e-3,
  },
  mu: {
    init: (peak: Peak1D, peakShape: PseudoVoigt) => peakShape.mu,
    min: () => 0,
    max: () => 1,
    gradientDifference: () => 0.01,
  },
};
