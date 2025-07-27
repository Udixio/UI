import { PluginAbstract, PluginImplAbstract } from '../../plugin';

interface VitePluginOptions {}

export class VitePlugin extends PluginAbstract<
  VitePluginImpl,
  VitePluginOptions
> {
  dependencies = [];
  name = 'vite';
  pluginClass = VitePluginImpl;
}

class VitePluginImpl extends PluginImplAbstract<VitePluginOptions> {
  onInit(): void {}
}
