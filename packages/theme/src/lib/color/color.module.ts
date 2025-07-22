import { ColorApi } from './color.api';
import { ColorManager } from './color.manager';
import { asClass } from 'awilix';
import { Module } from '@udixio/theme';

export const ColorModule: Module = {
  colorManagerService: asClass(ColorManager).singleton(),
  colorService: asClass(ColorApi).singleton(),
};
