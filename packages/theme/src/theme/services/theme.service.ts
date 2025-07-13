import { DynamicColor } from '@material/material-color-utilities';
import { Injectable } from '@nestjs/common';
import { SchemeService, SchemeServiceOptions } from './scheme.service';
import { VariantService } from './variant.service';
import { VariantEntity } from '../entities/variant.entity';

type ThemeOptions = Omit<SchemeServiceOptions, 'palettes'>;

const colorPaletteKeyColor = DynamicColor.fromPalette({
  name: 'primary_palette_key_color',
  palette: (s) => s.primaryPalette,
  tone: (s) => s.primaryPalette.keyColor.tone,
});

@Injectable()
export class ThemeService {
  constructor(
    private schemeService: SchemeService,
    private variantService: VariantService
  ) {
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

  create(options: ThemeOptions) {
    this.schemeService.createOrUpdate(options);
  }

  addVariant(variant: VariantEntity) {
    this.variantService.set(variant);
  }

  update(options: Partial<ThemeOptions>) {
    this.schemeService.createOrUpdate(options);
  }
  // theme(): SchemeService {
  //   return new SchemeService(this.themeOptions, this.colorService)
  // }
}
