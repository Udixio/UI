# @udixio/motion — étape 3 : `reveal`, `scrub`, `loop` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les trois verbes restants de l'animation de page : `reveal` (un élément entre en scène quand il arrive dans la vue), `scrub` (sa progression suit le défilement) et `loop` (une boucle qui se met en pause hors de la vue et qu'on peut arrêter).

**Architecture:** Mêmes briques que les étapes 1 et 2 : définitions validées par le manifeste, liaisons par élément (`motion()`, `data-motion`, adaptateurs), une liaison par nature. Nouvelles natures : `view` (`reveal`, `scrub`) et `loop`. `reveal` s'appuie sur un observateur d'intersection partagé (`viewport.ts`) et sur la cascade existante ; `scrub` sur l'API native `ViewTimeline` (WAAPI), avec un rendu statique là où elle manque ; `loop` sur une animation WAAPI à itérations infinies, mise en pause hors de la vue.

**Tech Stack:** TypeScript, WAAPI (`ViewTimeline`, `iterations: Infinity`), `IntersectionObserver`, Vitest navigateur (Chromium 156, Firefox 157, WebKit 27.2), Astro (démo).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.2.3 (`repeat`, `axis`, `range`, `pause`, `reason`), §8.2.4 (lignes `reveal`, `scrub`, `loop`), §8.4 F4, F5, F24, F20, §8.1 quater I08, I13, §8.1 quinquies (S1 : repli statique du défilement lié), §8.5 (repli statique par défaut).

## Global Constraints

- `reveal` : déclencheur = entrée dans la vue ; reprise `restart` ; rendu réduit `instant` ; ressort `spring.default.spatial`. Options : `repeat: 'once' | 'always'` (défaut `once`), `axis: 'block' | 'inline'` (défaut `block`), `stagger` / `origin` (ajout à la table de la spec : la cascade à l'entrée dans la vue est le cas le plus courant).
- `scrub` : progression liée au défilement, sans timing ; rendu réduit `neutral` (aucune animation, l'élément reste dans son état de feuille de style). Options : `range: 'enter' | 'cross' | 'exit' | 'contain'` (défaut `cross`), `axis`. Navigateur sans `ViewTimeline` (Firefox 157) : rendu statique, comme le mouvement réduit (§8.5).
- `loop` : démarre au montage ; reprise `restart` ; rendu réduit `frozen` (aucune animation) ; timing `CurveTiming` uniquement (un ressort ne boucle pas), défaut `{ duration: 'duration.extraLong4', easing: 'easing.linear' }`. `pause: 'control' | 'essential'` obligatoire ; `reason` obligatoire si `essential` (WCAG 2.2.2). Pause automatique hors de la vue ; pause par l'auteur (`binding.pause()`, `data-motion-paused`, option `paused` des adaptateurs).
- Natures : `presence` (`appear`, `disappear`), `emphasis` (`emphasize`), `layout`, `view` (`reveal`, `scrub`), `loop`. Une liaison par nature et par élément.
- Le contenu n'est jamais laissé invisible : sans observateur, sans JS, sous mouvement réduit ou sur erreur, l'élément est dans son état final (`reveal`) ou dans son état de feuille de style (`scrub`, `loop`).
- Contenu dans la vue au moment de la liaison : `reveal` ne le rejoue pas (décision du 2026-11-15 : pas d'animation au chargement par défaut).
- Presets (valeurs provisoires, calibrage à l'étape 8) : `rise` (reveal), `parallax` (scrub), `rotate`, `breathe`, `blink` (loop, ≤ 3 flashs/s), `shake` (emphasize).
- Charge machine : un fichier de test à la fois ; trois navigateurs pour chaque verbe ; vérifier la charge avant les lancements lourds.

## Review Focus

1. **Liste longue révélée en défilant vite** : chaque élément finit visible, à sa place, sans style en ligne résiduel. → test Task 2.
2. **Élément déjà dans la vue à la liaison** : aucune animation, aucun masquage. → test Task 2.
3. **`scrub` sans support natif** (Firefox 157) : aucun style en ligne, contenu visible. → test Task 3.
4. **Boucle hors de la vue** : en pause ; reprend en revenant ; mouvement réduit = arrêtée et dans son état de repos. → test Task 4.
5. **Destruction pendant une cascade de `reveal` en attente** : aucune animation créée après la destruction. → test Task 2.

### Task 1 : manifeste, natures, presets
- [ ] Verbes supportés, options, natures `view` / `loop`, presets ; tests ; commit `feat(motion): define reveal, scrub and loop motions`.

### Task 2 : `reveal`
- [ ] `viewport.ts`, liaison `reveal`, cascade, `repeat`, mouvement réduit ; tests trois navigateurs ; commit `feat(motion): reveal elements as they enter the view`.

### Task 3 : `scrub`
- [ ] Liaison `scrub` sur `ViewTimeline`, `range`, `axis`, repli statique ; tests trois navigateurs ; commit `feat(motion): link a motion to the scroll position`.

### Task 4 : `loop`
- [ ] Liaison `loop`, pause hors vue, `pause()` / `play()`, mouvement réduit ; tests trois navigateurs ; commit `feat(motion): play loops that pause out of view`.

### Task 5 : HTML et adaptateurs
- [ ] `data-motion-paused`, option `paused` / `udxMotionPaused` ; commit `feat(motion): pause loops from HTML and the framework adapters`.

### Task 6 : démo et README
- [ ] Sections « Reveal », « Scrub », « Loop » de `/motion/demo` ; commit `docs(motion): demonstrate reveal, scrub and loop`.

### Task 7 (contrôleur) : vérification et spec
