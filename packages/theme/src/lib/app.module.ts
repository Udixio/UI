import { asClass } from 'awilix';
import { API } from './API';
import { Module } from './app.container';

export const AppModule: Module = {
  appService: asClass(API).singleton(),
};
