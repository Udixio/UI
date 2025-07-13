import { asClass } from 'awilix';
import { Module } from '../app.container';
import { PluginService } from './plugin.service';

export const PluginModule: Module = {
  pluginService: asClass(PluginService).singleton(),
};
