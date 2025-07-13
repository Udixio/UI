import { ColorService } from './color';
import { ThemeService } from './theme';
import { PluginService } from './plugin/plugin.service';

export class AppService {
  public colorService: ColorService;
  public themeService: ThemeService;
  public pluginService: PluginService;

  constructor({
    colorService,
    themeService,
    pluginService,
  }: {
    colorService: ColorService;
    themeService: ThemeService;
    pluginService: PluginService;
  }) {
    this.pluginService = pluginService;
    this.colorService = colorService;
    this.themeService = themeService;
  }
}
