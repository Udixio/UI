# @udixio/icons-rounded-500

[Material Symbols](https://fonts.google.com/icons) icons as tree-shakable SVG strings — **rounded** style, weight **500**.

Part of the [@udixio/ui](https://github.com/Udixio/UI) ecosystem.

## Installation

```bash
pnpm add @udixio/icons-rounded-500
```

## Usage

Import icons individually by name. Each icon is a standalone module, ensuring only the icons you use are included in your bundle.

```ts
import { iHome } from '@udixio/icons-rounded-500/home'
import { iSettings } from '@udixio/icons-rounded-500/settings'
import { iSearch } from '@udixio/icons-rounded-500/search'
```

### Filled variants

Filled versions are available under the `/filled/` path:

```ts
import { iHomeFilled } from '@udixio/icons-rounded-500/filled/home'
import { iStarFilled } from '@udixio/icons-rounded-500/filled/star'
```

### With @udixio/ui-react

```tsx
import { Icon, IconButton } from '@udixio/ui-react'
import { iStar } from '@udixio/icons-rounded-500/star'
import { iStarFilled } from '@udixio/icons-rounded-500/filled/star'

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

Browse all available icons at [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Rounded&icon.weight=500).

## License

Apache-2.0
