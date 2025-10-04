import { asClass } from 'awilix';
import { Module } from '../app.container';
import { Context } from './context';

export const ContextModule: Module = {
  context: asClass(Context).singleton(),
};
