import { ColorApi } from './color';
import { ThemeApi } from './theme';
import { PluginApi } from './plugin/pluginApi';

export class API {
  public colors: ColorApi;
  public themes: ThemeApi;
  public plugins: PluginApi;

  constructor({
    colorService,
    themeService,
    pluginService,
  }: {
    colorService: ColorApi;
    themeService: ThemeApi;
    pluginService: PluginApi;
  }) {
    this.plugins = pluginService;
    this.colors = colorService;
    this.themes = themeService;
  }
}
