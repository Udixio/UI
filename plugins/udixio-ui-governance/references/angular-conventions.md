# Angular adapter conventions

What an Angular adapter looks like when it is idiomatic. [sync-angular-component](../skills/sync-angular-component/SKILL.md)
owns the conversion procedure; the audit skills cite this page instead of restating it.

## Shape

- Standalone component with `OnPush`, or an attribute directive when the primary behavior attaches
  to an element the consumer already owns. A service fits behavior with no host; a pipe fits a pure
  transformation. Choosing a shape that differs from React requires an accepted `FORM-*` finding.
- Selector prefix: read it from neighboring components; never assume it. A directive's inputs are
  prefixed with the directive name (`udxProgressIndicatorValue`) because the host is not its own.

## Binding idiom

- One typed `input()` per contract prop, holding the real value; `output()` per callback, without
  React's `on` prefix (`onValueChange` → `valueChange`).
- Content projection through `<ng-content>` or typed templates; never a React-shaped `children`
  input.
- Signals, `computed`, and the repository's controllable-state primitive own reactive state.
- `afterRenderEffect` connects `@udixio/core/dom` controllers; every controller is destroyed.
- A directive injects its own `ElementRef`; a component queries its own view. An input that only
  carries a `ref` or `targetRef` is a transliterated mechanism.

## Host element

The component host is a real element: account for it in semantics, layout, CSS inheritance, border
radius, clipping, and event targeting, with tests.
