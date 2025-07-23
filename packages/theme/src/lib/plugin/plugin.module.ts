import { asClass } from 'awilix';
import { Module } from '../app.container';
import { PluginApi } from './pluginApi';

export const PluginModule: Module = {
  pluginApi: asClass(PluginApi).singleton(),
};
