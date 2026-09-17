# Angular `class` alias & element classes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Angular consumers write `<udx-button class="mt-4">` and `[classes]="{ label: '…' }"` by adding a static per-element form to the core `className` contract and aliasing Angular's native `class` onto every component's root.

**Architecture:** The core class engine (`getClassNames`) gains a third `className` form — a static `ElementClasses<T>` object — and a `mergeClassNames` composer. Every Angular component replaces `classes: string | fn` with two inputs: `hostClass` (aliased `class`, string, routed to the root through the core) and `classes` (object | fn, no string). React changes nothing in code; its `className` type widens. Doc examples migrate from `classes="…"` to `class="…"`.

**Tech Stack:** TypeScript, `@udixio/core` (vitest, `tailwind-merge`), `@udixio/ui-angular` (Angular 21, signal inputs, jest + `@angular/core/testing`), `@udixio/ui-react` (vitest + testing-library), `apps/doc` (Astro, `docgen.js`).

**Spec:** `docs/superpowers/specs/2026-09-17-angular-class-alias-and-element-classes-design.md`

## Global Constraints

- Precedence, always: style defaults → `classes` (object/fn) → `class` (string). `twMerge` resolves conflicts once, per element, inside `getClassNames`.
- `classes` on Angular **components** no longer accepts `string`. Directives (`[udxBadge]`, `[udxTooltip]`) keep their prefixed inputs (`udxBadgeClass`, `udxTooltipClass`) **with** `string`: their host is the consumer's element, so `class` cannot be aliased there.
- No backward-compat alias, no deprecation shim.
- Every new or renamed input carries its own TSDoc. Never derive a description from a React-to-Angular name match.
- Every new core symbol is exported from the package index ([[feedback_no-internal-only-logic]]).
- Angular builds: `npx nx build ui-angular --skip-sync` ([[nx-sync-drift-ui-angular]]). Strip ANSI before grepping compiler output: `… 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep 'error TS'`.
- `apps/doc` examples are not type-checked by any gate ([[doc-examples-not-typechecked]]); every call site is found by `grep`, not by the compiler.
- Commit after each task. Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File map

| File | Responsibility |
| --- | --- |
| `packages/core/src/lib/utils/styles/get-classname.ts` | Modify: `ElementClasses<T>`, widen `StyleProps.className`, object branch in `getClassNames`, `mergeClassNames`. |
| `packages/core/src/lib/utils/styles/get-classname.spec.ts` | Create: unit tests for the object form, precedence, `mergeClassNames`. |
| `packages/ui-angular/src/lib/<component>/<component>.ts` (34 components) | Modify: `hostClass` + narrowed `classes`, `mergeClassNames` in the style state, `@limitations` line. |
| `packages/ui-angular/src/lib/button/button.spec.ts`, `tabs/tabs.spec.ts` | Modify: behavioural tests on a `display: contents` host and a root-host component. |
| `packages/ui-angular/src/lib/class-alias.spec.ts` | Create: matrix test — every component exposes `hostClass` aliased `class`. |
| `packages/ui-react/src/tests/TextField.spec.tsx` | Modify: lock the object form in React. |
| `apps/doc/src/examples/angular/*.ts` (14 files, 20 sites) | Modify: `classes="…"` → `class="…"`. |
| `apps/doc/src/examples/{react,angular}/text-field-element-classes.{tsx,ts}` | Create: object-form example. |
| `apps/doc/src/data/components/text-field.overview.mdx` | Modify: wire the new example. |
| `apps/doc/src/data/pages/get-started/angular.mdx` | Modify: "Styling a component" section with the `[class.x]` / `[ngClass]` limitation. |
| `apps/doc/src/data/api/*.json` | Regenerate via `pnpm --filter apps-doc docgen`. |

---

### Task 1: Core — `ElementClasses` and the static object form

**Files:**
- Modify: `packages/core/src/lib/utils/styles/get-classname.ts:21-48`
- Create: `packages/core/src/lib/utils/styles/get-classname.spec.ts`

**Interfaces:**
- Produces: `export type ElementClasses<T extends ComponentInterface> = Partial<Record<T['elements'][number], string>>`; `StyleProps<T>['className']` becomes `string | ElementClasses<T> | ClassNameComponent<T>`; `getClassNames.classNameList` accepts the same union. `ClassNameComponent<T>` now returns `ElementClasses<T>` (structurally identical to today).

- [x] **Step 1: Write the failing tests**

```ts
// packages/core/src/lib/utils/styles/get-classname.spec.ts
import { describe, expect, it } from 'vitest';
import {
  defaultClassNames,
  getClassNames,
  type ClassNameComponent,
  type ElementClasses,
} from './get-classname';
import type { ComponentInterface } from '../component';

interface Sample extends ComponentInterface {
  props: { variant: 'a' | 'b' };
  states: { pressed: boolean };
  elements: ['root', 'label', 'icon'];
}

const states = { variant: 'a', pressed: false } as const;

describe('getClassNames — static element object', () => {
  it('routes each key of an ElementClasses object to its element bucket', () => {
    const result = getClassNames<Sample>({
      classNameList: [{ label: 'uppercase', icon: 'rotate-45' }],
      default: 'root',
      states,
    });
    expect(result.label).toBe('label uppercase');
    expect(result.icon).toBe('icon rotate-45');
    // No item mentioned the root, so no bucket was created for it (existing behaviour).
    expect(result.root).toBeUndefined();
  });

  it('applies consumer values after style defaults, per element, through twMerge', () => {
    const defaults: ClassNameComponent<Sample> = () => ({
      root: 'bg-surface',
      label: 'text-on-surface',
    });
    const consumer: ElementClasses<Sample> = { label: 'text-primary' };
    // classNameList order mirrors defaultClassNames: [consumer, defaults]
    const result = getClassNames<Sample>({
      classNameList: [consumer, defaults],
      default: 'root',
      states,
    });
    expect(result.label).toBe('label text-primary');
    expect(result.label).not.toContain('text-on-surface');
    expect(result.root).toBe('root relative bg-surface');
  });

  it('defaultClassNames accepts the object form on className', () => {
    const style = defaultClassNames<Sample>('root', () => ({
      root: 'bg-surface',
      label: 'text-on-surface',
    }));
    const result = style({
      variant: 'a',
      pressed: false,
      className: { label: 'text-primary' },
    });
    expect(result.label).toBe('label text-primary');
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `npx nx test @udixio/core -- get-classname.spec.ts`
Expected: FAIL — the object is neither `string` nor callable; `classNameComponent(args.states)` throws `TypeError: classNameComponent is not a function`, and `ElementClasses` is not exported (type error).

- [x] **Step 3: Implement**

In `packages/core/src/lib/utils/styles/get-classname.ts`, replace lines 21-28 and the `forEach` body:

```ts
export interface StyleProps<T extends ComponentInterface> {
  /** Root classes (string), static element classes (object), or state-aware element classes (function). */
  className?: string | ElementClasses<T> | ClassNameComponent<T>;
}

/** Static classes per element, keyed by the interface's `elements` tuple. */
export type ElementClasses<T extends ComponentInterface> = Partial<
  Record<T['elements'][number], string>
>;

export type ClassNameComponent<T extends ComponentInterface> = (
  states: T['states'] & T['props'],
) => ElementClasses<T>;

export const getClassNames = <T extends ComponentInterface>(args: {
  classNameList: (
    | ClassNameComponent<T>
    | ElementClasses<T>
    | string
    | undefined
  )[];
  default: T['elements'][0];
  states: T['states'] & T['props'];
}): Record<T['elements'][number], string> => {
  const buckets: Partial<Record<T['elements'][number], string[]>> = {};
  args.classNameList.forEach((classNameComponent) => {
    if (!classNameComponent) return;
    if (typeof classNameComponent == 'string') {
      (buckets[args.default] ??= []).push(classNameComponent);
      return;
    }
    const result =
      typeof classNameComponent == 'function'
        ? classNameComponent(args.states)
        : classNameComponent;
    Object.entries(result).forEach((argsElement) => {
      const [key, value] = argsElement as [T['elements'][number], string];
      if (value) (buckets[key] ??= []).push(value);
    });
  });
  // … rest of the function unchanged (reverse, `relative`, kebab-case, classNames)
```

Update the `defaultClassNames` signature (`get-classname.ts:70-88`) so `states.className` and `defaultClassName` use the same union:

```ts
export const defaultClassNames = <T extends ComponentInterface>(
  element: T['elements'][0],
  defaultClassName: ClassNameComponent<T> | ElementClasses<T> | string,
) => {
  return (
    states: RequiredNullable<T['props']> &
      T['states'] & {
        className: ClassNameComponent<T> | ElementClasses<T> | string | undefined;
      },
  ) =>
    getClassNames({
      classNameList: [states.className, defaultClassName],
      default: element,
      states,
    });
};
```

- [x] **Step 4: Run tests**

Run: `npx nx test @udixio/core`
Expected: PASS, including `class-engine.characterization.spec.ts` unchanged (no existing output may drift).

- [x] **Step 5: Verify the export**

Run: `grep -n "ElementClasses" packages/core/src/lib/utils/styles/get-classname.ts && node -e "import('./packages/core/src/index.ts').catch(()=>{})"` is not meaningful for types; instead run `npx nx build @udixio/core` and check `grep -c "ElementClasses" dist/packages/core/index.d.ts` (or wherever `types` resolves) → `≥ 1`. `styles/index.ts` already re-exports `./get-classname`, so no index edit is needed.

- [x] **Step 6: Commit**

```bash
git add packages/core/src/lib/utils/styles/get-classname.ts packages/core/src/lib/utils/styles/get-classname.spec.ts
git commit -m "feat(core): accept a static per-element object as className

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Core — `mergeClassNames`

**Files:**
- Modify: `packages/core/src/lib/utils/styles/get-classname.ts` (append)
- Modify: `packages/core/src/lib/utils/styles/get-classname.spec.ts` (append)

**Interfaces:**
- Consumes: `ElementClasses<T>`, `ClassNameComponent<T>` from Task 1.
- Produces: `export const mergeClassNames = <T extends ComponentInterface>(defaultElement: T['elements'][0], ...items: (string | ElementClasses<T> | ClassNameComponent<T> | undefined | null)[]) => ClassNameComponent<T> | undefined`. A string item is routed to `defaultElement`. Returns `undefined` when every item is empty, so a component passing nothing keeps `className: undefined`.

- [x] **Step 1: Write the failing tests**

```ts
describe('mergeClassNames', () => {
  it('returns undefined when nothing is given', () => {
    expect(mergeClassNames<Sample>('root', undefined, '', null)).toBeUndefined();
  });

  it('composes strings, objects and functions in the order received', () => {
    const merged = mergeClassNames<Sample>(
      'root',
      () => ({ label: 'a' }),
      { label: 'b', icon: 'i' },
      'root-class',
    );
    const result = getClassNames<Sample>({
      classNameList: [merged],
      default: 'root',
      states,
    });
    // twMerge keeps both `a` and `b` (no conflict); order is preserved.
    expect(result.label).toBe('label a b');
    expect(result.icon).toBe('icon i');
    expect(result.root).toBe('root relative root-class');
  });

  it('lets a later string override an earlier object on the root through twMerge', () => {
    const merged = mergeClassNames<Sample>('root', { root: 'bg-surface' }, 'bg-primary');
    const result = getClassNames<Sample>({
      classNameList: [merged],
      default: 'root',
      states,
    });
    expect(result.root).toBe('root relative bg-primary');
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `npx nx test @udixio/core -- get-classname.spec.ts`
Expected: FAIL — `mergeClassNames` is not exported.

- [x] **Step 3: Implement**

Append to `get-classname.ts`:

```ts
/**
 * Composes several `className` values into one state-aware function, in the
 * order received. Later items win on conflicts because `getClassNames` runs
 * `twMerge` once per element over the concatenation. A string is routed to
 * `defaultElement`, exactly as a bare string `className` is.
 *
 * Returns `undefined` when every item is empty so a caller with nothing to
 * add keeps `className: undefined`.
 */
export const mergeClassNames = <T extends ComponentInterface>(
  defaultElement: T['elements'][0],
  ...items: (
    | string
    | ElementClasses<T>
    | ClassNameComponent<T>
    | undefined
    | null
  )[]
): ClassNameComponent<T> | undefined => {
  const present = items.filter(
    (item): item is string | ElementClasses<T> | ClassNameComponent<T> =>
      item != null && item !== '',
  );
  if (present.length === 0) return undefined;
  return (states) => {
    const out: Record<string, string[]> = {};
    present.forEach((item) => {
      const resolved: ElementClasses<T> =
        typeof item == 'string'
          ? ({ [defaultElement]: item } as ElementClasses<T>)
          : typeof item == 'function'
            ? item(states)
            : item;
      Object.entries(resolved).forEach(([key, value]) => {
        if (value) (out[key] ??= []).push(value as string);
      });
    });
    return Object.fromEntries(
      Object.entries(out).map(([key, values]) => [key, values.join(' ')]),
    ) as ElementClasses<T>;
  };
};
```

- [x] **Step 4: Run tests**

Run: `npx nx test @udixio/core`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/core/src/lib/utils/styles/get-classname.ts packages/core/src/lib/utils/styles/get-classname.spec.ts
git commit -m "feat(core): add mergeClassNames to compose className values in order

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Angular pilot — Button (`display: contents` host)

**Files:**
- Modify: `packages/ui-angular/src/lib/button/button.ts:16-24` (imports), `:50-53` (`@limitations`), `:157-158` (inputs), `:294` (style state)
- Modify: `packages/ui-angular/src/lib/button/button.spec.ts` (append tests)

**Interfaces:**
- Consumes: `ElementClasses`, `mergeClassNames` from `@udixio/core`.
- Produces: the canonical shape every other component copies in Task 5:
  ```ts
  readonly hostClass = input<string>('', { alias: 'class' });
  readonly classes = input<ElementClasses<XInterface> | ClassNameComponent<XInterface>>();
  // in the style state:
  className: mergeClassNames<XInterface>('<defaultElement>', this.classes(), this.hostClass()),
  ```
  where `<defaultElement>` is `XInterface['elements'][0]` (for Button: `'button'`).

- [x] **Step 1: Write the failing tests**

Append to `button.spec.ts`, inside the main `describe('Button', …)` block where `fixture` is a `ComponentFixture<Button>`:

```ts
  it('routes the native class attribute to the root button, not the host', () => {
    fixture.componentRef.setInput('hostClass', 'mt-4');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('mt-4');
  });

  it('lets a class string override a style default on the root through twMerge', () => {
    fixture.componentRef.setInput('variant', 'filled'); // default sets bg-primary
    fixture.componentRef.setInput('hostClass', 'bg-secondary');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('bg-secondary');
    expect(button.className).not.toContain('bg-primary ');
    expect(button.className).not.toMatch(/bg-primary$/);
  });

  it('applies a static element object to the named element only', () => {
    fixture.componentRef.setInput('classes', { label: 'uppercase' });
    fixture.componentRef.setInput('label', 'Save');
    fixture.detectChanges();
    const label: HTMLElement = fixture.nativeElement.querySelector('.label');
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(label.className).toContain('uppercase');
    expect(button.className).not.toContain('uppercase');
  });

  it('gives the class string precedence over the classes object on the root', () => {
    fixture.componentRef.setInput('classes', { button: 'bg-tertiary' });
    fixture.componentRef.setInput('hostClass', 'bg-secondary');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('bg-secondary');
    expect(button.className).not.toContain('bg-tertiary');
  });
```

And a template-level test proving the alias (add a host component near the existing ones at the top of the file):

```ts
@Component({
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<udx-button label="Go" class="mt-4" [class]="extra()" />`,
})
class ClassAliasHost {
  readonly extra = signal('shadow-1');
}
```

(add `signal` to the `@angular/core` import) and, in a new `describe('Button class alias', …)`:

```ts
  it('forwards static and bound class to the root button', () => {
    const f = TestBed.createComponent(ClassAliasHost);
    f.detectChanges();
    const button: HTMLButtonElement = f.nativeElement.querySelector('button');
    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('shadow-1');
    f.componentInstance.extra.set('shadow-2');
    f.detectChanges();
    expect(f.nativeElement.querySelector('button').className).toContain('shadow-2');
    expect(f.nativeElement.querySelector('button').className).not.toContain('shadow-1');
  });
```

- [x] **Step 2: Run to verify it fails**

Run: `npx nx test ui-angular -- button.spec.ts`
Expected: FAIL — `setInput('hostClass', …)` throws `NG0303` (unknown input); the `ClassAliasHost` test finds neither `mt-4` nor `shadow-1` on the inner `<button>`.

- [x] **Step 3: Implement**

In `button.ts`:

```ts
// imports from '@udixio/core' — add:
  type ElementClasses,
  mergeClassNames,
```

Replace lines 157-158:

```ts
  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  readonly classes = input<
    ElementClasses<ButtonInterface> | ClassNameComponent<ButtonInterface>
  >();
```

Replace line 294:

```ts
    className: mergeClassNames<ButtonInterface>(
      'button',
      this.classes(),
      this.hostClass(),
    ),
```

Add to the `@limitations` block (line 50-53):

```ts
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host and have no visible effect; use `class`, `[class]`, or `classes`.
```

- [x] **Step 4: Run tests**

Run: `npx nx test ui-angular -- button.spec.ts`
Expected: PASS.

- [x] **Step 5: Type gate**

Run: `npx nx build ui-angular --skip-sync 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -c 'error TS'`
Expected: `0`. (Other components still compile: their `classes` inputs are untouched and `mergeClassNames` is additive.)

- [x] **Step 6: Commit**

```bash
git add packages/ui-angular/src/lib/button/button.ts packages/ui-angular/src/lib/button/button.spec.ts
git commit -m "feat(ui-angular)!: alias native class onto the Button root, narrow classes to elements

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Angular pilot — TabPanel (host **is** the root)

**Files:**
- Modify: `packages/ui-angular/src/lib/tabs/tab-panel.ts:59` (input), `:90` (style state), imports, TSDoc
- Modify: `packages/ui-angular/src/lib/tabs/tabs.spec.ts` (append)

**Interfaces:**
- Consumes: the canonical shape from Task 3.
- Produces: proof that a component with `'[class]': 'styles()["x"]'` in `host` needs no special case.

- [x] **Step 1: Write the failing test**

Append to `tabs.spec.ts` (imports: reuse the existing `TabGroup`/`Tabs`/`Tab`/`TabPanels`/`TabPanel` host setup in that file; add a host component):

```ts
@Component({
  standalone: true,
  imports: [TabGroup, Tabs, Tab, TabPanels, TabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tab-group [defaultValue]="'a'">
      <udx-tabs><udx-tab value="a" label="A" /></udx-tabs>
      <udx-tab-panels>
        <udx-tab-panel value="a" class="p-8 absolute">Panel A</udx-tab-panel>
      </udx-tab-panels>
    </udx-tab-group>
  `,
})
class TabPanelClassHost {}

describe('TabPanel class alias (host is the root)', () => {
  it('merges the consumer class into the host [class] binding through twMerge', () => {
    TestBed.configureTestingModule({ imports: [TabPanelClassHost] });
    const f = TestBed.createComponent(TabPanelClassHost);
    f.detectChanges();
    const panel: HTMLElement = f.nativeElement.querySelector('udx-tab-panel');
    expect(panel.className).toContain('tab-panel');
    expect(panel.className).toContain('p-8');
    // The style default is `relative` (getClassNames unshifts it on the root).
    // Through twMerge the consumer's `absolute` must replace it, not sit beside it.
    expect(panel.className).toContain('absolute');
    expect(panel.className.split(/\s+/)).not.toContain('relative');
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `npx nx test ui-angular -- tabs.spec.ts`
Expected: FAIL — without the alias, Angular unions the static `absolute` with the bound `relative`; both are present and the `not.toContain('relative')` assertion fails.

- [x] **Step 3: Implement**

Same edit as Task 3 in `tab-panel.ts`: import `ElementClasses`, `mergeClassNames`; replace the `classes` input with the `hostClass` + narrowed `classes` pair; replace `className: this.classes()` (line 90) with `className: mergeClassNames<TabPanelInterface>('tabPanel', this.classes(), this.hostClass())`. No `host` change: `'[class]': 'styles()["tabPanel"]'` stays and now emits the merged string.

Do **not** add the `[class.x]` limitation line to TabPanel, MenuGroup or MenuHeadline: their host is the root, so `[class.x]` works there.

- [x] **Step 4: Run tests**

Run: `npx nx test ui-angular -- tabs.spec.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/ui-angular/src/lib/tabs/tab-panel.ts packages/ui-angular/src/lib/tabs/tabs.spec.ts
git commit -m "feat(ui-angular)!: alias native class on TabPanel, whose host is the root

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Angular sweep — the remaining 32 components + matrix test

**Files:**
- Modify (canonical shape, exactly as Task 3): `anchor-positioner/anchor-positioner.ts`, `badge/badge-surface.ts`, `card/card.ts`, `carousel/carousel-item.ts`, `carousel/carousel.ts`, `checkbox/checkbox.ts`, `chip/chip.ts`, `chips/chips.ts`, `context-menu/context-menu.ts`, `date-picker/date-picker.ts`, `divider/divider.ts`, `fab/fab.ts`, `fab-menu/fab-menu.ts`, `icon-button/icon-button.ts`, `icon/icon.ts`, `menu/menu-group.ts`, `menu/menu-headline.ts`, `menu/menu-item.ts`, `menu/menu.ts`, `navigation-rail/navigation-rail-item.ts`, `navigation-rail/navigation-rail.ts`, `progress-indicator/progress-indicator.ts`, `search/search.ts`, `side-sheet/side-sheet.ts`, `slider/slider.ts`, `snackbar/snackbar.ts`, `state-layer/state-layer.ts`, `switch/switch.ts`, `tabs/tab-panels.ts`, `tabs/tabs.ts`, `tabs/tab.ts`, `text-field/text-field.ts` — all under `packages/ui-angular/src/lib/`.
- Modify (directives, different rule): `badge/badge.ts:116-118`, `tooltip/tooltip.ts:139-142`.
- Create: `packages/ui-angular/src/lib/class-alias.spec.ts`

**Interfaces:**
- Consumes: canonical shape from Task 3.
- Produces: every `udx-*` component exposes an input with `propName: 'hostClass'`, `templateName: 'class'`.

- [x] **Step 1: Write the failing matrix test**

```ts
// packages/ui-angular/src/lib/class-alias.spec.ts
import { reflectComponentType, type Type } from '@angular/core';
import { AnchorPositioner } from './anchor-positioner/anchor-positioner';
import { BadgeSurface } from './badge/badge-surface';
import { Button } from './button/button';
import { Card } from './card/card';
import { Carousel } from './carousel/carousel';
import { CarouselItem } from './carousel/carousel-item';
import { Checkbox } from './checkbox/checkbox';
import { Chip } from './chip/chip';
import { Chips } from './chips/chips';
import { ContextMenu } from './context-menu/context-menu';
import { DatePicker } from './date-picker/date-picker';
import { Divider } from './divider/divider';
import { Fab } from './fab/fab';
import { FabMenu } from './fab-menu/fab-menu';
import { Icon } from './icon/icon';
import { IconButton } from './icon-button/icon-button';
import { Menu } from './menu/menu';
import { MenuGroup } from './menu/menu-group';
import { MenuHeadline } from './menu/menu-headline';
import { MenuItem } from './menu/menu-item';
import { NavigationRail } from './navigation-rail/navigation-rail';
import { NavigationRailItem } from './navigation-rail/navigation-rail-item';
import { ProgressIndicator } from './progress-indicator/progress-indicator';
import { Search } from './search/search';
import { Slider } from './slider/slider';
import { Snackbar } from './snackbar/snackbar';
import { StateLayer } from './state-layer/state-layer';
import { Switch } from './switch/switch';
import { Tab } from './tabs/tab';
import { TabPanel } from './tabs/tab-panel';
import { TabPanels } from './tabs/tab-panels';
import { Tabs } from './tabs/tabs';
import { TextField } from './text-field/text-field';

// Every element component. Directives ([udxBadge], [udxTooltip]) are excluded on
// purpose: their host is the consumer's element, so `class` must stay native there.
const COMPONENTS: Type<unknown>[] = [
  AnchorPositioner, BadgeSurface, Button, Card, Carousel, CarouselItem, Checkbox,
  Chip, Chips, ContextMenu, DatePicker, Divider, Fab, FabMenu, Icon, IconButton,
  Menu, MenuGroup, MenuHeadline, MenuItem, NavigationRail, NavigationRailItem,
  ProgressIndicator, Search, Slider, Snackbar, StateLayer, Switch, Tab, TabPanel,
  TabPanels, Tabs, TextField,
];

describe('native class alias', () => {
  it.each(COMPONENTS.map((c) => [c.name, c] as const))(
    '%s exposes hostClass aliased as class and no string-typed classes input',
    (_name, component) => {
      const mirror = reflectComponentType(component);
      expect(mirror).not.toBeNull();
      const inputs = mirror!.inputs;
      expect(inputs).toContainEqual(
        expect.objectContaining({ propName: 'hostClass', templateName: 'class' }),
      );
    },
  );
});
```

Adjust import names to the actual exported class names (`grep -n "^export class" packages/ui-angular/src/lib/**/*.ts`).

- [x] **Step 2: Run to verify it fails**

Run: `npx nx test ui-angular -- class-alias.spec.ts`
Expected: FAIL for every component except `Button` and `TabPanel`.

- [x] **Step 3: Apply the canonical shape to the 32 components**

For each file, the three edits from Task 3, with the component's own interface and default element (`XInterface['elements'][0]`; read it from `packages/core/src/lib/interfaces/<x>.interface.ts`). Add the `[class.x]` limitation line to every component whose `host` has `style: 'display: contents'`; skip it for `MenuGroup` and `MenuHeadline` (host is the root).

Three components deviate from the `string | ClassNameComponent` signature today; handle them as follows:

- `icon/icon.ts:70` — `input<string>()` but passes to `iconStyle` (`:111`). Apply the canonical shape with `IconInterface`, default element `'icon'`.
- `anchor-positioner/anchor-positioner.ts:54` and `context-menu/context-menu.ts:74` — `input<string>()` bound straight to an inner `div` (`[class]="classes()"`), no core style. Replace `classes` with `hostClass` only (no `classes` input, there is no element contract to expose) and bind `[class]="hostClass()"`. Both stay in the matrix test.

Internal template sites — 35 places in `packages/ui-angular/src/lib/**/*.ts` (not specs) bind a
string to a child component's `classes`: `[classes]="styles()['icon']"` on `udx-icon`,
`[classes]="styles()['stateLayer']"` on `udx-state-layer`, `classes="pointer-events-none"` on
`udx-anchor-positioner` in `tooltip-surface.ts`, etc. Find them with
`grep -rn '\[classes\]="styles()\|classes="' packages/ui-angular/src/lib --include=*.ts | grep -v spec`
and rewrite each to `[class]=` / `class=` — the string reaches the child's `hostClass` through the alias.

Directive → surface handoff — `badge/badge.ts:141` does `surface.setInput('classes', this.classes())`
with a value that may be a string. `BadgeSurface.classes` no longer accepts one. Replace with:

```ts
const value = this.classes();
if (typeof value === 'string') surface.setInput('hostClass', value);
else surface.setInput('classes', value);
```

Existing specs calling `setInput('classes', '<string>')` (`fab.spec.ts:134`, `icon-button.spec.ts:135`,
`checkbox.spec.ts:99`, `progress-indicator.spec.ts:78,105,126`) switch to `setInput('hostClass', …)`.

Directives — `badge/badge.ts:116-118` and `tooltip/tooltip.ts:139-142`: **keep** the existing input name `classes`, alias `udxBadgeClass` / `udxTooltipClass`, and widen the type to `string | ElementClasses<XInterface> | ClassNameComponent<XInterface>`. Update their TSDoc to: `/** Classes for the detached surface: a root string, static element classes, or a state-aware function. */`. Do not add `hostClass`.

- [x] **Step 4: Run the whole Angular suite**

Run: `npx nx test ui-angular`
Expected: PASS. Any existing spec that did `setInput('classes', 'some-string')` now fails at runtime (a string reaches `mergeClassNames` in the object slot and is routed as a root string — it still works, but the test documents the old contract). Migrate such calls to `setInput('hostClass', …)`. Find them: `grep -rn "setInput('classes', '" packages/ui-angular/src`.

- [x] **Step 5: Type gate — positive and negative**

Run: `npx nx build ui-angular --skip-sync 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -c 'error TS'` → `0`.

Negative: create `packages/ui-angular/src/lib/__negative__.ts`:

```ts
import { Component } from '@angular/core';
import { Button } from './button/button';
@Component({ standalone: true, imports: [Button], template: `<udx-button classes="x" />` })
export class Negative {}
```

Run the same build; expect `≥ 1` error mentioning `classes` and `string`. Then `rm packages/ui-angular/src/lib/__negative__.ts` and rebuild to `0`.

- [x] **Step 6: Commit**

```bash
git add packages/ui-angular/src
git commit -m "feat(ui-angular)!: alias native class onto every component root

BREAKING CHANGE: the \`classes\` input of every @udixio/ui-angular component
no longer accepts a string. Use \`class\` / \`[class]\` for the root, and
\`[classes]\` with an object or a function for internal elements.
Directive inputs \`udxBadgeClass\` and \`udxTooltipClass\` are unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: React — lock the object form

**Files:**
- Modify: `packages/ui-react/src/tests/TextField.spec.tsx` (append)

**Interfaces:**
- Consumes: widened `StyleProps.className` from Task 1 (no React code change).

- [x] **Step 1: Write the test**

```tsx
  it('accepts a static element object as className', () => {
    render(
      <TextField
        label="Name"
        name="name"
        className={{ label: 'uppercase', supportingText: 'italic' }}
        supportingText="Required"
      />,
    );
    expect(screen.getByText('Name').className).toContain('uppercase');
    expect(screen.getByText('Required').className).toContain('italic');
  });
```

Adapt the selectors to how the existing TextField spec locates the label and supporting text (read the top of the file first).

- [x] **Step 2: Run**

Run: `npx nx test @udixio/ui-react -- TextField.spec.tsx`
Expected: PASS on first run (the core already handles the object). If TypeScript rejects the prop, `@udixio/ui-react` is resolving a stale built core — run `npx nx build @udixio/core` and check `pnpm install --frozen-lockfile` ([[ui-angular-core-link-drift]]).

- [x] **Step 3: Commit**

```bash
git add packages/ui-react/src/tests/TextField.spec.tsx
git commit -m "test(ui-react): lock the static element object form of className

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Docs — migrate call sites, add the element-classes example, document the limitation

**Files:**
- Modify (20 sites): `apps/doc/src/examples/angular/` — `badge-basic.ts:16`, `card-actions.ts:15,22`, `card-composition.ts`, `card-variants.ts:12,18,24`, `divider-orientation.ts:16`, `divider-spacing.ts` (3), `navigation-rail-alignment.ts:15,21`, `navigation-rail-basic.ts:14`, `navigation-rail-extended.ts`, `navigation-rail-footer.ts:18`, `navigation-rail-selection.ts`, `progress-indicator-determinate.ts:22`, `progress-indicator-indeterminate.ts`, `search-composition.ts:26`.
- Create: `apps/doc/src/examples/react/text-field-element-classes.tsx`, `apps/doc/src/examples/angular/text-field-element-classes.ts`
- Modify: `apps/doc/src/data/components/text-field.overview.mdx`
- Modify: `apps/doc/src/data/pages/get-started/angular.mdx`
- Regenerate: `apps/doc/src/data/api/*.json`

- [x] **Step 1: Migrate every string call site**

```bash
cd apps/doc/src/examples/angular
sed -i -E "s/\[classes\]=\"'([^']*)'\"/class=\"\1\"/g; s/\bclasses=\"/class=\"/g" \
  badge-basic.ts card-actions.ts card-composition.ts card-variants.ts divider-orientation.ts \
  divider-spacing.ts navigation-rail-alignment.ts navigation-rail-basic.ts navigation-rail-extended.ts \
  navigation-rail-footer.ts navigation-rail-selection.ts progress-indicator-determinate.ts \
  progress-indicator-indeterminate.ts search-composition.ts
```

Verify: `grep -rn "classes=\"\|\[classes\]=\"'" apps/doc/src --include=*.ts --include=*.mdx | grep -v "styles()"` → no output.

- [x] **Step 2: Create the element-classes example**

```tsx
// apps/doc/src/examples/react/text-field-element-classes.tsx
import { TextField } from '@udixio/ui-react';

export default function TextFieldElementClassesReact() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <TextField label="Name" name="name" className="w-72" />
      <TextField
        label="Code"
        name="code"
        supportingText="Uppercase letters only"
        className={{ input: 'uppercase tracking-widest', supportingText: 'italic' }}
      />
    </div>
  );
}
```

```ts
// apps/doc/src/examples/angular/text-field-element-classes.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-element-classes-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-6">
      <udx-text-field label="Name" name="name" class="w-72" />
      <udx-text-field
        label="Code"
        name="code"
        supportingText="Uppercase letters only"
        [classes]="{ input: 'uppercase tracking-widest', supportingText: 'italic' }"
      />
    </div>
  `,
})
export class TextFieldElementClassesAngular {}
```

- [x] **Step 3: Wire it in the MDX**

In `text-field.overview.mdx`, add the four imports next to the existing ones:

```mdx
import TextFieldElementClassesReact from '@/examples/react/text-field-element-classes.tsx';
import { TextFieldElementClassesAngular } from '@/examples/angular/text-field-element-classes.ts';
import textFieldElementClassesReactSource from '@/examples/react/text-field-element-classes.tsx?raw';
import textFieldElementClassesAngularSource from '@/examples/angular/text-field-element-classes.ts?raw';
```

and a section after "Variants":

```mdx
## Styling the root and internal elements

A string targets the root: `className` in React, the native `class` attribute in
Angular. To reach an internal element (`input`, `label`, `supportingText`, …), pass
an object keyed by element name — `className={{ … }}` in React, `[classes]="{ … }"`
in Angular. A function receiving the resolved props and states is also accepted for
the rare cases that depend on what only the component knows. Consumer classes are
merged after the defaults with `tailwind-merge`, so `bg-*`, `text-*` and similar
utilities override cleanly.

<Code
  codes={{
    react: textFieldElementClassesReactSource,
    angular: textFieldElementClassesAngularSource,
  }}
>
  <TextFieldElementClassesReact slot="react" client:load />
  <TextFieldElementClassesAngular slot="angular" client:load />
</Code>
```

- [x] **Step 4: Document the Angular limitation**

In `apps/doc/src/data/pages/get-started/angular.mdx`, add before "## Live theme changes":

```mdx
## Styling a component

Use the native `class` attribute or `[class]` binding on any `udx-*` element: the
string is routed to the component's root element and merged with its own classes
through `tailwind-merge`, so your utilities win on conflicts.

```html
<udx-button class="mt-4 w-full" label="Save" />
<udx-button [class]="dense() ? 'py-1' : 'py-3'" label="Save" />
```

To style an internal element, bind `[classes]` to an object keyed by element name:

```html
<udx-text-field label="Code" [classes]="{ input: 'uppercase', label: 'font-bold' }" />
```

Most components render their host with `display: contents`, so `[class.x]` and
`[ngClass]` — which Angular always applies to the host — have no visible effect on
them. Put conditional classes in `[class]` or `[classes]` instead.
```

- [x] **Step 5: Regenerate the API data and check it**

Run: `pnpm --filter apps-doc docgen && pnpm --filter apps-doc docgen:check && pnpm --filter apps-doc docgen:test`
Expected: all three succeed; `grep -c '"alias": "class"' apps/doc/src/data/api/button.json` → `1`; the `classes` entry for `button.json` no longer mentions `string`.

- [x] **Step 6: Build the doc site**

Run: `pnpm --filter apps-doc build 2>&1 | tail -5`
Expected: build succeeds. Then open the TextField page in the dev server (`pnpm --filter apps-doc dev`) and confirm the new example renders `uppercase` on the input in both tabs.

- [x] **Step 7: Commit**

```bash
git add apps/doc/src/examples apps/doc/src/data
git commit -m "docs: use native class in Angular examples, add element-classes example and styling guide

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Full verification

- [x] **Step 1: Run every affected suite**

```bash
npx nx test @udixio/core && npx nx test ui-angular && npx nx test @udixio/ui-react
npx nx build @udixio/core && npx nx build ui-angular --skip-sync 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -c 'error TS'
pnpm --filter apps-doc docgen:check
```

Expected: tests PASS; error count `0`; docgen clean.

- [x] **Step 2: Residual grep**

```bash
grep -rn "readonly classes = input<string" packages/ui-angular/src/lib   # → nothing
grep -rn "readonly classes = input<$" -A2 packages/ui-angular/src/lib | grep "string |" # → only badge.ts and tooltip.ts
grep -rn "classes=\"\|\[classes\]=\"'" apps/doc/src | grep -v "styles()"  # → nothing
```

- [x] **Step 3: Characterization unchanged**

`git diff HEAD~8 -- packages/core/src/lib/styles/class-engine.characterization.spec.ts` → empty. The engine's output for existing inputs must not have moved.

No commit: this task produces no change. Report the three command outputs verbatim.
