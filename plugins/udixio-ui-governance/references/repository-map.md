# Repository map

Resolve the repository root from the current working directory. Verify paths before editing because
the repository can evolve.

## Canonical layers

| Concern                | Canonical location                         | Rule                                                           |
| ---------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Shared public contract | `packages/core/src/lib/interfaces/`        | Framework-agnostic props and resolved states                   |
| Shared styling         | `packages/core/src/lib/styles/`            | Pure class computation, no runtime framework                   |
| Shared behavior        | `packages/core/src/lib/behaviors/`         | Pure state transitions and semantic decisions                  |
| Shared DOM effects     | `packages/core/src/lib/dom/`               | One imperative implementation, Motion JavaScript when animated |
| React source adapter   | `packages/ui-react/src/lib/components/`    | Default product source when no exception is documented         |
| Angular adapter        | `packages/ui-angular/src/lib/<component>/` | Thin Angular binding over the shared contract                  |
| React tests            | `packages/ui-react/src/tests/`             | User-visible behavior and DOM contract                         |
| Angular tests          | `packages/ui-angular/src/lib/<component>/` | Same scenario matrix as React                                  |
| Component overview     | `apps/doc/src/data/components/`            | MDX overview and direct source imports                         |
| Examples               | `apps/doc/src/examples/{react,angular}/`   | Compilable framework-native examples                           |

Read `docs/component-authoring.md` and `docs/component-behavior.md` before making architectural
judgments. Repository documentation outranks this reference when it is newer and internally
consistent. Report contradictions instead of guessing.

## Naming map

- Component symbol: `ProgressIndicator`.
- File stem and route: `progress-indicator`.
- React file: `ProgressIndicator.tsx`.
- Angular selector: `lib-progress-indicator`.
- Core files: `progress-indicator.interface.ts`, `progress-indicator.style.ts`, and an optional
  `progress-indicator.behavior.ts`.
- React public props: `ReactProgressIndicatorProps`.
- Angular inputs use contract names; outputs drop React's `on` prefix (`onValueChange` maps to
  `valueChange`).

## Discovery

Run the inventory before every audit or synchronization:

```bash
python3 plugins/udixio-ui-governance/scripts/component_inventory.py <component> --root .
```

Treat its result as path discovery, not semantic proof. Inspect every reported candidate and public
barrel before concluding that an artifact is present or absent.
