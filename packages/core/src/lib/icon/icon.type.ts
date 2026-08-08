import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface SvgImport {
  src: string;
  width: number;
  height: number;
  format: string;
}

export type Icon = IconDefinition | SvgImport | string;

export type IconKind = 'raw' | 'image' | 'fontawesome';

/** Classifies an `Icon` value; shared so style and both framework adapters agree on rendering mode. */
export function resolveIconKind(icon: Icon): IconKind {
  if (typeof icon === 'string') return 'raw';
  return 'src' in icon ? 'image' : 'fontawesome';
}
