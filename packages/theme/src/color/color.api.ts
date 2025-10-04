import { Color, ColorOptions } from './color';
import { ColorManager } from './color.manager';
import { DynamicColorKey } from './color.utils';
import { API } from '../API';

export type AddColorsOptions =
  | ((args: API) => Record<string, ColorOptions>)
  | Record<string, ColorOptions>;

export class ColorApi {
  private readonly colorManager: ColorManager;
  public api?: API;

  constructor({ colorManager }: { colorManager: ColorManager }) {
    this.colorManager = colorManager;
  }

  getColors() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: ColorOptions): Color {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions) {
    if (!this.api)
      throw new Error(
        'The API is not initialized. Please call bootstrap() before calling addColors().',
      );

    if (typeof args === 'function') {
      args = args(this.api);
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
