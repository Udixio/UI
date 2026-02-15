# @udixio/icons-rounded-600

[Material Symbols](https://fonts.google.com/icons) icons as tree-shakable SVG strings — **rounded** style, weight **600**.

Part of the [@udixio/ui](https://github.com/Udixio/UI) ecosystem.

## Installation

```bash
pnpm add @udixio/icons-rounded-600
```

## Usage

Import icons individually by name. Each icon is a standalone module, ensuring only the icons you use are included in your bundle.

```ts
import { iHome } from '@udixio/icons-rounded-600/home'
import { iSettings } from '@udixio/icons-rounded-600/settings'
import { iSearch } from '@udixio/icons-rounded-600/search'
```

### Filled variants

Filled versions are available under the `/filled/` path:

```ts
import { iHomeFilled } from '@udixio/icons-rounded-600/filled/home'
import { iStarFilled } from '@udixio/icons-rounded-600/filled/star'
```

### With @udixio/ui-react

```tsx
import { Icon, IconButton } from '@udixio/ui-react'
import { iStar } from '@udixio/icons-rounded-600/star'
import { iStarFilled } from '@udixio/icons-rounded-600/filled/star'

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

Browse all available icons at [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Rounded&icon.weight=600).

## License

Apache-2.0
