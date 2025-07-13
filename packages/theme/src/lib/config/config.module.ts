import { asClass } from 'awilix';
import { Module } from '../app.container';
import { ConfigService } from './config.service';

export const ConfigModule: Module = {
  configService: asClass(ConfigService).singleton(),
};
