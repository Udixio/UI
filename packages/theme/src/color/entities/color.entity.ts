import { hexFromArgb, TonalPalette } from '@material/material-color-utilities';
import { SchemeEntity } from '../../theme/entities/scheme.entity';
import { DynamicColor } from '../../material-color-utilities/dynamic_color';
import { ContrastCurve } from '../../material-color-utilities';
import mergeDeep from 'merge-deep';
import { SchemeService } from '../../theme/services/scheme.service';
import { ColorManagerService } from '../color-manager.service';

export interface ColorOptions {
  palette: (scheme: SchemeEntity) => TonalPalette;
  tone: (scheme: SchemeEntity) => number;
  isBackground?: boolean;
  background?: (scheme: SchemeEntity) => DynamicColor;
  secondBackground?: (scheme: SchemeEntity) => DynamicColor;
  contrastCurve?: ContrastCurve;
  toneDeltaPair?: (scheme: SchemeEntity) => {
    roleA: DynamicColor;
    readonly roleB: DynamicColor;
    readonly delta: number;
    readonly polarity: 'darker' | 'lighter' | 'nearer' | 'farther';
    readonly stayTogether: boolean;
  };
}

export class ColorEntity {
  private dynamicColor: DynamicColor | null = null;

  constructor(
    private option: ColorOptions & { name: string },
    private schemeService: SchemeService,
    private colorService: ColorManagerService
  ) {}

  update(args: Partial<ColorOptions & { name: string }>) {
    this.dynamicColor = null;
    this.option = mergeDeep(this.option, args);
  }

  getHex(): string {
    return hexFromArgb(this.getArgb());
  }

  getArgb() {
    return this.getDynamicColor().getArgb(this.schemeService.get());
  }

  getName(): string {
    return this.option.name.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  getDynamicColor(): DynamicColor {
    if (!this.dynamicColor) {
      this.dynamicColor = DynamicColor.fromPalette({
        ...this.option,
        name: this.getName(),
      });
    }
    return this.dynamicColor;
  }
}
