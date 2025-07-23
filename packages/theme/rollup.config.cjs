const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: '../../dist/packages/theme',
    tsConfig: './tsconfig.lib.json',
    compiler: 'tsc',
    format: ['cjs', 'esm'],
    assets: [{ input: '{projectRoot}', output: '.', glob: '*.md' }],
    useLegacyTypescriptPlugin: false,
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    output: {
      sourcemap: true,
      sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        // Convert relative paths to absolute paths
        return require('path').resolve(
          require('path').dirname(sourcemapPath),
          relativeSourcePath,
        );
      },
    },
  },
);
