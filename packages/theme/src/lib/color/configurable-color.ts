import { hexFromArgb, TonalPalette } from '@material/material-color-utilities';
import { Scheme, SchemeManager } from '../theme';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import { ColorManager } from './color.manager';

export interface ColorOptions {
  palette: (scheme: Scheme) => TonalPalette;
  tone: (scheme: Scheme) => number;
  isBackground?: boolean;
  background?: (scheme: Scheme) => DynamicColor;
  secondBackground?: (scheme: Scheme) => DynamicColor;
  contrastCurve?: (scheme: Scheme) => ContrastCurve;
  toneDeltaPair?: (scheme: Scheme) => {
    roleA: DynamicColor;
    readonly roleB: DynamicColor;
    readonly delta: number;
    readonly polarity: 'darker' | 'lighter' | 'nearer' | 'farther';
    readonly stayTogether: boolean;
  };
  chromaMultiplier?: (scheme: Scheme) => number;
}

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
    private option: ColorOptions & { name: string },
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
    if (!this.dynamicColor) {
      this.dynamicColor = DynamicColor.fromPalette({
        ...this.option,
        name: this.getName(),
      });
    }
    return this.dynamicColor;
  }
}
