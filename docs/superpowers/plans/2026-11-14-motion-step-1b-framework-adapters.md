# @udixio/motion — étape 1b : adaptateurs React, Angular, Svelte — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offrir la surface d'écriture de `@udixio/motion` dans chaque framework — `useMotion` (React), directive `udxMotion` (Angular), attachment `motion` (Svelte) — avec l'entrée au montage, la sortie au démontage et le rejeu d'une emphase.

**Architecture:** Les adaptateurs sont des enveloppes minces autour de la liaison du noyau (`motion(el, source)` → `MotionBinding`, livrée à l'étape 1a). Ils n'ajoutent aucune logique d'animation : ils branchent le cycle de vie du framework (montage, démontage, changement d'entrée) sur `setPresent`, `play` et `destroy`. La rétention du nœud pendant une sortie passe par l'idiome de chaque framework (§8.0 #2) : état `mounted` en React, `(animate.leave)` en Angular, `transition:` en Svelte.

**Tech Stack:** TypeScript, React 19 (ref avec nettoyage, `useSyncExternalStore`), Angular 21 (`input()`, `afterNextRender`, `animate.leave`), Svelte 5.46 (attachments, transitions), Vitest + jsdom (React, Svelte), Jest + jsdom (Angular), Playwright (doc).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.0 #2 (présence), §8.0 bis #3 (même surface partout), §8.2.4 (défauts par verbe), §8.3.5 (état et règles de l'étape 1a).

## Global Constraints

- Les adaptateurs vivent dans `@udixio/ui-react`, `@udixio/ui-angular`, `@udixio/ui-svelte`. **`@udixio/motion` ne dépend d'aucun framework.**
- **Aucune logique internal-only** : tout ce qu'un adaptateur utilise vient d'une entrée publique de `@udixio/motion`.
- Aucune logique d'animation dans un adaptateur : pas de keyframes, pas de timing, pas d'écriture de style. Seuls `setPresent`, `play`, `destroy` sont appelés.
- Verbes pris en charge : `appear`, `disappear`, `emphasize`. Le déclencheur est fixé par le verbe.
- **Règle d'entrée** : un élément monté par le framework côté client joue son entrée. Un contenu livré par le serveur et hydraté est considéré en place (`settled`) **quand le framework l'indique par une API publique** (React). Angular et Svelte n'en exposent pas : l'option explicite `settled` existe dans les trois adaptateurs.
- `data-presence` et `inert` sont écrits par le runtime seul ; un adaptateur ne les touche jamais.
- **Jamais d'exception au rendu** : un nom de motion pas encore défini ne casse pas le composant ; l'élément reste visible et se lie quand la définition arrive.
- Rien ne s'exécute côté serveur : aucun accès au DOM pendant un rendu SSR.
- Tests jsdom : pas de WAAPI, donc le noyau applique l'état de destination tout de suite. Les tests d'adaptateur vérifient le branchement (appels, états finaux, montage), pas l'animation — celle-ci est couverte par les tests navigateur de `packages/motion` et par la démo.
- **Charge machine** : pendant une tâche, uniquement le fichier de test concerné, une commande à la fois ; suites complètes et trois navigateurs à la Task 6 seulement. Les tests Angular (jest) lisent `packages/motion/dist` et `packages/core/dist` : le contrôleur reconstruit `@udixio/motion` avant la Task 3.
- Commits : message terminé par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ; ne jamais pousser ; fichiers indexés par chemin explicite.

## Review Focus

1. **Bascule rapide** : `present` repasse à `true` avant la fin de la sortie → l'élément reste monté et finit présent ; aucune sortie périmée ne le démonte. → tests Tasks 2, 3, 4.
2. **Composant démonté pendant une animation** : liaison détruite, aucune mise à jour d'état après le démontage, aucune erreur. → tests Tasks 2, 3, 4.
3. **Nom pas encore défini au montage** (île hydratée avant celle qui définit) : pas d'exception, élément visible, liaison créée à l'arrivée de la définition, sans rejouer l'entrée. → test Task 1.
4. **Sortie sans liaison** (nom inconnu, ou liaison déjà détruite) : le nœud est retiré tout de suite — `animationComplete()` appelé en Angular, durée 0 en Svelte — au lieu d'attendre le délai de garde du framework (4 s en Angular). → tests Tasks 3, 4.
5. **Rendu serveur** : `renderToString` (React) et rendu SSR Svelte ne lèvent pas et ne lisent pas le DOM ; `mounted` reflète `present`. → tests Tasks 2, 4.

---

### Task 0 (contrôleur) : dépendances

Fait par le contrôleur avant de lancer les implémenteurs, en un commit `build: depend on @udixio/motion in the framework adapters`.

- [ ] Ajouter `"@udixio/motion": "0.0.0"` aux `dependencies` de `packages/ui-react`, `packages/ui-angular`, `packages/ui-svelte` (même écriture que dans `packages/core/package.json`).
- [ ] Ajouter `@udixio/motion` aux modules externes du build de chaque paquet, à côté de `@udixio/core` (`packages/ui-react/vite.config.ts` ; équivalents Angular et Svelte s'ils listent leurs externes).
- [ ] `pnpm install` une fois à la racine ; vérifier que le lockfile ne change que pour ces trois liens.

### Task 1 : `motionWhenDefined` dans le noyau

**Files:**
- Modify: `packages/motion/src/bind.ts`, `packages/motion/src/bind.browser.spec.ts`, `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `motion`, `MotionBinding`, `MotionSource`, `resolveMotion`, `onMotionDefined`, `definedMotions`.
- Produces :
  ```ts
  export interface DeferredMotion {
    /** The binding, once the motion is defined. */
    readonly binding: MotionBinding | undefined;
    destroy(): void;
  }
  export function motionWhenDefined(
    target: HTMLElement,
    source: MotionSource,
    options?: { present?: boolean; settled?: boolean; development?: boolean },
  ): DeferredMotion
  ```

  `MotionBinding` gagne `readonly verb: MotionSpec['verb']` (les adaptateurs en ont besoin pour ne rejouer que les emphases ; `connect.ts` peut alors abandonner sa table `verbs` au profit de `getMotion(el)?.verb` en gardant un `Set` des éléments qu'il a liés).

Règles :
- `source` déjà résoluble (référence, spec, ou nom défini) : liaison immédiate avec les options reçues.
- Nom non défini : aucune exception, élément non touché ; en développement, un `console.error` `[@udixio/motion] Unknown motion "<nom>". Defined: <liste>` ; abonnement à `onMotionDefined` ; à l'arrivée du nom, liaison avec `settled: true` et le `present` reçu.
- `destroy()` : arrête l'abonnement et détruit la liaison si elle existe. Idempotent.
- Une spec invalide lève toujours (erreur d'auteur, pas une question d'ordre de chargement).

- [ ] **Step 1 : tests** (`bind.browser.spec.ts`) :
  - nom défini → `binding` défini tout de suite, une animation d'entrée ;
  - **Review Focus 3** : nom `when-defined-later` non défini → pas d'exception, `binding` `undefined`, aucun style en ligne, un `console.error` avec `development: true` ; après `defineMotion('when-defined-later', fade.spec)` → `binding` défini, `document.getAnimations()` vide, `data-presence="present"` ;
  - `destroy()` avant la définition, puis définition → `getMotion(target)` `undefined` ;
  - spec invalide → `TypeError` ;
  - `motion(target, press).verb === 'emphasize'`.
- [ ] **Step 2 :** `MOTION_BROWSERS=chromium npx vitest run src/bind.browser.spec.ts` (dans `packages/motion`) → FAIL.
- [ ] **Step 3 :** implémenter dans `bind.ts`, exporter depuis `index.ts` ; simplifier `connect.ts` comme indiqué.
- [ ] **Step 4 :** PASS, puis `MOTION_BROWSERS=chromium npx vitest run src/connect.browser.spec.ts` → PASS ; `npx tsc --noEmit -p tsconfig.spec.json` → code 0.
- [ ] **Step 5 :** commit `feat(motion): bind a motion as soon as its name is defined`.

### Task 2 : React — `useMotion`

**Files:**
- Create: `packages/ui-react/src/lib/hooks/useMotion.ts`, `packages/ui-react/src/tests/useMotion.spec.tsx`, `packages/ui-react/src/tests/useMotion.ssr.spec.tsx`
- Modify: `packages/ui-react/src/lib/hooks/index.ts`

**Interfaces:**
- Consumes: `motionWhenDefined`, `DeferredMotion`, `MotionBinding` (`verb`, `play`, `setPresent`), `MotionSource` de `@udixio/motion`.
- Produces :
  ```ts
  export interface UseMotionOptions {
    /** Whether the element is present. Default: true. */
    present?: boolean;
    /** An emphasis replays each time this value changes. */
    state?: unknown;
    /** Treat the element as already in place: no entry. Default: true when hydrating server content. */
    settled?: boolean;
  }
  export interface UseMotionReturn<T extends HTMLElement> {
    /** Put it on the animated element. */
    ref: RefCallback<T>;
    /** True while the element must be rendered: present, or still leaving. */
    mounted: boolean;
    /** Replays an emphasis. */
    play: () => void;
    /** The core binding (handle: pause, reverse, seek), once bound. */
    getBinding: () => MotionBinding | undefined;
  }
  export function useMotion<T extends HTMLElement = HTMLElement>(source: MotionSource, options?: UseMotionOptions): UseMotionReturn<T>
  ```
  Usage visé :
  ```tsx
  const panel = useMotion('slide', { present: open });
  return panel.mounted && <div ref={panel.ref}>…</div>;
  ```

Règles :
- `ref` est stable et renvoie une fonction de nettoyage (React 19) : à l'attache, `motionWhenDefined(el, source, { present, settled })` ; au détachement, `destroy()`.
- Hydratation : `useSyncExternalStore(subscribe, () => false, () => true)` vaut `true` au premier rendu d'un contenu hydraté. Sa valeur au premier rendu fixe le `settled` par défaut de la première attache ; les attaches suivantes (remontage) jouent l'entrée.
- `mounted = present || sortieEnCours`. Quand `present` passe à `false` : `binding.setPresent(false)` ; l'élément est démonté seulement si la promesse vaut `'finished'` et que `present` est toujours `false`. Sans liaison (nom inconnu) : démontage immédiat.
- Quand `present` repasse à `true` pendant la sortie : `binding.setPresent(true)`.
- `state` : au changement de valeur après la première attache, `binding.play()` si le verbe est `emphasize` ; ignoré pour un verbe de présence (`play()` y lève : ne pas l'appeler). `play` renvoyé : même garde.
- Changement de `source` (nom, ou `name` d'une référence) : nouvelle liaison, `settled: true`.
- Aucune mise à jour d'état après le démontage du composant.

- [ ] **Step 1 : tests.** `useMotion.spec.tsx` simule `@udixio/motion` (`vi.mock`, `motionWhenDefined` renvoyant une liaison factice dont `setPresent` renvoie une promesse contrôlée par le test) :
  - montage client → `motionWhenDefined` appelé avec `{ present: true, settled: false }` ; démontage → `destroy` appelé ;
  - `hydrateRoot` sur un HTML produit par `renderToString` → appelé avec `settled: true` ; un remontage ultérieur → `settled: false` ;
  - `present: false` → `setPresent(false)` appelé, élément encore dans le DOM ; promesse résolue `'finished'` → élément retiré ;
  - **Review Focus 1** : `present` `false` puis `true` avant la résolution, puis résolution `'cancelled'` → élément toujours monté, `setPresent(true)` appelé ;
  - **Review Focus 2** : composant démonté pendant la sortie, puis résolution `'finished'` → aucun avertissement React, `destroy` appelé une fois ;
  - `state` qui change sur une liaison `emphasize` → `play` appelé une fois ; sur une liaison `appear` → jamais ;
  - un test non simulé (vrai noyau, jsdom) : `useMotion(fade)` → après montage `data-presence="present"`.
  `useMotion.ssr.spec.tsx` (**Review Focus 5**) : `renderToString` avec `present: true` rend l'élément, avec `present: false` ne le rend pas, sans erreur.
- [ ] **Step 2 :** `cd packages/ui-react && npx vitest run src/tests/useMotion.spec.tsx src/tests/useMotion.ssr.spec.tsx` → FAIL.
- [ ] **Step 3 :** implémenter, exporter (`useMotion`, `UseMotionOptions`, `UseMotionReturn`) depuis `hooks/index.ts`, avec TSDoc (`@devx`, `@limitations` comme les autres hooks).
- [ ] **Step 4 :** PASS.
- [ ] **Step 5 :** commit `feat(ui-react): add useMotion`.

### Task 3 : Angular — directive `udxMotion`

**Files:**
- Create: `packages/ui-angular/src/lib/motion/motion.ts`, `packages/ui-angular/src/lib/motion/motion.spec.ts`
- Modify: `packages/ui-angular/src/index.ts`

**Interfaces:**
- Consumes: `motionWhenDefined`, `DeferredMotion`, `MotionSource` de `@udixio/motion` ; `AnimationCallbackEvent` de `@angular/core`.
- Produces :
  ```ts
  @Directive({ selector: '[udxMotion]', exportAs: 'udxMotion', host: { '(animate.leave)': 'leave($event)' } })
  export class Motion {
    readonly source = input.required<MotionSource>({ alias: 'udxMotion' });
    readonly present = input(true, { alias: 'udxMotionPresent' });
    readonly state = input<unknown>(undefined, { alias: 'udxMotionState' });
    readonly settled = input(false, { alias: 'udxMotionSettled', transform: booleanAttribute });
    play(): void;
    /** The core binding (handle: pause, reverse, seek), once bound. */
    get binding(): MotionBinding | undefined;
    protected leave(event: AnimationCallbackEvent): void;
  }
  ```
  Usage visé :
  ```html
  @if (open()) { <div udxMotion="slide">…</div> }
  <button udxMotion="press" [udxMotionState]="count()">…</button>
  ```

Règles :
- Liaison créée dans le navigateur seulement, après le premier rendu de l'hôte (`afterNextRender`), avec `present` et `settled` lus à ce moment ; détruite à la destruction de la directive.
- `leave(event)` — retrait structurel (`@if`, `@for`) : `binding.setPresent(false)`, puis `event.animationComplete()` quand la promesse se résout, quelle que soit sa valeur. **Review Focus 4** : sans liaison, `animationComplete()` tout de suite.
- `udxMotionPresent` : au changement, `binding.setPresent(valeur)` (nœud gardé dans le DOM par l'auteur).
- `udxMotionState` : au changement après la liaison, `play()` si le verbe est `emphasize`.
- Changement de `udxMotion` : nouvelle liaison, `settled: true`.
- Suivre les conventions de `packages/ui-angular/src/lib/badge/badge.ts` (signaux, `afterRenderEffect`, zoneless).
- Si Angular n'appelle pas un écouteur `(animate.leave)` déclaré dans `host` d'une directive, **s'arrêter et rapporter BLOCKED** avec l'observation exacte : ne pas inventer un autre mécanisme.

- [ ] **Step 1 : tests** (`motion.spec.ts`, composants hôtes de test, `@udixio/motion` simulé comme en Task 2 sauf mention) :
  - création → `motionWhenDefined` appelé avec `{ present: true, settled: false }` ; `udxMotionSettled` → `settled: true` ; destruction → `destroy` ;
  - `@if` qui passe à `false` → `setPresent(false)` appelé, élément encore dans le DOM ; promesse résolue → élément retiré ;
  - **Review Focus 1** : `[udxMotionPresent]` `false` puis `true` → `setPresent(true)` appelé, élément présent ;
  - **Review Focus 2** : fixture détruite pendant la sortie → pas d'erreur, `destroy` appelé ;
  - **Review Focus 4** : `motionWhenDefined` renvoyant `binding: undefined`, `@if` à `false` → élément retiré sans attendre ;
  - `[udxMotionState]` qui change sur un `emphasize` → `play` une fois ;
  - un test non simulé : `udxMotion="fade"` (preset importé) → `data-presence="present"` après stabilisation.
- [ ] **Step 2 :** `cd packages/ui-angular && npx jest --config jest.config.cjs --runInBand src/lib/motion` → FAIL.
- [ ] **Step 3 :** implémenter, exporter depuis `src/index.ts`, TSDoc aux conventions du paquet.
- [ ] **Step 4 :** PASS.
- [ ] **Step 5 :** commit `feat(ui-angular): add the udxMotion directive`.

### Task 4 : Svelte — attachment `motion` et transition `presence`

**Files:**
- Create: `packages/ui-svelte/src/lib/motion/motion.attachment.svelte.ts`, `packages/ui-svelte/src/lib/motion/motion.types.ts`, `packages/ui-svelte/src/lib/motion/motion.fixture.svelte`, `packages/ui-svelte/src/lib/motion/motion.spec.ts`, `packages/ui-svelte/src/lib/motion/index.ts`
- Modify: `packages/ui-svelte/src/lib/index.ts`

**Interfaces:**
- Consumes: `motionWhenDefined`, `getMotion`, `MotionSource` de `@udixio/motion` ; `Attachment` de `svelte/attachments` ; `TransitionConfig` de `svelte/transition`.
- Produces :
  ```ts
  export interface MotionAttachmentOptions { present?: boolean; state?: unknown; settled?: boolean }
  export function motion(source: MotionSource, options?: () => MotionAttachmentOptions): Attachment<HTMLElement>
  /** Keeps a leaving element in the DOM for the time of its exit. Use as `transition:presence`. */
  export function presence(node: Element): (options: { direction: 'in' | 'out' | 'both' }) => TransitionConfig
  ```
  Usage visé :
  ```svelte
  {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
  <button {@attach motion('press', () => ({ state: count }))}>…</button>
  ```

Règles :
- L'attachment lie une fois (`motionWhenDefined`, options lues sans dépendance réactive) et renvoie `destroy`. `present` et `state` sont suivis dans des effets enfants, comme `tooltip.attachment.svelte.ts` : `present` → `setPresent` ; `state` → `play()` si `emphasize`, pas à la première lecture.
- `presence` renvoie une fonction (appelée par Svelte au microtask suivant, avec la direction) :
  - `out` : `binding.setPresent(false)` ; renvoie `{ duration: binding.handle?.duration ?? 0, tick: () => {} }` ;
  - `in` : `binding.setPresent(true)` (sans effet si l'élément est déjà présent) ; renvoie `{ duration: 0 }` ;
  - **Review Focus 4** : sans liaison (`getMotion(node)` `undefined`) → `{ duration: 0 }`.
- Le fichier d'attachment n'est jamais exécuté au rendu serveur ; ne rien lire du DOM au niveau module.

- [ ] **Step 1 : tests** (`motion.spec.ts` avec `motion.fixture.svelte`, `@udixio/motion` simulé sauf mention) :
  - montage → `motionWhenDefined` appelé avec `{ present: true, settled: false }` ; option `settled` transmise ; démontage → `destroy` ;
  - changement de `present` → `setPresent` appelé, l'attachment n'est pas recréé (`motionWhenDefined` appelé une seule fois) ;
  - changement de `state` sur un `emphasize` → `play` une fois ;
  - `presence` direction `out` avec une liaison factice de durée 300 → `setPresent(false)` appelé, configuration `{ duration: 300 }` ; **Review Focus 1** : direction `in` ensuite → `setPresent(true)` ;
  - **Review Focus 4** : `presence` sans liaison → `{ duration: 0 }` ;
  - **Review Focus 2** : fixture démontée pendant la sortie → pas d'erreur, `destroy` appelé ;
  - **Review Focus 5** : rendu serveur de la fixture (`render` de `svelte/server`) sans erreur ;
  - un test non simulé : `{@attach motion(fade)}` → `data-presence="present"`.
- [ ] **Step 2 :** `cd packages/ui-svelte && npx vitest run src/lib/motion` → FAIL.
- [ ] **Step 3 :** implémenter, exporter `motion`, `presence`, `MotionAttachmentOptions` depuis l'index du paquet.
- [ ] **Step 4 :** PASS ; `npx svelte-check` limité au dossier si le paquet en a un script, sinon rien.
- [ ] **Step 5 :** commit `feat(ui-svelte): add the motion attachment and presence transition`.

### Task 5 : démo par framework dans la documentation

**Files:**
- Create: `apps/doc/src/components/motion-demo/ReactPresence.tsx`, `apps/doc/src/components/motion-demo/AngularPresence.ts`, `apps/doc/src/components/motion-demo/SveltePresence.svelte`
- Modify: `apps/doc/src/pages/motion/demo.astro`, `apps/doc/tests/motion.browser.test.mjs`, `packages/motion/README.md` (section « Writing a motion » : sous-section « Frameworks », et retrait de la limite « adapters are not shipped yet »)

**Interfaces:**
- Consumes: `useMotion` (`@udixio/ui-react`), `Motion` (`@udixio/ui-angular`), `motion`, `presence` (`@udixio/ui-svelte`), presets de `@udixio/motion/presets`.

Contenu : section « Frameworks » de `/motion/demo`, trois îles `client:only` (une par framework, même apparence que les cartes existantes). Chaque île : un bouton `Toggle <framework> card` et une carte montée ou démontée par l'idiome du framework (`mounted &&`, `@if`, `{#if}` + `transition:presence`) avec le preset `slide` ; sous chaque île, le code écrit. Chaque carte porte `data-demo-card="react|angular|svelte"`.

- [ ] **Step 1 :** ajouter à `motion.browser.test.mjs` un test par framework dans la boucle des navigateurs : attendre la carte ; cliquer le bouton ; aussitôt, la carte est encore dans le DOM avec `data-presence="exiting"` ; attendre qu'elle soit retirée ; cliquer ; attendre `data-presence="present"`. Aucune `pageerror`.
- [ ] **Step 2 :** implémenter les trois îles, la section et le README. L'implémenteur ne lance ni build ni serveur : le contrôleur vérifie dans le navigateur.
- [ ] **Step 3 :** `node --check apps/doc/tests/motion.browser.test.mjs`.
- [ ] **Step 4 :** commit `docs(motion): show the framework adapters in the demo`.

### Task 6 (contrôleur) : vérification groupée et spec

- [ ] Une commande à la fois : `npx nx build @udixio/motion --skip-sync` ; `MOTION_BROWSERS=chromium,firefox,webkit npx nx test @udixio/motion --skip-sync` ; `cd packages/core && npx vitest run` ; `npx nx run @udixio/ui-react:vitest:test --skip-sync` ; `npx nx test ui-svelte --skip-sync` ; `npx nx test ui-angular --skip-sync` ; `cd packages/motion && pnpm size` (budget `core` re-mesuré si dépassé).
- [ ] Doc : `npx astro build` dans `apps/doc`, site statique servi sur le port 4322, `MOTION_BROWSERS=chromium,firefox,webkit node --test tests/motion.browser.test.mjs`.
- [ ] Spec : §8.3.5 (adaptateurs livrés, règles fixées, points ouverts), §8.6 (étape 1 terminée), journal. Commit `docs(motion): record step 1b delivery in the spec`.
