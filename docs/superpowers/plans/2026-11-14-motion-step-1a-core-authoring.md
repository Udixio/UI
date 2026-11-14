# @udixio/motion — Étape 1a : surface d'écriture du noyau — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre `@udixio/motion` utilisable de bout en bout pour `appear`, `disappear` et `emphasize` : définir une animation en TS, la jouer sur un élément, l'écrire en HTML avec `data-motion`, et faire tourner un premier composant Udixio (Badge) dessus.

**Architecture:** Un registre global de définitions (`defineMotion`), un moteur de lecture (`playMotion`) qui s'appuie sur le routage existant (`startRoutedMotion`, provider WAAPI) et applique reprise et rendu réduit, une liaison par élément (`motion(el, …)`) qui gère la présence, et un scanner DOM (`connectMotion`) pour la syntaxe `data-motion`. Les adaptateurs React / Angular / Svelte (`useMotion`, `udxMotion`, attachment) font l'objet du plan 1b ; Badge n'en a pas besoin car son contrôleur vit dans `@udixio/core`.

**Tech Stack:** TypeScript, Vite library mode, Vitest 4.1 (projets `unit` Node et `browser` Playwright), Web Animations API, Nx 23, Astro (doc).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — référence normative §8.2 à §8.6 (étape 1 de §8.6).

## Global Constraints

- **Aucune logique internal-only** : tout module utilisé par un autre paquet est exporté par une entrée publique (l'entrée `./internal-policy` disparaît).
- **Aucune dépendance à React** dans `@udixio/motion` ; anime.js reste le seul moteur JS, mais cette étape n'en a pas besoin : tout passe par WAAPI (champs `opacity`, `x`, `y`, `scale`, `rotate`).
- Verbes pris en charge : `appear`, `disappear`, `emphasize`. **Le déclencheur est fixé par le verbe**, jamais une option (§8.2.3).
- Reprise : `appear` / `disappear` = `carry` (position exacte par nouvelle animation depuis la valeur calculée, sans vitesse) ; `emphasize` = `restart` par défaut, `carry` si `interrupt: 'carry'`.
- Rendu réduit par défaut : `appear` et `disappear` = `fade` ; `emphasize` = `static`. Le fondu de `disappear` n'est pas multiplié par `--udx-motion-scale`.
- Timing par défaut : `appear` / `disappear` = `spring.default.spatial` pour `x`, `y`, `scale`, `rotate` et `spring.default.effects` pour `opacity` ; `emphasize` = `spring.fast.spatial`. Un `timing` écrit dans la définition s'applique à tous les champs.
- `finished` ne rejette jamais ; valeurs `'finished' | 'cancelled'`.
- HTML : `data-motion="<nom>"` ne porte qu'une référence ; état de présence publié dans `data-presence="entering | present | exiting"`, écrit par le runtime seul.
- **Le contenu ne doit jamais rester invisible** : sans WAAPI, sans définition, ou en cas d'erreur, l'élément est mis dans son état de destination.
- Noms de définition : kebab-case, hors noms réservés du manifeste (`enter`, `exit`, `in`, `out`, `transition`, `animate`, `initial`, `AnimatePresence`, préfixe `view-transition-`).
- **Charge machine** : pendant une tâche, ne lancer que le fichier de test concerné, sur Chromium seul (`MOTION_BROWSERS=chromium`) ; les suites complètes et les trois navigateurs ne tournent qu'à la Task 10. Jamais deux suites en parallèle.
- Commits : message terminé par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ; ne jamais pousser.
- Valeurs visuelles des presets : provisoires, à calibrer à l'étape 8 de §8.6.

## Review Focus

1. **Pas de `Element.prototype.animate`** (jsdom, navigateur ancien) : l'élément finit dans son état de destination, sans exception. → test Task 5.
2. **Bascule rapide** `setPresent(true/false)` dix fois dans la même frame : un seul lot d'animations actif, état final correct, pas d'`inert` résiduel. → test Task 6.
3. **Élément retiré du DOM par l'auteur en cours d'animation** : liaison détruite, promesse résolue en `'cancelled'`, aucune animation active. → test Task 7.
4. **`data-motion` vers un nom non défini, ou défini plus tard** (île hydratée après) : une erreur de développement, élément laissé visible, liaison créée dès que la définition arrive. → test Task 7.
5. **Préférence de mouvement réduit qui change pendant une animation** : l'animation en cours se termine immédiatement à destination ; les suivantes sont réduites. → test Task 6.

---

### Task 1: Entrée publique de la politique et export du runtime

**Files:**
- Rename: `packages/motion/src/internal-policy.ts` → `packages/motion/src/policy.ts`
- Modify: `packages/motion/package.json` (entrée `./internal-policy` → `./policy`, dans `exports` et `publishConfig.exports`), `packages/motion/vite.config.mts`, `packages/motion/.size-limit.json`, `packages/motion/src/index.ts`, `packages/motion/scripts/package-exports.test.mjs`
- Modify: `packages/core/src/lib/dom/switch.ts`, `slider.ts`, `progress-policy.ts`, `packages/core/vite.config.mts` (import et `external` vers `@udixio/motion/policy`)

**Interfaces:**
- Produces: `@udixio/motion/policy` exporte `motionPolicy: MotionPolicy` et le type `MotionPolicy` ; `@udixio/motion` exporte `getMotionRuntime(options: { development: boolean }): MotionRuntime`, `retainMotionRuntime(runtime: MotionRuntime): () => void` et le type `MotionRuntime`.

- [ ] **Step 1:** Mettre à jour `package-exports.test.mjs` : l'entrée `./policy` existe, `./internal-policy` n'existe plus, `index` exporte `getMotionRuntime` et `retainMotionRuntime`.
- [ ] **Step 2:** `cd packages/motion && node --test scripts/package-exports.test.mjs` → FAIL.
- [ ] **Step 3:** Faire le renommage, les exports et la mise à jour des trois imports de `core`.
- [ ] **Step 4:** `npx nx build @udixio/motion --skip-sync` puis le test de l'étape 2 → PASS ; `cd packages/core && npx vitest run src/lib/dom/switch.spec.ts src/lib/dom/slider.spec.ts src/lib/dom/linear-indeterminate.spec.ts` → PASS.
- [ ] **Step 5:** Commit `refactor(motion): expose policy and runtime as public entries`.

### Task 2: `defineMotion` et registre des définitions

**Files:**
- Create: `packages/motion/src/define-motion.ts`, `packages/motion/src/define-motion.spec.ts`
- Modify: `packages/motion/src/manifest.ts` (retirer `trigger` de `spec.deferred` et de `deferredDomains`), `packages/motion/src/manifest.spec.ts`, `packages/motion/motion-manifest.json` (régénéré par `scripts/generate-motion-manifest.mjs`), `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `validateMotionDocument`, `motionManifest`, `MotionDocument` (`manifest.ts`).
- Produces :
  - `type MotionSpec = MotionDocument['spec']`
  - `interface MotionRef<N extends string = string> { readonly name: N; readonly spec: Readonly<MotionSpec> }`
  - `defineMotion<N extends string>(name: N, spec: MotionSpec): MotionRef<N>`
  - `resolveMotion(name: string): MotionRef | undefined`
  - `onMotionDefined(listener: (ref: MotionRef) => void): () => void`
  - `validateMotionSpec(spec: unknown): Readonly<MotionSpec>` (lève `TypeError` listant `chemin: code`)

- [ ] **Step 1: Tests** (`define-motion.spec.ts`, projet `unit`) :
  - `defineMotion('card-enter', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] })` renvoie `{ name: 'card-enter' }` gelé, et `resolveMotion('card-enter')` renvoie la même référence ;
  - nom `'enter'`, `'view-transition-x'`, `'CardEnter'` et `''` → `TypeError` ;
  - `verb: 'reveal'` → `TypeError` dont le message contient `/verb: unsupported` ;
  - redéfinition avec une spec identique → même référence ; avec une spec différente → `Error` contenant le nom ;
  - le registre est partagé entre copies : il vit sous `globalThis[Symbol.for('udixio.motion.definitions.preview.1')]` ;
  - `onMotionDefined` est appelé pour chaque nouvelle définition, plus après désabonnement ;
  - manifeste : `trigger` n'apparaît plus dans `spec.deferred` ni `deferredDomains`.
- [ ] **Step 2:** `cd packages/motion && npx vitest run src/define-motion.spec.ts src/manifest.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter ; comparaison de specs par `JSON.stringify` des specs validées (clés dans l'ordre du manifeste).
- [ ] **Step 4:** Même commande → PASS.
- [ ] **Step 5:** Commit `feat(motion): add defineMotion and the shared definition registry`.

### Task 3: Presets livrés

**Files:**
- Create: `packages/motion/src/presets.ts`, `packages/motion/src/presets.spec.ts`
- Modify: `packages/motion/package.json`, `vite.config.mts` (entrée publique `./presets`), `.size-limit.json`

**Interfaces:**
- Consumes: `defineMotion` (Task 2).
- Produces (`@udixio/motion/presets`, définis à l'import) : `fade`, `slide`, `scale`, `press` : `MotionRef`.

Valeurs (provisoires) :

| Nom | Verbe | Keyframes |
|---|---|---|
| `fade` | `appear` | `[{ opacity: 0 }, { opacity: 1 }]` |
| `slide` | `appear` | `[{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }]` |
| `scale` | `appear` | `[{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }]` |
| `press` | `emphasize` | `[{ scale: 1 }, { scale: 0.96 }, { scale: 1 }]` |

- [ ] **Step 1:** Test : après import de `./presets.js`, `resolveMotion` renvoie les quatre noms avec ces verbes et keyframes.
- [ ] **Step 2:** `npx vitest run src/presets.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(motion): ship fade, slide, scale and press presets`.

### Task 4: Handle composé et découpage des champs

**Files:**
- Create: `packages/motion/src/compose.ts`, `packages/motion/src/compose.spec.ts`

**Interfaces:**
- Consumes: `MotionHandle`, `VisualFrame` (`contract.ts`).
- Produces :
  - `composeHandles(handles: MotionHandle[]): MotionHandle` — `duration` = max ; `backend` = celui du premier ; `velocity` = `{ value: 0, source: 'unavailable' }` ; `finished` = `'cancelled'` si un seul l'est, sinon `'finished'` ; chaque méthode est relayée à tous ; `seek(t)` borne `t` à la durée de chaque handle.
  - `settledHandle(): MotionHandle` — handle déjà terminé (`finished` résolu en `'finished'`, durée 0, méthodes sans effet).
  - `splitFrames(keyframes: VisualFrame[]): { effects: VisualFrame[]; spatial: VisualFrame[] }` — `effects` ne garde que `opacity`, `spatial` les autres champs ; une liste vide quand aucun keyframe n'a de champ du groupe.

- [ ] **Step 1:** Tests unitaires avec des handles factices : durée max, `finished` composé (`cancelled` l'emporte), `seek(400)` appelle `seek(200)` sur un handle de 200 ms, `composeHandles([])` équivaut à `settledHandle()`, `splitFrames` sur `[{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }]`.
- [ ] **Step 2:** `npx vitest run src/compose.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(motion): add composite handle and field splitting`.

### Task 5: `playMotion` — lecture, reprise et rendu réduit

**Files:**
- Create: `packages/motion/src/play.ts`, `packages/motion/src/play.browser.spec.ts`
- Modify: `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `startRoutedMotion` (`timing-integration.ts`), `waapiProvider`, `probeWaapiEasing`, `resolveReducedRender`, `composeHandles`, `settledHandle`, `splitFrames`, `MotionRef`, `MotionRuntime`.
- Produces :
  - `playMotion(target: HTMLElement, spec: Readonly<MotionSpec>, options: { direction: 'forward' | 'backward'; carry: boolean; runtime: MotionRuntime; scheme?: MotionScheme }): MotionHandle`
  - `applyFrame(target: HTMLElement, frame: VisualFrame): void` — écrit `opacity`, `translate`, `scale`, `rotate` en style inline (jamais `transform`).

Règles que la signature ne fixe pas :
- `backward` joue les keyframes inversés avec les défauts de `disappear` quand le verbe est `appear` (et réciproquement).
- `carry: true` : avant de démarrer, figer en inline les valeurs calculées de `opacity`, `translate`, `scale`, `rotate`, puis lancer une animation à **un seul keyframe** (la destination).
- Échelle : lire `--udx-motion-scale` dans le style calculé, bornée à `[0, 1]` ; elle multiplie les durées, sauf pour le fondu réduit de `disappear`.
- Politique `runtime.policy.reduced` : rendu `fade` → les champs non `opacity` sont appliqués à destination immédiatement et seule l'opacité est animée (0→1 en avant, 1→0 en arrière si la définition n'a pas d'opacité) avec `spring.default.effects` ; `static` et `instant` → `applyFrame(destination)` et `settledHandle()`.
- Tout résultat `unavailable` ou `instant` de `startRoutedMotion`, et toute exception du provider : `applyFrame(destination)`, `settledHandle()`, plus `console.error` quand `runtime.development`.

- [ ] **Step 1: Tests** (`play.browser.spec.ts`) :
  - `slide` en avant : `handle.duration` = durée du ressort spatial (plus longue que celle de l'opacité) ; après `finished`, `opacity` inline `1` et `translate` `0px 0px` ;
  - `backward` sur `fade` : après `finished`, `opacity` `0` ;
  - reprise : lancer `fade` en avant, `seek` à mi-durée, puis `playMotion(backward, carry: true)` : l'opacité calculée juste après vaut celle d'avant à ± 0,02 ;
  - réduit (`document.documentElement.dataset.motionPolicy = 'reduce'`) sur `slide` : `translate` vaut `0px 0px` dès le retour de l'appel, l'opacité s'anime ; sur `press` : `settledHandle` et `scale` final ;
  - `--udx-motion-scale: 0` sur la cible : état de destination immédiat ;
  - **Review Focus 1** : cible dont `animate` vaut `undefined` → état de destination, aucune exception, `finished` = `'finished'`.
- [ ] **Step 2:** `MOTION_BROWSERS=chromium npx vitest run src/play.browser.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(motion): play definitions with carry and reduced rendering`.

### Task 6: `motion()` — liaison par élément et présence

**Files:**
- Create: `packages/motion/src/bind.ts`, `packages/motion/src/bind.browser.spec.ts`
- Modify: `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `playMotion`, `applyFrame`, `resolveMotion`, `validateMotionSpec`, `getMotionRuntime`, `retainMotionRuntime`.
- Produces :
  - `type MotionSource = MotionRef | Readonly<MotionSpec> | string` (un nom est résolu par `resolveMotion` ; inconnu → `Error`)
  - `interface MotionBinding { readonly handle: MotionHandle | null; readonly present: boolean; play(): MotionHandle; setPresent(present: boolean): Promise<'finished' | 'cancelled'>; destroy(): void }`
  - `motion(target: HTMLElement, source: MotionSource, options?: { present?: boolean; settled?: boolean; development?: boolean }): MotionBinding`
  - `getMotion(target: Element): MotionBinding | undefined`

Règles :
- Verbe `appear` : à la liaison, joue en avant si `present !== false` et `settled !== true` ; avec `settled: true`, l'élément est considéré en place et rien ne joue ; avec `present: false`, la première frame est appliquée sans animation.
- `setPresent(false)` : `data-presence="exiting"`, attribut `inert`, lecture `backward` avec `carry: true` ; la promesse suit `finished`. `setPresent(true)` : retire `inert`, `data-presence="entering"` puis `"present"` à la fin, lecture `forward` avec `carry: true`. Appel sans changement d'état : renvoie la promesse en cours.
- Verbe `disappear` : l'entrée est instantanée, la sortie joue les keyframes en avant.
- Verbe `emphasize` : `play()` rejoue (`carry` seulement si `interrupt: 'carry'`) ; `setPresent` lève `TypeError`.
- Une seconde liaison sur la même cible détruit la précédente.
- La liaison s'abonne à `runtime.policy` : au passage en réduit, l'animation en cours est amenée à sa fin (`seek(duration)`).
- `destroy()` : annule, retire `data-presence` et `inert` posés par la liaison, libère le runtime.

- [ ] **Step 1: Tests** (`bind.browser.spec.ts`) :
  - liaison `fade` : joue, puis `data-presence="present"` ;
  - `settled: true` : aucune animation (`document.getAnimations()` vide), opacité inchangée ;
  - sortie puis entrée : `inert` posé puis retiré, promesse de sortie résolue `'cancelled'` quand l'entrée l'interrompt ;
  - `press` : deux `play()` de suite → un seul lot actif ;
  - `getMotion(el)` renvoie la liaison, `undefined` après `destroy()` ;
  - **Review Focus 2** : dix bascules `setPresent` alternées dans la même tâche, dernière à `true` → après la fin, `opacity` `1`, pas d'`inert`, `data-presence="present"`, `waapiProvider.activeCount()` revenu à 0 ;
  - **Review Focus 5** : passer `data-motion-policy` à `reduce` pendant une entrée → opacité `1` dans la frame suivante et `finished` résolu.
- [ ] **Step 2:** `MOTION_BROWSERS=chromium npx vitest run src/bind.browser.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(motion): bind definitions to elements with presence`.

### Task 7: `connectMotion` — syntaxe `data-motion`

**Files:**
- Create: `packages/motion/src/connect.ts`, `packages/motion/src/connect.browser.spec.ts`
- Modify: `packages/motion/src/index.ts`

**Interfaces:**
- Consumes: `motion`, `getMotion`, `resolveMotion`, `onMotionDefined`.
- Produces : `connectMotion(options?: { root?: Document | Element; development?: boolean }): () => void` (la fonction renvoyée déconnecte et détruit les liaisons créées par ce scanner).

Règles :
- Premier balayage : chaque `[data-motion]` est lié avec `settled: true` (contenu serveur déjà visible, aucun flash) ; un élément portant `hidden` est lié avec `present: false`.
- Un `MutationObserver` unique sur `root` (`childList`, `subtree`, `attributes` avec `attributeFilter: ['data-motion', 'data-state', 'hidden']`) :
  - nœud ajouté portant `data-motion` (ou ses descendants) → liaison, l'entrée joue ;
  - nœud retiré → `destroy()` de sa liaison ;
  - `hidden` ajouté sur un élément lié à une définition `appear` : retirer `hidden` dans le même rappel (avant la peinture), `setPresent(false)`, puis reposer `hidden` quand la promesse vaut `'finished'` ; `hidden` retiré → `setPresent(true)` ; les écritures du scanner lui-même sont ignorées ;
  - `data-state` modifié sur un élément lié à une définition `emphasize` → `play()` ;
  - `data-motion` modifié → nouvelle liaison.
- Nom inconnu : l'élément n'est pas touché ; en développement, un seul `console.error` par nom, listant les noms définis. Les éléments en attente sont liés quand `onMotionDefined` annonce leur nom.
- Conditionnel (candidat F19) : au moment de jouer, si la valeur calculée de `--udx-motion` sur l'élément vaut `none`, l'état de destination est appliqué sans animation.

- [ ] **Step 1: Tests** (`connect.browser.spec.ts`) :
  - contenu présent au balayage : aucune animation ; élément inséré ensuite avec `data-motion="fade"` : une animation, puis opacité `1` ;
  - ajout de `hidden` : l'élément reste affiché pendant la sortie (`hidden` absent, `inert` présent), puis `hidden` revient ; retrait de `hidden` : entrée ;
  - `data-motion="press"` : changer `data-state` déclenche une animation ;
  - `--udx-motion: none` : insertion sans animation ;
  - **Review Focus 3** : retirer l'élément pendant son entrée → `getMotion` renvoie `undefined`, `waapiProvider.activeCount()` vaut 0 ;
  - **Review Focus 4** : `data-motion="plus-tard"` non défini → un `console.error` (développement), élément visible ; `defineMotion('plus-tard', …)` ensuite → `getMotion(el)` défini ;
  - la fonction de déconnexion détruit toutes les liaisons.
- [ ] **Step 2:** `MOTION_BROWSERS=chromium npx vitest run src/connect.browser.spec.ts` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(motion): connect data-motion elements`.

### Task 8: Badge sur `@udixio/motion`

**Files:**
- Modify: `packages/core/src/lib/dom/badge.ts`, `packages/core/src/lib/dom/badge.spec.ts`, `packages/core/src/lib/interfaces/badge.interface.ts`
- Modify: `packages/ui-react/src/lib/components/Badge.tsx`, `packages/ui-react/src/tests/Badge.spec.tsx`
- Modify: `packages/ui-angular/src/lib/badge/badge.ts`, `badge-surface.ts` et leurs specs
- Modify: `packages/ui-svelte/src/lib/badge/` (composant et spec)
- Modify: `apps/doc/src/data/components/badge.overview.mdx` (prop renommée)

**Interfaces:**
- Consumes: `motion`, `MotionSpec`, `SpringRef`, `CurveTiming` de `@udixio/motion`.
- Produces :
  - `interface BadgeMotion { timing?: SpringRef | CurveTiming }` (remplace `BadgeTransition`, supprimé) ; `BadgeProps.motion?: BadgeMotion` (remplace `transition`) ; alias Angular `udxBadgeMotion` (remplace `udxBadgeTransition`).
  - `createBadgeTransitionController({ element, motion?, reducedMotion? })` garde `setVisible(visible, instant?)` et `destroy()`.

Règles :
- Définition interne exportée : `badgeVisibility: MotionSpec = { verb: 'appear', keyframes: [{ opacity: 0, scale: 0 }, { opacity: 1, scale: 1 }] }`, complétée par `motion.timing` s'il est fourni.
- `setVisible(true)` : retire `visibility: hidden` puis `setPresent(true)` ; `setVisible(false)` : `setPresent(false)` puis `visibility: hidden` quand la promesse vaut `'finished'` ; `instant` : liaison `settled` et état final appliqué.
- `badge.ts` n'importe plus `animejs` ; l'option `reducedMotion` force l'état final sans animation quand elle renvoie `true`.

- [ ] **Step 1:** Adapter `badge.spec.ts` : états finaux (`visibility`, `opacity`, `scale`) pour afficher, masquer, `instant` et `reducedMotion` ; aucun import d'`animejs` dans `badge.ts`.
- [ ] **Step 2:** `cd packages/core && npx vitest run src/lib/dom/badge.spec.ts` → FAIL.
- [ ] **Step 3:** Migrer le contrôleur, l'interface, les trois adaptateurs et leurs specs, puis la doc.
- [ ] **Step 4:** Le test de l'étape 2 → PASS ; puis, un par un : `cd packages/ui-react && npx vitest run src/tests/Badge.spec.tsx` ; `cd packages/ui-svelte && npx vitest run src/lib/badge` ; `cd packages/ui-angular && npx jest --config jest.config.cjs --runInBand src/lib/badge` → PASS.
- [ ] **Step 5:** Commit `feat(badge)!: drive badge visibility with @udixio/motion` (corps : `BREAKING CHANGE: BadgeProps.transition devient motion ; udxBadgeTransition devient udxBadgeMotion`).

### Task 9: Démo dans la documentation

**Files:**
- Create: `apps/doc/src/pages/motion/demo.astro`
- Modify: `apps/doc/src/layouts/layout.astro` (appel de `connectMotion`), `apps/doc/src/components/Navigation.tsx` (entrée « Démo »), `apps/doc/tests/motion.browser.test.mjs`

**Interfaces:**
- Consumes: `connectMotion` de `@udixio/motion`, import de `@udixio/motion/presets`.

Contenu de la page : quatre cartes (`fade`, `slide`, `scale`) qu'un bouton affiche et masque par l'attribut `hidden` ; un bouton `press` dont `data-state` change au clic ; un sélecteur qui pose `data-motion-policy="reduce"` sur `<html>` ; un bloc de code montrant le HTML écrit.

- [ ] **Step 1:** Ajouter à `motion.browser.test.mjs` : la page `/motion/demo` se charge sans erreur console ; cliquer « Masquer » pose puis retire `inert`, et `hidden` revient.
- [ ] **Step 2:** Implémenter la page, l'appel dans le layout et l'entrée de navigation.
- [ ] **Step 3:** `cd apps/doc && npx astro build` → code 0 ; `pnpm test:motion-browser` → PASS.
- [ ] **Step 4:** Commit `docs(motion): add a live data-motion demo page`.

### Task 10: Budgets, README et vérification groupée

**Files:**
- Modify: `packages/motion/.size-limit.json`, `packages/motion/README.md`, `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§8.3.4 et journal)

- [ ] **Step 1:** `npx nx build @udixio/motion --skip-sync` puis `cd packages/motion && npx size-limit --json` ; fixer chaque budget à la mesure + 10 % (entrées `core`, `presets`, `policy` ajoutées).
- [ ] **Step 2:** README : section « Écrire une animation » (`defineMotion`, `motion`, `connectMotion`, presets, `data-presence`, limites de l'étape 1a).
- [ ] **Step 3:** Vérification groupée, **une commande à la fois** : `npx nx test @udixio/motion --skip-sync` (Chromium, Firefox, WebKit) ; `cd packages/core && npx vitest run` ; `npx nx run @udixio/ui-react:vitest:test --skip-sync` ; `npx nx test ui-svelte --skip-sync` ; `npx nx test ui-angular --skip-sync` ; `cd packages/motion && pnpm size`.
- [ ] **Step 4:** Mettre à jour §8.3.4 (écarts comblés : `defineMotion`, liaison, scanner, entrée publique de la politique) et le journal de la spec.
- [ ] **Step 5:** Commit `docs(motion): record step 1a delivery and update size budgets`.
