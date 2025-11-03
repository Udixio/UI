import { asClass } from 'awilix';
import { Module } from '../app.container';
import { PluginApi } from './plugin.api';

export const PluginModule: Module = {
  pluginApi: asClass(PluginApi).scoped(),
};
