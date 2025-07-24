import { DynamicColor } from '@material/material-color-utilities';
import { SchemeManager, SchemeServiceOptions } from './scheme.manager';
import { VariantManager } from './variant.manager';
import { Variant } from './variant';

type ThemeOptions = Omit<
  SchemeServiceOptions,
  'palettes' | 'sourcesColorHex'
> & { sourceColorHex: string };

const colorPaletteKeyColor = DynamicColor.fromPalette({
  name: 'primary_palette_key_color',
  palette: (s) => s.primaryPalette,
  tone: (s) => s.primaryPalette.keyColor.tone,
});

export class ThemeApi {
  private readonly schemeManager: SchemeManager;
  private readonly variantManager: VariantManager;

  constructor({
    schemeManager,
    variantManager,
  }: {
    schemeManager: SchemeManager;
    variantManager: VariantManager;
  }) {
    this.schemeManager = schemeManager;
    this.variantManager = variantManager;

    // this.addPalette({key: "primary", addDefaultColors: true})
    // this.addPalette({key: "secondary", addDefaultColors: true})
    // this.addPalette({key: "tertiary", addDefaultColors: true})
    // this.addPalette({key: "error", palette: TonalPalette.fromHueAndChroma(25.0, 84.0)})
    // this.addPalette({key: "neutral"})
    // this.addPalette({key: "neutralVariant"})
  }

  // addPalette({key, palette, addDefaultColors}: {key: string; palette: TonalPalette; addDefaultColors: boolean}) {
  //   this.themeOptions.palettes.set(key, palette);
  //   if (addDefaultColors){
  //     this.colorService.addPalette(key)
  //   }
  // }

  // create(args: ThemeOptions): SchemeService {
  //   return new SchemeService(args, this.colorService)
  // }
  //
  // update(options: Partial<ThemeOptions>): SchemeService {
  //   Object.assign(this.themeOptions, options);
  //   return this.theme();
  // }

  create(options: ThemeOptions & { variant: Variant }) {
    this.schemeManager.createOrUpdate({
      ...options,
      sourcesColorHex: { primary: options.sourceColorHex },
    });
    this.variantManager.set(options.variant);
  }

  update(options: Partial<ThemeOptions> & { variant?: Variant }) {
    const themeOptions: Partial<SchemeServiceOptions> = { ...options };
    if (options.sourceColorHex)
      themeOptions.sourcesColorHex = { primary: options.sourceColorHex };
    this.schemeManager.createOrUpdate(themeOptions);
    if (options.variant) this.variantManager.set(options.variant);
  }

  addCustomPalette(key: string, colorHex: string) {
    this.variantManager.addCustomPalette(key, colorHex);
  }

  // theme(): SchemeService {
  //   return new SchemeService(this.themeOptions, this.colorService)
  // }
}
