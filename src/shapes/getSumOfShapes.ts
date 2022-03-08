import { PseudoVoigt, Shape1D, getShape1D } from 'ml-peak-shape-generator';

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
    return (x: number) => {
      let y = 0;
      let offset = 0;
      peaks.forEach((peak) => {
        let kind = peak.shape.kind;
        let shape = getShape1D({ kind: kind } as Shape1D);
        shape.fwhm = parameters[offset + 2];
        if (shape instanceof PseudoVoigt) {
          shape.mu = parameters[offset + 3];
        }
        y += parameters[offset + 1] * shape.fct(x - parameters[offset]);
        offset += 4;
      });
      return y;
    };
  };
}
