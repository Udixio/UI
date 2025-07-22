import { DynamicColor } from '@material/material-color-utilities';
import { SchemeService, SchemeServiceOptions } from './scheme.service';
import { VariantService } from './variant.service';
import { VariantEntity } from '../entities/variant.entity';

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
  private readonly schemeService: SchemeService;
  private readonly variantService: VariantService;

  constructor({
    schemeService,
    variantService,
  }: {
    schemeService: SchemeService;
    variantService: VariantService;
  }) {
    this.schemeService = schemeService;
    this.variantService = variantService;

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

  create(options: ThemeOptions & { variant: VariantEntity }) {
    this.schemeService.createOrUpdate({
      ...options,
      sourcesColorHex: { primary: options.sourceColorHex },
    });
    this.variantService.set(options.variant);
  }

  update(options: Partial<ThemeOptions> & { variant?: VariantEntity }) {
    const themeOptions: Partial<SchemeServiceOptions> = { ...options };
    if (options.sourceColorHex)
      themeOptions.sourcesColorHex = { primary: options.sourceColorHex };
    this.schemeService.createOrUpdate(themeOptions);
    if (options.variant) this.variantService.set(options.variant);
  }

  addCustomPalette(key: string, colorHex: string) {
    this.variantService.addCustomPalette(key, colorHex);
  }

  // theme(): SchemeService {
  //   return new SchemeService(this.themeOptions, this.colorService)
  // }
}
