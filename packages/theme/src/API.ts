import { ColorApi } from './color';
import { PluginApi } from './plugin';
import { Context } from './context';
import { PaletteApi } from './palette/palette.api';
import { Variant } from './variant/variant';

export class API {
  public colors: ColorApi;
  public plugins: PluginApi;
  public context: Context;
  public palettes: PaletteApi;
  public variant: Variant;

  constructor({
    colorApi,
    pluginApi,
    context,
    palettes,
    variant,
  }: {
    colorApi: ColorApi;
    pluginApi: PluginApi;
    palettes: PaletteApi;
    context: Context;
    variant: Variant;
  }) {
    colorApi.api = this;

    this.context = context;
    this.plugins = pluginApi;
    this.colors = colorApi;
    this.palettes = palettes;
    this.variant = variant;
  }

  async load() {
    return this.plugins.loadPlugins();
  }
}
