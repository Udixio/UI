import { ColorOptions, ConfigurableColor } from './configurable-color';
import { ColorManager } from './color.manager';

export type AddColors = {
  colors?: Record<string, Partial<ColorOptions>>;
  fromPalettes?: string[] | string;
};

export type AddColorsOptions =
  | AddColors
  | ((colorService: ColorApi) => AddColors);

export class ColorApi {
  private readonly colorManager: ColorManager;

  constructor({ colorManager }: { colorManager: ColorManager }) {
    this.colorManager = colorManager;
  }

  getColors() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: Partial<ColorOptions>): ConfigurableColor {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions | AddColorsOptions[]) {
    if (!Array.isArray(args)) args = [args];
    args.forEach((args) => {
      if (typeof args === 'function') {
        args = args(this);
      }
      if (args.fromPalettes) {
        if (!Array.isArray(args.fromPalettes))
          args.fromPalettes = [args.fromPalettes];
        args.fromPalettes.map((paletteKey) => {
          this.colorManager.addFromPalette(paletteKey);
        });
      }
      if (args.colors) {
        Object.keys(args.colors).map((key) =>
          this.addColor(key, args.colors![key]),
        );
      }
    });
  }

  getColor(key: string): ConfigurableColor {
    return this.colorManager.get(key);
  }

  removeColor(key: string): boolean {
    return this.colorManager.remove(key);
  }

  updateColor(key: string, newColor: Partial<ColorOptions>): ConfigurableColor {
    return this.colorManager.createOrUpdate(key, newColor);
  }
}
