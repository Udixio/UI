import { ColorOptions, ConfigurableColor } from './configurable-color';
import { ColorManager } from './color.manager';
import { DynamicColorKey } from './color.utils';

export type AddColorsOptions = Record<string, Omit<ColorOptions, 'name'>>;

export class ColorApi {
  private readonly colorManager: ColorManager;

  constructor({ colorManager }: { colorManager: ColorManager }) {
    this.colorManager = colorManager;
  }

  getColors() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: Omit<ColorOptions, 'name'>): ConfigurableColor {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions) {
    Object.entries(args).forEach(([name, colorOption]) => {
      if (typeof args === 'function') {
        args = args(this);
      }

      if (args.colors) {
        this.addColor(name, colorOption);
      }
    });
  }

  getColor(key: DynamicColorKey | string): ConfigurableColor {
    return this.colorManager.get(key);
  }

  removeColor(key: string): boolean {
    return this.colorManager.remove(key);
  }

  updateColor(
    key: string,
    newColor:
      | (Partial<ColorOptions> & { alias?: never })
      | { alias: string; palette?: never; tone?: never },
  ): ConfigurableColor {
    return this.colorManager.createOrUpdate(key, newColor);
  }
}
