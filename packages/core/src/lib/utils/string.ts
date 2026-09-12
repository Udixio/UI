// Element keys are a small, fixed set reused on every style computation, so
// memoize the conversion rather than re-running the regex chain each time.
const kebabCache = new Map<string, string>();

export function convertToKebabCase(text: string) {
  const cached = kebabCache.get(text);
  if (cached !== undefined) return cached;

  const result = text
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase transitions (insert a dash between the letters)
    .toLowerCase() // Convertir tout en minuscules
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Strip accents (diacritics)
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with dashes
    .replace(/^-+|-+$/g, ''); // Strip leading/trailing dashes

  kebabCache.set(text, result);
  return result;
}
