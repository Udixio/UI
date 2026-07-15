import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface SvgImport {
  src: string;
  width: number;
  height: number;
  format: string;
}

export type Icon = IconDefinition | SvgImport | string;
