import { atom } from 'nanostores';
import config from '../../theme.config';
import { API, type ConfigInterface, type PaletteCallback } from '@udixio/theme';

export const themeConfigStore = atom<ConfigInterface>(config);

export const themeServiceStore = atom<API | null>(null);

const secondaryHuePaletteOverrides = new WeakSet<PaletteCallback>();

export const markSecondaryHuePaletteOverride = (callback: PaletteCallback) => {
  secondaryHuePaletteOverrides.add(callback);
  return callback;
};

export const isSecondaryHuePaletteOverride = (
  value: unknown,
): value is PaletteCallback =>
  typeof value === 'function' &&
  secondaryHuePaletteOverrides.has(value as PaletteCallback);

/**
 * L'API est mise à jour en place par ThemeProvider. Cette révision permet aux
 * vues qui lisent ses couleurs dynamiques de se rafraîchir sans remplacer
 * l'instance partagée.
 */
export const themeServiceVersionStore = atom(0);
