# Framework URLs and the per-kind motion syntax Implementation Plan

> **On hold (2026-11-28).** The syntax tasks wait for the motion model
> (`docs/superpowers/specs/2026-11-28-motion-model-design.md`, step 2/8); the URL tasks are replaced by
> `docs/superpowers/plans/2026-11-28-motion-early-track.md`. Kept as a record; do not execute.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One motion per kind in the three adapters (React props, Angular inputs, Svelte object), the motion pages in MDX
at `/<framework>/motion/<page>` with one framework per reading, and a `/motion` home of six notions.

**Architecture:** The core gains per-verb types and `listMotionSources`, which the adapters call so the order and the
wrong-kind rule exist once. The doc site gets one URL module (`src/lib/framework-url.ts`) used by two route files, the
links, the navigation, the generated redirects and the tests; pages become entries of a `motion` collection rendered
by `MotionEntry.astro` with `props.framework` (prose) and `Astro.params.framework` (components).

**Tech Stack:** TypeScript 5.9, React 19, Angular 21 (signal inputs, `strictTemplates`), Svelte 5 (attachments), Astro 7
(content collections, MDX, Vercel adapter, astro-pagefind, sitemap), Vitest, Jest (Angular), `node --test` (Node 24, type
stripping), Playwright through the doc's `*.browser.test.mjs` suites.

**Spec:** `docs/superpowers/specs/2026-11-28-framework-urls-and-motion-syntax-design.md` (decisions); design with the
reasons: `.superpowers/sdd/2026-11-17-animation-docs/design-2026-11-28-url-props-home.md`.

## Global Constraints

- Repository rules: `CLAUDE.md`, `apps/doc/AGENTS.md`, `packages/ui-angular/AGENTS.md`,
  `.superpowers/sdd/2026-11-17-animation-docs/rules.md` and `parallel-rules.md`. English everywhere.
- Never `git stash`, `checkout -- <file>`, `restore`, `reset`, `clean`; commit with
  `git commit -m "<conventional message>" -- <explicit paths>` (new files staged with `git add <path>`), message ending
  with the session's Co-Authored-By line. No push, no `pnpm install`, no new dependency.
- `apps/doc/src/pages/motion/gestures.astro` has an uncommitted change owned by someone else: Task 18 does not start
  until it is committed (the controller checks `git status`).
- Nothing is published: breaking changes are allowed without a warning (maintainer, 2026-11-28).
- Prefixes: `react`, `angular`, `svelte`, `html` (`EXAMPLE_FRAMEWORKS` of `src/stores/exampleFrameworkStore.ts`); the
  storage key `udixio:docs:preferred-example-framework`; React is the default reading.
- Neutral motion pages: `''` (home), `glossary`, `limits`, `roadmap`, `loading-and-weight`, `api`. Every other motion page
  is framework-dependent. Outside motion, every page of the `pages` collection, `/themes`, `/theme/builder` and the site
  home are neutral (301s under `react`, `angular`, `svelte`); component pages have no prefixed form (404).
- React props `presence`, `emphasis`, `layout`, `reveal`, `scrub`, `looping`; `step` -> `sequenceStep`; `name` removed.
  Angular inputs `udxPresence`, `udxEmphasis`, `udxLayout`, `udxReveal`, `udxScrub`, `udxLoop`. Svelte keys
  `presence`, `emphasis`, `layout`, `reveal`, `scrub`, `loop`.
- Order of the bound list: presence, emphasis, layout, reveal or scrub, loop.
- Wrong-kind message (core, `reportWrongKind`, words from `places`): `"slide" ignored in layout: it is a presence (verb appear). Pass it to presence.`
  Places: React `{ presence: 'presence', emphasis: 'emphasis', layout: 'layout', reveal: 'reveal', scrub: 'scrub', loop: 'looping' }`;
  Angular `udxPresence`, `udxEmphasis`, `udxLayout`, `udxReveal`, `udxScrub`, `udxLoop`; Svelte the default (the keys).
- Titles and descriptions (spec §2.9): `motionTitle(need, framework?)` gives "Presence in Svelte · Motion", a neutral page
  "Glossary · Motion", the home "Motion"; a reading's description is `summary + ' ' + FRAMEWORK_LINES[framework]`.
- Implementers are Haiku subagents (effort per task); reviews Sonnet, effort `high`. Implementers never build the doc
  site and never run a whole browser suite; they run only the checks their task names. The controller runs builds and the
  three-engine verification (Task 23).
- Load: check `cut -d' ' -f1 /proc/loadavg` before any browser run or dev server (wait while above 8; the controller's
  `astro build` waits for load < 4 and > 3 GB free).

### Brief block B (paste into every brief of Tasks 6 to 22)

> - Every control is a Udixio component (Button, IconButton, Chips, Tabs, Switch, Slider, TextField…), in examples, scenes
>   and the site's chrome. Native elements only in the HTML tab and for the element that is itself the animation. Before
>   reporting, grep `<button|<input|<select|role="tab"` in the files you touched and justify each native one.
> - Style with Tailwind classes and the Udixio theme tokens: no new `.css` file, no `<style>` block, no hard-coded colour,
>   radius or spacing; only what has no utility goes in a Tailwind v4 `@utility` reading the theme's variables.
> - Docs in `apps/doc` change with the code they describe, in the same task.
> - Nothing type-checks `apps/doc`: after a public rename, grep `apps/doc` for the old name, and run the throwaway-tsconfig
>   sweep of `apps/doc/AGENTS.md` (outside the repo, no `references`, `paths` mapping `@udixio/*` to each package's
>   `src/index.ts` and `@/*` to `./src/*`, `src/examples/angular/**` excluded; ignore `astro:content` and
>   `import.meta.glob` errors). Report the errors it finds in your files.
> - Animation: `@udixio/motion` only; no new engine or mechanism without asking.

## Review Focus

1. **A name defined after the bind, of the wrong kind** (`layout="card-enter"` where `card-enter` is defined later as a
   presence): nothing is bound for `layout`, and the report names `presence` once. Pinned in Task 2 (core browser spec)
   and Tasks 3 to 5 (one adapter spec each).
2. **A link with a hash or a query** (`/motion/values#counters`, `/motion/layout?x=1#y`): `withFramework` prefixes the
   path and keeps both; the `counters` entry follows `values`. Pinned in Task 10a (`framework-url.test.mjs`).
3. **A trailing slash** (the built site serves `/react/motion/presence/`): `splitFramework`, the rail's active page and the
   link classification compare without it. Pinned in Task 10a and Task 11.
4. **Back after a switch, and a switch with a hash in the URL**: Back returns to the framework left, the hash stays, the
   reading position lands on the same heading. Pinned in Task 11 (`framework-urls.browser.test.mjs`).
5. **A neutral page opened under a prefix by hand** (`/svelte/motion/glossary`, `/react/theme/colors`): a 301 to the bare
   URL, never a 404, and `/html/theme/…`, `/html` and `/react/components/…` stay 404s. Pinned in Task 10a (`frameworkRedirects`) and Task 10c (`built-site.test.mjs`, `config.json`).

## Parallel groups

| Group | Tasks                                                    | Runs                                                                  | Shared files that forbid more parallelism                                                                                                                                                                                                                                                                                  |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 1, then 2                                                | serial                                                                | `packages/motion/src/define-motion.ts`, `index.ts`                                                                                                                                                                                                                                                                         |
| A     | 3, 4, 5                                                  | parallel, after 2                                                     | none between them (each its own package)                                                                                                                                                                                                                                                                                   |
| —     | Strictness check                                         | controller, after Tasks 1 and 3 (before group B uses the final types) | Task 3's and Task 5's files, if the strict variant is applied                                                                                                                                                                                                                                                              |
| B     | 6 (after 3), 7 (after 4), 8 (after 5), 9 (after 3, 4, 5) | parallel                                                              | `tests/motion-examples.test.mjs` belongs to Task 6 only                                                                                                                                                                                                                                                                    |
| 2     | 10a, 10b, 10c                                            | serial, after group B                                                 | `astro.config.ts`, `motion-nav.ts`, `content.config.ts`, `MotionPage.astro`, `MotionUsage.astro`                                                                                                                                                                                                                           |
| C     | 11, 12                                                   | parallel, after 10c                                                   | 11 owns `framework-tabs` and `framework-urls` suites; 12 the other suites                                                                                                                                                                                                                                                  |
| D     | 13 to 20                                                 | parallel, after group C                                               | none: each batch owns its pages, demos and scenes; no batch edits a shared suite, `motion-nav.ts`, `MotionPage.astro` or `MotionUsage.astro`                                                                                                                                                                               |
| —     | Group D check                                            | controller, after group D                                             | one build, one server, checks in series                                                                                                                                                                                                                                                                                    |
| E     | 22, then 21                                              | serial, after group D                                                 | both edit `lib/framework-choice.ts`: 22 adds the panel rule the home needs, 21 deletes the variant rule once nothing uses it; 21 also owns `layout.astro` and the `motion.browser`, `pages`, `motion-page-claims`, `recipes` suites; 22 owns `root/*`, `motion/index.astro`, `motion-nav.ts`, `animation.browser.test.mjs` |
| 3     | 23                                                       | controller                                                            | everything                                                                                                                                                                                                                                                                                                                 |

Example files move with their adapter (group B), not with their pages: once an adapter drops its old syntax, an Angular
example that still binds `[udxMotion]` fails the AOT compile of the doc build, and Task 10c's build check needs a building
site. The pages' own prose, inline code strings and the two new inline-spec examples move with the pages (group D).

---

### Task 1: core per-verb types

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Modify: `packages/motion/src/define-motion.ts` (`MotionRef`, `defineMotion`, `MotionRegistry`; add `MotionVerb`,
  `MotionSpecOf`, `MotionNameOf`, `MotionOf`, `MotionSources`, `MotionSourceKey`, `MotionPlaces`, `ExpectedSource`,
  `DistributiveOmit`), `packages/motion/src/presets.ts`
  (annotations), `packages/motion/src/index.ts` (exports)
- Test: `packages/motion/src/define-motion-types.spec.ts` (new)

**Interfaces:**

- Produces (spec §3.2, verbatim): `MotionVerb`, `MotionSpecOf<V>`, `MotionRef<N, V>`,
  `defineMotion<N, const S>(name, spec): MotionRef<N, S['verb']>`, `MotionRegistry` (values are verbs),
  `MotionNameOf<V>`, `MotionOf<V>`, `MotionSources`, `MotionSourceKey`, `MotionPlaces`, `ExpectedSource` (types of spec §3.2),
  `DistributiveOmit<T, K extends PropertyKey>` (`T extends unknown ?
Omit<T, K> : never`), all exported from `@udixio/motion`.

- [ ] **Step 1: Write the failing type test** `define-motion-types.spec.ts` (Vitest `expectTypeOf` plus `@ts-expect-error`):

```ts
import * as presets from './presets.js';
it('the registry gives each preset the verb of its reference', () => {
  type Drift = {
    [
      K in keyof typeof presets
    ]: (typeof presets)[K]['spec']['verb'] extends MotionRegistry[K &
      keyof MotionRegistry]
      ? never
      : K;
  }[keyof typeof presets];
  expectTypeOf<Drift>().toEqualTypeOf<never>();
  expectTypeOf<keyof typeof presets>().toEqualTypeOf<keyof MotionRegistry>();
});
it('defineMotion reads the verb from the spec', () => {
  const card = defineMotion('card', {
    verb: 'appear',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  });
  expectTypeOf(card).toEqualTypeOf<MotionRef<'card', 'appear'>>();
});
it('names, references and specs are typed by verb', () => {
  expectTypeOf<MotionNameOf<'appear'>>().toEqualTypeOf<
    'fade' | 'slide' | 'cascade' | 'scale' | 'draw'
  >();
  const layout: MotionOf<'layout'> = presets.reflow;
  // @ts-expect-error a presence reference is not a layout
  const wrong: MotionOf<'layout'> = presets.slide;
  // @ts-expect-error an emphasis spec cannot say appear
  const spec: MotionOf<'emphasize'> = { verb: 'appear', keyframes: [] };
  const any: MotionRef = presets.slide; // still compiles
});
it('a reveal and a scrub exclude each other', () => {
  const one: MotionSources = { presence: 'fade', reveal: 'rise' };
  // @ts-expect-error both view verbs
  const both: MotionSources = { reveal: 'rise', scrub: 'parallax' };
});
```

- [ ] **Step 2: Run it to see it fail**
      Run: `cd packages/motion && npx tsc --noEmit -p tsconfig.spec.json`. Expected: errors on the missing exports.
- [ ] **Step 3: Implement the types** of spec §3.2 in `define-motion.ts`; annotate each preset as
      `MotionRef<'<name>', '<verb>'>`; update the TSDoc of `MotionRegistry` (declaration merging with a verb); export from
      `index.ts`. No runtime change.
- [ ] **Step 4: Run the checks**
      Run: `cd packages/motion && npx tsc --noEmit -p tsconfig.spec.json && npx vitest run --project unit src/define-motion-types.spec.ts src/define-motion.spec.ts src/manifest-types.spec.ts`.
      Expected: no type error, tests PASS.
- [ ] **Step 5: Commit**
      `git add packages/motion/src/define-motion-types.spec.ts` then
      `git commit -m "feat(motion)!: type motions by verb, with a registry of verbs" -- packages/motion/src/define-motion.ts packages/motion/src/presets.ts packages/motion/src/index.ts packages/motion/src/define-motion-types.spec.ts`

### Task 2: `listMotionSources` and the wrong-kind check

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `packages/motion/src/define-motion.ts` (`SOURCE_VERBS`, `listMotionSources`), `packages/motion/src/bind.ts`
  (`motionsWhenDefined` widens `sources`; its `admit(verb)` callback, around line 337, refuses an `ExpectedSource` whose verb
  is not in `SOURCE_VERBS[key]` before the same-kind rule), `packages/motion/src/slots.ts` (`reportWrongKind` beside
  `reportSameKind`), `packages/motion/src/index.ts`
- Test: `packages/motion/src/motion-sources.spec.ts` (unit, node: test 1), `packages/motion/src/motion-sources.browser.spec.ts`
  (real DOM: tests 2 to 8, `console.error` spied as the existing report tests do)

**Interfaces:**

- Consumes: Task 1's types; `resolveMotion`, `kindOf`, `onMotionDefined`.
- Produces (spec §3.2, §3.3):
  - `SOURCE_VERBS: Readonly<Record<MotionSourceKey, readonly MotionVerb[]>>` (presence: `['appear', 'disappear']`, each
    other key its one verb)
  - `listMotionSources(sources: MotionSources, places?: MotionPlaces): ExpectedSource[]`: pure, no element, no report;
    order presence, emphasis, layout, reveal, scrub, loop, given keys only; an inline spec gets its key's verb (`appear`
    for a presence spec naming none); `places` defaults to the keys themselves.
  - `motionsWhenDefined(target: MotionElement, sources: readonly (MotionSource | ExpectedSource)[], options?: BindOptions):
DeferredMotion[]`; a plain `MotionSource` binds as today. `BindOptions`, `DeferredMotion`, `playListed`, `listedTarget`
    unchanged.
  - `reportWrongKind(target: Element, name: string, place: string, kind: MotionKind, verb: MotionVerb, rightPlace: string): void`,
    once per element through `reportIgnored`, under `options.development`; message
    `"<name>" ignored in <place>: it is <a kind> (verb <verb>). Pass it to <rightPlace>.`

- [ ] **Step 1: Write the failing tests** (the eight of spec §3.3)
  1. `listMotionSources lists the given keys in order, with specs given their key's verb`: `{ loop: 'rotate', layout:
'reflow', presence: 'fade', emphasis: 'press', reveal: 'rise' }` gives keys presence, emphasis, layout, reveal, loop;
     `{ layout: {} }` gives `verb: 'layout'`; a presence spec without verb gets `'appear'`, with `'disappear'` keeps it;
     default `places` are the keys, custom `places` are carried.
  2. `a name of another kind defined before the bind is not bound, the other keys are`: `{ presence: 'fade', layout: 'slide' }`
     binds the presence only; one report, `"slide" ignored in layout: it is a presence (verb appear). Pass it to presence.`
  3. `a name of another kind defined after the bind is still not bound at its definition`: `{ emphasis: 'press', layout:
'late-card' }`, then `defineMotion('late-card', { verb: 'appear', … })`: no layout binding before or after, one
     report at the definition, the press binding kept.
  4. `reports once per element`: two wrong sources on one element, one report; the same on two elements, two.
  5. `a scrub name under reveal is refused and names the scrub place` (`{ reveal: 'parallax' }`).
  6. `reveal with scrub binds the reveal and reports the scrub by the same-kind rule` (untyped object).
  7. `no report without development; a plain MotionSource list binds as before` (the existing bind tests stay green).
  8. `state order through playListed: emphasis, else layout, else reveal, else loop`.
- [ ] **Step 2: Run them to see them fail**: `cd packages/motion && npx vitest run --project unit src/motion-sources.spec.ts`
      and `MOTION_BROWSERS=chromium npx vitest run --project browser src/motion-sources.browser.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces; the check lives in `admit` only (no second decision point).
- [ ] **Step 4: Run the checks**: the two commands, `npx tsc --noEmit -p tsconfig.spec.json`, and
      `MOTION_BROWSERS=chromium npx vitest run --project browser src/bind.browser.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**
      `git add packages/motion/src/motion-sources.spec.ts packages/motion/src/motion-sources.browser.spec.ts` then
      `git commit -m "feat(motion): list an element's motions by kind and refuse a motion of another kind" -- packages/motion/src/define-motion.ts packages/motion/src/bind.ts packages/motion/src/slots.ts packages/motion/src/index.ts packages/motion/src/motion-sources.spec.ts packages/motion/src/motion-sources.browser.spec.ts`

### Task 3: React adapter (group A)

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `packages/ui-react/src/lib/motion/Motion.tsx` (props, TSDoc, examples; the `@limitations` line on `name` goes,
  lines on `as="link"` and on `as={Component}` hiding same-named props come), `packages/ui-react/src/lib/motion/Presence.tsx`
  (TSDoc examples), `packages/ui-react/src/lib/hooks/useMotion.ts` (signature; `motionsOf` removed), the package's exports
  (`ReactMotionSources`, `UseMotionOptions`)
- Test: `packages/ui-react/src/tests/Motion.spec.tsx`, `Motion.component.integration.spec.tsx`,
  `Motion.reserved.integration.spec.tsx`, `useMotion.spec.tsx`, `useMotion.integration.spec.tsx`, `useMotion.ssr.spec.tsx`,
  `Presence.integration.spec.tsx`, `Presence.ssr.spec.tsx` (rewritten to the new props); new `Motion.types.spec.tsx`

**Interfaces:**

- Consumes: `MotionOf`, `MotionSources`, `DistributiveOmit`, `MotionPlaces`, `listMotionSources` (Tasks 1, 2): `useMotion`
  maps `looping` to `loop`, calls `listMotionSources(sources, REACT_PLACES)` and passes the result to `motionsWhenDefined`.
  `REACT_PLACES: MotionPlaces` (exported) is the React places of the Global Constraints.
- Produces: `ReactMotionSources = DistributiveOmit<MotionSources, 'loop'> & { looping?: MotionOf<'loop'> }`;
  `MotionOwnProps` with `presence`, `emphasis`, `layout`, `reveal`, `scrub`, `looping`, `sequenceStep` and no
  `name`/`step`; `useMotion<T extends MotionElement = HTMLElement>(options: UseMotionOptions): UseMotionReturn<T>` with
  `UseMotionOptions = ReactMotionSources & { present?; state?; settled?; shared?; paused?; restoreFocus? }`.

- [ ] **Step 1: Write the failing tests**
      `Motion.types.spec.tsx`:
  - `no own prop but as is a native attribute`:
    `type Native = { [K in keyof React.JSX.IntrinsicElements]: keyof React.JSX.IntrinsicElements[K] }[keyof React.JSX.IntrinsicElements];`
    `expectTypeOf<Exclude<Extract<keyof MotionOwnProps, Native>, 'as'>>().toEqualTypeOf<never>()`.
  - `native form attributes reach an input`: `<Motion as="input" name="email" type="number" step={5} />` compiles.
  - `loop and looping live together`: `<Motion as="video" loop looping="pulse" />`; `<Motion as="circle" r={4} reveal="rise" />`.
  - the rows of spec §3.4 "What the types give", one assertion each (`@ts-expect-error` on `layout={slide}`,
    `emphasis={{ verb: 'appear', keyframes: [] }}`, `layout={{ keyframes: [] }}`, `reveal="rise" scrub="parallax"`).
    `Motion.spec.tsx` / `useMotion.spec.tsx`:
  - `binds each prop as its own kind` (presence, emphasis, layout, reveal, scrub, looping: `getMotion(el, kind)` exists).
  - `does not bind a value of another kind and names the right prop`: `<Motion layout="slide">` binds nothing and logs
    exactly the Global Constraints message; same when `slide` is defined after mount; `<Motion presence="rotate">` says
    `Pass it to looping.`
  - `binds reveal and reports scrub when both are given` (cast to bypass the type).
  - `state plays emphasis, else layout, else reveal, else the loop`: with `emphasis` and `layout`, a `state` change plays
    the emphasis; with `layout` and `reveal`, the layout; with `reveal` and `looping`, the reveal.
  - `an inline spec per prop takes the verb of its prop` (six cases, `presence` with `verb: 'disappear'` included).
  - `name and step are the element's own again`; `sequenceStep writes data-motion-step`.
  - `useMotion takes the component's words in one object`: `useMotion({ presence: 'slide', present: false })`.
  - `a re-render with an equal inline spec neither binds again nor replays the entry; a changed spec binds again, settled`.
  - `no source renders and reports nothing`: `<Motion>` alone and `<Motion sequenceStep="title">` bind nothing, log nothing;
    `present={false}` hides at once; `useMotion({})` gives a `ref` that binds nothing, `mounted === present`, `play()` undefined.
  - in `Motion.types.spec.tsx`: `// @ts-expect-error` on `presence={ref}` with `const ref: MotionRef = slide`, and
    `presence={ref.name}` compiles.
- [ ] **Step 2: Run them to see them fail**
      Run: `cd packages/ui-react && npx vitest run src/tests/Motion.spec.tsx src/tests/useMotion.spec.tsx` and
      `npx tsc --noEmit -p packages/ui-react/tsconfig.spec.json` (from the root). Expected: FAIL.
- [ ] **Step 3: Implement** the props of spec §3.4 on `useMotion` (which calls `listMotionSources`), `Motion` on top; then
      ship the types of spec §3.2 as written; the strict variant is decided by the controller (Strictness check below), not here.
- [ ] **Step 4: Run the checks**: `npx vitest run` in `packages/ui-react` (the motion specs listed above) and the
      `tsc` command. Expected: PASS, no new type error. `grep -rn "motionsOf\|name=\"\|step=\"" packages/ui-react/src/lib/motion packages/ui-react/src/lib/hooks/useMotion.ts` finds nothing.
- [ ] **Step 5: Commit**
      `git commit -m "feat(ui-react)!: one Motion prop per kind, looping and sequenceStep" -- <the files above>`

### Task 4: Angular adapter (group A)

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `packages/ui-angular/src/lib/motion/motion.ts` (selector, six inputs, `source` and `motionsOf` removed, TSDoc);
  `motion-gesture.ts`, `motion-value.ts`, `motion-sequence.ts` (TSDoc examples only)
- Test: `motion.spec.ts`, `motion.integration.spec.ts`, `motion.component.integration.spec.ts`,
  `motion.reserved.integration.spec.ts` (rewritten); new `packages/ui-angular/src/lib/motion/motion.types.spec.ts`

**Interfaces:**

- Consumes: `MotionOf`, `MotionPlaces`, `listMotionSources(sources, ANGULAR_PLACES)` passed to `motionsWhenDefined`.
- Produces: `ANGULAR_PLACES: MotionPlaces` (exported; the `udx*` names of the Global Constraints); `Motion` directive, selector `'[udxPresence], [udxEmphasis], [udxLayout], [udxReveal], [udxScrub], [udxLoop]'`,
  `exportAs: 'udxMotion'`; fields `presence`, `emphasis`, `layout`, `reveal`, `scrub`, `loop` =
  `input<MotionOf<…> | undefined>(undefined, { alias: 'udx<Kind>' })`; the option inputs unchanged.

- [ ] **Step 1: Write the failing tests**
      `motion.types.spec.ts` (checked by `tsc`): `type InputValue<T> = T extends InputSignal<infer V> ? V : never`;
      `const ok: InputValue<Motion['layout']> = reflow;` and `// @ts-expect-error` on `slide`; one pair per input.
      Specs: `binds udxPresence and udxLayout on one element` (`<li udxPresence="cascade" udxLayout="reflow">`);
      `does not bind a value of another kind and names udxPresence` (static `udxLayout="slide"`, before and after the
      definition: `"slide" ignored in udxLayout: it is a presence (verb appear). Pass it to udxPresence.`); `binds udxReveal and reports udxScrub`; `udxMotionState plays emphasis, else layout, else reveal, else loop`;
      `an inline spec per input takes its verb` (`[udxPresence]="{ keyframes: … }"`); `a new spec object of equal content
    binds nothing again, a changed one binds again settled`; `#m="udxMotion"` still plays.
- [ ] **Step 2: Run them to see them fail**: `npx nx test ui-angular --skip-sync --testPathPattern=lib/motion/motion` and
      `npx tsc --noEmit -p packages/ui-angular/tsconfig.spec.json`. Expected: FAIL.
- [ ] **Step 3: Implement** spec §3.5.
- [ ] **Step 4: Run the checks** (same), then the strictTemplates check, not committed: in the scratchpad, a tsconfig
      extending `packages/ui-angular/tsconfig.lib.json` with `angularCompilerOptions.strictTemplates: true` and one component
      whose template is `<p [udxLayout]="ref"></p>`; `npx ngc -p <scratch>/tsconfig.json` fails naming `udxLayout` with
      `ref = slide` and passes with `ref = reflow`. Put both outputs in the report.
- [ ] **Step 5: Commit**
      `git commit -m "feat(ui-angular)!: one udx input per motion kind on the Motion directive" -- <the files above>`

### Task 5: Svelte adapter (group A)

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Modify: `packages/ui-svelte/src/lib/motion/motion.attachment.svelte.ts` (signature, `motionsOf` removed, TSDoc),
  `motion.types.ts` (TSDoc), the fixtures `motion.fixture.svelte`, `motion.each.fixture.svelte`,
  `motion.host.fixture.svelte`, `motion.components.fixture.svelte`, `motion.reserved.fixture.svelte`,
  `motion.text.fixture.svelte`; `packages/ui-svelte/src/lib/text-field/TextField.svelte` (the comment at line 85,
  `{@attach motion('shake')}` -> `{@attach motion({ emphasis: 'shake' })}`)
- Test: `motion.spec.ts`, `motion.integration.spec.ts`, `motion.components.integration.spec.ts`,
  `motion.reserved.integration.spec.ts`; new `packages/ui-svelte/src/lib/motion/motion-sources.types.ts` (svelte-check)

**Interfaces:**

- Consumes: `listMotionSources(sources)` (default places: the keys) passed to `motionsWhenDefined`.
- Produces: `motion(sources: MotionSources, options?: () => MotionAttachmentOptions): Attachment<MotionElement>`.

- [ ] **Step 1: Write the failing tests**
      `motion-sources.types.ts`: `motion({ presence: 'cascade', layout: 'reflow' })` compiles; `@ts-expect-error` on
      `motion({ layout: slide })`, `motion({ reveal: 'rise', scrub: 'parallax' })`, `motion({ emphasis: { verb: 'appear',
keyframes: [] } })`, `motion('slide')`. Specs: `binds one motion per key`; `does not bind a value of another kind
and names the presence key` (before and after the definition: `"slide" ignored in layout: it is a presence (verb appear).
Pass it to presence.`); `binds reveal and reports scrub`; `state plays emphasis,
else layout, else reveal, else loop`; `an inline spec per key takes its verb`; `a new sources object of equal content binds
nothing again, one whose content changed binds again, settled`.
- [ ] **Step 2: Run them to see them fail**: `cd packages/ui-svelte && npx vitest run --config vite.config.ts src/lib/motion`
      and `npx svelte-check --tsconfig ./tsconfig.lib.json --fail-on-warnings`. Expected: FAIL.
- [ ] **Step 3: Implement** spec §3.6 with the shipped types; the strict variant is the controller's Strictness check.
- [ ] **Step 4: Run the checks** (same). Expected: PASS, svelte-check clean.
- [ ] **Step 5: Commit**
      `git commit -m "feat(ui-svelte)!: the motion attachment takes an object of kinds" -- <the files above>`

### Strictness check (controller, after Tasks 1 and 3)

The controller, not an implementer, decides between the shipped types and the strict per-prop variant (spec §3.4).

- [ ] **Step 1:** In the controller's scratchpad, `strictness/`: `check.mjs` (Node, `typescript` from the repo's
      `node_modules`, `ts.createLanguageService` over the compiler options of `packages/ui-react/tsconfig.spec.json`) and two
      fixtures, `shipped.tsx` (imports `Motion` from `packages/ui-react/src`) and `strict.tsx` (the same lines against a
      candidate `Motion` typed with one type parameter per prop, checked against `MotionRegistry`, written by the controller in
      the fixture).
- [ ] **Step 2:** Run `node <scratchpad>/strictness/check.mjs` on each fixture. Pass criteria, all three:
  1. `getCompletionsAtPosition` at `<Motion presence="|"` returns exactly `fade`, `slide`, `cascade`, `scale`, `draw` among
     string-literal entries (no emphasis, layout, view or loop name);
  2. `<Motion layout="slide" />` gives a semantic diagnostic whose flattened message contains `layout`;
  3. `<Motion presence="not-registered" />` gives no diagnostic.
- [ ] **Step 3:** Strict passes all three: dispatch a fresh Haiku (effort `high`) to apply it to `Motion`/`useMotion` (Task 3's
      files) and to Svelte's `motion()` (Task 5's files), adding `@ts-expect-error` on `layout="slide"` and
      `motion({ layout: 'slide' })` to their type tests. Otherwise keep the shipped types. Write the outcome, with the script's
      output per criterion, in `.superpowers/sdd/2026-11-17-animation-docs/progress.md`.

### Task 6: React examples (group B, after Task 3)

Implementer: Haiku, effort `high`. No task review (mechanical; the final review covers it). Brief block B.

**Files:**

- Modify: every `apps/doc/src/examples/react/motion-*.tsx` that uses `name=`, `step=` or `useMotion(` (list it with
  `grep -lE 'name=|step=|useMotion\(' apps/doc/src/examples/react/motion-*`), `apps/doc/src/components/motion/scenes/PlayerOpen.tsx`
- Test: `apps/doc/tests/motion-examples.test.mjs` (lines 30 and 31: `presence="toast"` for React and `udxPresence="toast"`
  for Angular; this task alone edits the file)

- [ ] **Step 1: Update the test** to the new syntax; run `node --test apps/doc/tests/motion-examples.test.mjs`; expected FAIL.
- [ ] **Step 2: Rewrite the examples** per spec §3.4 "Before / after" (`name` -> the prop of its kind, `step` ->
      `sequenceStep`, `useMotion(source, options)` -> `useMotion({ …sources, …options })`), keeping the 56-character
      measure of split examples.
- [ ] **Step 3: Check**: the test above PASSes (the Angular line may fail until Task 7 lands: report it); `grep -rnE
"<Motion[^>]*\b(name|step)=|useMotion\('" apps/doc/src` finds nothing outside the pages; the throwaway-tsconfig sweep
      reports nothing in these files.
- [ ] **Step 4: Commit** `git commit -m "docs(motion): React examples use one prop per kind" -- <files>`

### Task 7: Angular examples (group B, after Task 4)

Implementer: Haiku, effort `high`. No task review. Brief block B.

**Files:** Modify every `apps/doc/src/examples/angular/motion-*.ts` with `udxMotion` (about 33 files;
`grep -lE 'udxMotion=|\[udxMotion\]' apps/doc/src/examples/angular`).

- [ ] **Step 1:** List the files and their `udxMotion` uses.
- [ ] **Step 2:** Rewrite per spec §3.5 (the options `udxMotionState`… stay; `#m="udxMotion"` stays; a gesture-only element
      carries no kind input).
- [ ] **Step 3: Check**: `grep -rnE 'udxMotion=|\[udxMotion\]' apps/doc/src/examples` finds nothing; each example
      imports `Motion` where it uses a kind input. The AOT compile happens in the controller's build (Task 10c).
- [ ] **Step 4: Commit** `git commit -m "docs(motion): Angular examples use one udx input per kind" -- <files>`

### Task 8: Svelte examples (group B, after Task 5)

Implementer: Haiku, effort `high`. No task review. Brief block B.

**Files:** Modify every `apps/doc/src/examples/svelte/motion-*.svelte` calling `motion(` (about 33 files).

- [ ] **Step 1:** List the files. **Step 2:** Rewrite per spec §3.6. **Step 3: Check**: `grep -rn "motion('" apps/doc/src/examples/svelte`
      and `grep -rnE 'motion\(\[' apps/doc/src/examples/svelte` find nothing; `node --test apps/doc/tests/motion-examples.test.mjs`
      for the Svelte cases. **Step 4: Commit** `git commit -m "docs(motion): Svelte examples pass an object of kinds" -- <files>`

### Task 9: README, API reference data, skill (group B, after Tasks 3 to 5)

Implementer: Haiku, effort `high`. No task review. Brief block B.

**Files:**

- Modify: `packages/motion/README.md` (registry passage around line 101, React passages around 151, 208, 233, 384, 914 to
  965, 1116; Angular and Svelte passages around 962 to 1007), `apps/doc/scripts/motion-api.groups.mjs` (group the new
  exports: `MotionVerb`, `MotionSpecOf`, `MotionNameOf`, `MotionOf`, `MotionSources`, `DistributiveOmit`,
  `listMotionSources`, `MotionSourceKey`, `MotionPlaces`, `ExpectedSource`, `SOURCE_VERBS`, `ReactMotionSources`, `REACT_PLACES`,
  `ANGULAR_PLACES`), `apps/doc/src/data/motion-api.json` (regenerated),
  `plugins/udixio-ui-usage/skills/consume-component/SKILL.md` (line 51: the adapters' new words),
  `apps/doc/src/lib/motion-facts.ts` and `apps/doc/src/components/motion/root/Hero.astro` (the old syntax in their text, so
  that a build served before Task 22 shows the new writing)

- [ ] **Step 1:** `cd apps/doc && node scripts/motion-api.mjs --check`: expected FAIL (stale, ungrouped exports).
- [ ] **Step 2:** Edit the groups; run `node scripts/motion-api.mjs`, then `--check` and `node --test scripts/motion-api.test.mjs`: PASS.
- [ ] **Step 3:** Rewrite the README passages and the skill line per spec §3; `grep -nE "name=\"|udxMotion=|motion\('|step=\"" packages/motion/README.md`
      finds only `data-motion` HTML and `data-motion-step`.
- [ ] **Step 4: Commit** `git commit -m "docs(motion): README, API data and usage skill say one motion per kind" -- <files>`
      The MCP server needs no source change: its doc snapshot (`packages/mcp/src/bundled`, untracked) is regenerated by its build.

### Task 10a: the URL module, redirects, titles (serial, after group B)

Implementer: Haiku, effort `high`. Review: Sonnet. Brief block B.

**Files:**

- Create: `apps/doc/src/lib/framework-url.ts`, `apps/doc/tests/framework-url.test.mjs`, `apps/doc/tests/motion-url.mjs`
- Modify: `apps/doc/src/lib/motion-nav.ts` (`perFramework` on `MotionNeed` and every entry; `motionTitle`),
  `apps/doc/src/lib/motion-facts.ts` (`FRAMEWORK_LINES`; its `size-report.json` import gains `with { type: 'json' }` so that
  Node loads it), `apps/doc/astro.config.ts` (the four redirects removed; `frameworkRedirects(...)` with the neutral paths outside motion: every page of
  `src/data/pages/**` read by `node:fs`, `/themes`, `/theme/builder`, `/`; sitemap filter without `isFrameworkStub` paths, and a
  `serialize` that strips the trailing slash as `canonicalUrl` does)

**Interfaces:**

- Produces (`framework-url.ts`; runtime imports relative `.ts` only, so `node --test` loads it):
  - `splitFramework(pathname: string): { framework?: ExampleFramework; path: string }`
  - `hasFrameworkVariants(path: string): boolean`
  - `withFramework(path: string, framework: ExampleFramework | undefined): string`
  - `docLink(href: string, framework: ExampleFramework | undefined): { href: string; frameworkLink: boolean }` (on a
    neutral page, a framework-dependent target is `withFramework(href, 'react')` with `frameworkLink: true`)
  - `frameworkRedirects(neutralPaths: readonly string[]): Record<string, string>` (spec §2.6: neutral motion pages under four
    prefixes, `neutralPaths` under `react`, `angular`, `svelte`; `/react` -> `/`)
  - `isFrameworkStub(path: string): boolean` (a bare framework-dependent path)
  - `canonicalUrl(pathname: string, site: string | URL): string` (`new URL(pathname, site)` without its trailing slash, the
    root keeping its own)
- Produces (`motion-nav.ts`): `motionTitle(need: MotionNeed, framework?: ExampleFramework): string`: `'<label> in <Framework> ·
Motion'` for a reading, `'<label> · Motion'` for a neutral page, `'Motion'` for the home (the layout appends " — Udixio UI");
  labels from `FRAMEWORK_LABELS` (`motion-facts.ts`).
- Produces (`motion-facts.ts`): `FRAMEWORK_LINES: Record<ExampleFramework, string>`, the four sentences of spec §2.9, verbatim.
- Produces (`tests/motion-url.mjs`): `motionUrl(slug: string, framework = 'react'): string` (bare for a neutral slug).

- [ ] **Step 1: Write the failing tests** in `framework-url.test.mjs` (node, imports `../src/lib/framework-url.ts`):
  - `splitFramework strips a framework prefix only`: `/react/motion/presence` -> `{ framework: 'react', path: '/motion/presence' }`;
    `/react/motion/presence/` -> same path without the slash; `/motion/glossary` -> `{ path: '/motion/glossary' }`;
    `/reactive/x` -> no framework; `/svelte` -> `{ framework: 'svelte', path: '/' }`.
  - `hasFrameworkVariants follows perFramework`: true for `/motion/presence`, `/motion/recipes/dialog`,
    `/motion/values#counters`; false for `/motion`, `/motion/glossary`, `/theme/colors`, `/components/button`.
  - `withFramework prefixes framework-dependent paths and keeps query and hash`: `('/motion/layout?x=1#y', 'angular')` ->
    `/angular/motion/layout?x=1#y`; `('/motion/glossary', 'react')` -> `/motion/glossary`; `('/motion/presence', undefined)`
    -> `/motion/presence`.
  - `docLink renders React and marks it on a neutral page` (the two cases of the Interfaces).
  - `frameworkRedirects covers the neutral pages under every prefix`: for `['/theme/colors', '/get-started/introduction',
'/agents', '/mcp', '/themes', '/theme/builder', '/']`, holds `/react/motion/glossary` -> `/motion/glossary`,
    `/html/motion/api` -> `/motion/api`, `/svelte/motion` -> `/motion`, `/angular/theme/colors` -> `/theme/colors`,
    `/react/get-started/introduction`, `/svelte/agents`, `/angular/mcp`, `/react/themes` to their bare paths, `/react` -> `/`;
    holds no `/html/theme/colors`, no `/html`, no `/react/components/…` and no key for a framework-dependent page.
  - `canonicalUrl drops the trailing slash but the root's`: `('/react/motion/presence/', site)` ->
    `https://ui.udixio.fr/react/motion/presence`; `('/', site)` -> `https://ui.udixio.fr/`.
  - `isFrameworkStub`: true for `/motion/presence`, false for `/react/motion/presence` and `/motion/glossary`.
  - `motionTitle names the reading`: presence in svelte -> `'Presence in Svelte · Motion'`; glossary -> `'Glossary · Motion'`;
    the home -> `'Motion'`. `FRAMEWORK_LINES.angular` is `'In Angular, with the directives of @udixio/ui-angular.'`.
  - `the neutral motion pages are the five of the spec`: `MOTION_NEEDS.filter(n => !n.perFramework).map(n => n.slug)`
    equals `['loading-and-weight', 'api', 'glossary', 'limits', 'roadmap', '']` as a set.
- [ ] **Step 2: Run it to see it fail**: `cd apps/doc && node --test tests/framework-url.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** spec §2.6, §2.8 and §2.9 (titles) in the files above.
- [ ] **Step 4: Run it**: PASS. `node --check astro.config.ts` is not possible (TS): instead `node -e` importing
      `./src/lib/framework-url.ts` prints `Object.keys(frameworkRedirects([])).length` (> 0).
- [ ] **Step 5: Commit**
      `git commit -m "feat(doc): one module for framework URLs, redirects and reading titles" -- <files>`

### Task 10b: routes, MotionEntry, stub, links (serial, after 10a)

Implementer: Haiku, effort `max`. Review: Sonnet. Brief block B.

**Files:**

- Create: `apps/doc/src/pages/[framework]/motion/[...path].astro`, `apps/doc/src/pages/motion/[...path].astro`,
  `apps/doc/src/components/motion/MotionEntry.astro`, `apps/doc/src/components/motion/FrameworkStub.astro`,
  `apps/doc/src/components/DocLink.astro`, `apps/doc/tests/motion-entries.test.mjs`
- Modify: `apps/doc/src/content.config.ts` (collection `motion`, glob `src/data/motion/**/*.mdx`),
  `apps/doc/src/components/MotionPage.astro` (props `need` and `framework`; title `motionTitle(need, framework)`; description
  per spec §2.9; the header shows the summary alone; switch on every framework-dependent page; `title` and `description`
  stay accepted until Task 21 for the pages not yet moved), `apps/doc/src/components/motion/MotionUsage.astro` (one
  framework, no tabs, when `Astro.params.framework` is set; tabs otherwise), `Choice.astro`, `Fact.astro`, `Step.astro` (read
  `Astro.params.framework` when set, else today's behaviour), `MotionRelated.astro` (links through `docLink`)

**Interfaces:**

- Consumes: Task 10a's functions, `motionTitle`, `FRAMEWORK_LINES`.
- Produces: routes that generate a path only for a slug with an entry (spec §2.3); `MotionEntry.astro` props
  `{ entry: CollectionEntry<'motion'>; framework?: ExampleFramework }`, rendering
  `<Content framework={framework} components={{ a: DocLink, pre: Code }} />` inside `MotionPage`; `FrameworkStub.astro`
  props `{ path: string }` (spec §2.5: the stored value is checked against the four ids; anything else, none, or a storage
  that throws gives `react`); `DocLink.astro` props `{ href: string }` + the anchor's attributes, rendering
  `docLink(href, Astro.params.framework)` with `data-framework-link` when marked.
- Produces: the demo pattern for later tasks: `demos/<Example>.astro` statically imports the React, Angular and Svelte
  islands and renders `<MotionUsage name=… layout=…>` with only `Astro.params.framework`'s island (`HtmlExample` for `html`).

- [ ] **Step 1: Write the failing test** `motion-entries.test.mjs` (node, sources only; one subtest per slug of
      `MOTION_NEEDS` but the home, named `<slug>: …` so a batch can filter): `<slug>: has an MDX entry and no .astro page`;
      `<slug>: no ForFramework, ApiName, literal <a href, or exported components`; `<slug>: no heading inside a props.framework
condition`; `<slug>: no client: island inside an MDX expression`; `<slug>: no old motion syntax` (`name=`/`step=` on
      `<Motion`, `udxMotion=`, `[udxMotion]`, `motion('`). Run it: every slug FAILs (no entry yet).
- [ ] **Step 2: Implement** the files above per spec §2.3 to §2.5 and §2.8.
- [ ] **Step 3: Check**: with one `npx astro dev --port 4330` (serial task; load < 8), the pages not yet moved still answer
      200 at their bare URLs with their old titles (`/motion/presence`, `/motion/lists`, `/motion`), no server error; stop the
      server. The test of Step 1 still fails for every slug (expected until Task 10c and group D).
- [ ] **Step 4: Commit** `git commit -m "feat(doc): motion routes render MDX entries per framework, with a stub and DocLink" -- <files>`

### Task 10c: Presence in MDX, built-site and browser tests (serial, after 10b)

Implementer: Haiku, effort `max`. Review: Sonnet. Brief block B, plus `task-template.md` (updated for the MDX rules) and
spec §2.4.

**Files:**

- Create: `apps/doc/src/data/motion/presence.mdx` (same sections and content; per-framework sentences become
  `props.framework` conditions; the inline-spec example of spec §3.4 in "Use your own motion"),
  `apps/doc/src/components/motion/demos/PresenceDemo.astro`, `apps/doc/tests/built-site.test.mjs`,
  `apps/doc/tests/framework-urls.browser.test.mjs`
- Delete: `apps/doc/src/pages/motion/presence.astro`

**Interfaces:**

- Consumes: 10a and 10b (`motionUrl`, `isFrameworkStub`, `motionTitle`, `FRAMEWORK_LINES`, the demo pattern).
- Produces: the model page for group D, and the two suites later tasks extend (`framework-urls.browser.test.mjs` by Task 11).

- [ ] **Step 1: Write the failing tests**
      `built-site.test.mjs` (node, reads `apps/doc/.vercel/output`; skips with a message when it is absent):
      `every internal link is classified correct` (spec §2.8, five rules); `the four readings of a page have equal heading ids`;
      `every page has a canonical equal to canonicalUrl of its path, with no trailing slash but the root's; a stub points to
React`; `each canonical equals its sitemap entry as a string`; `config.json holds 301s for /react/get-started/introduction,
/svelte/agents, /angular/mcp, /react/themes and /react; nothing exists for /react/components/button/overview nor
/html/theme/colors`; `a link to /<framework>/components/… is classified an error`; `a reading's title is motionTitle and its
description ends with its FRAMEWORK_LINES sentence`; `a stub lists four readings and is ignored by Pagefind`; `every
generated redirect is a 301 in config.json before handle: filesystem, with no HTML file`; `the sitemap lists prefixed and
neutral pages, no stub, fixture or roadmap`; `a prefixed page declares its Pagefind framework filter`.
      `framework-urls.browser.test.mjs`: `each reading of Presence hydrates its demo and shows only its framework` (the toast
      plays in react, angular, svelte and html); `the stub goes to the stored framework, keeping query and hash`; `the stub
without a stored choice goes to React`; `the stub goes to React for vue, an empty string, or a storage that throws, and
the address never holds undefined or null`; `opening a prefixed page does not change the stored choice`.
      `node --test --test-name-pattern "^presence:" tests/motion-entries.test.mjs`: FAIL.
- [ ] **Step 2: Move presence** per spec §2.4 and `task-template.md`.
- [ ] **Step 3: Check**: the `presence:` subtests PASS. With one `npx astro dev --port 4330` (load < 8), on Chromium:
      `MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4330 node --test --test-concurrency=1 tests/framework-urls.browser.test.mjs`;
      stop the server. Screenshots of `/react/motion/presence` and `/svelte/motion/presence` at 1280 and 375, light and dark.
- [ ] **Step 4: Commit**
      `git commit -m "docs(motion): Presence is the first MDX page, read per framework" -- <files>`
- [ ] **Step 5 (controller): real build check.** Build per Task 23's recipe (packages first), timing `npx astro build`, then:
  - production hydration: `framework-urls.browser.test.mjs` against the static server on Chromium, Firefox, WebKit;
  - `node --test tests/built-site.test.mjs` (redirects in `.vercel/output/config.json`, sitemap, canonical, Pagefind
    attributes, link classification: only links to not-yet-migrated pages, the canonical of non-stub pages and the Pagefind
    filter (both Task 11) may fail here; list them);
  - Pagefind: `pagefind` output lists the four presence readings with their filter;
  - build time: compare with the time of the last build before Task 10a and extrapolate to 30 framework-dependent pages × 4 plus 6 neutral ones; report both.

### Task 11: the switch as navigation, rail, head script, canonical, search (group C)

Implementer: Haiku, effort `max`. Review: Sonnet. Brief block B.

**Files:**

- Create: `apps/doc/src/lib/reading-position.ts` (`rememberReadingPosition(): ReadingPosition`,
  `restoreReadingPosition(position: ReadingPosition): void`, `type ReadingPosition = { ids: string[]; offset: number }`)
- Modify: `apps/doc/src/components/FrameworkSwitch.astro`, `apps/doc/src/components/FrameworkTabs.tsx`
  (`FrameworkSwitchLinks({ labelledBy, current, hrefs })` replaces `FrameworkSwitchRadios`: Udixio `Tab` with `href`,
  `aria-current="page"` on the current one; a click stores the choice and calls `navigate(href + location.hash)`),
  `apps/doc/src/components/Navigation.tsx` (`sectionFromPathname` on `splitFramework(pathname).path`),
  `apps/doc/src/components/Sidebar.tsx` (active page on bare paths; links through `withFramework`), both under spec §2.8's
  hydration rule (first render from the `pathname` prop's prefix else `react`, never the store; after mount the pathname's
  prefix else the stored choice; no `data-framework-link` in an island),
  `apps/doc/src/layouts/layout.astro` (canonical by `canonicalUrl`; the head script rewrites only static
  `[data-framework-link]` links, before paint and on `astro:before-swap`; in the `<head>`, `<meta data-pagefind-filter="framework[content]">`
  with the reading's one id, or the four on every page that is not a prefixed reading), `apps/doc/src/lib/framework-choice.ts` (a prefixed page never writes the store),
  `apps/doc/src/components/DocumentationSearch.tsx` (`filters: { framework: <stored> }`)
- Test: `apps/doc/tests/framework-tabs.browser.test.mjs` (rewritten for the switch as navigation),
  `apps/doc/tests/framework-urls.browser.test.mjs` (extended)

- [ ] **Step 1: Write the failing tests**: `the switch is four links, the current one aria-current`; `the switch works
without JavaScript` (`javaScriptEnabled: false`: clicking Svelte opens `/svelte/motion/presence`); `a switch keeps the
heading under the reading line and the hash` (scroll to "Variants", switch, the same heading is within 4 px of its offset;
      with `#options` in the URL the hash stays); `Back returns to the framework left`; `a switch stores the choice, a visit does
not`; `the rail opens Animation on a prefixed URL and marks the page`; `rail links keep the reading's prefix`; `a neutral
page rewrites its static framework links to the stored choice before the first paint`; `on /motion/glossary with Svelte
stored, no console error or warning, and after hydration the side panel's framework links start with /svelte/`; `on
/angular/motion/presence with Svelte stored they start with /angular/`; `with Svelte stored, search finds
/components/button/overview and /theme/colors, and only the Svelte reading of a framework-dependent page`; `/motion/api keeps its headings and anchors and orders its
blocks by the stored framework`.
- [ ] **Step 2: Run them to see them fail** (one dev server, Chromium, the two files one after the other). Expected: FAIL.
- [ ] **Step 3: Implement** spec §2.7 to §2.9 (canonical through `astro-seo`'s `canonical` or a `<link>`, from
      `canonicalUrl(Astro.url.pathname, Astro.site)`).
- [ ] **Step 4: Run them**: PASS on Chromium; then the same two files on WebKit (scroll keeping, hydration). Search needs
      the Pagefind index: those tests skip on a dev server and run in the controller's built-site pass (Task 23).
- [ ] **Step 5: Commit** `git commit -m "feat(doc): the framework switch navigates between readings and keeps the place" -- <files>`

### Task 12: test URLs through `motionUrl` (group C)

Implementer: Haiku, effort `high`. No task review.

**Files:** Modify `apps/doc/tests/motion.browser.test.mjs`, `pages.browser.test.mjs`, `animation.browser.test.mjs`,
`motion-page-claims.browser.test.mjs`, `recipes.browser.test.mjs`, `components-box.browser.test.mjs`,
`sequences-hydration.browser.test.mjs` (not `components-showcase`, deleted by Task 22; not the two files of Task 11).

- [ ] **Step 1:** Replace each `/motion/<slug>` literal with `motionUrl('<slug>')` (or a framework argument where the test
      means one); `location.pathname.startsWith('/motion/lists')` and `'/motion/text'` compare
      `splitFramework(location.pathname).path`; `/motion/glossary` and `/motion/limits` checks stay.
- [ ] **Step 2: Check**: `node --check` on each file; `grep -nE "'/motion/[a-z]" apps/doc/tests/*.mjs` lists only neutral
      pages and fixtures.
- [ ] **Step 3: Commit** `git commit -m "test(doc): motion URLs come from motionUrl" -- <files>`

### Tasks 13 to 20: the motion pages to MDX (group D, parallel)

Implementer: Haiku, effort `high` (`max` for Tasks 13, 14 and 20). Review: Sonnet for Tasks 13 and 20 (logic in the
choosing and API pages); the final review covers the others. Brief block B, plus `task-template.md` and spec §2.4. `task-template.md` was updated on 2026-11-28 for the MDX rules
(`props.framework` for prose, islands chosen in an `.astro` component, no headings inside conditions); it no longer
prescribes `ForFramework` or `ApiName`.

| Task | Pages (`src/pages/motion/<slug>.astro` -> `src/data/motion/<slug>.mdx`)                                                                                                                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13   | `getting-started`, `choosing-an-api` (with the inline-spec example of spec §3.4)                                                                                                                                                                                                                           |
| 14   | `how-it-works`, `troubleshooting`                                                                                                                                                                                                                                                                          |
| 15   | `recipes`, `recipes/dialog`, `recipes/toasts`, `recipes/accordion`, `recipes/tab-indicator`, `recipes/navigation-menu`                                                                                                                                                                                     |
| 16   | `emphasis`, `layout`, `lists`, `shared-elements`                                                                                                                                                                                                                                                           |
| 17   | `reveal`, `scrub`, `loop` (it says once that React's prop is `looping`), `text`, `svg`                                                                                                                                                                                                                     |
| 18   | `values`, `gestures` (after its pending change is committed), `sequences`, `animate`, `scroll`, `page-transitions`                                                                                                                                                                                         |
| 19   | `tokens`, `presets`, `accessibility`, `per-breakpoint`, `loading-and-weight` (neutral)                                                                                                                                                                                                                     |
| 20   | `api` (neutral: one page at `/motion/api`, one set of headings and anchors; its blocks keep their run-time order from `data-docs-framework` through `motion/api/apiPage.ts`; its frontmatter logic moves to an `.astro` component), `glossary`, `inspect`, `limits`, `roadmap` (all neutral but `inspect`) |

**Files (each task):** Create `apps/doc/src/data/motion/<slug>.mdx` and `apps/doc/src/components/motion/demos/<Example>.astro`
for each live demo; Delete `apps/doc/src/pages/motion/<slug>.astro`; Modify only scene or component files used by these
pages alone (grep first). Never `motion-nav.ts`, `MotionPage.astro`, `MotionUsage.astro`, a shared suite, or another
batch's files.

- [ ] **Step 1:** `cd apps/doc && node --test --test-name-pattern "^(<slug>|<slug>…):" tests/motion-entries.test.mjs`: FAIL.
- [ ] **Step 2:** Move each page per spec §2.4 (prose by `props.framework`, headings outside conditions, links bare, demos
      through `demos/*.astro`, inline code strings and prose in the new syntax of spec §3, `ApiName` replaced by a
      condition, `Choice frameworks` kept; no `title` or `description`: `MotionEntry` passes the need). Keep the content; change only what the move and the syntax require.
- [ ] **Step 3:** The command of Step 1 PASSes. Nothing else: no dev server, no browser (CLAUDE.md, "Parallelise the writing,
      not the checks"). Report the pages, the demo components created, and the suites that cover them.
- [ ] **Step 4: Commit** `git commit -m "docs(motion): <pages> in MDX, one framework per reading" -- <files>`

### Group D check (controller, after Tasks 13 to 20)

- [ ] **Step 1:** `node --test tests/motion-entries.test.mjs`: every slug PASSes.
- [ ] **Step 2:** One build and one static server (Task 23's recipe); in series, on Chromium: each moved page's four
      readings and stub at 1280 and 375, light and dark; `built-site.test.mjs`; the suites the batches reported, one file at a
      time. The failures go to Task 21 as its list.

### Task 22: the `/motion` home by notion (group E, first)

Implementer: Haiku, effort `high`. Review: Sonnet (visual). Brief block B.

**Files:**

- Create: `apps/doc/src/components/motion/root/Notions.astro`, `apps/doc/src/components/motion/root/Notion.astro`
- Modify: `apps/doc/src/pages/motion/index.astro` (imports, comment; title `motionTitle(home)`, description the home's
  summary), `apps/doc/src/lib/motion-nav.ts` (`scene` removed from `MotionNeed` and its entries; the home summary no longer
  says "every need with its page"), `root/Hero.astro` (the four install commands and the four adapter lines become
  `data-view="code"` `[data-example-panel][data-framework]` panels of one `[data-code-frameworks]` group without tabs),
  `root/Principle.astro` (its four results become the `data-view="preview"` panels of its code block, marked
  `data-code-layout="split"` and `data-code-previews`; look and toolbar unchanged), `root/GettingStartedLink.tsx`
  (`data-framework-link`), `apps/doc/src/lib/framework-choice.ts` (`showChosenFramework` also applies the panel rule, the
  one function the layout's head script uses for panels; the variant rule stays until Task 21), `apps/doc/tests/animation.browser.test.mjs` (first test rewritten: hero, principle, six notions in order with
  their links, facts; the preview tests and the components test deleted). `root/framework.ts` stays.
- Delete: `root/Gallery.astro`, `root/NeedCard.astro`, `root/previews.ts`, `root/Components.astro`, `root/components/`
  (seven files), `apps/doc/tests/components-showcase.browser.test.mjs`

- [ ] **Step 1: Write the failing tests** in `animation.browser.test.mjs`: `the home shows six notions in the side panel's
order`: h3s are Presence, Emphasis, Layout and shared elements, Reveal and scrub, Loop, Values, gestures, sequences; each
      block's sentence is spec §4's; links per block as spec §4, prefixed by the stored framework (`data-framework-link`); the
      "Also" row lists animateStyle and springs, Tokens, Presets, Accessibility, Per breakpoint; each demo hydrates (Save shows
      the toast, Like presses). `the hero and the principle follow the stored framework without variants`: with Svelte stored,
      the Svelte install panel and the Svelte result are shown before hydration and the others hidden; a change of the store
      after load switches both; `document.querySelectorAll('[data-framework-variant]')` on the home is empty. Run on one dev
      server, Chromium: FAIL.
- [ ] **Step 2:** Build the section per spec §4 (two columns from 800 px of page, `rise` preset), the Hero and Principle
      panels, the panel rule; delete the files above.
- [ ] **Step 3:** The tests PASS; `grep -rn "Gallery\|NeedCard\|previews\|Components.astro\|\.scene" apps/doc/src` finds
      nothing; screenshots at 1280 and 375, light and dark, reduced motion; the home's transferred JS (six islands) noted.
- [ ] **Step 4: Commit** `git commit -m "feat(doc): the motion home shows six notions, each with a live demo" -- <files>`

### Task 21: remove the toggles, reconcile the shared suites (group E, after Task 22)

Implementer: Haiku, effort `max`. Review: Sonnet. Brief block B.

**Files:**

- Delete: `apps/doc/src/components/ForFramework.astro`, `apps/doc/src/components/ApiName.astro`
- Modify: `Choice.astro`, `Fact.astro`, `Step.astro` (only `Astro.params.framework`), `MotionPage.astro` (`frameworkSwitch`,
  `title` and `description` props removed; remaining callers, `pages/motion/fixtures/components.astro` included, pass `need`),
  `lib/framework-choice.ts` (the variant rule and `frameworksIn`'s variant use deleted; the code-block contract, the store and
  `data-docs-framework` stay; its header comment rewritten), `layouts/layout.astro` (the head script's variant branch and
  selector deleted), `tests/motion.browser.test.mjs`, `pages.browser.test.mjs`, `motion-page-claims.browser.test.mjs`,
  `recipes.browser.test.mjs` (the failures the controller lists after group D, and the variant assertions)

- [ ] **Step 1:** `grep -rn "ForFramework\|ApiName\|data-framework-variant\|frameworkVariant\|frameworkSwitch" apps/doc/src apps/doc/tests`
      lists every use; `node --test tests/motion-entries.test.mjs` PASSes for every slug.
- [ ] **Step 2:** Delete and simplify; fix each listed suite failure by its cause (a selector of a removed toggle, a URL), not by
      loosening an assertion.
- [ ] **Step 3:** The grep finds nothing; the touched suites and `animation.browser.test.mjs`, run by test name on one dev
      server, Chromium: PASS.
- [ ] **Step 4: Commit** `git commit -m "refactor(doc)!: one framework per reading, the variant toggles go" -- <files>`

### Task 23: final verification (controller)

- [ ] **Step 1: Build** (load < 4, > 3 GB free): `npx nx build @udixio/motion --skip-sync`, `npx nx build @udixio/core --skip-sync`,
      `npx nx build @udixio/ui-react --skip-sync`, `npx nx build ui-svelte --skip-sync`,
      `npx nx build ui-angular --skip-sync --exclude-task-dependencies`; `cd apps/doc && npm run docgen && npm run docgen:check &&
node scripts/motion-api.mjs --check && time npx astro build`. Record the build time against Task 10c's.
- [ ] **Step 2: Packages**: React `npx vitest run`; Angular jest (`npx nx test ui-angular --skip-sync`); Svelte vitest and
      svelte-check; motion `tsc -p tsconfig.spec.json`, `--project unit`, `MOTION_BROWSERS=<e> --project browser` per engine,
      `node --test scripts/*.test.mjs`, `npx size-limit`; core `--project unit` and `CORE_BROWSERS=<e> --project browser`.
- [ ] **Step 3: Doc node tests**: `node --test tests/framework-url.test.mjs tests/motion-entries.test.mjs tests/built-site.test.mjs
tests/motion-examples.test.mjs scripts/motion-api.test.mjs scripts/docgen.test.js`: PASS, no skip.
- [ ] **Step 4: Doc browser suites**, served with `python3 -m http.server 4322 --bind 127.0.0.1` from
      `apps/doc/.vercel/output/static`, one file at a time, each on chromium, firefox, webkit:
      `MOTION_BROWSERS=<e> MOTION_DOC_URL=http://localhost:4322 node --test --test-concurrency=1 tests/<f>.browser.test.mjs` for
      `framework-urls`, `framework-tabs`, `motion`, `animation`, `pages`, `recipes`, `components-box`, `motion-page-claims`
      (+ `sequences-hydration` on a dev server). Redirects are not served by the static server: they are checked in
      `config.json` (Step 3) and, if a preview deployment exists, with `curl -sI`. Known flakes (pass alone): root long task
      (Chromium), core navigation-rail width (Firefox). Spec acceptance criteria 10 to 16 are covered by `framework-urls`
      (search, hydration, stub), `built-site.test.mjs` (prefixed paths, canonical, sitemap) and the React specs (Task 3):
      check each is in a passing run.
- [ ] **Step 5: Sweeps**: the throwaway-tsconfig sweep of `apps/doc`; `grep -rnE "<Motion[^>]*\b(name|step)=|useMotion\('|udxMotion=|\[udxMotion\]|motion\('"
apps/doc/src packages/*/src packages/motion/README.md plugins --exclude=Motion.types.spec.tsx --exclude=motion-sources.types.ts`
      finds nothing (those two type tests write `name`, `step` and `motion('slide')` on purpose; the compile covers the rest); `grep -rn '<button\|<input\|<select\|role="tab"' apps/doc/src`
      justified.
- [ ] **Step 6: Look**: every changed page in a browser, light and dark, 1280 and 375, reduced motion; the stub with and
      without a stored choice; the switch in the three engines.
- [ ] **Step 7:** Final review (Sonnet, effort `high`) of the branch diff against the spec; fix rounds to a fresh Haiku.
