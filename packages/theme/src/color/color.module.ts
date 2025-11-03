import { ColorApi } from './color.api';
import { ColorManager } from './color.manager';
import { asClass } from 'awilix';
import { Module } from '../app.container';

export const ColorModule: Module = {
  colorManager: asClass(ColorManager).scoped(),
  colorApi: asClass(ColorApi).scoped(),
};
