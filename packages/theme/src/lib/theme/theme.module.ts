import { asClass } from 'awilix';
import { Module } from '../app.container';
import { SchemeManager } from './scheme.manager';
import { VariantManager } from './variant.manager';
import { ThemeApi } from './theme.api';

export const ThemeModule: Module = {
  schemeService: asClass(SchemeManager).singleton(),
  variantService: asClass(VariantManager).singleton(),
  themeService: asClass(ThemeApi).singleton(),
};
