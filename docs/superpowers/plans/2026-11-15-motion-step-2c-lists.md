# @udixio/motion — étape 2c : listes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animer une liste de bout en bout : les éléments entrent en cascade, sortent proprement, et leurs voisins se déplacent pour leur faire ou leur reprendre la place.

**Architecture:** Quatre ajouts sur le noyau existant. (1) Un élément peut porter plusieurs animations, une par nature (présence, emphase, layout) : `data-motion="fade reflow"`. (2) La cascade (`stagger`, `origin`) regroupe les entrées ou sorties demandées dans la même tâche par définition et par portée, les classe par position visuelle et leur donne un délai. (3) La sortie d'une liste (`exit`) est soit en place (l'élément garde sa place puis les voisins se déplacent), soit hors flux (l'élément est retiré du flux au début, les voisins se déplacent pendant qu'il sort). (4) Les coins arrondis d'un élément qui change de taille sont corrigés pendant le vol.

**Tech Stack:** TypeScript, WAAPI, Vitest navigateur (trois navigateurs), Astro (démo).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.2.3 (`stagger`, `origin`, `exit`), §8.2.6 (tokens `--udx-motion-stagger-*`, plafond 400 ms), §8.1 bis #3 (M5-L07), §8.1 quater I14, I16, I19, §8.4 F10, §8.3.7 et §8.3.8 (moteur de layout).

## Global Constraints

- Natures d'animation : **présence** (`appear`, `disappear`), **emphase** (`emphasize`), **layout** (`layout`). Un élément porte au plus une liaison par nature.
- `data-motion` accepte plusieurs noms séparés par des espaces ; deux noms de même nature sur un élément = erreur de développement, le premier gagne.
- `stagger` : tokens `tight` / `normal` / `loose` lus sur `--udx-motion-stagger-<token>` (20 / 50 / 100 ms) ; délai = `min(rang × pas, --udx-motion-stagger-max)` (400 ms) ; rang = ordre visuel mesuré (haut puis gauche) ; `origin` : `first` (défaut), `last`, `center`. Verbes : `appear`, `disappear`.
- `exit` : `in-place` (défaut) ou `out-of-flow` ; verbes `appear`, `disappear`.
- Mouvement réduit : pas de cascade (délai nul), pas de retrait du flux animé ; les états finaux s'appliquent.
- Le moteur de layout ignore un élément dont la présence n'est pas `present` (il entre ou sort : sa propre animation de présence a la main sur `translate` / `scale`).
- Rien de durable en ligne hors ce que la présence écrit déjà ; un élément retiré du flux retrouve ses styles en ligne d'origine à son retour ou à la destruction.
- Performances : après chaque tâche qui touche au moteur de layout, `node bench/layout-run.mjs --engine udixio --scenario reorder --count 200` et `--scenario idle --count 200` ne régressent pas de plus de 10 %.
- **Charge machine** : un fichier de test à la fois ; tests navigateur du moteur sur Chromium, puis Firefox, puis WebKit.
- Commits : chemins explicites, ne jamais pousser.

## Review Focus

1. **Élément ajouté pendant que la liste bouge** : il entre, ses voisins lui font place, sans conflit sur `translate`. → test Task 2.
2. **Dix éléments ajoutés d'un coup** : cascade dans l'ordre visuel, délai plafonné, un seul lot de mesures. → test Task 3.
3. **Éléments ajoutés dans deux listes différentes dans la même tâche** : deux cascades indépendantes. → test Task 3.
4. **Sortie hors flux puis retour avant la fin** : l'élément reprend sa place, les voisins la lui rendent, aucun style en ligne résiduel. → test Task 4.
5. **Sortie en place pilotée par `hidden`** : à la fin de la sortie, les voisins se déplacent (pas de saut). → test Task 4.

---

### Task 1 (fait en amont) : découpage de `layout.ts` en modules

Refactorisation sans changement de comportement (`src/layout/*.ts`), vérifiée sur trois navigateurs et au banc d'essai.

### Task 2 : plusieurs animations par élément

**Files:**
- Modify: `packages/motion/src/bind.ts`, `packages/motion/src/bind.browser.spec.ts`, `packages/motion/src/connect.ts`, `packages/motion/src/connect.browser.spec.ts`, `packages/motion/src/layout/flush.ts` (ou le module qui porte `flush`), `packages/motion/src/layout.browser.spec.ts`, `packages/motion/src/define-motion.ts`, `packages/motion/src/index.ts`
- Modify: `packages/ui-react/src/lib/hooks/useMotion.ts` (+ spec), `packages/ui-angular/src/lib/motion/motion.ts` (+ spec), `packages/ui-svelte/src/lib/motion/motion.attachment.svelte.ts` (+ spec)

**Interfaces:**
- Produces :
  ```ts
  export type MotionKind = 'presence' | 'emphasis' | 'layout';
  export function kindOf(verb: MotionSpec['verb']): MotionKind
  /** The binding of one kind on an element; without a kind, the first of presence, emphasis, layout. */
  export function getMotion(target: Element, kind?: MotionKind): MotionBinding | undefined
  export function getMotions(target: Element): MotionBinding[]
  ```
  `motion(target, source)` ne détruit que la liaison précédente **de même nature**. `MotionBinding` gagne `readonly kind: MotionKind`.
  `connectMotion` : `data-motion="a b c"` lie chaque nom ; un nom inconnu reste en attente seul ; présence par `hidden` → liaison de présence ; `data-state` → liaison d'emphase ; changement de `data-motion` → les liaisons du scanner sont refaites.
  Adaptateurs : la source accepte un tableau (`useMotion(['fade', 'reflow'], { present })`, `[udxMotion]="['fade', 'reflow']"` ou `udxMotion="fade reflow"`, `motion(['fade', 'reflow'])`) ; `present` pilote la liaison de présence, `state` la liaison d'emphase ; `mounted`, `leave`, `presence` suivent la liaison de présence.
- Moteur de layout : dans `flush`, un élément suivi dont `data-presence` existe et n'est pas `present` est sauté (ni comparé, ni animé) ; son cache est remesuré au premier flush où il est `present`, sans animation.

- [ ] **Step 1 : tests** — bind : `motion(el, fade)` puis `motion(el, reflow)` → deux liaisons, `getMotions` en rend deux, `getMotion(el)` rend la présence, `getMotion(el, 'layout')` le layout ; rebind de même nature → l'ancienne seule est détruite ; `destroy()` de l'une laisse l'autre. connect : `data-motion="connect-fade connect-reflow"` → deux liaisons ; `hidden` pilote la présence ; deux noms de présence → un `console.error`, le premier lié. layout : **Review Focus 1** (liste de trois `fade reflow`, insertion d'un quatrième au milieu : il a une animation d'opacité et aucune de `translate` ; les deux suivants ont une animation de `translate` ; à la fin, positions exactes et rien en ligne hors `opacity`). Adaptateurs (liaisons factices) : tableau → une liaison par source ; `present` n'appelle `setPresent` que sur la présence.
- [ ] **Step 2 :** FAIL (un fichier à la fois).
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS (motion : bind, connect, layout sur trois navigateurs ; React, Svelte, Angular après `npx nx build @udixio/motion --skip-sync`) ; `tsc` → 0 ; banc d'essai sans régression.
- [ ] **Step 5 :** commit `feat(motion): bind one motion of each kind on an element`.

### Task 3 : cascade (`stagger`, `origin`)

**Files:**
- Create: `packages/motion/src/stagger.ts`, `packages/motion/src/stagger.spec.ts`, `packages/motion/src/stagger.browser.spec.ts`
- Modify: `packages/motion/src/manifest.ts`, `packages/motion/motion-manifest.json`, `packages/motion/src/define-motion.spec.ts`, `packages/motion/src/compose.ts`, `packages/motion/src/play.ts`, `packages/motion/src/bind.ts`, `packages/motion/src/index.ts`, `packages/motion/src/presets.ts`

**Interfaces:**
- Produces :
  - Manifeste : `stagger` et `origin` passent de différés à optionnels pour `appear` et `disappear` (autres verbes : `unsupported`).
  - `playMotion(..., { ..., delay?: number })` : délai en ms, transmis à chaque groupe.
  - `compose.ts` : `deferredHandle(): { handle: MotionHandle; resolve(real: MotionHandle): void }` — avant `resolve`, `cancel()` marque l'annulation (le vrai handle est annulé dès qu'il arrive, `finished` vaut `'cancelled'`), les autres commandes sont sans effet ; après, tout est transmis.
  - `stagger.ts` :
    ```ts
    /** Rank of each box in visual order (top, then left), counted from `origin`. */
    export function visualRanks(boxes: ReadonlyArray<{ top: number; left: number; height: number }>, origin: 'first' | 'last' | 'center'): number[]
    /** Delay of a rank, capped. */
    export function staggerDelay(rank: number, step: number, max: number): number
    /** Start `play` with the delay of `target` among the elements of the same group asking in the same task. */
    export function staggered(target: HTMLElement, group: object, options: { stagger: 'tight' | 'normal' | 'loose'; origin?: 'first' | 'last' | 'center'; reduced: boolean }, play: (delay: number) => MotionHandle): MotionHandle
    ```
    Groupe = même objet de définition (`group`) **et** même portée (`layoutScopeOf(target)`). Le lot est vidé dans un microtask : lectures (rects, tokens sur le premier élément du groupe) puis écritures (`play`). Un seul élément ou `reduced` → délai 0. Deux boîtes sont sur la même ligne quand leurs hauts diffèrent de moins de la moitié de la plus petite hauteur.
  - `bind.ts` : `enter` et `exit` passent par `staggered` quand la définition porte `stagger`.
  - Preset `cascade` : `appear`, `[{ opacity: 0, y: 16 }, { opacity: 1, y: 0 }]`, `stagger: 'normal'`.

- [ ] **Step 1 : tests** — `stagger.spec.ts` : rangs d'une colonne, d'une grille 3×2 (ligne par ligne), `origin: 'last'` et `'center'` (5 éléments → 2, 1, 0, 1, 2) ; `staggerDelay(10, 50, 400) === 400`. `stagger.browser.spec.ts` : **Review Focus 2** (dix éléments liés dans la même tâche : délais `0, 50, …, 400, 400` lus sur `getAnimations()[0].effect.getTiming().delay`, dans l'ordre visuel même si l'ordre de liaison est inversé) ; **Review Focus 3** ; un élément seul → 0 ; mouvement réduit → 0 ; `cancel()` avant le microtask → aucune animation créée, `finished` → `'cancelled'` ; sortie en cascade (`setPresent(false)` sur cinq éléments). `define-motion.spec.ts` : `stagger` accepté sur `appear`, refusé sur `layout`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 :** implémenter ; régénérer le manifeste JSON.
- [ ] **Step 4 :** PASS sur trois navigateurs ; `bind.browser.spec.ts`, `play.browser.spec.ts` verts ; `tsc` → 0.
- [ ] **Step 5 :** commit `feat(motion): stagger entries and exits by visual order`.

### Task 4 : sorties de liste (`exit`)

**Files:**
- Create: `packages/motion/src/pin.ts`, `packages/motion/src/pin.browser.spec.ts`
- Modify: `packages/motion/src/manifest.ts`, `packages/motion/motion-manifest.json`, `packages/motion/src/bind.ts`, `packages/motion/src/bind.browser.spec.ts`, `packages/motion/src/connect.ts`, `packages/motion/src/connect.browser.spec.ts`, `packages/motion/src/layout.ts`, `packages/motion/src/index.ts`

**Interfaces:**
- Produces :
  - Manifeste : `exit` optionnel pour `appear` et `disappear`.
  - `layout.ts` : `flushLayoutAround(element: HTMLElement): void` — compare tout de suite la portée qui suivrait un voisin de `element` (`layoutScopeOf(element)`), s'il y en a une.
  - `pin.ts` : `pinOutOfFlow(element: HTMLElement): () => void` — lit `offsetLeft`, `offsetTop`, `offsetWidth`, `offsetHeight`, puis écrit en ligne `position: absolute`, `left`, `top`, `width`, `height`, `margin: 0`, `box-sizing: border-box` ; la fonction rendue restaure les valeurs en ligne d'origine (idempotente).
  - `bind.ts` : sortie avec `exit: 'out-of-flow'` (hors mouvement réduit) → `pinOutOfFlow` avant de jouer, puis `flushLayoutAround(target)` ; au retour (`setPresent(true)`) ou à `destroy()` → restauration puis `flushLayoutAround(target)`.
  - `connect.ts` : quand le scanner relâche l'affichage à la fin d'une sortie (l'élément devient `display: none`), il appelle `flushLayoutAround(el)`.

- [ ] **Step 1 : tests** — pin : position visuelle inchangée après `pinOutOfFlow` (à 0,5 px), le voisin suivant remonte, restauration exacte des styles en ligne (y compris un `width` en ligne préexistant). bind : **Review Focus 4**. connect : **Review Focus 5** (liste de trois `connect-fade connect-reflow`, `hidden` sur le premier : pendant la sortie les voisins ne bougent pas ; à la fin ils ont une animation de `translate` et arrivent à leur place) ; même liste avec une définition `exit: 'out-of-flow'` : les voisins bougent dès le début.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 :** implémenter ; régénérer le manifeste JSON.
- [ ] **Step 4 :** PASS sur trois navigateurs ; `tsc` → 0 ; banc d'essai sans régression.
- [ ] **Step 5 :** commit `feat(motion): let list neighbours close the gap of an exit`.

### Task 5 : coins arrondis

**Files:**
- Modify: `packages/motion/src/contract.ts`, `packages/motion/src/providers/waapi.ts`, `packages/motion/src/providers/animejs.ts`, `packages/motion/src/providers/css.ts`, le module de vol du layout, `packages/motion/src/layout.browser.spec.ts`, `packages/motion/src/providers/providers.browser.spec.ts`

**Interfaces:**
- Produces : `MotionRequest.styles?: ReadonlyArray<Readonly<Record<string, string>>>` — propriétés CSS supplémentaires par keyframe (même longueur que `keyframes`), portées par WAAPI, refusées par `animejs` et `css`. Réservé aux corrections du moteur : aucune surface d'écriture ne l'expose.
- Règle : un élément suivi (ou un nœud boîte de son contenu) dont la taille change et dont un rayon calculé est en px non nul est joué en forme échantillonnée ; à chaque instant, `border-radius` vaut les rayons de repos divisés par l'étirement courant, horizontalement et verticalement (`tl/kx tr/kx br/kx bl/kx / tl/ky …`). Les rayons en pourcentage ne sont pas corrigés.

- [ ] **Step 1 : tests** — provider : `styles` appliqués par keyframe, rien en ligne à la fin avec `commit: false`. layout : carte `border-radius: 16px` qui double de largeur — à 15 %, 30 %, 60 %, le rayon horizontal calculé × l'étirement horizontal courant = 16 px à 0,5 px près ; `border-radius: 50%` → aucune animation de rayon ; carte sans rayon → forme à 2 keyframes conservée ; à la fin, `style.borderRadius === ''`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** PASS sur trois navigateurs ; `tsc` → 0 ; banc d'essai sans régression (les éléments du banc n'ont pas de rayon).
- [ ] **Step 5 :** commit `feat(motion): keep rounded corners round while an element resizes`.

### Task 6 : démo et documentation

**Files:**
- Modify: `apps/doc/src/pages/motion/demo.astro`, `apps/doc/tests/motion.browser.test.mjs`, `packages/motion/README.md`

Contenu : section « Lists » — une liste `data-motion="cascade reflow"` avec « Add item » (insère au début), « Add five », « Remove first » (pose `hidden`, puis retire le nœud à la fin de la sortie), et une variante hors flux. README : plusieurs noms dans `data-motion`, `stagger` / `origin`, `exit`, preset `cascade`.

- [ ] Implémenter (sans lancer le site) ; `node --check` ; commit `docs(motion): demonstrate animated lists`.

### Task 7 (contrôleur) : vérification

- [ ] Démo au navigateur (captures), banc d'essai complet, suites complètes une à une, tailles, doc construite sur trois navigateurs.
- [ ] Spec §8.3.9, §8.6, journal ; commit `docs(motion): record step 2c delivery in the spec`.
