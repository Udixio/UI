# Repository map

Resolve the repository root from the current working directory. Verify paths before editing because
the repository can evolve.

## Canonical layers

| Concern                  | Canonical location                                          | Rule                                                                 |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Shared public contract   | `packages/core/src/lib/interfaces/`                         | Framework-agnostic props and resolved states                         |
| Shared styling           | `packages/core/src/lib/styles/`                             | Pure class computation, no runtime framework                         |
| Shared behavior          | `packages/core/src/lib/behaviors/`                          | Pure state transitions and semantic decisions                        |
| Shared DOM effects       | `packages/core/src/lib/dom/`                                | One imperative implementation, anime.js when animated                |
| React source adapter     | `packages/ui-react/src/lib/components/`                     | Default product source when no exception is documented               |
| Angular adapter          | `packages/ui-angular/src/lib/<component>/`                  | Thin Angular binding over the shared contract                        |
| React tests              | `packages/ui-react/src/tests/`                              | User-visible behavior and DOM contract                               |
| Angular tests            | `packages/ui-angular/src/lib/<component>/`                  | Same scenario matrix as React                                        |
| Component overview       | `apps/doc/src/data/components/`                             | MDX overview and direct source imports                               |
| Examples                 | `apps/doc/src/examples/{react,angular}/`                    | Compilable framework-native examples                                 |
| API documentation source | Public React/Angular adapters and core contracts            | TSDoc/JSDoc descriptions, defaults, `@devx`, `@a11y`, `@limitations` |
| API generator            | `apps/doc/scripts/docgen.js`                                | Extract shared and framework-native API without relabeling           |
| Generated API data       | `apps/doc/src/data/api/<component>.json`                    | Versioned generated artifact; never the semantic authority           |
| API schema validator     | `plugins/udixio-ui-governance/scripts/validate_api_docs.py` | Deterministic schema, availability, and normalized member checks     |
| API renderer             | `apps/doc/src/pages/components/[component]/api.astro`       | Render only API payloads that exist for the selected framework       |
| Framework preference     | `apps/doc/src/stores/exampleFrameworkStore.ts`              | One preference shared by examples, code, and API pages               |

Shared animated effects are implemented once in `@udixio/core/dom` with **anime.js**, chosen because
it is plain JavaScript and therefore consumable identically by React and Angular. The `motion` package survives only as residue to retire, not as a pattern to reproduce: three
type-only `Transition` imports in `Chip`, `NavigationRail` and `NavigationRailItem`, which are
erased at compile time, and two runtime `animate` imports in the React and Angular Slider specs. No
runtime `motion/react` import remains in either adapter. Touching one of those files for an
unrelated reason does not require migrating it, but **adding** an animated effect requires moving
that effect down into `core/dom`.

Read `docs/component-authoring.md` and `docs/component-behavior.md` before making architectural
judgments. Repository documentation outranks this reference when it is newer and internally
consistent. Report contradictions instead of guessing.

## Naming map

- Component symbol: `ProgressIndicator`.
- File stem and route: `progress-indicator`.
- React file: `ProgressIndicator.tsx`.
- Angular component selector: `udx-progress-indicator`. Verify the prefix against neighboring
  components before assuming it; this reference is not a substitute for reading the source.
- Angular attribute-directive selector: `[udxProgressIndicator]`, with inputs prefixed the same way
  (`udxProgressIndicatorValue`) because the host element is not the directive's own. The prefix is
  the exception that a directive's shape justifies, not a general naming rule.
- Core files: `progress-indicator.interface.ts`, `progress-indicator.style.ts`, and an optional
  `progress-indicator.behavior.ts`.
- React public props: `ReactProgressIndicatorProps`.
- Angular inputs otherwise use contract names; outputs drop React's `on` prefix (`onValueChange`
  maps to `valueChange`).

## Discovery

Run the inventory before every audit or synchronization:

```bash
python3 plugins/udixio-ui-governance/scripts/component_inventory.py <component> --root .
```

Treat its result as path discovery, not semantic proof. `apiDocumentationSources` is the union of
the discovered shared, React, and Angular public sources; inclusion does not prove that its comments
are correct or selected by docgen. Inspect every reported candidate, generated artifact,
documentation infrastructure file, and public barrel before concluding that an artifact is present
or absent.
