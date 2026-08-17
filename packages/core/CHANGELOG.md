## 0.2.2-next.1 (2026-08-16)

This was a version bump only for @udixio/core to align it with other projects, there were no code changes.

## 0.2.2-next.0 (2026-08-13)

### 🚀 Features

- **icon-button:** restore accessible default tooltips ([9bfe6917](https://github.com/Udixio/UI/commit/9bfe6917))

### 🩹 Fixes

- **tooltip:** restore Material interaction and motion ([090d4eb6](https://github.com/Udixio/UI/commit/090d4eb6))
- **text-field:** align outlined label with leading icon ([0dc1fb1d](https://github.com/Udixio/UI/commit/0dc1fb1d))

### ❤️ Thank You

- Joël VIGREUX

## 0.2.1 (2026-08-11)

### 🩹 Fixes

- **release:** add repository field so provenance verification passes ([60834f4d](https://github.com/Udixio/UI/commit/60834f4d))

### ❤️ Thank You

- Claude Sonnet 5
- Joël VIGREUX

## 0.2.0 (2026-08-11)

This was a version bump only for @udixio/core to align it with other projects, there were no code changes.

## 0.1.1 (2026-08-10)

### 🩹 Fixes

- **release:** make @udixio/core and @udixio/ui-angular publishable ([95a1af3a](https://github.com/Udixio/UI/commit/95a1af3a))

### ❤️ Thank You

- Claude Sonnet 5
- Joël VIGREUX

## 0.1.0 (2026-08-10)

### 🚀 Features

- **carousel:** add the Angular adapter ([002f1796](https://github.com/Udixio/UI/commit/002f1796))
- **components:** add remaining parity updates ([10f69d94](https://github.com/Udixio/UI/commit/10f69d94))
- **menu:** finalize cross-framework menu family ([7a8a70ad](https://github.com/Udixio/UI/commit/7a8a70ad))
- **ui:** finalize Chip and Chips parity ([1e51414b](https://github.com/Udixio/UI/commit/1e51414b))
- **checkbox:** complete multi-framework component ([67a3e5ae](https://github.com/Udixio/UI/commit/67a3e5ae))
- **core:** add shared CustomScroll DOM controller ([60d456ab](https://github.com/Udixio/UI/commit/60d456ab))
- ⚠️  **card:** stabilize cross-framework API ([6f40ca1d](https://github.com/Udixio/UI/commit/6f40ca1d))
- ⚠️  **icon-button,fab,fab-menu:** stabilize cross-framework API ([e387c06c](https://github.com/Udixio/UI/commit/e387c06c))
- ⚠️  **button:** stabilize cross-framework API ([32434571](https://github.com/Udixio/UI/commit/32434571))
- standardize multiframework API documentation ([558fc406](https://github.com/Udixio/UI/commit/558fc406))
- unify multi-framework docs and component states ([5348bfcf](https://github.com/Udixio/UI/commit/5348bfcf))
- **ui-angular:** minimal Button consuming @udixio/core ([d4064b8e](https://github.com/Udixio/UI/commit/d4064b8e))

### 🩹 Fixes

- **date-picker:** redesign DatePicker, add Angular adapter, share Icon interface ([17e6aa91](https://github.com/Udixio/UI/commit/17e6aa91))
- **text-field:** redesign TextField, add Angular adapter, add extensible mask prop ([801799ef](https://github.com/Udixio/UI/commit/801799ef))
- **tooltip:** redesign Tooltip/AnchorPositioner, add Angular adapter, drop motion/react ([d0e708c6](https://github.com/Udixio/UI/commit/d0e708c6))
- **switch:** redesign Switch, add Angular adapter, Anime.js tween thumb animation ([17c45a32](https://github.com/Udixio/UI/commit/17c45a32))
- **tabs:** redesign Tab family, add Angular adapter, shared Motion animation ([a7cabe1c](https://github.com/Udixio/UI/commit/a7cabe1c))
- **side-sheet:** add Angular adapter, controlled open contract, shared Motion animation ([2f000266](https://github.com/Udixio/UI/commit/2f000266))
- **snackbar:** add Angular adapter, controlled open contract, shared Motion animation ([0fc0cf9c](https://github.com/Udixio/UI/commit/0fc0cf9c))
- **slider:** add Angular adapter, controlled contract, shared drag/animation ([1ba1dba4](https://github.com/Udixio/UI/commit/1ba1dba4))
- **navigation-rail:** stop labels flashing double before hydration ([5cc44676](https://github.com/Udixio/UI/commit/5cc44676))
- **navigation-rail:** build Angular parity, fix controlled/key/a11y defects, share Motion animation ([130eae26](https://github.com/Udixio/UI/commit/130eae26))
- **progress-indicator:** add Angular adapter, wire ARIA, fix animation defects ([07c82ad4](https://github.com/Udixio/UI/commit/07c82ad4))
- ⚠️  **carousel:** correct controlled index contract, add defaultIndex ([2b8dc418](https://github.com/Udixio/UI/commit/2b8dc418))
- **fab-menu:** restore motion and examples ([29aae7f4](https://github.com/Udixio/UI/commit/29aae7f4))
- **button:** finalize cross-framework component ([0d1ee417](https://github.com/Udixio/UI/commit/0d1ee417))
- restore ui-react public exports and move TextField interactive flags to states ([2a3577df](https://github.com/Udixio/UI/commit/2a3577df))

### 🔥 Performance

- ⚠️  **core:** single-pass Tailwind class merge engine ([1117857b](https://github.com/Udixio/UI/commit/1117857b))

### ⚠️  Breaking Changes

- **carousel:** correct controlled index contract, add defaultIndex  ([2b8dc418](https://github.com/Udixio/UI/commit/2b8dc418))
  `onChange` is renamed `onIndexChange`.
  Carousel had a double source of truth: the resolved selected index was
  always the internally scroll-driven `selectedItem`, and a controlled
  `index` prop only nudged scroll once (comparing `index !== selectedItem`)
  before scroll took back over. This violates docs/component-behavior.md
  §2 (a controlled value must be the single source of truth; interaction
  notifies without self-mutating) and diverges from the established
  value/defaultValue/onXChange convention used by Button/Checkbox/Chip/Menu.
  Fixed by wiring `index`/`defaultIndex`/`onIndexChange` through the shared
  `useControllableState` primitive, matching every other component family.
  `onChange` becomes `onIndexChange` per repo convention (React prefixes
  with `on`; Angular sync will use bare `indexChange`).
  Also fixed a real bug this surfaced: the DOM controller always started
  its spring at progress 0 regardless of the resolved initial index, so any
  nonzero `defaultIndex`/`index` was silently overwritten back to 0 right
  after mount. The controller is now seeded via `setProgress` at the
  resolved initial index instead of an implicit `update()` at 0.
  Component is @status beta (unreleased contract), so no deprecated alias.
  Updated the MDX overview examples and regenerated the API doc; also
  dropped a stale `marginPourcent` reference left over from its earlier
  removal. Added controlled/uncontrolled initial-selection tests.
  tsc clean (0 errors); ui-react 122/122, core unaffected.
- **core:** single-pass Tailwind class merge engine  ([1117857b](https://github.com/Udixio/UI/commit/1117857b))
  @udixio/core no longer exports useClassNames,
  createUseClassNames, or the lowercase classnames alias. Use classNames, or cx
  for conflict-free concatenation.
- **card:** stabilize cross-framework API  ([6f40ca1d](https://github.com/Udixio/UI/commit/6f40ca1d))
  `interactive` now renders `role="button"` with
  `tabindex="0"` instead of being a purely visual affordance. Consumers
  that supplied their own semantics with a nested control should move the
  destination to `href` on the card, or drop `interactive` on the
  container wrapping their own interactive element. No compatibility alias
  is provided.
- **icon-button,fab,fab-menu:** stabilize cross-framework API  ([e387c06c](https://github.com/Udixio/UI/commit/e387c06c))
  IconButton renames iconSelected to pressedIcon,
  activated to pressed, onToggle to onPressedChange, and replaces
  allowShapeTransformation with shapeFeedback; label and icon are now
  required, and semantic toggling requires the new toggleable prop. Fab
  and FabMenu now require label. FabMenu takes a declarative actions array
  instead of framework-specific children, and no longer accepts
  onOpenChange. Exported state types (IconButtonStates, FabMenuStates,
  Elements) are removed in favour of the interface members, and the
  IconButton state isActive is renamed isPressed.
- **button:** stabilize cross-framework API  ([32434571](https://github.com/Udixio/UI/commit/32434571))
  replace disableTextMargins and allowShapeTransformation with edgeAligned and shapeFeedback, require one React content source, and standardize pressed-state behavior without compatibility aliases.

### ❤️ Thank You

- Claude Opus 4.8
- Claude Sonnet 5
- Joël VIGREUX