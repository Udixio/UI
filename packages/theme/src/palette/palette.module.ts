import { asClass } from 'awilix';
import { Module } from '../app.container';
import { PaletteManager } from './palette.manager';
import { PaletteApi } from './palette.api';

export const PaletteModule: Module = {
  paletteApi: asClass(PaletteApi).scoped(),
  paletteManager: asClass(PaletteManager).scoped(),
};
