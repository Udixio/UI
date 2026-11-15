# @udixio/motion — étape 2b : qualité du layout (vitesse conservée, contenu non déformé) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le verbe `layout` irréprochable à l'œil : une interruption repart avec la vitesse en cours (pas d'à-coup), et le contenu d'un élément qui change de taille garde sa forme pendant le mouvement.

**Architecture:** Deux ajouts au moteur de l'étape 2a, tous deux joués par le navigateur sur `translate` et `scale` (hors fil principal). (1) Un ressort analytique (`spring.ts`) donne position et vitesse à tout instant ; un vol interrompu repart d'un ressort échantillonné en keyframes, initialisé avec la vitesse courante. (2) Une projection (`project.ts`) calcule, pour chaque descendant d'un élément qui change de taille, le transform propre qui annule l'étirement du parent et le place où la mise en page réelle l'aurait mis ; ces transforms sont échantillonnés aux mêmes instants que le parent. Le cache de géométrie s'étend au contenu des éléments suivis.

**Tech Stack:** TypeScript, WAAPI (keyframes échantillonnés, easing `linear`), Vitest (Node pour les calculs, navigateur pour le moteur).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.3.7 (état et limites de 2a), §8.2.4 (`layout` : reprise `carry`), §8.1 quinquies (I02 : la vitesse n'est conservée que par un ressort ; I25 : paramètres des ressorts).

## Global Constraints

- Tout reste joué par le provider WAAPI sur `translate` et `scale`, sans rien laisser en ligne à la fin (`commit: false`).
- Ressorts : paramètres des tokens (`dampingRatio` ζ ≤ 1, `stiffness` k, masse 1, ω = √k), lus dans `spring-data.generated.ts` via `tokens.ts`.
- Un vol au repos garde la forme légère de 2a (2 keyframes + easing `linear()` du token). La forme échantillonnée ne sert que lorsqu'il y a une vitesse initiale ou un contenu à projeter.
- Échantillonnage : instants uniformes, pas ≤ 1000/60 ms, entre 9 et 91 keyframes, easing `linear`.
- Contenu projeté : descendants **éléments** d'un élément suivi, profondeur ≤ 3, au plus 24 nœuds par élément suivi ; au-delà, le contenu n'est pas corrigé. Un nœud qui porte du texte direct est un nœud **texte** : il garde sa taille finale et seul son bord de départ (gauche, haut) est interpolé. Les autres nœuds sont des **boîtes** : position et taille interpolées, puis récursion.
- Le texte posé directement dans l'élément suivi (sans élément enveloppe) n'est pas corrigeable : limite documentée.
- Performances : le temps de calcul d'un changement à 200 éléments sans contenu ne doit pas régresser de plus de 10 % par rapport au banc d'essai (`bench/layout-report.json`) ; aucune lecture de style dans la phase d'écriture.
- Aucune logique internal-only ; pas de dépendance nouvelle.
- **Charge machine** : un fichier de test à la fois ; les tests navigateur du moteur passent sur Chromium **puis** Firefox **puis** WebKit avant de valider une tâche (les trois diffèrent sur l'ordre des rappels).
- Commits : message terminé par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ; ne jamais pousser ; chemins explicites.

## Review Focus

1. **Interruption en plein rebond** (ressort sous-amorti, vitesse de signe opposé au déplacement) : pas de saut de position ni de vitesse, arrivée exacte. → test Task 2.
2. **Contenu centré ou aligné à droite** dans un élément qui s'élargit : il reste centré / à droite pendant tout le vol. → test Task 3.
3. **Enfant suivi dans un parent suivi qui change de taille** : l'enfant n'est ni étiré ni décalé du facteur d'échelle du parent. → test Task 4.
4. **Interruption d'un vol avec contenu projeté** : le contenu repart de sa position visuelle courante. → test Task 4.
5. **Contenu modifié sans que la boîte du parent change** (texte remplacé), puis changement de taille : le contenu part de sa position réelle, pas d'un cache périmé. → test Task 3.

---

### Task 1 : ressort analytique et temps courant du handle

**Files:**
- Create: `packages/motion/src/spring.ts`, `packages/motion/src/spring.spec.ts`
- Modify: `packages/motion/src/contract.ts`, `packages/motion/src/providers/waapi.ts`, `packages/motion/src/providers/animejs.ts`, `packages/motion/src/providers/css.ts`, `packages/motion/src/compose.ts`, `packages/motion/src/tokens.ts`, `packages/motion/src/index.ts`, les specs qui construisent des handles factices

**Interfaces:**
- Produces :
  ```ts
  export interface SpringParams { dampingRatio: number; stiffness: number }
  /** Offset from the target at `t` seconds, for a spring starting `offset` away with `velocity` (units per second). */
  export function springOffset(params: SpringParams, offset: number, velocity: number, t: number): number
  /** Time derivative of `springOffset`. */
  export function springVelocity(params: SpringParams, offset: number, velocity: number, t: number): number
  /** Seconds after which the offset stays within `epsilon` (same unit as `offset`). */
  export function springSettleTime(params: SpringParams, offset: number, velocity: number, epsilon: number): number
  /** Parameters of a spring token, for a scheme. */
  export function springParams(ref: SpringRef, scheme: MotionScheme): SpringParams   // dans tokens.ts
  ```
  `MotionHandle` gagne `readonly currentTime: number` (ms écoulées dans l'animation ; 0 pour un handle établi ; max des enfants pour un handle composé).
- Formules (ω = √k) :
  - ζ < 1, ω_d = ω√(1 − ζ²) : `x(t) = e^(−ζωt)·(A·cos ω_d t + B·sin ω_d t)`, `A = offset`, `B = (velocity + ζωA)/ω_d` ; `x'(t) = e^(−ζωt)·((B·ω_d − ζωA)·cos ω_d t − (A·ω_d + ζωB)·sin ω_d t)`.
  - ζ = 1 : `x(t) = e^(−ωt)·(A + C·t)`, `C = velocity + ωA` ; `x'(t) = e^(−ωt)·(C − ω·(A + C·t))`.
  - ζ > 1 : `RangeError`.
  - `springSettleTime` : plus petit `t` tel que l'enveloppe `e^(−ζωt)·R ≤ epsilon`, avec `R = √(A² + B²)` (ζ < 1) ou la borne `|A| + |C|·t` (ζ = 1, par pas de 1 ms) ; `0` si déjà dedans ; plafonné à 5 s.

- [ ] **Step 1 : tests** (`spring.spec.ts`) : `springOffset(p, 1, 0, 0) === 1` ; `x(t)` tend vers 0 ; pour chaque token, `1 − springOffset(params, 1, 0, t)` égale la valeur de son easing `linear()` à 0,5 % près en dix instants ; `springVelocity` égale la dérivée numérique (`(x(t+h) − x(t−h))/2h`, h = 1e-5) à 1e-3 relatif ; vitesse initiale respectée (`springVelocity(p, a, v, 0) ≈ v`) ; ζ = 1 et ζ = 0,6 ; `springSettleTime` cohérent avec la durée du token à ±15 % pour `offset = 1`, `velocity = 0`, `epsilon = 0.001` ; `ζ > 1` lève. Handles : `currentTime` avance sur WAAPI (test navigateur existant du provider étendu d'un cas), vaut 0 sur `settledHandle()`.
- [ ] **Step 2 :** `npx vitest run src/spring.spec.ts` → FAIL.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS ; `MOTION_BROWSERS=chromium npx vitest run src/providers/providers.browser.spec.ts` ; `npx tsc --noEmit -p tsconfig.spec.json` → 0.
- [ ] **Step 5 :** commit `feat(motion): add an analytic spring and the current time of a handle`.

### Task 2 : vitesse conservée à l'interruption

**Files:**
- Modify: `packages/motion/src/layout.ts`, `packages/motion/src/layout.browser.spec.ts`

**Interfaces:**
- Consumes: `spring.ts`, `springParams`, `MotionHandle.currentTime`, `resolveWaapiTiming`, `waapiProvider`.

Règles :
- Chaque vol garde sa cinématique : `{ params, timeScale, fields: { x, y, scaleX, scaleY → { from, to, velocity } } }` (un vol à 2 keyframes est un ressort de vitesse initiale nulle ; un vol en courbe — `CurveTiming` — n'a pas de cinématique).
- Interruption d'un vol à ressort avec `carry` : pour chaque champ, vitesse courante = `springVelocity(params, from − to, velocity, handle.currentTime / 1000 / timeScale)` ; le nouveau vol part de la position visuelle courante (comme en 2a) avec cette vitesse.
- Nouveau vol : si toutes les vitesses sont négligeables (`|v| < 1` px/s et `< 0,01`/s pour les échelles) → forme 2a. Sinon → keyframes échantillonnés : durée `max` des `springSettleTime` par champ (epsilon 0,5 px ou 0,001), bornée entre la durée du token et 2 fois celle-ci ; valeur du champ à `t_i` = `to + springOffset(params, from − to, velocity, t_i)` ; easing `linear` ; durée réelle = durée × `--udx-motion-scale`.
- `interrupt: 'restart'` et les vols en courbe : vitesse nulle, comme en 2a.

- [ ] **Step 1 : tests** (`layout.browser.spec.ts`) : après `pause()` + `seek()` à 15 % puis changement inverse, mesurer la position à `t` et `t + 16 ms` du nouveau vol (`seek`) : la vitesse initiale mesurée égale la vitesse analytique de l'ancien vol à ±15 % et a son signe ; **Review Focus 1** : interruption à un instant où l'ancien vol dépasse sa cible (ressort ζ < 1) → position continue à 2 px, vitesse de même signe, arrivée exacte à 0,5 px, rien en ligne ; un vol sans vitesse garde 2 keyframes (`getAnimations()[0].effect.getKeyframes().length === 2`) ; un vol repris en a au moins 9 ; `interrupt: 'restart'` → 2 keyframes.
- [ ] **Step 2 :** FAIL (Chromium).
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS sur Chromium, Firefox, WebKit (un à la fois) ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): carry the velocity of an interrupted layout move`.

### Task 3 : contenu non déformé

**Files:**
- Create: `packages/motion/src/project.ts`, `packages/motion/src/project.spec.ts`
- Modify: `packages/motion/src/layout.ts`, `packages/motion/src/layout.browser.spec.ts`, `packages/motion/src/index.ts`

**Interfaces:**
- Produces (`project.ts`, fonctions pures) :
  ```ts
  /** Scale of a parent relative to its natural size, per axis. */
  export interface Stretch { x: number; y: number }
  export function lerpBox(from: Box, to: Box, q: number): Box
  /** Own transform that shows `desired` (relative to the parent's visual centre) for a node whose layout box is `after` (relative to the parent's layout centre), inside a parent stretched by `k`. */
  export function projectBox(after: Box, desired: Box, k: Stretch): OwnTransform
  /** Same, for a text node: natural size kept, start edge (left, top) taken from `desired`. */
  export function projectText(after: Box, desired: Box, k: Stretch): OwnTransform
  /** Net stretch of a projected box, for its own children. */
  export function stretchOf(after: Box, desired: Box): Stretch
  ```
  Formules par axe (centres relatifs au centre du parent) :
  - boîte : `sx = desired.w / (k.x · after.w)` ; `x = desired.cx / k.x − after.cx` ;
  - texte : `sx = 1 / k.x` ; `x = (desired.cx − desired.w/2 + after.w/2) / k.x − after.cx` ;
  - `stretchOf` : `{ x: desired.w / after.w, y: desired.h / after.h }` ; une dimension nulle donne 1.
- Cache du contenu : chaque élément suivi garde l'arbre de ses nœuds de contenu (`element`, `kind: 'box' | 'text'`, boîte relative au centre de son parent, enfants), mesuré quand l'élément est mesuré au repos, sauf lors d'un rafraîchissement dû au défilement. Un enfant suivi n'est pas un nœud de contenu (Task 4).
- Dans `flush`, `relevant` devient une collecte : pour chaque enregistrement, l'élément suivi le plus proche contenant la cible voit son contenu re-mesuré dans la phase de lecture, même si sa propre boîte n'a pas bougé.
- Vol d'un élément dont la taille change (rapport hors tolérance) et qui a du contenu : aux instants d'échantillonnage `t_i`, `k_i` = échelle animée du parent / échelle de repos, `q_i = 1 − springOffset(params, 1, 0, t_i)` (ou la progression de la courbe pour un `CurveTiming`), boîte voulue = `lerpBox(avant, après, q_i)`, transform propre par `projectBox` / `projectText`, composé avec le transform de repos du nœud ; récursion avec `stretchOf`. Chaque nœud reçoit une animation échantillonnée, annulée avec celle du parent.

- [ ] **Step 1 : tests.** `project.spec.ts` : enfant de taille constante dans un parent étiré ×2 → `sx = 0.5`, centre conservé ; boîte qui suit son parent → échelle nette = rapport interpolé ; texte : bord gauche exact, taille naturelle ; `stretchOf`. `layout.browser.spec.ts` (vol mis en pause, `seek` à 15 %) : carte `display:flex` avec un enfant `80×20` — à mi-course la carte a une largeur visuelle intermédiaire et l'enfant mesure `80×20` à 0,5 px près ; **Review Focus 2** : enfant centré (`margin: auto`) et enfant à droite (`margin-left: auto`) restent centré / à droite à 1 px près à trois instants ; titre bloc avec texte → largeur visuelle = largeur finale, bord gauche = interpolation ; conteneur imbriqué (boîte → boîte → texte) ; **Review Focus 5** ; à la fin, aucun style en ligne sur aucun nœud et `getAnimations()` vide partout ; un élément sans changement de taille n'anime pas son contenu ; au-delà de 24 nœuds, les suivants ne sont pas animés.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS sur les trois navigateurs ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): keep the content of a resizing layout element undistorted`.

### Task 4 : enfants suivis et interruption du contenu projeté

**Files:**
- Modify: `packages/motion/src/layout.ts`, `packages/motion/src/layout.browser.spec.ts`

Règles :
- Un élément suivi dont la référence est un élément suivi qui change de taille est planifié par projection (boîtes avant / après de son propre cache, relatives à la référence), à la place de `flipFrames` ; son contenu est projeté à sa suite avec son étirement net.
- Un tel enfant est replanifié dès que sa référence l'est, même si sa propre boîte relative n'a pas changé.
- Interruption d'un vol avec contenu projeté : la boîte « avant » de chaque nœud est sa boîte visuelle courante relative au centre visuel du parent, déduite de son transform animé et de l'étirement courant du parent.

- [ ] **Step 1 : tests** : **Review Focus 3** (enfant suivi `40×40` dans une carte suivie qui double de largeur : taille visuelle `40×40` à 0,5 px à trois instants, position = interpolation de ses positions avant / après à 1 px) ; **Review Focus 4** (interruption à 15 % : rect visuel de chaque nœud continu à 2 px, arrivée exacte, rien en ligne) ; enfant suivi dont le parent ne fait que se déplacer → comportement de 2a inchangé.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS sur les trois navigateurs ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): project followed children and interrupted content`.

### Task 5 : démo, documentation, mesures

**Files:**
- Modify: `apps/doc/src/pages/motion/demo.astro`, `apps/doc/tests/motion.browser.test.mjs`, `packages/motion/README.md`

Contenu : les deux cartes « Size » reçoivent un titre, une ligne de texte et une puce alignée à droite ; test navigateur : à mi-course, la puce garde sa taille naturelle à 1 px près. README : la limite « contenu étiré » devient « le texte posé directement dans l'élément suivi est étiré ; l'envelopper dans un élément ».

- [ ] Implémenter (sans lancer le site) ; `node --check` ; commit `docs(motion): show undistorted content in the layout demo`.

### Task 6 (contrôleur) : vérification

- [ ] Captures à mi-course de la démo (contenu net), interruption répétée à la main dans le script.
- [ ] Banc d'essai (`node bench/layout-run.mjs`) : pas de régression > 10 % sur `changeMs` à 200 éléments.
- [ ] Suites complètes (motion sur trois navigateurs, core, React, Svelte, Angular, tailles, doc construite), une commande à la fois.
- [ ] Spec §8.3.8, §8.6, journal ; commit `docs(motion): record step 2b delivery in the spec`.
