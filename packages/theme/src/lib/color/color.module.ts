import { ColorService } from './services/color.service';
import { ColorManagerService } from './services/color-manager.service';
import { asClass } from 'awilix';
import { Module } from '../app.container';

export const ColorModule: Module = {
  colorManagerService: asClass(ColorManagerService).singleton(),
  colorService: asClass(ColorService).singleton(),
};
