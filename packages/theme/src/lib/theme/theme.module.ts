import { asClass } from 'awilix';
import { Module } from '../app.container';
import { SchemeManager } from './scheme.manager';
import { VariantManager } from './variant.manager';
import { ThemeApi } from './theme.api';

export const ThemeModule: Module = {
  schemeManager: asClass(SchemeManager).singleton(),
  variantManager: asClass(VariantManager).singleton(),
  themeApi: asClass(ThemeApi).singleton(),
};
