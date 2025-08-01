import path, { resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import type { Plugin } from 'vite';

export const udixioVite = (args?: {
  configPath?: string;
  fileName?: string;
  outDir?: string
}): Plugin => {

  const {
    configPath = './theme.config',
    fileName = 'dynamic-styles.css',
    outDir = 'testDist',
  } = args ?? {}
  const absConfigPath = path.resolve(configPath);

  const generateCss = () => `
  coucou
  `;

  console.log('Config path:', absConfigPath);
  if (typeof generateCss !== 'function') {
    throw new Error(
      '[css-writer-plugin] You must provide a `generateCss` function',
    );
  }

  // Ensure output directory exists
  function ensureOutDir() {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
  }

  // Write CSS to disk
  function writeCss() {
    const css = generateCss();
    const filePath = resolve(outDir, fileName);
    writeFileSync(filePath, css, 'utf-8');
    console.log(`[css-writer-plugin] Wrote CSS to ${filePath}`);
  }

  return {
    name: 'vite:config-watcher',
    buildStart() {
      ensureOutDir();
      writeCss();
    },

    // Runs after Rollup generates assets
    generateBundle() {
      // In case CSS should reflect final bundle state
      writeCss();
    },

    // Handles Hot Module Replacement in dev server
    handleHotUpdate({ server, file, modules }) {
      // Optionally, check if a relevant file changed
      // For simplicity, regenerate CSS on every update
      ensureOutDir();
      writeCss();

      // Trigger full page reload so CSS changes are applied
      server.ws.send({ type: 'full-reload', path: '*' });
      return modules;
    },
  };
};
