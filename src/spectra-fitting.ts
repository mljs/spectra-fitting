import { Shape1D } from 'ml-peak-shape-generator';

export interface Peak1D {
  x: number;
  y: number;
  width?: number;
  fwhm: number;
  shape?: Shape1D | { kind: string };
}

export interface OptimizationOptions {
  kind?: string | number;
  parameters?: any;
  options?: {
    timeout?: number;
    damping?: number;
    maxIterations?: number;
    errorTolerance?: number;
  };
}

export interface OptimizeOptions {
  shape?: Shape1D | { kind: string };
  optimization?: OptimizationOptions;
}
