import { DataXY } from 'cheminfo-types';
import { Shape1D } from 'ml-peak-shape-generator';

interface Peak1D {
  x: number;
  y: number;
  width: number;
  fwhm?: number;
  shape?: Shape1D;
}

export interface OptimizationOptions {
  kind?: string;
  parameters?: any;
  options?: {
    timeout?: number;
    damping?: number;
    maxIterations?: number;
    errorTolerance?: number;
  };
}

export interface OptimizeOptions {
  shape?: Shape1D;
  optimization?: OptimizationOptions;
}
export function optimize(
  data: DataXY,
  peakList: Peak1D[],
  options: OptimizeOptions,
): {
  error: number;
  peaks: Peak1D[];
  iterations: number;
};
