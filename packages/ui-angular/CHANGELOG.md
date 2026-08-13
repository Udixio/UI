## 0.2.1 (2026-08-11)

### 🩹 Fixes

- **release:** add repository field so provenance verification passes ([60834f4d](https://github.com/Udixio/UI/commit/60834f4d))

### 🧱 Updated Dependencies

- Updated @udixio/core to 0.2.1

### ❤️ Thank You

- Claude Sonnet 5
- Joël VIGREUX

## 0.2.0 (2026-08-11)

### 🩹 Fixes

- **release:** resolve workspace:* for ui-angular's dist manifest too ([7697a100](https://github.com/Udixio/UI/commit/7697a100))

### 🧱 Updated Dependencies

- Updated @udixio/core to 0.2.0
- Updated @udixio/icons-rounded-400 to 0.2.1

### ❤️ Thank You

- Claude Sonnet 5
- Joël VIGREUX

## 0.1.1 (2026-08-10)

### 🩹 Fixes

- **release:** make @udixio/core and @udixio/ui-angular publishable ([95a1af3a](https://github.com/Udixio/UI/commit/95a1af3a))

### 🧱 Updated Dependencies

- Updated @udixio/core to 0.1.1

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
- ⚠️  **card:** stabilize cross-framework API ([6f40ca1d](https://github.com/Udixio/UI/commit/6f40ca1d))
- ⚠️  **icon-button,fab,fab-menu:** stabilize cross-framework API ([e387c06c](https://github.com/Udixio/UI/commit/e387c06c))
- ⚠️  **button:** stabilize cross-framework API ([32434571](https://github.com/Udixio/UI/commit/32434571))
- standardize multiframework API documentation ([558fc406](https://github.com/Udixio/UI/commit/558fc406))
- unify multi-framework docs and component states ([5348bfcf](https://github.com/Udixio/UI/commit/5348bfcf))
- **ui-angular:** add createStyle signal primitive ([eee1403d](https://github.com/Udixio/UI/commit/eee1403d))
- **ui-angular:** minimal Button consuming @udixio/core ([d4064b8e](https://github.com/Udixio/UI/commit/d4064b8e))
- add @udixio/ui-angular publishable library ([eaf11ac3](https://github.com/Udixio/UI/commit/eaf11ac3))

### 🩹 Fixes

- **date-picker:** redesign DatePicker, add Angular adapter, share Icon interface ([17e6aa91](https://github.com/Udixio/UI/commit/17e6aa91))
- **text-field:** redesign TextField, add Angular adapter, add extensible mask prop ([801799ef](https://github.com/Udixio/UI/commit/801799ef))
- **tooltip:** redesign Tooltip/AnchorPositioner, add Angular adapter, drop motion/react ([d0e708c6](https://github.com/Udixio/UI/commit/d0e708c6))
- **switch:** redesign Switch, add Angular adapter, Anime.js tween thumb animation ([17c45a32](https://github.com/Udixio/UI/commit/17c45a32))
- **tabs:** redesign Tab family, add Angular adapter, shared Motion animation ([a7cabe1c](https://github.com/Udixio/UI/commit/a7cabe1c))
- **side-sheet:** add Angular adapter, controlled open contract, shared Motion animation ([2f000266](https://github.com/Udixio/UI/commit/2f000266))
- **snackbar:** add Angular adapter, controlled open contract, shared Motion animation ([0fc0cf9c](https://github.com/Udixio/UI/commit/0fc0cf9c))
- **button:** stop rendering <div> inside native <button> elements ([3d25c5ea](https://github.com/Udixio/UI/commit/3d25c5ea))
- **slider:** add Angular adapter, controlled contract, shared drag/animation ([1ba1dba4](https://github.com/Udixio/UI/commit/1ba1dba4))
- **navigation-rail:** stop labels flashing double before hydration ([5cc44676](https://github.com/Udixio/UI/commit/5cc44676))
- **navigation-rail:** build Angular parity, fix controlled/key/a11y defects, share Motion animation ([130eae26](https://github.com/Udixio/UI/commit/130eae26))
- **progress-indicator:** add Angular adapter, wire ARIA, fix animation defects ([07c82ad4](https://github.com/Udixio/UI/commit/07c82ad4))
- **carousel:** stop the controlled-index echo from fighting free scroll ([6b78530e](https://github.com/Udixio/UI/commit/6b78530e))
- **carousel-angular:** stop recreating controllers on every resize ([aead4c4f](https://github.com/Udixio/UI/commit/aead4c4f))
- **carousel-angular:** stop breaking the flex layout via display:contents ([6ada6e82](https://github.com/Udixio/UI/commit/6ada6e82))
- **carousel-angular:** drop non-item projected content (PARITY-DOM-001) ([aee7065b](https://github.com/Udixio/UI/commit/aee7065b))
- **fab-menu:** restore motion and examples ([29aae7f4](https://github.com/Udixio/UI/commit/29aae7f4))
- **button:** finalize cross-framework component ([0d1ee417](https://github.com/Udixio/UI/commit/0d1ee417))
- **review:** conform React Button style call and soften Angular doc comment ([55ef5d96](https://github.com/Udixio/UI/commit/55ef5d96))

### ⚠️  Breaking Changes

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

### 🧱 Updated Dependencies

- Updated @udixio/core to 0.1.0
- Updated @udixio/icons-rounded-400 to 0.2.0

### ❤️ Thank You

- Claude Opus 4.8
- Claude Sonnet 5
- Joël VIGREUX