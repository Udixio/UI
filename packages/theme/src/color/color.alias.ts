import { Color } from './color.base';
import type { ColorFromPalette } from './color.from-palette';
import type { ColorManager } from './color.manager';

/** Une couleur qui reflète en permanence celle d'une autre clé du registre. */
export class ColorAlias extends Color {
  constructor(
    public readonly name: string,
    public as: string,
    public colorManager: ColorManager,
  ) {
    super();
  }

  get argb(): number {
    return this.colorManager.get(this.as).argb;
  }

  color() {
    return this.colorManager.get(this.as) as ColorFromPalette;
  }
}
