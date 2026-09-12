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

  public toSerializable(): Options {
    return JSON.parse(
      JSON.stringify(this.options, (_key, value) =>
        typeof value === 'function' ? undefined : value,
      ),
    ) as Options;
  }

  public init(api: API) {
    this.pluginInstance = new this.pluginClass(api, this.options);
    this.pluginInstance.onInit?.();
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
    protected api: API,
    protected options: Options,
  ) {
    this.onInit?.();
  }

  /**
   * Lifecycle hooks, both optional: they are called with `?.()`, and an
   * implementation often provides only one of them. Declaring them
   * `abstract` would force every plugin to write both.
   */
  onInit?(): void;

  onLoad?(): void | Promise<void>;
}
