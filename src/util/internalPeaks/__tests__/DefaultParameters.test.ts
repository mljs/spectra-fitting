import { getShape1D } from 'ml-peak-shape-generator';
import { describe, expect, it } from 'vitest';

import { DefaultParameters } from '../DefaultParameters.ts';

describe('DefaultParameters', () => {
  const peak = { x: 1, y: 2 };

  it('computes y bounds for positive and negative peaks', () => {
    const gaussianShape = getShape1D({ kind: 'gaussian', fwhm: 0.5 });

    expect(DefaultParameters.y.min({ x: 0, y: 0 }, gaussianShape)).toBe(0);
    expect(DefaultParameters.y.max({ x: 0, y: 0 }, gaussianShape)).toBe(1.1);
    expect(DefaultParameters.y.min({ x: 0, y: -1 }, gaussianShape)).toBe(-1.1);
    expect(DefaultParameters.y.max({ x: 0, y: -1 }, gaussianShape)).toBe(0);
  });

  it('computes fwhm, fwhmG, and fwhmL values correctly', () => {
    const gaussianShape = getShape1D({ kind: 'gaussian', fwhm: 0.5 });

    expect(DefaultParameters.fwhm.init(peak, gaussianShape)).toBe(0.5);
    expect(DefaultParameters.fwhm.min(peak, gaussianShape)).toBe(0.125);
    expect(DefaultParameters.fwhm.max(peak, gaussianShape)).toBe(2);
    expect(DefaultParameters.fwhm.gradientDifference(peak, gaussianShape)).toBe(
      0.001,
    );

    expect(DefaultParameters.fwhmG.init(peak, gaussianShape)).toBe(0.3);
    expect(DefaultParameters.fwhmG.min(peak, gaussianShape)).toBe(0.075);
    expect(DefaultParameters.fwhmG.max(peak, gaussianShape)).toBe(1.2);
    expect(
      DefaultParameters.fwhmG.gradientDifference(peak, gaussianShape),
    ).toBe(0.0006);

    expect(DefaultParameters.fwhmL.init(peak, gaussianShape)).toBe(0.2);
    expect(DefaultParameters.fwhmL.min(peak, gaussianShape)).toBe(0.05);
    expect(DefaultParameters.fwhmL.max(peak, gaussianShape)).toBe(0.8);
    expect(
      DefaultParameters.fwhmL.gradientDifference(peak, gaussianShape),
    ).toBe(0.0004);
  });

  it('computes mu and gamma default values', () => {
    const pseudoVoigtShape = getShape1D({
      kind: 'pseudoVoigt',
      fwhm: 0.5,
      mu: 0.4,
    });

    expect(DefaultParameters.mu.init(peak, pseudoVoigtShape)).toBe(0.4);
    expect(DefaultParameters.mu.min(peak, pseudoVoigtShape)).toBe(0);
    expect(DefaultParameters.mu.max(peak, pseudoVoigtShape)).toBe(1);
    expect(
      DefaultParameters.mu.gradientDifference(peak, pseudoVoigtShape),
    ).toBe(0.01);

    const generalizedLorentzianShape = getShape1D({
      kind: 'generalizedLorentzian',
      fwhm: 0.5,
      gamma: 0.7,
    });

    expect(DefaultParameters.gamma.init(peak, generalizedLorentzianShape)).toBe(
      0.7,
    );
    expect(DefaultParameters.gamma.min(peak, generalizedLorentzianShape)).toBe(
      -1,
    );
    expect(DefaultParameters.gamma.max(peak, generalizedLorentzianShape)).toBe(
      2,
    );
    expect(
      DefaultParameters.gamma.gradientDifference(
        peak,
        generalizedLorentzianShape,
      ),
    ).toBe(0.01);
  });
});
