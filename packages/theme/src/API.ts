import { ColorApi } from './color';
import { PluginApi } from './plugin';
import { Context } from './context';
import { PaletteApi } from './palette/palette.api';
import { ColorManager } from './color/color.manager';

export class API {
  public colors: ColorApi;
  public plugins: PluginApi;
  public context: Context;
  public palettes: PaletteApi;

  constructor({
    colorApi,
    colorManager,
    pluginApi,
    context,
    paletteApi,
  }: {
    colorApi: ColorApi;
    colorManager: ColorManager;
    pluginApi: PluginApi;
    paletteApi: PaletteApi;
    context: Context;
  }) {
    colorApi.api = this;
    // Les ajusteurs de ton reçoivent l'API entière ; le manager la leur passe.
    colorManager.api = this;

    this.context = context;
    this.context.init(this);
    this.plugins = pluginApi;
    this.colors = colorApi;
    this.palettes = paletteApi;
  }

  async load() {
    return this.plugins.loadPlugins();
  }
}
