# @udixio/motion — Phase 2 : infrastructure de vérification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le paquet `@udixio/motion` avec l'infrastructure qui vérifiera tout le reste : tests dans de vrais navigateurs (I1), harness de conformance entre moteurs (I2) et mesures de poids et de performance (I3).

**Architecture:** Paquet autonome `packages/motion` (pas de peer React). Un contrat minimal `MotionProvider` / `MotionHandle` (§8.0 #4) et deux providers (`waapi`, `animejs`) servent de sujets de test ; le harness, exporté en `@udixio/motion/testing`, joue un même scénario sur chaque provider, échantillonne l'état visuel calculé et compare avec des tolérances. Le modèle `MotionSpec` complet (§8.2), le runtime global et le provider CSS natif sont hors de ce plan.

**Tech Stack:** TypeScript, Vite (library mode), Vitest 4.1.11 (mode navigateur, `@vitest/browser-playwright`), Playwright 1.64 (Chromium, Firefox, WebKit), anime.js 4.5, size-limit 11.2, Nx 23.

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§3 C12–C16, §7 phase 2 I1–I3, §8.0, §8.1 quater I02/I25/I30, §8.1 quinquies)

## Global Constraints

- Paquet `@udixio/motion`, **autonome, sans dépendance à React** (C12).
- **anime.js est le seul moteur JS** (C16) : dépendance `animejs ^4.5.0` ; aucun GSAP, aucun Motion en dépendance du paquet.
- Navigateurs supportés : browserslist **`defaults`** ; tests sur **Chromium, Firefox et WebKit** (C13).
- Handle (§8.0 #4) : méthodes `play`, `pause`, `reverse`, `seek`, `cancel` ; `finished` **ne rejette jamais** et se résout en `'finished'` ou `'cancelled'`.
- Moteur exposé et tracé (§8.0 #5) : chaque handle expose `backend`.
- Tolérances de conformance (§7 I2) : **opacité ± 0,02 ; longueurs ± 1 px ; échelle ± 0,01 ; angles ± 0,5°**.
- Budgets de poids (§7 I3) : valeur initiale = **première mesure + 10 %** ; budgets bloquants ; seuils de performance indicatifs seulement.
- Tests navigateur en PR **uniquement si `@udixio/motion` est affecté** (choix §7 I1).
- Lecture de l'état visuel : **jamais `getBoundingClientRect`** (faussé jusqu'à 14 px, S1) ; lire le style calculé.
- **Jamais de logique internal-only** : tout ce qui est utilisé est exporté (le harness l'est en sous-chemin `./testing`).
- Ressort M3 Expressive de référence pour les scénarios : `default.effects` = `cubic-bezier(0.34, 0.80, 0.34, 1.00)`, 200 ms (R17).

## Review Focus

1. **Annuler puis attendre** : `cancel()` puis `await handle.finished` doit donner `'cancelled'`, jamais une promesse rejetée (sinon erreur non gérée dans les adaptateurs). → test dans Task 3.
2. **`seek` après `cancel` ou après la fin** : ne doit pas lever d'exception ni relancer l'animation. → test dans Task 3.
3. **Élément retiré du DOM en cours d'animation** : le provider ne doit garder aucune animation active (fuite). → test dans Task 6.
4. **Transform absent** (`none`) sur l'élément : le lecteur d'état visuel doit renvoyer l'identité, pas `NaN`. → test dans Task 4.
5. **Un seul keyframe fourni** (départ implicite depuis la valeur courante) : les deux providers doivent partir de la même valeur calculée, sinon `carry` (I02) divergera entre moteurs. → scénario dans Task 4.

---

### Task 1: Scaffold du paquet `@udixio/motion`

**Files:**
- Create: `packages/motion/package.json`, `packages/motion/vite.config.mts`, `packages/motion/tsconfig.json`, `packages/motion/tsconfig.lib.json`, `packages/motion/tsconfig.spec.json`, `packages/motion/README.md`
- Create: `packages/motion/src/index.ts`, `packages/motion/src/runtime-key.ts`
- Modify: `tsconfig.json` (racine, ajouter la référence `./packages/motion`)
- Test: `packages/motion/src/runtime-key.spec.ts`

**Interfaces:**
- Produces: `RUNTIME_KEY: symbol` (= `Symbol.for('udixio.motion@1')`), exporté par `@udixio/motion`.

- [ ] **Step 1: Write the failing test** — `runtime-key.spec.ts` : `expect(RUNTIME_KEY).toBe(Symbol.for('udixio.motion@1'))`.
- [ ] **Step 2: Run test to verify it fails** — `npx nx test @udixio/motion` → FAIL (module introuvable).
- [ ] **Step 3: Create the package** en copiant la structure de `packages/core` (`package.json` avec `exports` `.` et condition `development` vers `./src/index.ts`, `publishConfig`, `"type": "module"`, version `0.0.0`, dépendance `animejs ^4.5.0`, aucune peer) ; `vite.config.mts` en library mode (entrée `index`, formats es + cjs, `external: ['animejs']`) ; `src/runtime-key.ts` définit `RUNTIME_KEY` ; `src/index.ts` le réexporte. Ajouter la référence au `tsconfig.json` racine.
- [ ] **Step 4: Run tests and build** — `pnpm install` puis `npx nx test @udixio/motion` → PASS ; `npx nx build @udixio/motion` → `packages/motion/dist/index.js` existe.
- [ ] **Step 5: Commit** — `git add packages/motion tsconfig.json pnpm-lock.yaml && git commit -m "feat(motion): scaffold @udixio/motion package"`

### Task 2: Tests en navigateur (I1)

**Files:**
- Modify: `packages/motion/vite.config.mts` (deux projets de test : `unit` en Node, `browser` en Playwright)
- Modify: `packages/motion/package.json` (devDependency `@vitest/browser-playwright` à la version exacte de `vitest`, 4.1.11)
- Modify: `.github/workflows/pr-validation.yml` (installation conditionnelle des navigateurs)
- Test: `packages/motion/src/browser-smoke.browser.spec.ts`

**Interfaces:**
- Produces: convention de nommage `*.browser.spec.ts` = exécuté dans les navigateurs ; `*.spec.ts` = Node.

- [ ] **Step 1: Write the failing test** — `browser-smoke.browser.spec.ts` : crée un `div`, `el.animate([{opacity:0},{opacity:1}], 200)`, puis `expect(el.getAnimations()).toHaveLength(1)`.
- [ ] **Step 2: Run test to verify it fails** — `npx nx test @udixio/motion` → FAIL (`document` indéfini en Node, ou fichier non inclus).
- [ ] **Step 3: Configure Vitest projects** — `test.projects` : `unit` (environment `node`, include `src/**/*.spec.ts`, exclude `**/*.browser.spec.ts`) et `browser` (include `src/**/*.browser.spec.ts`, `browser.enabled: true`, `provider: playwright()`, `headless: true`, `instances` construites depuis la variable d'environnement `MOTION_BROWSERS`, défaut `chromium,firefox,webkit`). Localement, `MOTION_BROWSERS=chromium,firefox` si WebKit manque de bibliothèques système.
- [ ] **Step 4: Run test to verify it passes** — `MOTION_BROWSERS=chromium,firefox npx nx test @udixio/motion` → PASS sur les deux instances.
- [ ] **Step 5: CI** — dans `pr-validation.yml`, avant `nx affected --target=test`, une étape qui exécute `npx playwright install --with-deps chromium firefox webkit` seulement si `npx nx show projects --affected` contient `@udixio/motion`.
- [ ] **Step 6: Commit** — `git commit -m "test(motion): run browser tests on chromium, firefox and webkit"`

### Task 3: Contrat `MotionHandle` / `MotionProvider` et deux providers

**Files:**
- Create: `packages/motion/src/contract.ts`, `packages/motion/src/providers/waapi.ts`, `packages/motion/src/providers/animejs.ts`, `packages/motion/src/providers/index.ts`
- Modify: `packages/motion/src/index.ts`, `packages/motion/vite.config.mts` (entrées `providers/waapi`, `providers/animejs` pour le découpage par moteur)
- Test: `packages/motion/src/providers/providers.browser.spec.ts`

**Interfaces:**
- Produces (dans `contract.ts`, réexporté par `@udixio/motion`) :
  - `type VisualFrame = { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number }` (px, px, facteur, degrés)
  - `type MotionTiming = { duration: number; easing: string; delay?: number }` (`easing` au format CSS, ex. `cubic-bezier(...)` ou `linear(...)`)
  - `type MotionRequest = { target: HTMLElement; keyframes: VisualFrame[]; timing: MotionTiming }` (un seul keyframe = départ depuis la valeur calculée courante)
  - `type MotionBackend = 'waapi' | 'animejs'`
  - `interface MotionHandle { readonly backend: MotionBackend; readonly duration: number; readonly finished: Promise<'finished' | 'cancelled'>; play(): void; pause(): void; reverse(): void; seek(timeMs: number): void; cancel(): void }`
  - `interface MotionProvider { readonly backend: MotionBackend; animate(request: MotionRequest): MotionHandle; activeCount(): number }`
- Produces : `waapiProvider: MotionProvider` (`@udixio/motion/providers/waapi`), `animejsProvider: MotionProvider` (`@udixio/motion/providers/animejs`).

- [ ] **Step 1: Write the failing tests** — pour chaque provider (`describe.each([waapiProvider, animejsProvider])`) :
  - `animate` puis `await handle.finished` → `'finished'` et `handle.backend` égal au provider ;
  - Review Focus 1 : `cancel()` puis `await handle.finished` → `'cancelled'` (aucun rejet) ;
  - Review Focus 2 : `cancel()` puis `seek(100)` et `play()` → aucune exception, `activeCount()` reste 0 ;
  - après la fin, `activeCount()` vaut 0.
- [ ] **Step 2: Run to verify they fail** — `MOTION_BROWSERS=chromium,firefox npx nx test @udixio/motion` → FAIL (modules absents).
- [ ] **Step 3: Implement `contract.ts` and the two providers** — `waapi` : `VisualFrame` → keyframes WAAPI sur les propriétés individuelles `opacity`, `translate`, `scale`, `rotate` ; `fill: 'both'` ; `finished` = la promesse native convertie (rejet `AbortError` → `'cancelled'`). `animejs` : `animate(target, {…, autoplay: true})` d'anime.js 4.5 avec les mêmes propriétés individuelles et l'easing converti (`cubicBezier(x1,y1,x2,y2)` pour un `cubic-bezier(...)`, `linear` sinon) ; `finished` résolu par `onComplete` / à l'annulation. Les deux tiennent un compteur d'animations actives décrémenté à la fin et à l'annulation.
- [ ] **Step 4: Run to verify they pass** — même commande → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(motion): add handle contract with waapi and animejs providers"`

### Task 4: Harness de conformance (I2)

**Files:**
- Create: `packages/motion/src/testing/visual-state.ts`, `packages/motion/src/testing/scenario.ts`, `packages/motion/src/testing/compare.ts`, `packages/motion/src/testing/index.ts`, `packages/motion/src/testing/scenarios/f2-fade-slide.ts`
- Modify: `packages/motion/package.json` + `vite.config.mts` (sous-chemin public `./testing`)
- Test: `packages/motion/src/testing/visual-state.browser.spec.ts`, `packages/motion/src/testing/conformance.browser.spec.ts`

**Interfaces:**
- Consumes: `MotionProvider`, `MotionRequest`, `VisualFrame` (Task 3).
- Produces (`@udixio/motion/testing`) :
  - `type VisualState = { opacity: number; x: number; y: number; scaleX: number; scaleY: number; rotate: number }`
  - `readVisualState(el: Element): VisualState` — compose `translate`, `rotate`, `scale` puis `transform` du style calculé en `DOMMatrix`, décompose ; `transform: none` → identité.
  - `type Scenario = { name: string; family: string; request: Omit<MotionRequest, 'target'>; initialStyle?: Partial<CSSStyleDeclaration>; samples: number[] }` (progressions de 0 à 1)
  - `runScenario(provider: MotionProvider, scenario: Scenario): Promise<VisualState[]>` — crée la cible, applique `initialStyle`, `animate`, `pause`, puis pour chaque progression `seek(p * duration)` et `readVisualState`, enfin `cancel` et retrait de la cible.
  - `const TOLERANCES = { opacity: 0.02, length: 1, scale: 0.01, angle: 0.5 }`
  - `compareSamples(a: VisualState[], b: VisualState[], tol?: typeof TOLERANCES): { ok: boolean; failures: string[] }`
  - `f2FadeSlide: Scenario` — famille `F2`, keyframes `[{opacity: 0, y: 24}, {opacity: 1, y: 0}]`, easing `cubic-bezier(0.34, 0.80, 0.34, 1.00)`, durée 200, échantillons `[0, 0.25, 0.5, 0.75, 1]`.

- [ ] **Step 1: Write the failing tests**
  - `visual-state.browser.spec.ts` : élément avec `translate: 10px 20px; scale: 2; rotate: 90deg; opacity: 0.5` → `{x:10, y:20, scaleX:2, scaleY:2, rotate:90, opacity:0.5}` (à la tolérance près) ; Review Focus 4 : élément sans transform → `{x:0, y:0, scaleX:1, scaleY:1, rotate:0}`.
  - `conformance.browser.spec.ts` : `runScenario(waapiProvider, f2FadeSlide)` et `runScenario(animejsProvider, f2FadeSlide)` → `compareSamples(...).ok === true` ; extrémités exactes (`opacity` 0 puis 1, `y` 24 puis 0) ; Review Focus 5 : scénario à un seul keyframe `[{opacity: 1}]` avec `initialStyle: {opacity: '0.3'}` → premier échantillon `opacity ≈ 0.3` sur les deux providers.
- [ ] **Step 2: Run to verify they fail** — `MOTION_BROWSERS=chromium,firefox npx nx test @udixio/motion` → FAIL.
- [ ] **Step 3: Implement the harness** selon les signatures ci-dessus ; `compareSamples` produit un message par écart (`<prop> @ <index> : <a> vs <b>`).
- [ ] **Step 4: Run to verify they pass** — même commande → PASS sur Chromium et Firefox (et WebKit en CI).
- [ ] **Step 5: Commit** — `git commit -m "test(motion): add cross-provider conformance harness with an F2 scenario"`

### Task 5: Budgets de poids (I3, partie bloquante)

**Files:**
- Create: `packages/motion/.size-limit.json`
- Modify: `packages/motion/package.json` (script `size`)
- Modify: `.github/workflows/pr-validation.yml` (étape `npx nx affected --target=size`)

**Interfaces:**
- Consumes: sorties de build `dist/index.js`, `dist/providers/waapi.js`, `dist/providers/animejs.js`, `dist/testing/index.js` (Tasks 1, 3, 4).

- [ ] **Step 1: Measure** — `npx nx build @udixio/motion` puis `npx size-limit --json` avec une configuration provisoire sans limite listant les quatre entrées (le provider `animejs` mesuré **avec** anime.js importé, les autres sans).
- [ ] **Step 2: Write `.size-limit.json`** — une entrée par sortie, `limit` = mesure × 1,1 arrondie au 0,1 kB supérieur (gzip).
- [ ] **Step 3: Verify** — `pnpm --filter @udixio/motion size` → PASS ; ajouter temporairement 20 kB à une entrée pour vérifier que la commande échoue, puis annuler.
- [ ] **Step 4: Commit** — `git commit -m "build(motion): add blocking size budgets per entry"`

### Task 6: Mesures de performance et fuites (I3, partie indicative)

**Files:**
- Create: `packages/motion/bench/page.html`, `packages/motion/bench/run.mjs`, `packages/motion/bench/README.md`
- Modify: `packages/motion/package.json` (script `bench`)
- Test: `packages/motion/src/providers/leaks.browser.spec.ts`

**Interfaces:**
- Consumes: `waapiProvider`, `animejsProvider` (Task 3).
- Produces: `bench/report.json` — par provider et par taille (100, 1000 éléments) : `longAnimationFrames` (nombre, durée totale, Chromium uniquement), `scriptMs`, `framesDropped`, avec CPU ralenti 4× (CDP `Emulation.setCPUThrottlingRate`) ; points de comparaison : transitions CSS pures et `animate` de `motion` (déjà présent dans le dépôt, utilisé seulement par le banc).

- [ ] **Step 1: Write the failing leak test** — `leaks.browser.spec.ts` : pour chaque provider, 200 animations lancées puis annulées → `activeCount() === 0` et `document.getAnimations().length === 0` ; Review Focus 3 : 50 animations dont la cible est retirée du DOM en cours de route → après `await` des `finished`, `activeCount() === 0`.
- [ ] **Step 2: Run to verify it fails or passes** — `MOTION_BROWSERS=chromium,firefox npx nx test @udixio/motion` ; s'il échoue, corriger le provider concerné (décrément manquant), puis relancer jusqu'à PASS.
- [ ] **Step 3: Implement the bench** — `run.mjs` (Playwright, Chromium) sert `page.html` (statique, imports depuis `dist/`), lance chaque configuration, collecte les métriques via `PerformanceObserver` (`long-animation-frame`) et écrit `bench/report.json` ; aucune assertion bloquante (seuils indicatifs, §7 I3).
- [ ] **Step 4: Run** — `pnpm --filter @udixio/motion bench` → `bench/report.json` écrit avec les six configurations.
- [ ] **Step 5: Commit** — `git commit -m "test(motion): add leak tests and an indicative performance bench"` (sans `report.json`, ajouté au `.gitignore` du paquet).
