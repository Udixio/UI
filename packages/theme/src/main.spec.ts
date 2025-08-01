import AppContainer from './app.container';
import { API } from './API';
import { ConfigService } from './config';
import { bootstrap, bootstrapFromConfig } from './bootstrap';

jest.mock('./app.container', () => ({
  resolve: jest.fn(),
}));

describe('main', () => {
  let mockAPI: API;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockAPI = {} as API;
    mockConfigService = {
      configPath: '',
      loadConfig: jest.fn(),
    } as unknown as ConfigService;

    (AppContainer.resolve as jest.Mock).mockImplementation((key: string) => {
      if (key === 'api') return mockAPI;
      if (key === 'configService') return mockConfigService;
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bootstrap', () => {
    it('should resolve and return the API instance', () => {
      const result = bootstrap();
      expect(AppContainer.resolve).toHaveBeenCalledWith('api');
      expect(result).toBe(mockAPI);
    });
  });

  describe('bootstrapFromConfig', () => {
    it('should load config and return API instance when called without arguments', () => {
      const result = bootstrapFromConfig();
      expect(AppContainer.resolve).toHaveBeenCalledWith('configService');
      expect(mockConfigService.loadConfig).toHaveBeenCalledWith(undefined);
      expect(AppContainer.resolve).toHaveBeenCalledWith('api');
      expect(result).toBe(mockAPI);
    });

    it('should set config path when provided', () => {
      const path = '/path/to/config';
      bootstrapFromConfig({ path });
      expect(mockConfigService.configPath).toBe(path);
    });

    it('should load provided config', () => {
      const config = { theme: 'test' };
      bootstrapFromConfig({ config });
      expect(mockConfigService.loadConfig).toHaveBeenCalledWith(config);
    });
  });
});
