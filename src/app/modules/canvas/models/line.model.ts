import { Coordinate } from './coordinate.model';

export interface Line {
  x1: Coordinate['x'];
  y1: Coordinate['y'];
  x2: Coordinate['x'];
  y2: Coordinate['y'];
  c: string;
  w: number;
}
