import { createContainer, InjectionMode, Resolver } from 'awilix';
import { ColorModule } from './color';
import { AppModule } from './app.module';
import { PluginModule } from './plugin';
import { PaletteModule } from './palette/palette.module';
import { ContextModule } from './context';

export type Module = Record<string, Resolver<any>>;

export function registerModule(...modules: Module[]) {
  modules.forEach((module) => {
    Object.entries(module).forEach(([name, moduleClass]) => {
      AppContainer.register(name, moduleClass);
    });
  });
  return AppContainer;
}

export const AppContainer = createContainer({
  injectionMode: InjectionMode.PROXY,
});

registerModule(
  AppModule,
  PluginModule,
  ColorModule,
  PaletteModule,
  ContextModule,
);
