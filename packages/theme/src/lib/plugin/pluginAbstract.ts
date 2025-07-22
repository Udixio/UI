import { API } from '../API';

export type PluginConstructor<Plugin extends PluginImplAbstract<any>> = new (
  ...args: any
) => Plugin;

export abstract class PluginAbstract<
  Plugin extends PluginImplAbstract<Options>,
  Options extends object,
> {
  public abstract readonly dependencies: (new (
    ...args: any
  ) => PluginAbstract<any, any>)[];
  public abstract readonly name: string;
  public options: Options;
  public abstract readonly pluginClass: PluginConstructor<Plugin>;
  protected pluginInstance: Plugin | undefined;

  constructor(options: Options) {
    this.options = options;
  }

  public init(appService: API) {
    this.pluginInstance = new this.pluginClass(appService, this.options);
    this.pluginInstance.onInit();
    return this;
  }

  public getInstance(): Plugin {
    if (!this.pluginInstance) {
      throw new Error(`Plugin ${this.name} is not initialized`);
    }
    return this.pluginInstance;
  }
}

export abstract class PluginImplAbstract<Options extends object> {
  constructor(
    protected appService: API,
    protected options: Options,
  ) {
    this.onInit();
  }

  abstract onInit(): void;
}
