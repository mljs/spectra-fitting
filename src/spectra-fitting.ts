import { Shape1D } from 'ml-peak-shape-generator';

/*
export interface Peak1DExtended {
  x: {
    val : number;
    init?: number;
    min?: number;
    max?: number;
    gradientDifference?: number;
  };
  y: {
    val : number;
    init?: number;
    min?: number;
    max?: number;
    gradientDifference?: number;
  };
  width?: {
    val : number;
    init?: number;
    min?: number;
    max?: number;
    gradientDifference?: number;
  };
  fwhm: {
    val : number;
    init?: number;
    min?: number;
    max?: number;
    gradientDifference?: number;
  }
  shape?: Shape1D | { kind: string };
}
*/

export interface Peak1D {
  x: number;
  y: number;
  width?: number;
  fwhm: number;
  shape?: Shape1D;
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
