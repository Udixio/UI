# @udixio/core

The framework-agnostic half of the Udixio component library.

A component's props, its class names, and the behaviour behind it — keyboard
handling, focus, controlled state, motion — do not depend on React or Angular.
This package holds that part, so
[`@udixio/ui-react`](https://www.npmjs.com/package/@udixio/ui-react) and
[`@udixio/ui-angular`](https://www.npmjs.com/package/@udixio/ui-angular) are
thin adapters over one shared definition rather than two implementations that
drift apart.

You rarely install it directly — both framework packages pull it in. Reach for
it when you build a component of your own on the same footing, or when you want
a component's contract without its rendering.

## Using an AI coding agent?

See [ui.udixio.fr/agents](https://ui.udixio.fr/agents) for a Claude Code/Codex plugin that resolves
this package's exact installed API and usage patterns — or a plain-markdown doc mirror any agent
can fetch with zero setup.

## What is in it

| | |
|---|---|
| **Interfaces** | The props of every component — `ButtonProps`, `TextFieldProps`, and thirty-odd others. One declaration, both frameworks. |
| **Styles** | A style function per component, mapping props to the Tailwind classes of each part. `buttonStyle({ variant: 'filled' })` returns `{ button, touchTarget, stateLayer, label, icon }`. |
| **Behaviours** | The logic that has nothing to do with rendering: keyboard navigation, focus management, ripple and state layers, anchoring, scroll locking. |
| **Utils** | Class merging, controlled-state resolution, and the small helpers the adapters share. |
| `@udixio/core/dom` | DOM-only helpers, kept out of the main entry so a server render never reaches for them. |

Colours and typography come from
[`@udixio/theme`](https://www.npmjs.com/package/@udixio/theme): the style
functions emit token classes — `bg-primary`, `text-on-surface-variant` — and
never a literal colour, which is why one theme drives every component.

## Why it exists

Keeping a component in two frameworks means keeping two of everything: props,
class names, states, accessibility. They diverge, quietly, and the divergence
surfaces as a bug in one framework that cannot be reproduced in the other.

Splitting it means a fix lands once. A change to `buttonStyle` reaches React
and Angular in the same commit, and the two test suites check the same
contract.

## Development

```bash
npx nx build core
npx nx test core
```

## Documentation

[ui.udixio.fr](https://ui.udixio.fr) — each component page carries the shared
props alongside the React and Angular usage.
