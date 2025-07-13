import { ColorManagerService } from './color-manager.service';
import { ColorInterface } from '../color.interface';
import { ColorEntity, ColorOptions } from '../entities';

type AddColors = {
  colors?: Record<string, Partial<ColorOptions>>;
  fromPalettes?: string[] | string;
};

export type AddColorsOptions =
  | AddColors
  | ((colorService: ColorService) => AddColors);

export class ColorService implements ColorInterface {
  private readonly colorManagerService: ColorManagerService;
  constructor({
    colorManagerService,
  }: {
    colorManagerService: ColorManagerService;
  }) {
    this.colorManagerService = colorManagerService;
  }

  getColors() {
    return this.colorManagerService.getAll();
  }

  // getColors() {
  //   const colors: Record<string, string> = {};
  //
  //   for (const [key, value] of this.colorManagerService.getAll()) {
  //     colors[key] = hexFromArgb(value.getArgb(this.schemeService.get()));
  //   }
  //
  //   return colors;
  // }

  addColor(key: string, color: Partial<ColorOptions>): ColorEntity {
    return this.colorManagerService.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions | AddColorsOptions[]) {
    const colorsEntity: ColorEntity[] = [];
    if (!Array.isArray(args)) args = [args];
    args.forEach((args) => {
      if (typeof args === 'function') {
        args = args(this);
      }
      if (args.fromPalettes) {
        if (!Array.isArray(args.fromPalettes))
          args.fromPalettes = [args.fromPalettes];
        args.fromPalettes.map((paletteKey) => {
          this.colorManagerService.addFromPalette(paletteKey);
        });
      }
      if (args.colors) {
        Object.keys(args.colors).map((key) =>
          this.addColor(key, args.colors![key])
        );
      }
    });
  }

  getColor(key: string): ColorEntity {
    return this.colorManagerService.get(key);
  }

  removeColor(key: string): boolean {
    return this.colorManagerService.remove(key);
  }

  updateColor(key: string, newColor: Partial<ColorOptions>): ColorEntity {
    return this.colorManagerService.createOrUpdate(key, newColor);
  }
}
