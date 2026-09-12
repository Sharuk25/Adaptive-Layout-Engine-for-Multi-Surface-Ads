import { Rect } from './types';
import { intersects } from '../utils/geometry';

export function checkCollisions(elements: Rect[]): boolean {
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (intersects(elements[i], elements[j])) {
        return true; // Collision detected
      }
    }
  }
  return false;
}
