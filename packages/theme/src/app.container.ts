import { createContainer, InjectionMode, Resolver } from 'awilix';
import { ColorModule } from './color';
import { AppModule } from './app.module';
import { PluginModule } from './plugin';
import { PaletteModule } from './palette';
import { ContextModule } from './context';

export type Module = Record<string, Resolver<any>>;

export const AppContainer = () => {
  function registerModule(...modules: Module[]) {
    modules.forEach((module) => {
      Object.entries(module).forEach(([name, moduleClass]) => {
        container.register(name, moduleClass);
      });
    });
    return AppContainer;
  }

  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  registerModule(
    AppModule,
    PluginModule,
    ColorModule,
    PaletteModule,
    ContextModule,
  );

  return container;
};
