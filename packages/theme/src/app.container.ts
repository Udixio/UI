import { AwilixContainer, createContainer, InjectionMode, Resolver } from 'awilix';
import { ColorModule } from './color';
import { AppModule } from './app.module';
import { PluginModule } from './plugin';
import { PaletteModule } from './palette';
import { ContextModule } from './context';

export type Module = Record<string, Resolver<any>>;

let cachedContainer: AwilixContainer | null = null;

export const AppContainer = (options?: { fresh?: boolean }) => {
  if (!options?.fresh && cachedContainer) {
    return cachedContainer;
  }

  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  function registerModule(...modules: Module[]) {
    modules.forEach((module) => {
      Object.entries(module).forEach(([name, moduleClass]) => {
        container.register(name, moduleClass);
      });
    });
    return AppContainer;
  }

  registerModule(
    AppModule,
    PluginModule,
    ColorModule,
    PaletteModule,
    ContextModule,
  );

  cachedContainer = container;
  return container;
};
