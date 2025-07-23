import { ColorApi } from './color.api';
import { ColorManager } from './color.manager';
import { asClass } from 'awilix';
import { Module } from '@udixio/theme';

export const ColorModule: Module = {
  colorManager: asClass(ColorManager).singleton(),
  colorApi: asClass(ColorApi).singleton(),
};
