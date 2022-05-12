const cache = new Map();

export function getWateringInterval(size: number): number {
  const cached = cache.has(size);
  const result = cached ? cache.get(size) : Math.floor(Math.pow(size * 0.05 + 5, 1.1));

  if (!cached) cache.set(size, result);

  return result;
}

export function getTreeAge(size: number): number {
  let age = 0;

  for (let i = 0; i < size; i++) {
    age += getWateringInterval(i);
  }

  return age;
}
