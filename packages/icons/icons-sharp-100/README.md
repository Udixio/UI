# @udixio/icons-sharp-100

[Material Symbols](https://fonts.google.com/icons) icons as tree-shakable SVG strings — **sharp** style, weight **100**.

Part of the [@udixio/ui](https://github.com/Udixio/UI) ecosystem.

## Installation

```bash
pnpm add @udixio/icons-sharp-100
```

## Usage

Import icons individually by name. Each icon is a standalone module, ensuring only the icons you use are included in your bundle.

```ts
import { iHome } from '@udixio/icons-sharp-100/home'
import { iSettings } from '@udixio/icons-sharp-100/settings'
import { iSearch } from '@udixio/icons-sharp-100/search'
```

### Filled variants

Filled versions are available under the `/filled/` path:

```ts
import { iHomeFilled } from '@udixio/icons-sharp-100/filled/home'
import { iStarFilled } from '@udixio/icons-sharp-100/filled/star'
```

### With @udixio/ui-react

```tsx
import { Icon, IconButton } from '@udixio/ui-react'
import { iStar } from '@udixio/icons-sharp-100/star'
import { iStarFilled } from '@udixio/icons-sharp-100/filled/star'

// Simple icon
<Icon icon={iStar} />

// Toggle icon button
<IconButton
  icon={iStar}
  iconSelected={iStarFilled}
  onToggle={(active) => console.log(active)}
/>
```

## Icon names

Icons follow the naming convention `i{PascalCaseName}` (e.g., `iKeyboardArrowDown`, `iDarkMode`). Filled variants append `Filled` (e.g., `iStarFilled`).

Browse all available icons at [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Sharp&icon.weight=100).

## License

Apache-2.0
