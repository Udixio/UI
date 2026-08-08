# Udixio UI

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![PR Validation](https://github.com/Udixio/UI/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/Udixio/UI/actions/workflows/pr-validation.yml)
[![npm @udixio/ui-react](https://img.shields.io/npm/v/%40udixio%2Fui-react?label=%40udixio%2Fui-react)](https://www.npmjs.com/package/@udixio/ui-react)
[![npm @udixio/ui-angular](https://img.shields.io/npm/v/%40udixio%2Fui-angular?label=%40udixio%2Fui-angular)](https://www.npmjs.com/package/@udixio/ui-angular)

A dynamic **Material Design 3** component library for React and Angular, with runtime theming and native Tailwind CSS integration.

`ThemeProvider` computes MD3 tonal palettes from a single source color and injects them as CSS custom properties at runtime — no build-time theme compilation, no `dark:` prefixes to manage by hand.

- 📖 Documentation & live playground: https://ui.udixio.fr
- 🎨 Built systematically from the official MD3 specifications
- ⚛️ / 🅰️ Shared framework-agnostic core, with first-class React and Angular adapters

## Packages

| Package | Description |
| --- | --- |
| [`@udixio/core`](packages/core) | Framework-agnostic behaviors, style engine and shared interfaces |
| [`@udixio/ui-react`](packages/ui-react) | React components (Button, TextField, DatePicker, Tabs, Switch, Tooltip, …) |
| [`@udixio/ui-angular`](packages/ui-angular) | Angular adapters for the same component set |
| [`@udixio/theme`](packages/theme) | Runtime MD3 theme engine (`ThemeProvider`, dynamic color) |
| [`@udixio/tailwind`](packages/tailwind) | Tailwind CSS plugin exposing MD3 semantic tokens as utilities |
| [`@udixio/mcp`](packages/mcp) | MCP server for AI-assisted development with Udixio UI |
| `@udixio/icons-*` | Material Symbols icon sets (outlined / rounded / sharp, multiple weights) |

## Getting started

```bash
npm install @udixio/ui-react @udixio/theme
```

See the [installation guide](https://ui.udixio.fr/theme/introduction) for the Angular setup and Tailwind configuration.

## Development

This is an [Nx](https://nx.dev) monorepo managed with `pnpm`.

```bash
pnpm install
npx nx run-many -t build     # build all packages
npx nx run-many -t test      # run all tests
npx nx run-many -t lint      # lint all projects
npx nx run apps-doc:dev      # run the documentation site locally
```

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the branching model, commit conventions, and PR process, and [.github/README.md](.github/README.md) for details on the release workflow.

## License

[Apache-2.0](LICENSE)
