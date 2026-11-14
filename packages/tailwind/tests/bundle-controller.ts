import { resolve } from 'node:path';
import { build } from 'vite';

/** Bundle the actual controller for use in a browser fixture. */
export async function bundleController(name: 'slider' | 'switch'): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: { conditions: ['development'] },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve(__dirname, `../../core/src/lib/dom/${name}.ts`),
        name: name === 'slider' ? 'SliderController' : 'SwitchController',
        formats: ['iife'],
      },
    },
  });
  const chunk = (Array.isArray(result) ? result[0] : result).output.find(
    (item) => item.type === 'chunk',
  );
  if (!chunk || chunk.type !== 'chunk') throw new Error(`${name} bundle missing`);
  return chunk.code;
}
