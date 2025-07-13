import { asClass } from 'awilix';
import { AppService } from './app.service';
import { Module } from './app.container';

export const AppModule: Module = {
  appService: asClass(AppService).singleton(),
};
