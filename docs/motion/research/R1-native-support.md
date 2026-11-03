# R1 — Matrice de support natif (état au 2026-11-03)

> Travail **R1** de la spec `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§7, phase 0).
> Rapport factuel : aucune décision de design n'est prise ici. Les « implications » sont formulées de façon neutre.

## 0. Méthode et données

| Source | Version utilisée | Publiée le |
|---|---|---|
| `@mdn/browser-compat-data` (BCD, source de MDN) | 8.1.8 | 2026-11-02 |
| `web-features` (statuts Baseline, web-features explorer / web.dev) | 3.45.0 (dev 2026-11-03) | 2026-11-03 |
| `caniuse-lite` (données de `browserslist`) | 1.0.30001820 | 2026-10-29 |
| `browserslist` | 4.29.5 | 2026-10-26 |
| Scores Interop (CSV `results-analysis`, stable) | dernière ligne | 2026-11-02 |

Les versions et la couverture ont été calculées par script (hors dépôt) à partir de ces paquets, puis recoupées avec les notes de version officielles (Chrome 146/147, Firefox 159, Safari 27.0/27.1/27.2) et caniuse pour les fonctionnalités que caniuse couvre lui-même.

### 0.1 Résolution de `defaults` aujourd'hui

`npx browserslist defaults` (= `> 0.5%, last 2 versions, Firefox ESR, not dead`) donne **86,01 %** de l'usage mondial :

```
chrome 156 155 154 153 152 151 150 109     edge 155 154 153 152
firefox 159 158 156 155 153 (ESR)          safari 27 26.6
ios_saf 27.0 26.6 26.5 18.5-18.7           and_chr 156  and_ff 159  android 156
samsung 30 29                              opera 135 134   op_mob 80
and_uc 15.5  and_qq 14.9  kaios 3.0-3.1  kaios 2.5  op_mini all
```

Entrées « traînantes » qui expliquent la plupart des non-couvertures :

| Entrée | Moteur (BCD) | Usage | Pourquoi elle est dans `defaults` |
|---|---|---|---|
| `chrome 109` | Blink 109 (dernier Chrome Windows 7/8) | 0,60 % | `> 0.5%` |
| `ios_saf 18.5-18.7` | WebKit 621 (iOS 18) | 2,01 % | `> 0.5%` |
| `firefox 153` | Gecko 153 (ESR) | 0,05 % | `Firefox ESR` |
| `op_mob 80` | Blink 120 (sortie 2024-01) | 0,85 % | `last 2 versions` (caniuse ne connaît que 12.x et 80) |
| `samsung 29` | Blink 136 | 0,11 % | `last 2 versions` |
| `safari 26.6`, `ios_saf 26.5/26.6` | WebKit 624 | 1,41 % / 1,36 %… | `last 2 versions` / `> 0.5%` |
| **G0** : `op_mini all`, `kaios 2.5`, `kaios 3.0-3.1`, `and_uc 15.5`, `and_qq 14.9` | absents de BCD | ≈ 0,61 % cumulés (op_mini et kaios ≈ 0 %) | `last 2 versions` / `not dead` |

**Fait structurant :** aucune fonctionnalité de cette liste n'est supportée par *toutes* les entrées de `defaults` au sens strict, parce que le groupe **G0** (Opera Mini en mode serveur, KaiOS 2.5 ≈ Gecko 48, UC/QQ) n'a pas de données BCD et ne supporte pas ces API modernes (Opera Mini ne supporte même pas `prefers-reduced-motion` ni WAAPI selon caniuse). La colonne « `defaults` » ci-dessous indique donc la couverture **hors G0**, la liste des entrées manquantes et la part d'usage mondial non couverte (hors G0).

Attention : `defaults` est une requête *mobile* (usage) ; son résultat change à chaque mise à jour de `caniuse-lite`. Les chiffres ci-dessous sont un instantané au 2026-10-29.

## 1. Tableau principal

Légende : `n°` = première version stable sans flag ; `—` = non supporté (BCD) ; `p` = partiel. Edge suit Chrome sauf mention. Safari iOS = Safari desktop sauf mention. Baseline : *limited* = pas dans les 3 moteurs ; *newly* = dans les 3 moteurs depuis la date ; *widely* = 30 mois après *newly*.

| Fonctionnalité | Chrome | Edge | Firefox | Safari (mac / iOS) | Baseline (web-features) | Interop | `defaults` (hors G0) |
|---|---|---|---|---|---|---|---|
| `animation-timeline: scroll()` / `view()` | 115 | 115 | **159** (2026-10-27) | 26 | newly **2026-10-27** (`scroll-driven-animations`) | **2026** (SDA) | Non — manquent chrome 109, firefox 153/155/156/158, ios_saf 18.5-18.7 — 3,93 % |
| `scroll-timeline` / `view-timeline` nommées (+ `-axis`, `-inset`) | 115 | 115 | 159 | 26 | newly 2026-10-27 | 2026 | Non — idem — 3,93 % |
| `timeline-scope` | 116 | 116 | 159 | 26 | newly 2026-10-27 | 2026 | Non — idem — 3,93 % |
| `animation-range` (`-start`/`-end`) | 115 | 115 | 159 | 26 | newly 2026-10-27 | 2026 | Non — idem — 3,93 % |
| ↳ plage nommée `scroll` | 147 | 147 | 159 | 26.5 | (sous-fonctionnalité) | — | Non |
| `animation` raccourci incluant `animation-timeline` | 115 **p** (reset seulement) | 115 p | — | — | — | — | Non (comportement divergent, cf. notes) |
| `ScrollTimeline` / `ViewTimeline` (JS) | 115 | 115 | 159 | 26 | newly 2026-10-27 | 2026 | Non — 3,93 % |
| `Element.animate({ timeline })` | 85 | 85 | 159 | 16 | — | — | Non — manquent firefox ≤158 — ≈0,1 % |
| `Element.animate({ rangeStart/rangeEnd })` | 115 | 115 | 159 | 26 | — | — | Non — 3,93 % |
| `animation-trigger` / `timeline-trigger` / `trigger-scope` / `AnimationTrigger` | **146** | 146 | — | — | **limited** (`scroll-triggered-animations`) | Non | Non — manquent tout Firefox, tout Safari, samsung 29/30, op_mob 80, chrome 109 — 19,04 % |
| `@starting-style` | 117 | 117 | 129 | 17.5 | newly 2024-08-06 | 2024 | Non — manque chrome 109 — 0,60 % |
| `transition-behavior: allow-discrete` (propriété) | 117 | 117 | 129 **p** | 17.4 | newly 2024-08-06 | 2024 | Non — Firefox partiel — 2,34 % |
| ↳ transition de `display` (`display-animation`) | 117 | 117 | **—** | 18 | **limited** | Non | Non — manquent tous les Firefox — 2,34 % |
| ↳ `overlay` (top layer) | 117 | 117 | — | — | limited | Non | Non — 16,28 % |
| `interpolate-size: allow-keywords` | 129 | 129 | — | — | **limited** | Non | Non — manquent tout Firefox, tout Safari, op_mob 80 — 17,13 % |
| `calc-size()` | 129 | 129 | — | — | **limited** | Non | Non — 17,13 % |
| View Transitions same-document (`document.startViewTransition`, `view-transition-name`, pseudo-éléments) | 111 | 111 | 144 | 18 | newly **2025-10-14** | 2025 + 2026 | Non — manque chrome 109 — 0,60 % |
| ↳ `startViewTransition({ types })`, `:active-view-transition-type()` | 125 | 125 | 147 | 18.2 | newly 2026-01-13 (`active-view-transition`) | 2026 | Non — + op_mob 80 — 1,45 % |
| ↳ `document.activeViewTransition` | 142 | 142 | 147 | 26.2 | — | — | Non — 3,57 % |
| ↳ `ViewTransition.waitUntil()` | 144 | 144 | — | — | — | — | Non — 19,04 % |
| View Transitions cross-document (`@view-transition`, `pageswap`/`pagereveal`) | 126 | 126 | **—** | 18.2 | **limited** | **2026** | Non — manquent tous les Firefox, op_mob 80 — 3,19 % |
| `view-transition-name: match-element` | 137 | 137 | 144 | 18.4 | newly 2025-10-14 (inclus dans `view-transitions`) | — | Non — + op_mob 80, samsung 29 — 1,56 % |
| `view-transition-class` | 125 | 125 | 144 | 18.2 | newly 2025-10-14 | 2025 | Non — + op_mob 80 — 1,45 % |
| `Element.startViewTransition()` (élément-scopé) + `view-transition-scope` | **147** | 147 | — | — | **limited** | Non | Non — 19,04 % |
| `linear()` easing | 113 | 113 | 112 | 17.2 | **widely 2026-06-11** (newly 2023-12-11) | — | Non — manque chrome 109 — 0,60 % |
| `sibling-index()` / `sibling-count()` | 138 | 138 | 154 | 26.2 | newly **2026-08-18** | — | Non — manquent chrome 109, firefox 153 (ESR), ios_saf 18.x, op_mob 80, samsung 29 — 3,62 % |
| `@property` / `CSS.registerProperty` (dont interpolation `<integer>`/`<number>`) | 85 (`registerProperty` 78) | 85 | 128 | 16.4 | newly 2024-07-09 | 2023-2024 (`interop-2023-property`) | **Oui** (hors G0) — 0 % |
| `offset-path` (`path()`) / `offset-distance` | 55 (`path()` 64) | 79 | 72 | 15.4 (`offset-distance` 16, `path()` 16) | **widely** 2025-03-12 (`motion-path`) | 2023 (Motion path) | **Oui** — 0 % |
| ↳ `offset-path` avec `ray()` / formes / `url()` / boîtes | 116 | 116 | 122 | 16–18 | (inclus) | 2023 | Non — manque chrome 109 — 0,60 % |
| Propriété CSS `d` (animation de tracé) | 52 | 79 | 97 | **—** (parsée, sans effet) | limited (`path-shape`) | Non | Non — manquent tout Safari mac/iOS — 13,94 % |
| Transformations individuelles `translate`/`scale`/`rotate` | 104 | 104 | 72 | 14.1 (iOS 14.5) | **widely** 2025-02-05 | — | **Oui** — 0 % |
| WAAPI : `Element.animate`, `getAnimations`, `Animation.currentTime`, `finished`, `commitStyles`, `persist` | 84 (animate 36) | 84 | 75 | 13.1 / 13.4 (`document.getAnimations` complet : 14) | **widely** 2023-03-16 (`web-animations`) | — | **Oui** — 0 % |
| `CSSAnimation` / `CSSTransition` (pilotage `currentTime`) | 84 | 84 | 75 | 13.1 / 13.4 | widely (inclus) | — | **Oui** — 0 % |
| `Animation.overallProgress` | 133 | 133 | 142 | 26.2 | — | — | Non — 3,46 % |
| `AnimationEvent.animation` / `TransitionEvent.animation` | 151 | 151 | 152 | 27 | newly 2026-09-14 | — | Non — 17,19 % |
| `animation-composition` | 112 | 112 | 115 | 16 | widely 2026-01-04 | — | Non — manque chrome 109 — 0,60 % |
| Long Animation Frames (`PerformanceLongAnimationFrameTiming`) | 123 | 123 | — | — | **limited** | Non | Non — 17,13 % |
| `prefers-reduced-motion` | 74 | 79 | 63 | 10.1 / 10.3 | widely 2022-07-15 | — | **Oui** — 0 % |
| `scroll-behavior: smooth` | 61 | 79 | 36 | 15.4 | widely 2024-09-14 | — | **Oui** — 0 % |
| `scrollIntoView(options)` | 61 | 79 | 36 | 14 | widely (`scroll-into-view`) | — | **Oui** — 0 % |
| événement `scrollend` | 114 | 114 | 109 | **26.2** | newly 2025-12-12 | 2025 | Non — chrome 109, ios_saf 18.x — 2,61 % |
| IntersectionObserver v1 | 51 | 15 | 55 | 12.1 / 12.2 | widely 2021-09-25 | — | **Oui** — 0 % |
| ↳ `scrollMargin` | 120 | 120 | 141 | 26 | — | — | Non — 2,61 % |
| IntersectionObserver v2 (`trackVisibility`, `isVisible`) | 74 | 79 | — | — | **limited** | Non | Non — 15,68 % |
| `content-visibility` (`hidden`/`visible`) | 85 | 85 | 125 | 18 | newly 2025-09-15 | — | **Oui** — 0 % |
| ↳ `content-visibility: auto` (complet) | 85 | 85 | 125 | 26 (18 partiel) | (inclus) | — | Non — ios_saf 18.x partiel — 2,01 % |
| ↳ `contentvisibilityautostatechange` | 108 | 108 | 130 | 18 | (inclus) | — | **Oui** — 0 % |
| `document.visibilityState` (pause onglet caché, F21) | 33 | 12 | 18 | 7 | widely | — | **Oui** — 0 % |

Résumé des catégories (hors G0) :

- **Couvert par `defaults`** : `@property`, `offset-path`/`offset-distance` (`path()`), transformations individuelles, WAAPI (dont `CSSAnimation.currentTime`), `prefers-reduced-motion`, `scroll-behavior`, `scrollIntoView`, IntersectionObserver v1, `content-visibility` de base, `visibilityState`.
- **Manque seulement `chrome 109` (0,60 %)** : `@starting-style`, `linear()`, View Transitions same-document, `animation-composition`, `offset-path` étendu.
- **Manque aussi iOS 18 / Firefox ESR / Firefox < 159 (≈ 2,3–4 %)** : scroll-driven animations, `sibling-index()`, `transition-behavior` sur `display`, cross-document VT, `match-element`, `scrollend`.
- **Chromium seul (≈ 13–19 %)** : `animation-trigger`, `interpolate-size`, `calc-size()`, `Element.startViewTransition`, `overlay`, LoAF, IO v2 ; et `d` est l'inverse (tout sauf Safari).

## 2. Écarts avec la spec du 2026-11-03 (§5)

| Mention au §5 | Constat R1 |
|---|---|
| F5 « Firefox derrière flag » | **Obsolète** : Firefox 159 (sorti le 2026-10-27) active les scroll-driven animations par défaut (bug 1324602). Baseline *newly* depuis le 2026-10-27. Le score Interop 2026 de Firefox sur ce domaine reste 70,1 % (contre 97,5 % Chrome, 96,5 % Safari). |
| F4 `animation-trigger` « Chrome 146+ » | Confirmé (Chrome 146, 2026-03-10). Rien chez Firefox ni Safari (y compris Safari 27.0–27.2). |
| F7 `element.startViewTransition()` « Chrome 147+ » | Confirmé (Chrome 147, 2026-04-07). Limited. |
| F8 `match-element` « Baseline » | Exact : fait partie de la fonctionnalité `view-transitions`, Baseline *newly* 2025-10-14 (Chrome 137, Firefox 144, Safari 18.4). Pas encore dans `defaults` sans exception (chrome 109, op_mob 80, samsung 29). |
| F10 `sibling-index()` « Chromium » | **Obsolète** : Firefox 154 et Safari 26.2 l'ont livré ; Baseline *newly* 2026-08-18. Manque Firefox ESR 153 et iOS 18. |
| F2 `interpolate-size` | Toujours Chromium seul. |
| F17 « `d` en CSS (partiel) » | Chrome + Firefox ; **Safari non** (parse sans effet selon BCD). |

## 3. Notes par fonctionnalité

### 3.1 Scroll-driven animations (`animation-timeline`, `scroll()`/`view()`, timelines nommées, `animation-range`, `timeline-scope`, `ScrollTimeline`/`ViewTimeline`)

- Chrome 115 (juillet 2023), Safari 26 (septembre 2025), Firefox 159 (27 octobre 2026). Avant 159, Firefox l'exposait derrière la préférence `layout.css.scroll-driven-animations.enabled` (nom cité de mémoire, non revérifié dans une source primaire) — aucune préférence n'apparaît plus dans BCD ni dans la page « Experimental features » de MDN, la fonctionnalité étant livrée.
- **Raccourci `animation`** : en Chrome, `animation:` *réinitialise* `animation-timeline` à `auto` mais ne peut pas le définir (BCD « reset-only ») ; Firefox et Safari ne le réinitialisent pas (BCD : non supporté). Conséquence pratique : l'ordre de déclaration `animation` puis `animation-timeline` compte dans Chrome, et le comportement d'un `animation:` posé après un `animation-timeline` diffère d'un moteur à l'autre. Pertinent pour l'ordre de génération des utilitaires Tailwind.
- `animation-range` : la plage nommée `scroll` est plus récente (Chrome 147, Safari 26.5, Firefox 159).
- Safari 27.2 corrige « `animation-range-start` et `animation-range-end` résolus incorrectement quand `zoom` est appliqué » ; Safari 27.0 corrige la sérialisation de `view-timeline-inset`. Un bug WebKit d'octobre 2026 signale qu'une keyframe `translate: none` est rendue avec le `translate` de base de l'élément depuis le chemin threadé des SDA introduit en Safari 26.4 (correctif committé, version de livraison non vérifiée).
- Interop 2026 (domaine « Scroll-driven animations », `animation-timeline`, `scroll-timeline`, `view-timeline`) au 2026-11-02 : Chrome 97,5 %, Edge 97,5 %, Firefox 70,1 %, Safari 96,5 %, score « interop » commun 67,8 % (il était de 9 % au 2026-01-01). Le score Firefox indique des écarts de conformité restants malgré la livraison.
- Le domaine Interop 2026 « Web compat » contient aussi « timing des événements scroll par rapport aux événements d'animation ».
- Implication neutre : un fallback reste nécessaire pour ≈ 3,9 % de l'usage `defaults` (Chrome 109, Firefox ESR 153 et 155–158, iOS 18), proportion qui diminue à mesure que ces entrées sortent de `defaults` (pour l'ESR : à son remplacement par l'ESR suivante).

### 3.2 `animation-trigger` / `timeline-trigger` (scroll-triggered animations)

- Chrome 146 (2026-03-10) : propriétés `timeline-trigger` (+ `-name`, `-source`, `-activation-range`, `-active-range`), `animation-trigger`, `trigger-scope`, interface JS `AnimationTrigger`. Spec : CSS Animation Triggers Level 1 (brouillon, `experimental: true` dans BCD).
- Aucun signal de livraison chez Firefox ni Safari (Safari 27.0/27.1/27.2 n'en parlent pas). Pas dans Interop 2026.
- Par défaut les noms de triggers sont globaux ; `trigger-scope` sert à les restreindre (note Chrome 146).
- Statut `experimental` dans BCD : la spec est un brouillon de travail et la syntaxe peut encore évoluer.

### 3.3 `@starting-style` et `transition-behavior: allow-discrete`

- `@starting-style` : Baseline *newly* 2024-08-06 (Chrome 117, Firefox 129, Safari 17.5). Focus area Interop 2024 (« starting-style-transition-behavior »).
- `transition-behavior` : la propriété est Baseline, **mais** Firefox ne sait toujours pas transitionner `display` ni `content-visibility` (BCD : non supporté ; bug Mozilla 1882408). Safari ne transitionne `display` qu'à partir de 18 (la propriété existe depuis 17.4).
- Conséquence : dans Firefox, l'**entrée** depuis `display:none` avec `@starting-style` s'anime (la transition part du style de départ), mais la **sortie** vers `display:none` est instantanée. La propriété `overlay` (garder un popover/dialog dans le top layer pendant la sortie) est Chromium seul.
- Safari 27.0 corrige « les transitions de `display` animaient incorrectement les popovers et `<dialog>` à la fermeture ».

### 3.4 `interpolate-size` et `calc-size()`

- Chromium seul depuis 129 (Chrome, Edge, Samsung 28, Opera). `experimental: true` dans BCD. Ni Firefox ni Safari, pas dans Interop 2026.
- `interpolate-size: allow-keywords` est hérité : posé sur `:root`, il active les transitions vers/depuis `auto`, `min-content`, `fit-content`… dans tout le document. `calc-size()` permet l'opération par élément et le calcul (`calc-size(auto, size + 2rem)`).
- Les navigateurs sans support ignorent la déclaration : la valeur change sans transition (dégradation silencieuse).

### 3.5 View Transitions same-document

- Baseline *newly* 2025-10-14 (Chrome 111, Firefox 144, Safari 18). Focus area Interop 2025 (same-document + `view-transition-class`) et Interop 2026 (améliorations same-document, `blocking="render"`, `<link rel="expect">`, `:active-view-transition-type()`, cross-document).
- Scores Interop 2026 « View transitions » au 2026-11-02 : Chrome 100 %, Edge 99,4 %, Firefox 79,8 %, Safari 99 %, commun 78,4 %. L'écart Firefox s'explique en grande partie par l'absence de cross-document.
- `types` / `:active-view-transition-type()` : Chrome 125, Safari 18.2, Firefox 147 → Baseline *newly* 2026-01-13.
- `ViewTransition.waitUntil()` : Chrome 144 seul.
- Une seule transition document-scopée à la fois : en démarrer une nouvelle saute la précédente (`skipTransition`). C'est précisément ce que lève la variante élément-scopée (Chrome 147).
- `view-transition-name` doit être unique dans le document au moment de la capture ; un doublon fait échouer la transition. `match-element` génère un nom implicite par identité d'élément, valable uniquement en same-document.
- Safari 27.0 corrige : snapshots stockés en sRGB (couleurs non-sRGB faussées), animation de groupe qui sautait à l'état final si une règle CSS était insérée pendant la transition, snapshots avec des valeurs de `transform` périmées pendant des animations de transform accélérées.

### 3.6 View Transitions cross-document (`@view-transition { navigation: auto }`)

- Chrome 126, Safari 18.2. Firefox : non (BCD). **Divergence de sources** : caniuse marque Firefox 144+ « partiel » avec la note « partiel = seulement View Transitions Level 1 », c'est-à-dire sans cross-document — les deux sources concordent donc sur le fond. Autre divergence : BCD donne Samsung Internet 28+ supporté, caniuse donne Samsung 29/30 non supportés.
- Same-origin uniquement. Événements `pageswap`/`pagereveal` : mêmes versions (Firefox non).
- Dans Interop 2026 : un support Firefox est l'objectif affiché de ce domaine, sans date publiée.
- Safari 27.0 corrige un `pagereveal` déclenché à tort démarrant une transition sortante.

### 3.7 `view-transition-class`

- Baseline *newly* 2025-10-14 (Chrome 125, Safari 18.2, Firefox 144). Interop 2025. Permet de styler plusieurs groupes par classe au lieu de cibler chaque nom.

### 3.8 `Element.startViewTransition()` (élément-scopé)

- Chrome 147 (2026-04-07) : « expose `element.startViewTransition()` sur des éléments HTML arbitraires ; l'élément établit un scope ; plusieurs transitions sur des éléments distincts peuvent tourner en parallèle ». S'accompagne de `Element.activeViewTransition`, `ViewTransition.transitionRoot` et de la propriété `view-transition-scope`.
- Limited (Chromium seul). Spec : CSS View Transitions Level 2 (brouillon). Absent d'Interop 2026.

### 3.9 `linear()` easing

- Baseline **widely** depuis le 2026-06-11. Seul `chrome 109` manque dans `defaults` (hors G0).
- `linear()` approxime une courbe par segments linéaires ; la fidélité d'un ressort dépend du nombre de points. Dans un navigateur sans support, toute la déclaration `transition`/`animation` qui la contient est invalide (et pas seulement l'easing), ce qui retombe sur la valeur précédente de la cascade.

### 3.10 `sibling-index()` / `sibling-count()`

- Chrome 138, Firefox 154, Safari 26.2 → Baseline *newly* 2026-08-18.
- Manquants dans `defaults` : chrome 109, Firefox ESR 153, iOS 18, op_mob 80, samsung 29.
- Safari 27.0 corrige : re-résolution dans `@keyframes` quand les frères changent, simplification dans `calc()`, valeur 0 en stylage cross-tree `::part()`. Les versions Safari 26.2–26.6 présentes dans `defaults` portent donc ces bugs.
- Comptent les éléments frères du DOM (pas les pseudo-éléments ni la position visuelle `order`/grid).

### 3.11 `@property` (propriétés personnalisées typées)

- Baseline *newly* 2024-07-09 (Firefox 128 dernier). Interop 2023, reconduit en 2024. Couvert par `defaults` hors G0.
- Permet de transitionner/animer une variable typée (`<number>`, `<integer>`, `<length>`, `<color>`, `<angle>`…). Une variable non enregistrée est interpolée de façon discrète (bascule à 50 %).
- Interpolation `<integer>` : interpolée comme un nombre puis arrondie à l'entier le plus proche (règle CSS Values) ; l'affichage d'un compteur passe par `counter-reset` + `counter()` dans `content`, donc par un pseudo-élément (texte non sélectionnable et non exposé de façon fiable aux technologies d'assistance).
- `@property` est évalué au niveau du document : une règle `@property` dans une shadow root n'est pas prise en compte (comportement conforme à la spec, source fréquente de confusion).
- `CSS.registerProperty` lève une exception si le nom est déjà enregistré ; `@property` en double : la dernière règle gagne.

### 3.12 `offset-path` / `offset-distance` (motion path)

- Baseline **widely** 2025-03-12 pour l'ensemble `motion-path` (Safari 16 dernier pour `offset-distance`/`path()`). Interop 2023.
- Les valeurs `ray()`, formes de base, `url()` et boîtes (`<coord-box>`) arrivent plus tard (Chrome 116, Firefox 122, Safari 16–18) → manque `chrome 109`.
- Safari 27.0 corrige « `offset-path` ne respectait pas `<coord-box>` lors du mélange de chemins `shape()` et `basic-shape` ».
- `shape()` (alternative responsive à `path()`) est un domaine Interop 2026 (`clip-path`, `shape-outside`).

### 3.13 Propriété CSS `d` (animation de tracé SVG)

- Chrome 52, Firefox 97. **Safari : non** — BCD : « la propriété est parsée mais n'a pas d'effet ». Les travaux WebKit (parsing livré en 2024 puis placé derrière un flag désactivé ; bug WebKit 275842) n'ont pas abouti à une livraison connue.
- **Point à confirmer** : les notes Safari 27.0 listent deux correctifs touchant `d` (« interpolation des drapeaux d'arc dans la propriété `d` », « `getTotalLength()` et API associées respectent la propriété CSS `d` »). Cela peut concerner l'implémentation derrière flag ; BCD 8.1.8 (2026-11-02) maintient « non supporté ». Non vérifié en navigateur.
- Le morphing via `d` exige que les deux chemins aient la même structure de commandes ; sinon l'interpolation est discrète.
- Alternative native ancienne : SMIL (`<animate attributeName="d">`), Baseline widely ; Safari 27.0 a fait une « revue de bout en bout du moteur SMIL » avec de nombreux correctifs.

### 3.14 Transformations individuelles (`translate`, `scale`, `rotate`)

- Baseline widely 2025-02-05 (Chrome 104 dernier). Couvert par `defaults`.
- Ordre d'application fixe : `translate` → `rotate` → `scale` → puis `transform`. Elles se composent avec `transform` au lieu de le remplacer, ce qui permet d'animer chaque axe indépendamment.

### 3.15 Web Animations API

- Socle (`Element.animate`, `getAnimations`, `Animation.currentTime/finished/commitStyles/persist/replaceState`, `CSSAnimation`, `CSSTransition`) : Baseline widely 2023-03-16, couvert par `defaults`. Safari 13.1–13.x implémentait une ancienne version de `document.getAnimations()` (complet en 14).
- `CSSAnimation`/`CSSTransition` sont renvoyés par `getAnimations()` ; leur `currentTime` est modifiable. Interaction spec (CSS Animations 2) : un appel `pause()`/`play()` via l'API prend le pas sur `animation-play-state` jusqu'au prochain changement de cette propriété ; changer `animation-name` crée une nouvelle `CSSAnimation`. (Détails et pièges : R4.)
- Remplacement automatique des animations `fill: forwards` (« auto-remove ») : sans `persist()`/`commitStyles()`, des animations remplies peuvent être retirées.
- `Animation.overallProgress` : Chrome 133, Firefox 142, Safari 26.2.
- `AnimationEvent.animation`/`TransitionEvent.animation` : Baseline *newly* 2026-09-14 (Safari 27 dernier).
- `.pseudoTarget` sur `AnimationEvent`/`TransitionEvent` : Chrome 147 (note de version).
- `animation-composition` : Baseline widely 2026-01-04.

### 3.16 Long Animation Frames API

- Chromium 123+ seul ; `experimental: true` ; pas dans Interop. Toute mesure LoAF est donc Chromium-only (outillage de mesure, pas une dépendance runtime).

### 3.17 `prefers-reduced-motion`

- Baseline widely 2022-07-15. Couvert par `defaults` hors G0 (Opera Mini : non).
- `scroll-behavior: smooth` et `scrollIntoView({behavior:'smooth'})` ne sont pas automatiquement neutralisés par `prefers-reduced-motion` dans tous les navigateurs ; ce n'est pas une garantie de la spec.
- En-tête client hint `Sec-CH-Prefers-Reduced-Motion` : Chromium seul.

### 3.18 `scroll-behavior` et API de scroll

- `scroll-behavior` : Baseline widely 2024-09-14. La durée et la courbe du défilement doux ne sont pas configurables en CSS et diffèrent selon le moteur.
- `scrollend` : Baseline *newly* 2025-12-12 (Safari 26.2 dernier) ; Interop 2025. Manque iOS 18 et Chrome 109.
- Promesses sur les méthodes de scroll (`scroll-promises`) : Chrome 150 seul. `scrollIntoView({container})` : Chrome 140 seul.
- Scroll snap : domaine Interop 2026. Safari 27.0 contient une trentaine de correctifs de défilement (scroll anchoring désormais actif, `scrollTo` pendant le momentum, `scrollend` émis à la mauvaise position lors d'un nouveau `scrollTo`…).

### 3.19 IntersectionObserver v2 (pertinence : déclenchement à la vue F4, visibilité réelle)

- v1 : Baseline widely 2021-09-25. `scrollMargin` (observer dans des conteneurs défilants imbriqués) : Chrome 120, Firefox 141, Safari 26.
- v2 (`trackVisibility`, `delay`, `isVisible`) : Chromium 74+ seul ; caniuse statut « unofficial ». Pas de signal Firefox/Safari.
- Safari 27.0 corrige un ralentissement O(n²) avec beaucoup de cibles observées et des bornes incorrectes pour les cibles SVG.

### 3.20 `content-visibility` (pertinence : coût des animations hors écran)

- Baseline *newly* 2025-09-15. `content-visibility: auto` complet dans Safari 26 seulement (18–25 : le contenu sauté n'est pas trouvable par « Rechercher dans la page »).
- Les animations à l'intérieur d'un sous-arbre sauté ne sont pas rendues ; l'événement `contentvisibilityautostatechange` (Baseline, couvert) signale les bascules.
- Transition de `content-visibility` via `allow-discrete` : Chrome 117, Safari 18, pas Firefox (comme `display`).

## 4. Interop — récapitulatif

| Programme | Domaines pertinents pour Motion |
|---|---|
| Interop 2023 | Motion path (`offset-*`), `@property` |
| Interop 2024 | `@starting-style` + `transition-behavior`, `@property` (reconduit), popover |
| Interop 2025 | View Transition API (same-document + `view-transition-class`), `scrollend` |
| Interop 2026 (20 domaines) | **Scroll-driven animations**, **View transitions** (same-doc, cross-doc, `:active-view-transition-type()`, `blocking="render"`, `<link rel="expect">`), Scroll snap, `shape()`, Web compat (timing scroll/animation), Dialogs & popovers, Anchor positioning |
| Absents de tout Interop | `animation-trigger`, `interpolate-size`/`calc-size()`, élément-scopé VT, `match-element`, `sibling-index()`, `linear()`, `d`, LoAF, IO v2 |

Remarque sur les sources : l'annonce d'Igalia mentionne « 19 domaines + 3 de nettoyage + 4 investigations » tandis que web.dev, WebKit, Microsoft et le fichier `interop-data.json` de wpt.fyi listent **20** domaines actifs et 4 investigations ; ce rapport suit le fichier wpt.fyi.

## 5. Sources

Données (paquets npm, interrogés le 2026-11-03) :
- https://github.com/mdn/browser-compat-data (`@mdn/browser-compat-data` 8.1.8)
- https://github.com/web-platform-dx/web-features (`web-features` 3.45.0) — explorer : https://web-platform-dx.github.io/web-features-explorer/
- https://github.com/browserslist/caniuse-lite (1.0.30001820) et https://github.com/browserslist/browserslist (4.29.5)
- https://github.com/Fyrd/caniuse/blob/main/features-json/cross-document-view-transitions.json

Pages de référence par fonctionnalité :
- https://developer.mozilla.org/docs/Web/CSS/animation-timeline
- https://developer.mozilla.org/docs/Web/CSS/animation-range
- https://developer.mozilla.org/docs/Web/CSS/@starting-style
- https://developer.mozilla.org/docs/Web/CSS/transition-behavior
- https://developer.mozilla.org/docs/Web/CSS/interpolate-size
- https://developer.mozilla.org/docs/Web/CSS/calc-size
- https://developer.mozilla.org/docs/Web/API/View_Transition_API
- https://developer.mozilla.org/docs/Web/CSS/@view-transition
- https://developer.mozilla.org/docs/Web/CSS/view-transition-class
- https://developer.mozilla.org/docs/Web/CSS/easing-function/linear
- https://developer.mozilla.org/docs/Web/CSS/sibling-index
- https://developer.mozilla.org/docs/Web/CSS/@property
- https://developer.mozilla.org/docs/Web/CSS/offset-path
- https://developer.mozilla.org/docs/Web/CSS/d
- https://developer.mozilla.org/docs/Web/API/Web_Animations_API
- https://developer.mozilla.org/docs/Web/API/PerformanceLongAnimationFrameTiming
- https://caniuse.com/view-transitions — https://caniuse.com/cross-document-view-transitions — https://caniuse.com/intersectionobserver-v2 — https://caniuse.com/css-motion-paths
- https://web.dev/baseline

Notes de version :
- https://developer.chrome.com/release-notes/146 (scroll-triggered animations, `trigger-scope`, 2026-03-10)
- https://developer.chrome.com/release-notes/147 (élément-scopé VT, plage `scroll`, `pseudoTarget`, 2026-04-07)
- https://groups.google.com/a/chromium.org/g/blink-dev/c/TZLFLjzt4II (Intent to Ship : Scroll Triggered Animations)
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159 (scroll-driven animations activées, bug 1324602)
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features
- https://bugzil.la/1882408 (Firefox : transition de `display`)
- https://webkit.org/blog/18325/webkit-features-for-safari-27-0/ (2026-09-17)
- https://webkit.org/blog/18486/webkit-features-for-safari-27-1/ (2026-10-23)
- https://webkit.org/blog/18515/webkit-features-for-safari-27-2/ (2026-10-26)
- https://bugs.webkit.org/show_bug.cgi?id=275842 (propriété `d`)
- https://bugs.webkit.org/show_bug.cgi?id=327193 (SDA / `translate: none`, Safari 27)

Interop :
- https://web.dev/blog/interop-2026 — https://web.dev/blog/interop-2025
- https://wpt.fyi/interop-2026 — données : https://wpt.fyi/static/interop-data.json et https://raw.githubusercontent.com/web-platform-tests/results-analysis/gh-pages/data/interop-2026/interop-2026-stable-v2.csv
- https://blogs.windows.com/msedgedev/2026/02/12/microsoft-edge-and-interop-2026/
- https://igalia.com/news/interop-2026.html
- https://hacks.mozilla.org/?p=48246 (Launching Interop 2026)
