import { Coordinate } from './coordinate.model';

export interface Point {
  x: Coordinate['x'];
  y: Coordinate['y'];
  c: string;
  w: number;
}
