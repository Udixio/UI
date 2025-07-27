import path from 'path';
import { pathToFileURL } from 'url';
import { Plugin } from 'vite';

export const udixioVite = (configPath: string = './theme.config'): Plugin => {
  const absConfigPath = path.resolve(configPath);

  return {
    name: 'vite:config-watcher',
    async buildStart() {
      this.addWatchFile(absConfigPath);
    },
    async handleHotUpdate({ file, server }) {
      if (file === absConfigPath) {
        console.log(`[vite-plugin-config-watcher] Reloading config: ${file}`);

        // Invalider le cache du module pour permettre le re-import
        const configModulePath = pathToFileURL(absConfigPath).href;
        const mod = await import(configModulePath + `?t=${Date.now()}`); // éviter cache
        const config = mod.default;

        console.log('New config:', config);

        // 👉 ici tu peux utiliser `config` comme tu veux
        // par exemple : notifier tes modules, reconfigurer un système, etc.
      }
    },
  };
};
