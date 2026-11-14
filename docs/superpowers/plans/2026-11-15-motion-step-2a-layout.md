# @udixio/motion — étape 2a : verbe `layout` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un élément marqué `layout` rejoint en mouvement sa nouvelle place et sa nouvelle taille quand la mise en page change (classe, attribut `data-*`, enfants ajoutés, retirés ou réordonnés), sans que l'auteur mesure quoi que ce soit.

**Architecture:** FLIP sur cache de géométrie (§8.4 F7, M3-L02, I10, spike S2). Chaque élément suivi appartient à une **portée** (l'ancêtre `data-motion-scope` le plus proche, sinon son parent). Un `MutationObserver` par portée détecte le changement après coup ; la position « avant » vient du cache (boîte de layout de la dernière mesure, corrigée du transform en vol pour la reprise `carry`), la position « après » est mesurée une fois les animations en vol annulées ; l'écart est joué en `translate` + `scale` vers l'identité, sans rien laisser en ligne à la fin. Aucune lecture avant mutation n'est demandée à l'auteur ni aux frameworks : le même mécanisme sert HTML, React, Angular et Svelte.

**Tech Stack:** TypeScript, WAAPI (propriétés individuelles `translate`, `scale`), `MutationObserver`, `ResizeObserver`, Vitest navigateur (Playwright), Astro (démo).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.2.3 (`MotionSpec`), §8.2.4 (ligne `layout`), §8.4 F7, §8.1 bis #1 (M3-L02), §8.1 quinquies (I10, S2), §8.3.5 et §8.3.6 (état du code).

**Découpage de l'étape 2 :** 2a (ce plan) = `layout` ; 2b = listes (`stagger`, `origin`, sorties `in-place` / `out-of-flow`) ; 2c = élément partagé (`defineShared`, `data-motion-shared`, rétention 600 ms, View Transitions conditionnelles).

## Global Constraints

- Verbe `layout` : déclencheur = changement observable dans la portée (classe, attribut `data-*`, `hidden`, enfants) ; reprise `carry` par défaut ; rendu réduit `instant` ; ressort `spring.default.spatial` (§8.2.4).
- Une définition `layout` n'a **pas de keyframes** : `defineMotion('nom', { verb: 'layout' })`, options `timing`, `interrupt`, `reduced` seulement.
- Le FLIP n'écrit **aucun style en ligne durable** : à la fin (ou à l'annulation), l'élément est rendu à sa feuille de style.
- Le FLIP passe par le provider (contrat `MotionProvider`), jamais par un appel direct à `element.animate` hors provider.
- Portée : attribut `data-motion-scope` (sans valeur) sur un ancêtre ; à défaut, le parent de l'élément suivi.
- Mouvement réduit (`prefers-reduced-motion`, `data-motion-policy="reduce"`) et `--udx-motion: none` : aucune animation, la nouvelle mise en page s'applique tout de suite.
- **Le contenu ne reste jamais déplacé** : toute erreur ou indisponibilité laisse l'élément à sa place de layout.
- Aucune logique internal-only ; `@udixio/motion` sans dépendance à un framework ; adaptateurs sans logique d'animation.
- Limites assumées de 2a (à documenter) : le contenu d'un élément dont la **taille** change est étiré pendant le mouvement (mise à l'échelle) ; un élément suivi imbriqué dans un élément suivi qui change de taille n'est pas corrigé ; `transform-origin` doit rester au centre ; un déplacement causé par un changement non observé (image qui se charge hors portée) n'est pas animé.
- **Charge machine** : pendant une tâche, uniquement le fichier de test concerné, Chromium seul, une commande à la fois ; suites complètes et trois navigateurs à la Task 6.
- Commits : message terminé par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ; ne jamais pousser ; fichiers indexés par chemin explicite.

## Review Focus

1. **Bascule rapide** (changement inverse pendant le mouvement) : l'élément repart de sa position visuelle courante, sans saut, et finit exactement à sa place, sans style en ligne. → test Task 3.
2. **Défilement interne de la portée** entre deux changements : le cache est rafraîchi, le mouvement suivant ne part pas d'une position périmée. → test Task 3.
3. **Élément masqué puis ré-affiché** (`hidden`, `display: none`) : aucune animation depuis ou vers une boîte de taille nulle. → test Task 3.
4. **Classe de transformation de l'auteur** (`translate-x-4`, `scale-95` sur l'élément suivi) : conservée pendant et après le mouvement. → test Task 3.
5. **Redimensionnement de la fenêtre / point de rupture** : la mise en page change sans mutation ; rien ne s'anime et le cache suit. → test Task 3.

---

### Task 1 : champs `scaleX` / `scaleY` et option `commit` du provider

**Files:**
- Modify: `packages/motion/src/manifest.ts`, `packages/motion/motion-manifest.json` (régénéré par `node scripts/generate-motion-manifest.mjs`), `packages/motion/src/contract.ts`, `packages/motion/src/providers/waapi.ts`, `packages/motion/src/providers/animejs.ts`, `packages/motion/src/providers/css.ts`, `packages/motion/src/play.ts`, `packages/motion/src/timing-integration.ts`
- Test: `packages/motion/src/providers/providers.browser.spec.ts`, `packages/motion/src/play.browser.spec.ts`, `packages/motion/src/define-motion.spec.ts`

**Interfaces:**
- Produces :
  - `VisualFrame` accepte `scaleX` et `scaleY` (retirés de `deferredVisualFields`, ajoutés à `visualFields`). Une frame qui porte `scale` **et** `scaleX` ou `scaleY` est invalide (`TypeError`, chemin `/spec/keyframes/<i>`, code `conflict`).
  - Écriture CSS : propriété `scale` = `"<scale>"` si `scale` est donné, sinon `"<scaleX ?? 1> <scaleY ?? 1>"`.
  - `MotionRequest.commit?: boolean` (défaut `true`). `false` : à la fin, l'animation est retirée et rien n'est écrit en ligne.
  - `startRoutedMotion` transmet `commit` (champ optionnel de son entrée).
  - `applyFrame`, `releaseFrame` et le gel de `carry` (`play.ts`) gèrent les deux champs.
- Les providers `animejs` et `css` refusent `scaleX` / `scaleY` et `commit: false` par une erreur explicite (`RangeError('Unsupported by this provider: …')`) : seul WAAPI les porte dans cette étape.

- [ ] **Step 1 : tests** — provider WAAPI : `[{ scaleX: 0.5, scaleY: 2 }, { scaleX: 1, scaleY: 1 }]` anime `scale` de `0.5 2` à `1 1` ; avec `commit: false`, après `finished`, `target.style.scale === ''` et `getAnimations()` vide ; avec `commit` omis, `target.style.scale === '1 1'` (ou `1`). `define-motion.spec.ts` : frame `{ scale: 1, scaleX: 2 }` → `TypeError` ; `{ scaleX: 0 }` acceptée. `play.browser.spec.ts` : un `appear` `[{ scaleX: 0 }, { scaleX: 1 }]` finit avec un `scale` calculé de `1` (ou `1 1`).
- [ ] **Step 2 :** lancer les trois fichiers, un par un (`MOTION_BROWSERS=chromium npx vitest run <fichier>`) → FAIL.
- [ ] **Step 3 :** implémenter ; régénérer le manifeste JSON ; `node scripts/generate-motion-manifest.mjs --check` → code 0.
- [ ] **Step 4 :** PASS ; `npx tsc --noEmit -p tsconfig.spec.json` → code 0.
- [ ] **Step 5 :** commit `feat(motion): add scaleX and scaleY fields and uncommitted provider runs`.

### Task 2 : définition `layout`, preset `reflow`, calcul du FLIP

**Files:**
- Create: `packages/motion/src/flip.ts`, `packages/motion/src/flip.spec.ts`
- Modify: `packages/motion/src/manifest.ts`, `packages/motion/motion-manifest.json`, `packages/motion/src/define-motion.ts`, `packages/motion/src/define-motion.spec.ts`, `packages/motion/src/presets.ts`, `packages/motion/src/presets.spec.ts`, `packages/motion/src/index.ts`

**Interfaces:**
- Produces :
  - `supportedVerbs` gagne `'layout'`. `defineMotion('x', { verb: 'layout' })` est valide ; `keyframes` présent et non vide → `TypeError` (`/spec/keyframes`, `unsupported`). La spec canonique d'un layout porte `keyframes: []`. `interrupt` accepté pour `layout` (`carry` par défaut).
  - `isPresenceVerb(verb): verb is 'appear' | 'disappear'` exporté par l'index.
  - Preset `reflow: MotionRef<'reflow'>` = `defineMotion('reflow', { verb: 'layout' })`.
  - `flip.ts` (fonctions pures, sans DOM) :
    ```ts
    /** A box: centre and size, relative to its reference. */
    export interface Box { cx: number; cy: number; w: number; h: number }
    /** The element's own individual transform (`translate`, `scale`). */
    export interface OwnTransform { x: number; y: number; sx: number; sy: number }
    /** Layout box (no own transform) from a visual box: undo translate and scale (scale about the centre). */
    export function toLayoutBox(visual: Box, own: OwnTransform): Box
    /** Visual box of a layout box under an own transform. */
    export function toVisualBox(layout: Box, own: OwnTransform): Box
    /** Frames that carry the visual box `before` to the visual box at rest `after`, or null when they match within tolerance. */
    export function flipFrames(before: Box, after: Box, rest: OwnTransform): [VisualFrame, VisualFrame] | null
    /** Parse computed `translate` / `scale` values ('none', '10px', '10px 4px', '0.5', '0.5 2'). */
    export function parseOwnTransform(translate: string, scale: string): OwnTransform
    ```
    `rest` = le transform propre de l'élément au repos (classe de l'auteur) ; `after` = `toVisualBox(boîte de layout après, rest)`. `flipFrames` renvoie `[{ x: rest.x + dx, y: rest.y + dy, scaleX: rest.sx * rw, scaleY: rest.sy * rh }, { x: rest.x, y: rest.y, scaleX: rest.sx, scaleY: rest.sy }]` avec `dx = before.cx - after.cx`, `dy = before.cy - after.cy`, `rw = before.w / after.w`, `rh = before.h / after.h`. Tolérance : `|dx|, |dy| < 0.5` px et `|rw - 1|, |rh - 1| < 0.01` → `null`. Une boîte de taille nulle (avant ou après) → `null`.

- [ ] **Step 1 : tests** (`flip.spec.ts`, Node) : translation pure ; changement de taille ; `rest` non neutre (`{ x: 16, y: 0, sx: 0.95, sy: 0.95 }`) conservé dans la frame d'arrivée ; sous la tolérance → `null` ; taille nulle → `null` ; `toVisualBox(toLayoutBox(v, own), own)` rend `v` ; `parseOwnTransform` sur les cinq formes. `define-motion.spec.ts` : cas `layout` ci-dessus. `presets.spec.ts` : `reflow.spec.verb === 'layout'`.
- [ ] **Step 2 :** `npx vitest run src/flip.spec.ts src/define-motion.spec.ts src/presets.spec.ts` → FAIL.
- [ ] **Step 3 :** implémenter ; régénérer le manifeste JSON.
- [ ] **Step 4 :** PASS ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): define layout motions and compute FLIP frames`.

### Task 3 : portée de layout et liaison

**Files:**
- Create: `packages/motion/src/layout.ts`, `packages/motion/src/layout.browser.spec.ts`
- Modify: `packages/motion/src/bind.ts`, `packages/motion/src/play.ts`, `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `flip.ts`, `startRoutedMotion` avec `commit: false`, `MotionRuntime` (`policy`, `frame`).
- Produces :
  ```ts
  /** Start following `target`: it moves to its new place when its scope changes. */
  export function trackLayout(target: HTMLElement, spec: Readonly<MotionSpec>, options: { runtime: MotionRuntime; development?: boolean }): LayoutTracking
  export interface LayoutTracking {
    readonly handle: MotionHandle | null;   // the move in flight, if any
    /** Compare now, as the scope's observer would. */
    flush(): void;
    destroy(): void;
  }
  /** The watched ancestor of a followed element: closest `[data-motion-scope]`, else its parent. */
  export function layoutScopeOf(target: HTMLElement): HTMLElement
  ```
  `motion(el, source)` avec un verbe `layout` : `binding.verb === 'layout'`, `binding.play()` appelle `flush()` et renvoie le handle en vol (ou un handle établi), `setPresent` lève `TypeError`, `destroy()` arrête le suivi. Aucun `data-presence` n'est écrit pour un layout.
  `play.ts` exporte `playFrames(target, keyframes, { verb, timing, runtime, commit?, development? }): MotionHandle | null` — `null` quand rien ne doit ou ne peut s'animer (réduit, `--udx-motion: none`, échelle 0, WAAPI absent).

Algorithme (détaillé dans les notes du contrôleur au lancement) : une portée par racine (`WeakMap`), un `MutationObserver` (`childList`, `subtree`, `attributes` ; enregistrements `style`, `data-presence`, `inert` ignorés), un `ResizeObserver` sur la racine et un écouteur `scroll` (capture) qui rafraîchissent le cache sans animer ; `flush()` synchrone : (1) position visuelle avant = boîte en cache, composée avec le transform en vol si `carry` ; (2) annulation des animations en vol ; (3) mesure de la boîte de layout après, relative à l'ancêtre suivi le plus proche (sinon à la racine) ; (4) `flipFrames` puis `playFrames(..., { commit: false })`.

- [ ] **Step 1 : tests** (`layout.browser.spec.ts`, Chromium) :
  - conteneur `display:flex; justify-content:flex-start` → classe qui passe en `flex-end` : l'enfant suivi a une animation, son rect visuel juste après le changement est (à 1 px) celui d'avant, et à la fin il est à sa place avec `style.translate === ''` et `style.scale === ''` ;
  - réordonnancement de trois enfants suivis (`append` du premier) : trois animations, positions finales exactes ;
  - changement de taille (classe qui élargit) : `scale` animé, taille finale exacte ;
  - **Review Focus 1** : second changement à mi-course → pas de saut (rect visuel continu à 2 px), arrivée exacte, aucun style en ligne ;
  - **Review Focus 2** : portée défilante, `scrollTop` modifié puis changement → le départ est la position visuelle courante ;
  - **Review Focus 3** : `hidden` posé puis retiré → aucune animation ;
  - **Review Focus 4** : élément avec `translate: 16px 0; scale: 0.95` en feuille de style → valeurs calculées identiques avant et après le mouvement, et le départ visuel est correct ;
  - **Review Focus 5** : largeur de la portée modifiée par un style du parent non observé puis `ResizeObserver` → aucune animation ; un changement de classe ensuite part de la bonne position ;
  - mouvement réduit et `--udx-motion: none` : aucune animation ;
  - `data-motion-scope` sur un ancêtre : un changement de classe sur un cousin déclenche le mouvement ;
  - `destroy()` en vol : animation annulée, aucun style en ligne, plus d'observateur quand la portée est vide.
- [ ] **Step 2 :** `MOTION_BROWSERS=chromium npx vitest run src/layout.browser.spec.ts` → FAIL.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS, puis `src/bind.browser.spec.ts` et `src/play.browser.spec.ts` → PASS ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): follow layout changes with FLIP`.

### Task 4 : `connectMotion` et adaptateurs

**Files:**
- Modify: `packages/motion/src/connect.ts`, `packages/motion/src/connect.browser.spec.ts`
- Modify: `packages/ui-react/src/lib/hooks/useMotion.ts`, `packages/ui-react/src/tests/useMotion.spec.tsx`
- Modify: `packages/ui-angular/src/lib/motion/motion.ts`, `packages/ui-angular/src/lib/motion/motion.spec.ts`
- Modify: `packages/ui-svelte/src/lib/motion/motion.attachment.svelte.ts`, `packages/ui-svelte/src/lib/motion/motion.spec.ts`

**Interfaces:**
- Consumes: `isPresenceVerb`, `binding.verb === 'layout'`.

Règles :
- `connectMotion` : un élément `data-motion="<layout>"` est lié comme les autres ; `hidden` et `data-state` ne pilotent rien pour lui.
- Adaptateurs : la présence (`setPresent`) ne concerne que `appear` et `disappear` — remplacer chaque test `verb !== 'emphasize'` par `isPresenceVerb(verb)`. Un layout avec `present: false` en React est démonté tout de suite ; `leave` Angular et `presence` Svelte terminent tout de suite pour un layout.
- Aucune autre logique : le `MutationObserver` de la portée voit les changements faits par les frameworks.

- [ ] **Step 1 : tests** — connect : `data-motion="reflow"` sur deux enfants d'un conteneur, changement de classe du conteneur → animations ; `hidden` sur un layout → `setPresent` jamais appelé, pas d'erreur. Chaque adaptateur : une liaison factice `verb: 'layout'` → `setPresent` jamais appelé quand `present` change, pas d'exception ; sortie immédiate.
- [ ] **Step 2 :** FAIL (un fichier à la fois).
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS (motion : `connect.browser.spec.ts` ; React, Svelte, Angular : leur fichier `motion` / `useMotion`, un à la fois ; Angular après `npx nx build @udixio/motion --skip-sync`).
- [ ] **Step 5 :** commit `feat(motion): bind layout motions from HTML and the framework adapters`.

### Task 5 : démo et documentation

**Files:**
- Modify: `apps/doc/src/pages/motion/demo.astro`, `apps/doc/tests/motion.browser.test.mjs`, `packages/motion/README.md`

Contenu : section « Layout » de `/motion/demo`, HTML pur avec `data-motion="reflow"` : (1) une rangée dont un bouton bascule `justify-start` / `justify-end` ; (2) une liste de cinq éléments avec « Shuffle » (réordonne) et « Remove first » ; (3) une carte qui s'élargit. README : sous-section « Layout » (définition, preset `reflow`, portée `data-motion-scope`, limites de 2a).

- [ ] **Step 1 :** test navigateur : après le clic de bascule, l'élément a une animation en cours et son rect visuel est proche de l'ancien ; à la fin, position finale et aucun style en ligne ; « Shuffle » : toutes les animations finissent, ordre visuel = ordre DOM.
- [ ] **Step 2 :** implémenter (l'implémenteur ne lance pas le site).
- [ ] **Step 3 :** `node --check apps/doc/tests/motion.browser.test.mjs`.
- [ ] **Step 4 :** commit `docs(motion): demonstrate layout motions`.

### Task 6 (contrôleur) : vérification groupée et spec

- [ ] Une commande à la fois : build `@udixio/motion` ; suite motion sur trois navigateurs ; core ; React ; Svelte ; Angular ; `pnpm size` (budgets re-mesurés si dépassés).
- [ ] Démo au navigateur (serveur de dev, captures), puis `astro build` et tests doc sur trois navigateurs.
- [ ] Spec : §8.3.7 (état après 2a, règles fixées, limites), §8.6, journal. Commit `docs(motion): record step 2a delivery in the spec`.
