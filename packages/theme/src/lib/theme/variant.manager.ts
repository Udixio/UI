import {
  CustomPaletteFunction,
  PaletteFunction,
  SchemeManager,
} from './scheme.manager';
import { Variant } from './variant';

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
    this.update();
  }

  private update() {
    if (!this.variantEntity) return;
    const palettes: Record<
      string,
      | {
          sourceColorkey: string;
          tonalPalette: CustomPaletteFunction;
        }
      | {
          tonalPalette: PaletteFunction;
        }
    > = {};
    Object.keys(this.variantEntity.palettes).forEach((key) => {
      palettes[key] = { tonalPalette: this.variantEntity!.palettes[key] };
    });

    const customPalettes = this.variantEntity.customPalettes;
    if (customPalettes) {
      Object.keys(this.customPalettes).forEach((key) => {
        palettes[key] = {
          sourceColorkey: key,
          tonalPalette: customPalettes,
        };
      });
    }
    this.schemeService.createOrUpdate({
      sourcesColorHex: this.customPalettes,
      palettes: palettes,
    });
  }
}
