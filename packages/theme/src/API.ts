import { ColorApi } from './color';
import { ThemeApi } from './theme';
import { PluginApi } from './plugin';

export class API {
  public colors: ColorApi;
  public themes: ThemeApi;
  public plugins: PluginApi;

  constructor({
    colorApi,
    themeApi,
    pluginApi,
  }: {
    colorApi: ColorApi;
    themeApi: ThemeApi;
    pluginApi: PluginApi;
  }) {
    this.plugins = pluginApi;
    this.colors = colorApi;
    this.themes = themeApi;
  }

  async load() {
    return this.plugins.loadPlugins();
  }
}
