import { SchemeManager } from './scheme.manager';
import { Variant } from './variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';

export class VariantManager {
  public customPalettes: Record<string, string> = {};
  private variantEntity?: Variant;

  private readonly schemeService: SchemeManager;

  constructor({ schemeService }: { schemeService: SchemeManager }) {
    this.schemeService = schemeService;
  }

  addCustomPalette(key: string, colorHex: string) {
    this.customPalettes[key] = colorHex;
    this.update();
  }

  set(variantEntity: Variant) {
    this.variantEntity = variantEntity;
    if (!variantEntity.palettes['error']) {
      variantEntity.palettes['error'] = () =>
        TonalPalette.fromHueAndChroma(25.0, 84.0);
    }
    this.update();
  }

  private update() {
    if (!this.variantEntity) return;
    const palettes: Record<
      string,
      {
        sourceColorkey?: string;
        tonalPalette: (sourceColorHct: Hct) => TonalPalette;
      }
    > = {};
    Object.keys(this.variantEntity.palettes).forEach((key) => {
      palettes[key] = { tonalPalette: this.variantEntity!.palettes[key] };
    });
    if (this.variantEntity.customPalettes) {
      Object.keys(this.customPalettes).forEach((key) => {
        palettes[key] = {
          sourceColorkey: key,
          tonalPalette: this.variantEntity!.customPalettes!,
        };
      });
    }
    this.schemeService.createOrUpdate({
      sourcesColorHex: this.customPalettes,
      palettes: palettes,
    });
  }
}
