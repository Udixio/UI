import { API } from './API';
import { ColorApi } from './color';
import { ThemeApi } from './theme';
import { PluginApi } from './plugin/index.js';

describe('API', () => {
  let colorApi: ColorApi;
  let themeApi: ThemeApi;
  let pluginApi: PluginApi;
  let api: API;

  beforeEach(() => {
    colorApi = {} as ColorApi;
    themeApi = {} as ThemeApi;
    pluginApi = {} as PluginApi;

    api = new API({
      colorApi,
      themeApi,
      pluginApi,
    });
  });

  it('should initialize with provided APIs', () => {
    expect(api.colors).toBe(colorApi);
    expect(api.themes).toBe(themeApi);
    expect(api.plugins).toBe(pluginApi);
  });
});
