import { Module } from '@nestjs/common';
import { SchemeService } from './services/scheme.service';
import { ThemeService } from './services/theme.service';
import { VariantService } from './services/variant.service';

@Module({
  providers: [SchemeService, ThemeService, VariantService],
  exports: [ThemeService, SchemeService],
})
export class ThemeModule {}
