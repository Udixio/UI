import { asClass } from 'awilix';
import { Module } from '../app.container';
import { SchemeService } from './scheme.service';
import { VariantManager } from './variant.manager';
import { ThemeApi } from './theme.api';

export const ThemeModule: Module = {
  schemeService: asClass(SchemeService).singleton(),
  variantService: asClass(VariantManager).singleton(),
  themeService: asClass(ThemeApi).singleton(),
};
