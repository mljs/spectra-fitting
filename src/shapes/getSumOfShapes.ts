import {
  Gaussian,
  PseudoVoigt,
  Lorentzian,
  Shape1D,
} from 'ml-peak-shape-generator';

/**
 * This function returns the sumOfShapes function
 * This function gives sumOfShapes access to the peak list and the associated data
 * @param parameters - parameters
 */

export function getSumOfShapes(
  peaks: {
    x: number;
    y: number;
    width?: number;
    fwhm: number;
    shape: Shape1D | { kind: string };
    parameters?: string[];
    fromIndex?: number;
    toIndex?: number;
  }[],
) {
  return function sumOfShapes(parameters: number[]) {
    const pseudoVoigt = new PseudoVoigt();
    const lorentzian = new Lorentzian();
    const gaussian = new Gaussian();

    return (x: number) => {
      let y = 0;
      let offset = 0;
      peaks.forEach((peak) => {
        let kind = peak.shape.kind;
        if (kind === 'pseudoVoigt') {
          pseudoVoigt.fwhm = parameters[offset + 2];
          pseudoVoigt.mu = parameters[offset + 3];
          y += parameters[offset + 1] * pseudoVoigt.fct(x - parameters[offset]);
          offset += 4;
        } else if (kind === 'lorentzian') {
          lorentzian.fwhm = parameters[offset + 2];
          y += parameters[offset + 1] * lorentzian.fct(x - parameters[offset]);
          offset += 4;
        } else if (kind === 'gaussian') {
          gaussian.fwhm = parameters[offset + 2];
          y += parameters[offset + 1] * gaussian.fct(x - parameters[offset]);
          offset += 4;
        }
      });

      return y;
    };
  };
}
