export function getWateringInterval(size: number): number {
  return Math.floor(Math.pow(size * 0.05 + 5, 1.1));
}
