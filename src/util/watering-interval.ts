const cache = new Map();

cache.set(1, 0);
cache.set(2, 0);

export function getWateringInterval(size: number): number {
  const cached = cache.has(size);
  const result = cached ? cache.get(size) : Math.floor(Math.pow(size * 0.07 + 5, 1.1));

  if (!cached) cache.set(size, result);

  return result;
}

export function getTreeAge(size: number): number {
  let age = 0;

  for (let i = 1; i <= size; i++) {
    age += getWateringInterval(i);
  }

  return age;
}
