import {
  AwilixContainer,
  BuildResolver,
  createContainer,
  DisposableResolver,
  InjectionMode,
} from 'awilix';
import { ColorModule } from './color';
import { ThemeModule } from './theme';
import { AppModule } from './app.module';
import { ConfigModule } from './config';
import { PluginModule } from './plugin';

export type Module = Record<
  string,
  BuildResolver<any> & DisposableResolver<any>
>;

export function importContainer(
  container: AwilixContainer,
  services: Module[],
) {
  services.forEach((service) => {
    Object.entries(service).forEach(([name, serviceClass]) => {
      container.register(name, serviceClass);
    });
  });
  return container;
}

const AppContainer = createContainer({
  injectionMode: InjectionMode.PROXY,
});

importContainer(AppContainer, [
  ConfigModule,
  AppModule,
  PluginModule,
  ColorModule,
  ThemeModule,
]);

// AppContainer.register(ColorModule.cradle);
// AppContainer.register(ThemeModule.cradle);

export default AppContainer;
