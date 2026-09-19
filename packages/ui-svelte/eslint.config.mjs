import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';
import svelteConfig from './svelte.config.js';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.ts',
            '{projectRoot}/svelte.config.js',
            '{projectRoot}/tsconfig.*.json',
            '{projectRoot}/src/tests/**',
            '{projectRoot}/**/*.spec.ts',
            '{projectRoot}/**/*.spec.svelte.ts',
            '{projectRoot}/**/*.fixture.svelte',
          ],
          // Imports made inside `.svelte` files are invisible to the Nx
          // project graph, so `svelte` itself would always read as unused.
          ignoredDependencies: ['svelte'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
  },
];
