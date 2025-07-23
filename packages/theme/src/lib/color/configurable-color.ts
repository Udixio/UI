import { hexFromArgb } from '@material/material-color-utilities';
import { SchemeManager } from '../theme';
import { DynamicColor, FromPaletteOptions } from '../material-color-utilities';
import { ColorManager } from './color.manager';

export type ColorOptions = (
  | (FromPaletteOptions & { alias?: string })
  | (Partial<FromPaletteOptions> & {
      alias: string;
      palette?: never;
    })
) & { name: string };

function argbToRgb(argb: number): { r: number; g: number; b: number } {
  return {
    r: (argb >> 16) & 0xff,
    g: (argb >> 8) & 0xff,
    b: argb & 0xff,
  };
}

export class ConfigurableColor {
  private dynamicColor: DynamicColor | null = null;

  constructor(
    private option: ColorOptions,
    private schemeService: SchemeManager,
    private colorService: ColorManager,
  ) {}

  update(args: Partial<ColorOptions & { name: string }>) {
    this.dynamicColor = null;
    this.option = { ...this.option, ...args };
  }

  getHex(): string {
    return hexFromArgb(this.getArgb());
  }

  getArgb() {
    return this.getMaterialColor().getArgb(this.schemeService.get());
  }

  getRgb() {
    return argbToRgb(this.getArgb());
  }

  getName(): string {
    return this.option.name.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  getMaterialColor(): DynamicColor {
    if ('alias' in this.option) {
      if (!this.option.alias) {
        throw new Error('Alias option must be defined');
      }
      return this.colorService.get(this.option.alias).getMaterialColor();
    }
    if (!this.dynamicColor) {
      this.dynamicColor = DynamicColor.fromPalette({
        ...this.option,
        name: this.getName(),
      });
    }
    return this.dynamicColor;
  }
}
