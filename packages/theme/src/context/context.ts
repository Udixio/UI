import { argbFromHex } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { Variant } from '../variant/variant';
import { PaletteManager } from '../palette/palette.manager';

export interface SchemeOptions {
  sourceColorHex: string;
  contrastLevel: number;
  isDark: boolean;
  variant: Variant;
}

export class Context {
  private _options?: SchemeOptions;
  private readonly palettesManager: PaletteManager;
  constructor(args: { palettesManager: PaletteManager }) {
    this.palettesManager = args.palettesManager;
  }

  protected update(args: Partial<SchemeOptions>) {
    const options = this._options;
    if (!options) {
      throw new Error('Options not found');
    }
    Object.entries(this.palettesManager.palettes).forEach(([key, value]) => {
      value.update(this);
    });

    //TODO: doit update tout les palettes
    this._options = {
      ...options,
      ...args,
    };
  }

  set(args: SchemeOptions) {
    this._options = args;
  }

  private getOptions(): SchemeOptions {
    const options = this._options;
    if (!options) {
      throw new Error('Options not found');
    }
    return options;
  }

  set darkMode(isDark: boolean) {
    this.update({ isDark });
  }
  get isDark() {
    return this.getOptions().isDark;
  }

  set contrastLevel(contrastLevel: number) {
    this.update({ contrastLevel });
  }
  get contrastLevel() {
    return this.getOptions().contrastLevel;
  }

  set sourceColor(sourceColorHex: string) {
    this.update({ sourceColorHex });
  }
  get sourceColorHct() {
    return Hct.fromInt(argbFromHex(this.getOptions().sourceColorHex));
  }

  set variant(variant: Variant) {
    this.update({ variant });
  }
  get variant() {
    return this.getOptions().variant;
  }

  temp<T>(args: Partial<SchemeOptions>, callback: () => T): T {
    const previousOptions = { ...this.getOptions() };
    this.update(args);
    const result = callback();
    this.set(previousOptions);
    return result;
  }
}
