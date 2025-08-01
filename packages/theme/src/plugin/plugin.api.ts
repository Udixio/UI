import { PluginAbstract } from './plugin.abstract';
import { API } from '../API';

export class PluginApi {
  private plugins = new Map<string, PluginAbstract<any, any>>();

  public addPlugin(plugin: PluginAbstract<any, any>) {
    this.plugins.set(plugin.name, plugin);
  }

  public initPlugins(api: API) {
    const plugins = new Map(this.plugins);

    let size = 0;

    this.plugins = new Map();

    do {
      size = plugins.size;
      plugins.forEach((plugin, key) => {
        const deps = plugin.dependencies.filter(
          (dep) => !this.plugins.has(new dep().name),
        );
        if (deps.length === 0) {
          this.plugins.set(plugin.name, plugin.init(api));
          plugins.delete(key);
        }
      });
    } while (plugins.size != 0 && plugins.size < size);

    if (plugins.size > 0)
      throw new Error(
        "Some plugins couldn't be loaded due to missing dependencies: " +
          Array.from(plugins.keys()),
      );
  }

  public loadPlugins() {
    this.plugins.forEach((plugin) => {
      plugin.getInstance().load();
    });
  }

  public getPlugin<T extends PluginAbstract<any, any>>(
    plugin: new (...args: any) => T,
  ): T {
    const pluginInstance = this.plugins.get(new plugin().name);
    if (!pluginInstance) throw new Error(`Plugin ${plugin.name} not found`);
    return pluginInstance as T;
  }
}
