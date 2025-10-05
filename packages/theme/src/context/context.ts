import { argbFromHex } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { Variant } from '../variant/variant';

export interface ContextOptions {
  sourceColorHex: string;
  contrastLevel: number;
  isDark: boolean;
  variant: Variant;
}

export class Context {
  private _options?: ContextOptions;
  private readonly updateCallbacks: Array<() => void> = [];

  protected update(args: Partial<ContextOptions>) {
    const options = this._options;
    if (!options) {
      throw new Error('Options not found');
    }

    this._options = {
      ...options,
      ...args,
    };

    this.updateCallbacks.forEach((callback) => callback());
  }

  set(args: ContextOptions) {
    this._options = args;
  }

  private getOptions(): ContextOptions {
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

  temp<T>(args: Partial<ContextOptions>, callback: () => T): T {
    const previousOptions = { ...this.getOptions() };
    this.update(args);
    const result = callback();
    this.set(previousOptions);
    return result;
  }

  onUpdate(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }
}
