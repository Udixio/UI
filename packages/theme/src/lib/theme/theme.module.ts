import { SchemeService, ThemeApi, VariantService } from './services';
import { asClass } from 'awilix';
import { Module } from '../app.container';

export const ThemeModule: Module = {
  schemeService: asClass(SchemeService).singleton(),
  variantService: asClass(VariantService).singleton(),
  themeService: asClass(ThemeApi).singleton(),
};
