import { SchemeService } from './scheme.service';
import { VariantEntity } from '../entities/variant.entity';
import { Injectable } from '@nestjs/common';
import { TonalPalette } from '@material/material-color-utilities';

@Injectable()
export class VariantService {
  constructor(private schemeService: SchemeService) {}

  set(variantEntity: VariantEntity) {
    if (!variantEntity.palettes.error) {
      variantEntity.palettes.error = () =>
        TonalPalette.fromHueAndChroma(25.0, 84.0);
    }
    this.schemeService.createOrUpdate(variantEntity);
  }
}
