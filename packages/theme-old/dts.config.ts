import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { defineConfig } from 'dts-cli';


export default defineConfig({
  // This function will run for each entry/format/env combination
  rollup: (config, options) => {
    config.plugins.push(
      commonjs(),
    );
    config.plugins.push(
      babel({ babelHelpers: 'runtime' })
    )
    return config;
  },
});