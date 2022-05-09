export function validateTreeName(name: string): boolean {
  if (name.length > 36) return false;
  if (name.length === 0) return false;
  if (!/^[a-zA-Z0-9\-' ]+$/.test(name)) return false;
  return true;
}
