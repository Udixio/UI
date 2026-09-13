## 0.2.2-next.7 (2026-09-13)

### 🚀 Features

- **badge:** animate showing and hiding with anime.js ([347c5973](https://github.com/Udixio/UI/commit/347c5973))
- ⚠️  **badge:** deliver the Angular badge as a directive, and put it on rail items ([8d89131c](https://github.com/Udixio/UI/commit/8d89131c))
- **badge:** add the Material 3 badge to both frameworks ([0e241b3b](https://github.com/Udixio/UI/commit/0e241b3b))
- ⚠️  **doc:** give each component one description, from its shared contract ([37c1b5a7](https://github.com/Udixio/UI/commit/37c1b5a7))
- **core:** add a shared tooltip trigger controller ([f6ddcc36](https://github.com/Udixio/UI/commit/f6ddcc36))

### 🩹 Fixes

- **core:** iterate classList via Array.from so ui-angular compiles ([5d24f18f](https://github.com/Udixio/UI/commit/5d24f18f))
- **anchor-positioner:** mirror only island theme scopes, and follow their changes ([d8d15489](https://github.com/Udixio/UI/commit/d8d15489))
- ⚠️  **tooltip:** let a closed surface pass pointers, inherit the anchor's theme, and follow the M3 tokens ([d18d8864](https://github.com/Udixio/UI/commit/d18d8864))
- **badge:** give the Angular string-form classes a target ([efc55a0c](https://github.com/Udixio/UI/commit/efc55a0c))
- **badge:** announce the description as live-region content, not a name ([4db7e989](https://github.com/Udixio/UI/commit/4db7e989))
- **badge:** stop clamping the label, and anchor the examples to icons ([fc758c92](https://github.com/Udixio/UI/commit/fc758c92))
- ⚠️  **chip:** give Angular the selection transition React always had ([1c08bdb6](https://github.com/Udixio/UI/commit/1c08bdb6))
- ⚠️  **state-layer:** let the colour prop win, and stop failing silently ([b876b659](https://github.com/Udixio/UI/commit/b876b659))
- **core:** measure the layout viewport in the anchor fallback ([19ada95c](https://github.com/Udixio/UI/commit/19ada95c))
- **core:** make the anchor fallback place corners where position-area does ([c52f7ade](https://github.com/Udixio/UI/commit/c52f7ade))
- **tooltip:** align rich tooltip action labels with the supporting text ([656511aa](https://github.com/Udixio/UI/commit/656511aa))
- **core:** claim tooltip visibility on a controlled open ([b9fe7b62](https://github.com/Udixio/UI/commit/b9fe7b62))

### ⚠️  Breaking Changes

- **tooltip:** let a closed surface pass pointers, inherit the anchor's theme, and follow the M3 tokens  ([d18d8864](https://github.com/Udixio/UI/commit/d18d8864))
- **badge:** deliver the Angular badge as a directive, and put it on rail items  ([8d89131c](https://github.com/Udixio/UI/commit/8d89131c))
  `udx-badge` is removed in favour of `[udxBadge]`.
- **doc:** give each component one description, from its shared contract  ([37c1b5a7](https://github.com/Udixio/UI/commit/37c1b5a7))
  generated API documents move `description` from each
  framework payload to the document root, and require schemaVersion 4.
- **chip:** give Angular the selection transition React always had  ([1c08bdb6](https://github.com/Udixio/UI/commit/1c08bdb6))
  `StateLayer` no longer accepts `style` in
  @udixio/ui-react; pass `transitionDuration` for the case it served.
- **state-layer:** let the colour prop win, and stop failing silently  ([b876b659](https://github.com/Udixio/UI/commit/b876b659))
  `StateLayer` no longer accepts `children` in
  @udixio/ui-react. Components restyling a Button's surface must declare
  `stateColor`; the `--default-color` CSS variable is no longer read.

### ❤️ Thank You

- Claude Opus 5
- Joël VIGREUX

## 0.2.2-next.6 (2026-08-28)

### 🩹 Fixes

- **search:** align contained results and dismissal ([ccc7c2de](https://github.com/Udixio/UI/commit/ccc7c2de))

### ❤️ Thank You

- Joël VIGREUX

## 0.2.2-next.5 (2026-08-27)

### 🩹 Fixes

- **fab-menu:** restore synchronized trigger motion ([ff2566b7](https://github.com/Udixio/UI/commit/ff2566b7))

### ❤️ Thank You

- Joël VIGREUX

## 0.2.2-next.4 (2026-08-26)

### 🩹 Fixes

- **button:** keep flex display for links ([73e7f252](https://github.com/Udixio/UI/commit/73e7f252))

### ❤️ Thank You

- Joël VIGREUX

## 0.2.2-next.3 (2026-08-24)

### 🚀 Features

- **button:** add support for `hasHref` to adjust display style based on link presence ([6a08df79](https://github.com/Udixio/UI/commit/6a08df79))
- **search:** add cross-framework Search component ([1a8b15a4](https://github.com/Udixio/UI/commit/1a8b15a4))

### 🩹 Fixes

- **theme:** synchronize dynamic palette overrides ([3072edb1](https://github.com/Udixio/UI/commit/3072edb1))

### ❤️ Thank You

- Joël VIGREUX

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