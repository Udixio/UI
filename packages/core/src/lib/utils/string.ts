// Element keys are a small, fixed set reused on every style computation, so
// memoize the conversion rather than re-running the regex chain each time.
const kebabCache = new Map<string, string>();

export function convertToKebabCase(text: string) {
  const cached = kebabCache.get(text);
  if (cached !== undefined) return cached;

  const result = text
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Gérer les transitions camelCase (ajouter un tiret entre les lettres)
    .toLowerCase() // Convertir tout en minuscules
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents (diacritics)
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non-alphanumériques par des tirets
    .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début/fin

  kebabCache.set(text, result);
  return result;
}
