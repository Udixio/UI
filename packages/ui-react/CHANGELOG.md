## 1.2.0 (2025-08-23)

### 🚀 Features

- **ui-react:** introduce `Icon` type and update `Icon` component interface ([ea01bfb](https://github.com/Udixio/UI/commit/ea01bfb))
- **ui-react:** replace `IconDefinition` with `Icon` in component interfaces ([819ebe1](https://github.com/Udixio/UI/commit/819ebe1))
- **ui-react:** enhance `Icon` component to support multiple icon types ([86b1c58](https://github.com/Udixio/UI/commit/86b1c58))

### 🩹 Fixes

- **ui-react:** improve readability in `navigation-rail-item.style.ts` ([a7098eb](https://github.com/Udixio/UI/commit/a7098eb))

### ❤️ Thank You

- Joël VIGREUX

## 1.1.0 (2025-08-22)

### 🚀 Features

- **ui-react:** add `disableTextMargins` prop to Button component ([ed0600b](https://github.com/Udixio/UI/commit/ed0600b))

### ❤️ Thank You

- Joël VIGREUX

## 1.0.1 (2025-08-22)

### 🧱 Updated Dependencies

- Updated @udixio/tailwind to 1.2.1

# 1.0.0 (2025-08-22)

### 🚀 Features

- **ui-react:** improve progress indicator styles and visibility logic ([b5c908b](https://github.com/Udixio/UI/commit/b5c908b))
- ⚠️  **ui-react:** enhance components with `children` support and refine accessibility ([d8626a5](https://github.com/Udixio/UI/commit/d8626a5))

### 🩹 Fixes

- ⚠️  **ui-react:** remove redundant variant assignment in Button component ([62a124f](https://github.com/Udixio/UI/commit/62a124f))

### ⚠️  Breaking Changes

- **ui-react:** The `filledTonal` variant behavior has been modified in the Button component. If you were relying on the previous redundant assignment logic, update your implementation to ensure consistent styling behavior.
- **ui-react:** The `ariaLabel` prop has been replaced with `label` across all components (`Button`, `IconButton`, `Fab`, etc.) for better accessibility compliance. Update your components to use `label` instead of `ariaLabel`. Additionally, `Snackbar` component's `supportingText` prop has been renamed to `message`.

### ❤️ Thank You

- Joël VIGREUX

## 0.1.2 (2025-08-05)

### 🩹 Fixes

- dependencies package ([a04c368](https://github.com/Udixio/UI/commit/a04c368))

### ❤️ Thank You

- Joël VIGREUX

## 0.1.1 (2025-08-04)

### 🩹 Fixes

- dependencies pakcage ([9feff43](https://github.com/Udixio/UI/commit/9feff43))
- dependencies pakcage ([afa3009](https://github.com/Udixio/UI/commit/afa3009))

### ❤️ Thank You

- Joël VIGREUX

## 0.4.3 (2025-07-25)

### 🩹 Fixes

- add `types` field to package exports and correct file extensions ([6b8ce9c](https://github.com/Udixio/UI/commit/6b8ce9c))

### 🧱 Updated Dependencies

- Updated tailwind to 0.5.3
- Updated theme to 0.5.3

### ❤️ Thank You

- Joël VIGREUX

## 0.4.2 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.5.2
- Updated theme to 0.5.2

## 0.4.1 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.5.1
- Updated theme to 0.5.1

## 0.4.0 (2025-07-25)

### 🚀 Features

- **theme:** migrate build system from Rollup to Vite for improved performance and configuration ([3f33657](https://github.com/Udixio/UI/commit/3f33657))

### 🧱 Updated Dependencies

- Updated tailwind to 0.5.0
- Updated theme to 0.5.0

### ❤️ Thank You

- Joël VIGREUX

## 0.3.11 (2025-07-25)

### 🩹 Fixes

- **dependencies:** update `pnpm-lock.yaml` for consistency and compatibility ([e6dfc9d](https://github.com/Udixio/UI/commit/e6dfc9d))

### 🧱 Updated Dependencies

- Updated tailwind to 0.4.1
- Updated theme to 0.4.2

### ❤️ Thank You

- Joël VIGREUX

## 0.3.10 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.4.0

## 0.3.9 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.7

## 0.3.8 (2025-07-25)

### 🩹 Fixes

- **dependencies:** update `pnpm-lock.yaml` for consistent dependency versions ([5dee7f3](https://github.com/Udixio/UI/commit/5dee7f3))

### ❤️ Thank You

- Joël VIGREUX

## 0.3.7 (2025-07-25)

### 🩹 Fixes

- **ui-react:** update build config to improve module compatibility ([a6de1ee](https://github.com/Udixio/UI/commit/a6de1ee))

### ❤️ Thank You

- Joël VIGREUX

## 0.3.6 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.6

## 0.3.5 (2025-07-25)

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.5
- Updated theme to 0.4.1

## 0.3.4 (2025-07-25)

### 🩹 Fixes

- **theme:** switch to ES module exports and adjust package type ([7314ded](https://github.com/Udixio/UI/commit/7314ded))

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.4
- Updated theme to 0.4.0

### ❤️ Thank You

- Joël VIGREUX

## 0.3.3 (2025-07-24)

### 🩹 Fixes

- **theme:** improve Tailwind CSS import handling in plugin ([f7c7f3a](https://github.com/Udixio/UI/commit/f7c7f3a))

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.3
- Updated theme to 0.3.2

### ❤️ Thank You

- Joël VIGREUX

## 0.3.2 (2025-07-24)

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.2
- Updated theme to 0.3.1

## 0.3.1 (2025-07-24)

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.1

## 0.3.0 (2025-07-24)

### 🚀 Features

- **package:** add `publishConfig` to package.json for public npm publishing ([40307c0](https://github.com/Udixio/UI/commit/40307c0))

### 🧱 Updated Dependencies

- Updated tailwind to 0.3.0
- Updated theme to 0.3.0

### ❤️ Thank You

- Joël VIGREUX

## 0.2.0 (2025-07-24)

### 🚀 Features

- **package:** add `repository` field to package.json files ([a05ca80](https://github.com/Udixio/UI/commit/a05ca80))

### 🧱 Updated Dependencies

- Updated tailwind to 0.2.0
- Updated theme to 0.2.0

### ❤️ Thank You

- Joël VIGREUX

## 0.1.0 (2025-07-24)

### 🚀 Features

- **theme, ui-react, tailwind:** enhance dependencies, Jest config, and Button component ([04e1d00](https://github.com/Udixio/UI/commit/04e1d00))
- **ui-react:** add `cursor-pointer` to interactive components and fix formatting issues ([cc499c4](https://github.com/Udixio/UI/commit/cc499c4))
- **ui-react:** update ripple effect to use modern color mix function ([d721f83](https://github.com/Udixio/UI/commit/d721f83))
- **ui-react:** replace FontAwesomeIcon with custom SVG rendering in Icon component ([8414c2f](https://github.com/Udixio/UI/commit/8414c2f))
- **theme:** integrate new utilities and refine Tailwind plugin configuration ([3f4152e](https://github.com/Udixio/UI/commit/3f4152e))
- **theme:** improve dark mode support and streamline color management ([7b72e9d](https://github.com/Udixio/UI/commit/7b72e9d))
- **theme:** enhance Tailwind plugin with createOrUpdateFile utility ([4316f58](https://github.com/Udixio/UI/commit/4316f58))
- **theme:** enhance Tailwind plugin with file content validation ([77aa702](https://github.com/Udixio/UI/commit/77aa702))
- **theme:** simplify Tailwind plugin setup and enhance color management ([a10657f](https://github.com/Udixio/UI/commit/a10657f))
- **theme:** refactor Tailwind plugin setup and clean up dependencies ([2468c56](https://github.com/Udixio/UI/commit/2468c56))
- **tailwind:** refactor plugin and integrate theme dependencies ([34501e3](https://github.com/Udixio/UI/commit/34501e3))
- **ui:** improve button styling and enhance Tailwind plugin configuration ([efdeeb0](https://github.com/Udixio/UI/commit/efdeeb0))
- **tailwind:** remove Tailwind library and update dependencies ([bd84038](https://github.com/Udixio/UI/commit/bd84038))
- **ui-react:** reintroduce TailwindCSS with Vite plugin and enhance Storybook setup ([c1a1637](https://github.com/Udixio/UI/commit/c1a1637))
- **ui-react:** add Storybook support and configure with Vite ([125396b](https://github.com/Udixio/UI/commit/125396b))
- **theme:** add dependencies and update lockfile for new theme module ([d615149](https://github.com/Udixio/UI/commit/d615149))
- **ui-react:** add TailwindCSS support and update styles ([61bbadd](https://github.com/Udixio/UI/commit/61bbadd))
- **build:** add Vite configuration and TypeScript setup for `ui-react` package ([4e04879](https://github.com/Udixio/UI/commit/4e04879))
- **config:** initialize Nx workspace setup ([6204056](https://github.com/Udixio/UI/commit/6204056))

### 🧱 Updated Dependencies

- Updated tailwind to 0.1.0
- Updated theme to 0.1.0

### ❤️ Thank You

- Joël VIGREUX