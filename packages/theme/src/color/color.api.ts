import { Color, ColorOptions } from './color';
import { ColorManager } from './color.manager';
import { DynamicColorKey } from './color.utils';
import { Scheme, SchemeManager } from '../theme';

export type AddColorsOptions =
  | ((args: {
      scheme: Scheme;
      colors: ColorApi;
    }) => Record<string, ColorOptions>)
  | Record<string, ColorOptions>;

export class ColorApi {
  private readonly colorManager: ColorManager;
  private readonly schemeManager: SchemeManager;

  constructor({
    colorManager,
    schemeManager,
  }: {
    colorManager: ColorManager;
    schemeManager: SchemeManager;
  }) {
    this.colorManager = colorManager;
    this.schemeManager = schemeManager;
  }

  getColors() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: ColorOptions): Color {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions) {
    if (typeof args === 'function') {
      args = args({ scheme: this.schemeManager.get(), colors: this });
    }
    if (args) {
      Object.entries(args).forEach(([name, colorOption]) => {
        this.addColor(name, colorOption);
      });
    }
  }

  getColor(key: DynamicColorKey | string): Color {
    return this.colorManager.get(key);
  }

  removeColor(key: string): boolean {
    return this.colorManager.remove(key);
  }

  updateColor(key: string, newColor: ColorOptions): Color {
    return this.colorManager.createOrUpdate(key, newColor);
  }
}
