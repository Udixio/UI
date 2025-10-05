import { ColorApi } from './color';
import { PluginApi } from './plugin';
import { Context } from './context';
import { PaletteApi } from './palette/palette.api';

export class API {
  public colors: ColorApi;
  public plugins: PluginApi;
  public context: Context;
  public palettes: PaletteApi;

  constructor({
    colorApi,
    pluginApi,
    context,
    paletteApi,
  }: {
    colorApi: ColorApi;
    pluginApi: PluginApi;
    paletteApi: PaletteApi;
    context: Context;
  }) {
    colorApi.api = this;

    this.context = context;
    this.plugins = pluginApi;
    this.colors = colorApi;
    this.palettes = paletteApi;
  }

  async load() {
    return this.plugins.loadPlugins();
  }
}
