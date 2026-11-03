# R3 — Sémantique exacte de `scroll()`, `view()`, `animation-range` et `animation-trigger`

> Travail **R3** du §7 de `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`
> (familles F4 / F5, principe §4.7 « fidélité par construction »).
> **Ce document ne prend aucune décision de design.** Il décrit ce que font la
> spec et les navigateurs, et donne un algorithme de référence pour calculer la
> progression d'une plage. Le choix de mécanisme pour le fallback relève de S1.
>
> Rédigé le 2026-11-03 à partir des Editor's Drafts du jour : Scroll-driven
> Animations 1 (ED du 25 septembre 2026), CSS Animations 2, Web Animations 1 et 2,
> Animation Triggers 1 (ED du 16 octobre 2026). Sources complémentaires : tests
> WPT (`scroll-animations/**`), issues csswg-drafts, polyfill
> `flackr/scroll-timeline`. **Aucun test n'a été exécuté dans un navigateur.**
> Les points marqués ⚠️ sont à mesurer en S1.
>
> Les supports navigateur sont la matière de R1
> (`docs/motion/research/R1-native-support.md`) ; le pilotage de `CSSAnimation`
> est approfondi dans R4 (`docs/motion/research/R4-fallback-fidelity.md`). Ce
> rapport n'y renvoie que là où la sémantique en dépend.

Légende : ✅ normatif et confirmé par un WPT · 📄 normatif sans WPT vu · ⚠️ ambigu,
divergent ou à mesurer · 🆕 changé récemment dans la spec (risque que les
implémentations soient en retard).

---

## 0. Specs de référence (liens directs)

| Sujet | Lien |
|---|---|
| Progression d'une scroll timeline | https://drafts.csswg.org/scroll-animations-1/#scroll-timeline-progress |
| `scroll()` | https://drafts.csswg.org/scroll-animations-1/#scroll-notation |
| `ScrollTimeline` | https://drafts.csswg.org/scroll-animations-1/#scrolltimeline-interface |
| Plages nommées de `view()` | https://drafts.csswg.org/scroll-animations-1/#view-timelines-ranges |
| Progression d'une view timeline | https://drafts.csswg.org/scroll-animations-1/#view-timeline-progress |
| `view()` | https://drafts.csswg.org/scroll-animations-1/#view-notation |
| `ViewTimeline` | https://drafts.csswg.org/scroll-animations-1/#viewtimeline-interface |
| `view-timeline-inset` | https://drafts.csswg.org/scroll-animations-1/#view-timeline-inset |
| Plage finie, durée `auto` | https://drafts.csswg.org/scroll-animations-1/#finite-attachment |
| Portée et résolution des noms | https://drafts.csswg.org/scroll-animations-1/#timeline-scoping |
| Événements | https://drafts.csswg.org/scroll-animations-1/#events |
| Boucle d'événements, timelines « stale » | https://drafts.csswg.org/scroll-animations-1/#event-loop |
| Plages nommées dans `@keyframes` | https://drafts.csswg.org/scroll-animations-1/#named-range-keyframes |
| `animation-range(-start/-end)` | https://drafts.csswg.org/scroll-animations-1/#named-range-animation-declaration |
| `timeline-scope` | https://drafts.csswg.org/scroll-animations-1/#timeline-scope |
| `animation-duration: auto` | https://drafts.csswg.org/css-animations-2/#animation-duration |
| `animation-timeline` | https://drafts.csswg.org/css-animations-2/#animation-timeline |
| Précédence de l'API JS sur le CSS | https://drafts.csswg.org/css-animations-2/#animations |
| Timeline progress-based, min/max | https://drafts.csswg.org/web-animations-2/#timelines |
| Conversion temps → proportions | https://drafts.csswg.org/web-animations-2/#time-based-animation-to-a-proportional-animation |
| Validation `CSSNumberish` | https://drafts.csswg.org/web-animations-2/#validate-a-cssnumberish-time |
| Start time auto-aligné | https://drafts.csswg.org/web-animations-2/#animation-calculating-an-auto-aligned-start-time |
| Durée d'itération intrinsèque | https://drafts.csswg.org/web-animations-2/#intrinsic-iteration-duration |
| `at timeline boundary` | https://drafts.csswg.org/web-animations-2/#at-timeline-boundary |
| Phases (before/active/after) | https://drafts.csswg.org/web-animations-1/#animation-effect-phases-and-states |
| Remplissage (fill) | https://drafts.csswg.org/web-animations-1/#fill-behavior |
| Active time → progression | https://drafts.csswg.org/web-animations-1/#calculating-the-active-time, `#calculating-the-simple-iteration-progress`, `#calculating-the-directed-progress`, `#calculating-the-transformed-progress` |
| Animations « relevant » (`getAnimations`) | https://drafts.csswg.org/web-animations-1/#relevant-animations-section |
| Triggers (concept, état) | https://drafts.csswg.org/animation-triggers-1/#triggers, `#trigger-internal-state` |
| Timeline triggers, plages | https://drafts.csswg.org/animation-triggers-1/#timeline-trigger-ranges |
| `animation-trigger`, actions | https://drafts.csswg.org/animation-triggers-1/#animation-trigger-shorthand |
| `AnimationTrigger` (IDL) | https://drafts.csswg.org/animation-triggers-1/#the-animationtrigger-interface |

---

## 1. `scroll()` — Scroll Progress Timeline

### 1.1 Syntaxe et valeurs par défaut 📄

`scroll( [ <scroller> || <axis> ]? )`, `<scroller> = root | nearest | self`,
`<axis> = block | inline | x | y`. Défauts : `nearest`, `block`. `scroll()`,
`scroll(block)`, `scroll(nearest)`, `scroll(block nearest)` sont équivalents.
Chaque occurrence de `scroll()` crée sa propre instance de `ScrollTimeline`,
même si deux éléments visent le même scroller avec les mêmes arguments.

### 1.2 Résolution du scroller

- **`nearest`** : le plus proche *ancêtre* scroll container « avec un axe
  défilable approprié ». Détails établis par les WPT :
  - ✅ un ancêtre en `overflow-x: clip; overflow-y: scroll` est sauté pour un
    axe `inline`/`x` ; la recherche remonte jusqu'à la racine, qui sert de repli
    (`scroll-timelines/scroll-timeline-source-single-axis-inactive.html` : la
    source devient `document.documentElement`, et la timeline est inactive si la
    racine ne défile pas non plus dans cet axe) ;
  - ✅ `overflow: hidden` **est** un scroll container (défilable par script)
    (`scroll-timelines/animation-with-overflow-hidden.html`) ; `visible` et
    `clip` n'en sont pas ;
  - ✅ la remontée suit la **chaîne des blocs conteneurs**, pas l'arbre DOM : un
    élément `position: absolute` dont le bloc conteneur est hors d'un scroller ne
    dépend pas de ce scroller (`css/scroll-timeline-nearest-with-absolute-positioned-element.html`,
    `view-timelines/view-timeline-abspos-containing-block-outside-scroller.tentative.html`).
- **`root`** : le viewport du document. Les références à l'élément racine se
  propagent au viewport (en quirks mode, `body` peut être le `scrollingElement` :
  `css/scroll-timeline-document-scroller-quirks.html`).
- **`self`** : la boîte principale de l'élément lui-même. Si elle n'est pas un
  scroll container dans l'axe demandé → timeline **inactive**.
- L'arbre utilisé est l'arbre aplati (shadow DOM / slots).

### 1.3 Axe et origine

`block`/`inline` sont résolus dans le **writing-mode du scroller** (pas de
l'élément animé) : en `horizontal-tb`, block = y ; dans tous les modes
verticaux, block = x. La progression est mesurée **depuis l'origine de
défilement** (*scroll origin*), qui peut basculer selon le writing-mode et la
direction, **même quand `x` ou `y` est explicite** (note de §2.2.1).
Conséquence pratique : en `direction: rtl` ou `writing-mode: vertical-rl`,
`scrollLeft` vaut 0 à l'origine (bord droit) et devient négatif ; la position
utile est `-scrollLeft` (`scroll-timelines/current-time-writing-modes.html`,
`css/scroll-timeline-axis-writing-mode.html`).

⚠️ La spec signale elle-même (issue inline de §2.2.2) que 0 % peut ne pas être
la position initiale selon la *content-distribution* (`justify-content`,
`flex-direction: column-reverse`…), et qu'il n'est pas dit si `currentTime` peut
sortir de [0 %, 100 %]. À mesurer en S1 pour `column-reverse` (où `scrollTop`
est dans [-max, 0] dans les moteurs actuels).

### 1.4 Calcul de la progression ✅

```
progress = scrollOffset / (scrollableOverflowSize − scrollContainerSize)
```

soit, côté DOM, `offset / (scrollHeight − clientHeight)` (ou largeur). La taille
du scroll container est celle du **scrollport** (boîte de padding moins les barres
de défilement), c'est-à-dire `clientWidth/clientHeight`.

### 1.5 Timeline inactive ✅

Inactive (← `currentTime === null`) si l'une de ces conditions est vraie :

- dénominateur nul (pas de plage de défilement) — `css/scroll-timeline-inactive.html` ;
- la source n'a pas de boîte (`display: none`) — WPT `scroll-timeline-source-single-axis-inactive.html` ;
- la source n'est pas un scroll container dans l'axe (cas `self`, ou repli racine
  non défilable) ;
- média paginé (impression) pour les timelines qui visent le viewport.

**Effet d'une timeline inactive** : l'animation n'a pas de temps courant, donc
**aucun effet, même avec `fill: both`** (`css/scroll-timeline-inactive.html` :
la largeur reste la valeur de base). Une timeline peut devenir inactive
dynamiquement (contenu qui rétrécit) ; l'effet disparaît au frame suivant.

### 1.6 Échantillonnage 📄

§5.1 : les scroll timelines mettent à jour leur temps une fois par frame, à
l'étape « update animations and send events » ; les timelines créées ou dont
les plages ont changé pendant le frame sont recalculées après le layout, avec
un tour de style/layout supplémentaire pour éviter un flash initial. Ce tour
supplémentaire ne s'applique pas aux lectures forcées (`getComputedStyle`) :
juste après création, une timeline est vue « stale » par `getComputedStyle`
(`css/scroll-timeline-inactive.html`, 2e test : la valeur reste figée jusqu'au
frame suivant). Les UA qui défilent de façon asynchrone peuvent échantillonner
sur le compositeur, donc l'état rendu et `scrollTop` peuvent diverger d'un frame.

---

## 2. `view()` — View Progress Timeline

### 2.1 Syntaxe, sujet, source

`view( [ <axis> || <'view-timeline-inset'> ]? )`. Défauts : `block`, inset
`auto`. Le **sujet** est l'élément qui porte l'animation (pour `view()`) ou
l'élément qui déclare `view-timeline-name` (pour une timeline nommée). La
**source** est le plus proche ancêtre scroll container **défilable dans l'axe**
(même résolution que `scroll(nearest)`, voir 1.2 ; WPT
`view-timeline-source-single-axis-{inner,outer}.html`). Pas d'argument
`<scroller>` dans `view()`. Chaque `view()` crée sa propre `ViewTimeline`.

### 2.2 Zone de visibilité (`view-timeline-inset`) ✅

La *view progress visibility range* est le scrollport réduit de deux insets,
exprimés dans l'axe de la timeline et résolus dans le writing-mode du scroller :

- une valeur → les deux côtés ; deux valeurs → `start end` ;
- `auto` = la valeur de `scroll-padding` du scroller du côté correspondant
  (`view-timelines/view-timeline-snapport.html`, `view-timeline-inset.html` :
  `scroll-padding-inline: 10px 20px` → plage [620, 890] au lieu de [600, 900]) ;
- `<length-percentage>` : retrait vers l'intérieur ; **pourcentages relatifs à
  la taille du scrollport** dans l'axe (WPT : scrollport 200 px, `10%` = 20 px) ;
- valeurs négatives = élargissement (*outset*).
- Constructeur JS : chaîne parsée comme `<'view-timeline-inset'>` ou séquence de
  1–2 `CSSNumericValue`/`CSSKeywordValue('auto')`, sinon `TypeError`.
  🆕⚠️ Les unités relatives (`em`, `vw`) dans la chaîne passée au constructeur
  sont refusées par un WPT récent, en attente d'une résolution
  ([csswg-drafts#13852](https://github.com/w3c/csswg-drafts/issues/13852), ouverte).

### 2.3 Plages nommées ✅

Notation (toutes en **offsets de défilement**, origine = scroll origin, axe de
la timeline) :

- `V` = taille du scrollport, `Is`/`Ie` = insets de début/fin résolus ;
- `P` = position du **bord de début de la border-box** du sujet dans le
  contenu défilant (distance depuis l'origine, au défilement 0) ;
- `Z` = taille de la border-box du sujet dans l'axe.

| Plage | 0 % | 100 % |
|---|---|---|
| `cover` | `coverStart = P − (V − Ie)` (bord de début du sujet sur le bord de fin de la zone) | `coverEnd = P + Z − Is` (bord de fin du sujet sur le bord de début) |
| `contain` | `min(A, B)` | `max(A, B)` |
| `entry` | `coverStart` | `containStart` |
| `exit` | `containEnd` | `coverEnd` |
| `entry-crossing` | `coverStart` | `B` |
| `exit-crossing` | `A` | `coverEnd` |
| `scroll` 🆕 | position de défilement minimale | position maximale |

avec `A = P − Is` (bord de début du sujet sur le bord de début de la zone) et
`B = P + Z − (V − Ie)` (bord de fin du sujet sur le bord de fin de la zone).

- **Sujet plus petit que la zone** (`Z < V − Is − Ie`) : `B < A`, donc
  `contain = [B, A]` (sujet entièrement visible), `entry-crossing = entry`,
  `exit-crossing = exit`.
- **Sujet plus grand** (`Z > V − Is − Ie`) : `A < B`, `contain = [A, B]` = la
  période où le sujet **recouvre** toute la zone (le « contain inversé »).
  `entry` se termine quand le bord de début du sujet atteint le bord de *début*
  de la zone, `entry-crossing` quand son bord de fin atteint le bord de *fin*.
  Vérifié par `view-timelines/view-timeline-range-large-subject.html` (scrollport
  200, sujet 400 en x=800 : cover [600,1200], contain [800,1000], entry [600,800],
  entry-crossing [600,1000], exit [1000,1200], exit-crossing [800,1200]).
- **Sujet de même taille** que la zone : `A = B`, `contain` est de longueur
  nulle (plage dégénérée, voir 3.5).
- La plage `scroll` (« toute la plage du scroller sous-jacent ») est récente
  (R1 : Chrome 147, Safari 26.5, Firefox 159).
- Le writing-mode qui définit « début » et « fin » est celui du **scroller**.
- `animation-range: normal` ≡ `cover 0%` → `cover 100%` pour une view timeline
  (`css/animation-range-normal-matches-cover.html`).

Rappel (note de §3) : 0 % et 100 % ne sont pas toujours atteignables (sujet en
haut de page : `coverStart` < 0, la progression au défilement 0 est > 0).

### 2.4 Progression d'une view timeline ✅

```
timelineProgress = (scrollOffset − coverStart) / (coverEnd − coverStart)
```

Inactive si le dénominateur est nul, si sujet ou source n'ont pas de boîte, ou
si la source « n'a pas d'overflow défilable ou n'est pas défilable dans l'axe »,
ou en média paginé.

⚠️ « n'a pas d'overflow défilable » est ambigu : le WPT non tentatif
`view-timelines/contain-alignment.html` attend des progressions 0 / 0,5 / 1 pour
des sujets dans un `overflow: auto` **qui ne déborde pas** (la timeline y est
donc active, sa position courante restant fixe). Gecko échoue ce test (bug
Mozilla 2047776, cité dans
[csswg-drafts#12134](https://github.com/w3c/csswg-drafts/issues/12134)).

### 2.5 Positionnement : transform, relatif, absolu, sticky

Texte normatif (§3.1) : « *Transforms are ignored, but relative and absolute
positioning are accounted for.* » Note : pour les boîtes **sticky**, une
condition 0 % / 100 % peut être vraie sur un intervalle de positions ; chaque
borne précise donc s'il faut prendre la position la plus tôt (*earliest*) ou la
plus tardive (*latest*).

- **Transform** : ignoré sur le sujet ✅
  (`css/view-timeline-with-transform-on-subject.html` : le sujet animé en
  `scaleX` + `translateY(50vh)` garde les bornes de sa boîte non transformée) et
  sur les ancêtres intermédiaires ✅ (`view-timelines/intermediate-transform.html` :
  `translate: 50px` sur un ancêtre ne change pas `startOffset`/`endOffset`).
  Concerne aussi `translate`/`scale`/`rotate` individuels.
  ⇒ `getBoundingClientRect()` **ne convient pas tel quel** dès qu'un transform
  existe sur le sujet ou entre le sujet et la source : il renvoie la boîte
  transformée. C'est le cas typique des animations d'entrée (`translateY`), où
  le sujet anime justement son propre transform.
- **Relatif / absolu** : pris en compte (`view-timeline-relative-subject.html`,
  `view-timeline-relative-ancestor.html`, `view-timeline-abspos-subject.html`).
- **Sticky** ✅ : la position **réellement collée** est prise en compte, avec la
  règle earliest/latest. `view-timelines/view-timeline-sticky-block.html` :
  scroller 500 px, sujet sticky `top: 0; bottom: 0` de 50 px dans un bloc
  conteneur [500, 1000] → cover [0, 1000], contain [50, 950], entry [0, 50],
  exit [950, 1000] — très différent du calcul sans sticky (cover [200, 750]).
  Variantes testées : sujet sticky en inline, ancêtre sticky
  (`view-timeline-sticky-inline-ancestor.html`), ajustement sous-pixel
  (`view-timeline-sticky-subpixel-adjustment.html`).
- **Fixed** : rien de spécifique dans la spec ; ⚠️ non couvert ici.
- **Inline / SVG** : les WPT `inline-subject.html`, `svg-graphics-element-00{1,2,3}.html`
  couvrent les sujets inline (boîte principale fragmentée) et SVG ; ⚠️ non
  détaillés dans ce rapport.
- **CSS `zoom`** : `scroll-timeline-range-with-zoom.html`,
  `animation-trigger-calc-with-zoom.tentative.html` ; ⚠️ à mesurer si le zoom
  est en jeu.

---

## 3. De la plage à la progression de l'effet

### 3.1 `animation-range-start` / `-end` ✅

Valeurs : `normal | <length-percentage> | <timeline-range-name> <length-percentage>?`.

- `normal` : début (resp. fin) de la timeline (= `cover` pour `view()`, toute
  la plage de défilement pour `scroll()`).
- `<length-percentage>` seul : mesuré **depuis le début de la timeline**, les
  pourcentages étant relatifs à la timeline entière.
- `<nom> <length-percentage>` : mesuré **depuis le début de la plage nommée**,
  pourcentages relatifs à **la longueur de cette plage** ; pourcentage omis =
  `0%` pour `-start`, `100%` pour `-end`.
- Les longueurs sont des **px de défilement** ajoutés à l'origine choisie :
  `entry 100px` = `entryStart + 100px` ; `calc(100% - 100px)` mélange les deux.
  Les pourcentages peuvent sortir de [0, 100] (extrapolation) :
  `contain -50%` et `entry 200%` sont valides (WPT large-subject : 700 et 1000).
- Raccourci `animation-range` : si la fin est omise et que le début a un nom,
  la fin = même nom à 100 % (`animation-range: entry` = `entry 0% entry 100%`) ;
  sinon la fin omise vaut `normal` (`animation-range: 10%` = `10% normal`).
- `animation-range` *peut élargir* la plage d'attache comme la restreindre.
- Sur une `scroll()` : `10px 80px` sur une plage de 100 px → `startTime` 10 %,
  durée 70 % (`css/animation-range-scroll-timeline.html`).
  ⚠️ Effet d'un **nom de plage de view timeline** (`entry`…) sur une scroll
  timeline : non trouvé dans la spec ni dans les WPT lus ; à mesurer.
- Les longhands `animation-range-*` sont des sous-propriétés **reset-only** du
  raccourci `animation`.

### 3.2 Mapping vers le modèle Web Animations ✅

Une timeline de scroll est *progress-based* : durée de timeline = 100 %, temps
exprimés en pourcentages. Pour un sujet donné :

```
T(s)        = (s − C0) / (C1 − C0) × 100 %        // C = cover (view) ou [min,max] (scroll)
startTime   = T(rangeStart)                       // start time auto-aligné
currentTime = T(s) − startTime                    // en % de la timeline, PAS de la plage
duration    = T(rangeEnd) − T(rangeStart)         // en % (getComputedTiming().duration)
```

Démonstration WPT : `css/animation-range-ignored.html` (durée effective =
`(range end − range start) / (cover 100 % − cover 0 %) × 100 %`). Le *start time*
est **auto-aligné** (WA2 §2.3.7.1) : recalculé à chaque mise à jour de la
timeline tant qu'aucun script n'a fixé `startTime`/`currentTime` ; il vaut le
début de la plage si `playbackRate ≥ 0`, la fin sinon. Le sens du défilement
**ne change pas** `playbackRate` : l'animation reste en direction « forwards »
quand on remonte la page.

### 3.3 `animation-duration: auto` et les délais

- CSS Animations 2 : `auto` = pour une animation scroll-driven, « la durée
  nécessaire pour remplir la timeline compte tenu de `animation-range`,
  `animation-delay` et `animation-iteration-count` » ; pour une animation
  temporelle, `auto` = `0s`. **Une `<time>` explicite sur une animation
  scroll-driven est « traitée comme `auto` »** 📄. La valeur résolue de
  `animation-duration: auto` est `0s` lorsque `animation-timeline` vaut `auto`
  (rétro-compatibilité ; `css/animation-duration-auto.tentative.html`).
- Scroll-driven 1 §4.1 : durée utilisée = plage restante ÷ `iteration-count`.
  Avec `iteration-count: infinite`, durée d'itération **et** durée active = 0
  (l'animation dégénère).
- WA2 §2.3 (« normalize specified timing ») : si la durée d'itération est
  `auto`, les délais de début et de fin sont **mis à 0** (on ne mélange pas
  temps et proportions). Conséquence : en CSS, un `animation-delay` en secondes
  est **sans effet** sur une animation scroll-driven 📄. ⚠️ Ce que font
  réellement les moteurs avec `animation: x 1s 0.5s` + `animation-timeline` est
  à mesurer en S1 (MDN rapporte qu'une durée en secondes « semble pousser
  l'animation vers la fin » sur `view()` ; non vérifié).
- API JS : une durée en ms est **convertie en proportions** de la plage
  (`duration: 700, delay: 100, endDelay: 200` → 70 % / 10 % / 20 % ;
  `scroll-timelines/intrinsic-iteration-duration.tentative.html`). Des délais en
  pourcentage (`CSS.percent(20)`) sont acceptés par `updateTiming` (tentative) et
  sont **relatifs à la plage d'attache** : avec un délai de 20 % au milieu de la
  plage, progression = (50 − 20) / 80 = 0,375
  (`css/view-timeline-with-delay-and-range.tentative.html`,
  `css/scroll-timeline-with-percent-delay.tentative.html`). Un total de délais
  ≥ 100 % rend l'effet inactif.
- Le brouillon CSS Animations 2 scinde `animation-delay` en
  `animation-delay-start` / `animation-delay-end` ; ⚠️ non vu dans les
  implémentations.

### 3.4 Phases, remplissage, bornes ✅

Le calcul est celui de Web Animations 1 (§4.6–4.8), dans l'unité « % ». Avec
`L` = temps local, `AD` = durée active, `EE` = fin de l'effet :

- **phase before** si `L < before-active boundary` (ou `L` égal et
  `playbackRate < 0`, hors *timeline boundary*) ;
- **phase after** si `L > active-after boundary`, **ou `L` égal avec
  `playbackRate ≥ 0` et pas « at timeline boundary »** ;
- sinon phase active. Autrement dit : **début inclusif, fin exclusive**, sauf
  au bord physique du défilement.
- **`fill`** : `auto` = `none` (`getComputedTiming().fill === "none"`). Hors de
  la phase active, `none` = pas d'effet (valeur de base), `backwards` montre la
  1re image avant, `forwards` la dernière après, `both` les deux. Matrice
  vérifiée par `scroll-timelines/scroll-animation-effect-fill-modes.tentative.html`
  (avec `fill: none` à la fin exacte de la plage, la valeur **n'est pas**
  appliquée).
- 🆕 **`at timeline boundary`** (WA2, réécrit par
  [PR #13819](https://github.com/w3c/csswg-drafts/pull/13819), fusionnée le
  2026-08-24, suite à
  [#12134](https://github.com/w3c/csswg-drafts/issues/12134)) : vrai si le
  temps courant de la timeline est égal à son **minimum ou maximum** (position
  de défilement min ou max). Dans ce cas la fin redevient inclusive : une
  animation dont la plage finit exactement au défilement max reste appliquée à
  100 % sans `fill`. Les ancres de WA1 parlent aussi d'un drapeau
  *endpoint-inclusive active interval*. Implémentations : voir §7.
- `direction`, `iteration-count`, `iteration-start` : formules WA1 inchangées
  (`#calculating-the-current-iteration`, `#calculating-the-directed-progress`).
  À une frontière d'itération exacte, la progression est 0 de l'itération
  suivante, sauf à la fin de l'intervalle actif (1).
- **Easing** : pour une `CSSAnimation`, `animation-timing-function` s'applique
  **par intervalle de keyframes** ; l'easing de l'effet est `linear`. La
  progression « transformée » de l'effet est donc la progression directe.

### 3.5 Plages dégénérées ou inversées

- **Longueur nulle** (`contain 50% contain 50%`, ou sujet de la taille de la
  zone pour `contain`) : durée active 0 ; les règles WA1 des durées nulles
  s'appliquent (progression 0 avant, `iteration-count` après).
  `css/timeline-offset-keyframes-zero-length-attachment-range.html` vérifie
  l'absence d'offsets infinis dans `getKeyframes()`.
- **Plage inversée** (`animation-range: exit entry`) : ⚠️ le comportement n'est
  pas explicité ; la durée intrinsèque négative est vraisemblablement ramenée à
  0. À mesurer.

### 3.6 Keyframes positionnées sur une plage 📄

`@keyframes { entry 0% {…} exit 100% {…} }` attache des keyframes à des points
absolus de la timeline (§A « Named Timeline Range Keyframe Selectors ») ; on
suppose `iteration-count = 1` pour les placer, puis l'animation est mise à
l'échelle de la durée d'itération. Si la timeline n'a pas la plage nommée, ces
keyframes sont ignorées. Les keyframes hors de la plage d'attache servent à
l'interpolation mais tombent hors de l'intervalle actif. `getKeyframes()` les
renvoie avec `offset = { rangeName, offset }` et un `computedOffset`.
Conséquence pour un moteur sans support : ces sélecteurs sont **invalides**, et
la règle de keyframe entière est ignorée par le parseur.

### 3.7 Timelines nommées et `timeline-scope`

- `scroll-timeline: --nom [axe]` (sur le scroller), `view-timeline: --nom [axe]
  [inset]` (sur le sujet). Noms en `<dashed-ident>`. Listes coordonnées : un
  élément peut déclarer plusieurs timelines.
- Conflit de noms sur un même élément : la dernière déclaration de la liste
  l'emporte, et **la scroll timeline l'emporte sur la view timeline**.
- 🆕 **Résolution** (ED actuel, §4.2 ; résolution CSSWG du 2026-01-28 dans
  [#13364](https://github.com/w3c/csswg-drafts/issues/13364), « *Needs Edits* »,
  et [#12581](https://github.com/w3c/csswg-drafts/issues/12581)) : les noms sont
  **globaux par défaut**. Pour un élément qui référence `--n` : (1) s'il
  définit `--n`, c'est celle-là ; (2) sinon, si `--n` est scopé par cet élément
  (ou s'il est l'élément racine), la **dernière** timeline `--n` parmi ses
  descendants en ordre de l'arbre aplati, ou une timeline inactive ; (3) sinon
  on recommence depuis le parent. ⇒ un ancêtre proche gagne ; à défaut, la
  dernière définition du document.
- `timeline-scope: none | all | <dashed-ident>#` : limite la visibilité d'un
  nom au sous-arbre, et oblige les descendants à ne résoudre que dans ce
  sous-arbre. Sert aussi à **remonter** un nom défini par un frère pour le
  rendre visible à des cousins.
- `animation-timeline: --n` sans timeline trouvée → l'animation n'a **pas** de
  timeline (aucun effet) — `css/animation-timeline-none.html`,
  `css/view-timeline-lookup.html`, `css/timeline-scope.html`.
- Une timeline nommée déclarée *après* l'élément animé (« deferred ») est
  supportée (`css/animation-timeline-deferred.html`).

### 3.8 Événements ✅

Les animations scroll-driven émettent `animationstart` / `animationend` /
`animationiteration` comme les autres. En remontant, `animationstart` est émis
à la *fin* de l'intervalle actif et `animationend` à son début ; `finish`
(Web Animations) n'est émis qu'en avançant.

---

## 4. Algorithme de référence (pseudo-code TypeScript)

But : à partir du DOM, calculer pour une plage `view()`/`scroll()` donnée (i)
les bornes en px de défilement, (ii) la progression brute de la plage, (iii) la
progression de l'effet telle que le natif la calcule. Les points ⚠️ signalent ce
que l'API DOM ne donne pas directement.

```ts
type AxisKw = 'block' | 'inline' | 'x' | 'y';
type Phys = 'x' | 'y';
type RangeName =
  | 'cover' | 'contain' | 'entry' | 'exit'
  | 'entry-crossing' | 'exit-crossing' | 'scroll';

/** `normal`, ou `[nom] calc(pct% + px)`. pct en fraction (0.5 = 50 %). */
type RangeOffset =
  | { kind: 'normal' }
  | { kind: 'offset'; name: RangeName | null; pct: number; px: number };

interface Interval { start: number; end: number }   // offsets de défilement (px)

// ───────────────────────────── 1. Axe physique ──────────────────────────────

function physicalAxis(axis: AxisKw, scroller: Element): Phys {
  if (axis === 'x' || axis === 'y') return axis;
  const horizontalWM = getComputedStyle(scroller).writingMode === 'horizontal-tb';
  const blockIsY = horizontalWM;               // tous les modes verticaux : block = x
  return (axis === 'block') === blockIsY ? 'y' : 'x';
}

/** L'origine de défilement est-elle du côté « droit/bas » dans cet axe ? */
function axisReversed(phys: Phys, scroller: Element): boolean {
  const cs = getComputedStyle(scroller);
  if (phys === 'x') {
    // inline en horizontal-tb + rtl, ou block en vertical-rl
    if (cs.writingMode === 'horizontal-tb') return cs.direction === 'rtl';
    return cs.writingMode === 'vertical-rl' || cs.writingMode === 'sideways-rl';
  }
  // y : inversé seulement en sideways-lr (inline de bas en haut)  ⚠️ rare
  return cs.writingMode === 'sideways-lr' && cs.direction === 'ltr';
  // ⚠️ column-reverse / content-distribution : voir §1.3, à mesurer.
}

// ──────────────────────────── 2. Source (scroller) ──────────────────────────

const isScrollable = (o: string) => o === 'auto' || o === 'scroll' || o === 'hidden';

function nearestScroller(el: Element, phys: Phys): Element /* ou racine */ {
  // Suivre la CHAÎNE DES BLOCS CONTENEURS (abspos/fixed sautent des ancêtres DOM).
  for (let a = containingBlockAncestor(el); a; a = containingBlockAncestor(a)) {
    if (a === document.documentElement) break;
    const cs = getComputedStyle(a);
    if (isScrollable(phys === 'x' ? cs.overflowX : cs.overflowY)) return a;
  }
  return document.scrollingElement!;           // repli racine (quirks : body)
}
// containingBlockAncestor : parent pour static/relative/sticky ; plus proche
// ancêtre positionné (ou transformé, contain, will-change…) pour absolute ;
// viewport (ou ancêtre transformé/filtré…) pour fixed. Le polyfill
// flackr/scroll-timeline en donne une implémentation (getContainingBlock).

interface ScrollState { pos: number; min: number; max: number; viewport: number }

function scrollState(src: Element, phys: Phys): ScrollState | null {
  if (!src.isConnected || getComputedStyle(src).display === 'none') return null;
  const size   = phys === 'x' ? src.clientWidth  : src.clientHeight; // scrollport
  const extent = phys === 'x' ? src.scrollWidth  : src.scrollHeight;
  const raw    = phys === 'x' ? src.scrollLeft   : src.scrollTop;    // fractionnaire possible
  const max = extent - size;
  const pos = axisReversed(phys, src) ? -raw : raw;  // distance depuis l'origine
  return { pos, min: 0, max, viewport: size };
}

// ──────────────────────────── 3. scroll() ───────────────────────────────────

function scrollTimelineProgress(st: ScrollState | null): number | null {
  if (!st || st.max - st.min <= 0) return null;        // inactive → aucun effet
  return (st.pos - st.min) / (st.max - st.min);
}

// ──────────────────────────── 4. view() : géométrie ─────────────────────────

interface SubjectGeom { P: number; Z: number }   // dans le repère « depuis l'origine »

/**
 * Position NON TRANSFORMÉE du bord de début de la border-box du sujet, mesurée
 * depuis l'origine de défilement de `src` au défilement 0, et sa taille.
 * Positionnement relatif/absolu inclus ; sticky : voir §5.
 *
 * ⚠️ Aucune API DOM ne donne directement cette valeur :
 *  - getBoundingClientRect : inclut transforms (sujet + ancêtres) et sticky ;
 *    correct seulement si aucun transform/translate/scale/rotate/offset-path/zoom
 *    n'existe du sujet jusqu'à la source.
 *  - somme des offsetTop/offsetLeft (polyfill) : ignore les transforms, inclut le
 *    relatif, mais arrondi à l'entier, sémantique offsetParent (tables, fixed),
 *    et inclut le décalage sticky COURANT.
 */
function subjectGeom(subject: Element, src: Element, phys: Phys): SubjectGeom {
  // Variante getBoundingClientRect (valide sans transform dans la chaîne) :
  const st = scrollState(src, phys)!;
  const r = subject.getBoundingClientRect();
  const s = src.getBoundingClientRect();
  const cs = getComputedStyle(src);
  if (phys === 'y') {
    const portTop = s.top + parseFloat(cs.borderTopWidth);
    if (!axisReversed('y', src)) return { P: r.top - portTop + st.pos, Z: r.height };
    const portBottom = portTop + st.viewport;
    return { P: portBottom - r.bottom + st.pos, Z: r.height };
  }
  const portLeft = s.left + parseFloat(cs.borderLeftWidth);
  // ⚠️ en rtl, la barre de défilement verticale peut être à gauche : utiliser
  //    clientLeft plutôt que border-left pour situer le bord du scrollport.
  if (!axisReversed('x', src)) return { P: r.left - portLeft + st.pos, Z: r.width };
  const portRight = portLeft + st.viewport;
  return { P: portRight - r.right + st.pos, Z: r.width };
}

/** view-timeline-inset → [Is, Ie] en px. */
function resolveInsets(
  inset: ['auto' | { pct: number; px: number }, 'auto' | { pct: number; px: number }],
  src: Element, phys: Phys, V: number,
): [number, number] {
  const sp = scrollPaddingStartEnd(src, phys);   // côtés logiques début/fin dans le
                                                  // writing-mode du scroller ; % → de V
  const one = (v: typeof inset[0], side: 0 | 1) =>
    v === 'auto' ? sp[side] : v.pct * V + v.px;
  return [one(inset[0], 0), one(inset[1], 1)];
}

type ViewRanges = Record<RangeName, Interval>;

function viewRanges(g: SubjectGeom, V: number, Is: number, Ie: number,
                    st: ScrollState): ViewRanges {
  const coverStart = g.P - (V - Ie);
  const coverEnd   = g.P + g.Z - Is;
  const A = g.P - Is;                    // bord de début du sujet sur le début de la zone
  const B = g.P + g.Z - (V - Ie);        // bord de fin du sujet sur la fin de la zone
  const containStart = Math.min(A, B);
  const containEnd   = Math.max(A, B);
  return {
    cover:            { start: coverStart,   end: coverEnd },
    contain:          { start: containStart, end: containEnd },
    entry:            { start: coverStart,   end: containStart },
    exit:             { start: containEnd,   end: coverEnd },
    'entry-crossing': { start: coverStart,   end: B },
    'exit-crossing':  { start: A,            end: coverEnd },
    scroll:           { start: st.min,       end: st.max },
  };
}

// ─────────────────────── 5. Résolution de animation-range ───────────────────

function resolveOffset(o: RangeOffset, isEnd: boolean,
                       timeline: Interval, named: Partial<ViewRanges>): number {
  if (o.kind === 'normal') return isEnd ? timeline.end : timeline.start;
  const base = o.name ? named[o.name] : timeline;
  if (!base) return NaN;                 // ⚠️ plage nommée absente : à mesurer (§3.1)
  return base.start + o.pct * (base.end - base.start) + o.px;
}
// Défauts du parseur : `entry` → {pct: 0} en start, {pct: 1} en end ;
// raccourci `animation-range: entry` → start entry 0 %, end entry 100 %.

// ─────────────────── 6. Progression brute de la plage ──────────────────────

/** Progression non bornée de `s` dans la plage d'attache (peut être <0 ou >1). */
function rangeProgress(s: number, att: Interval): number | null {
  const len = att.end - att.start;
  if (len === 0) return null;            // plage dégénérée : voir §3.5
  return (s - att.start) / len;
}

// ─────────── 7. Progression de l'effet (ce que le natif applique) ───────────

interface CssTiming {
  iterations: number;                    // peut être Infinity
  iterationStart: number;
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill: 'none' | 'forwards' | 'backwards' | 'both';   // 'auto' ≡ 'none'
  playbackRate: number;                  // 1 sauf script
}

/**
 * Renvoie la progression d'itération [0,1] à appliquer aux keyframes, ou null
 * si l'effet ne s'applique pas (valeur de base). Durée `auto` : délais = 0.
 */
function effectProgress(
  s: number, st: ScrollState, timeline: Interval, att: Interval, t: CssTiming,
): number | null {
  const tlLen = timeline.end - timeline.start;
  if (tlLen <= 0) return null;                          // timeline inactive
  const T  = (x: number) => (x - timeline.start) / tlLen; // fraction de timeline
  const L  = T(s) - T(att.start);                        // temps local (fraction)
  const EE = Math.max(T(att.end) - T(att.start), 0);     // ⚠️ plage inversée → 0 ?
  const D  = Number.isFinite(t.iterations) ? EE / t.iterations : 0; // durée d'itération
  const AD = D * t.iterations || 0;                      // ∞ × 0 → 0 (WA1)

  const atTimelineBoundary = s <= st.min || s >= st.max; // 🆕 WA2 (PR #13819)
  const backwards = t.playbackRate < 0;
  const beforeBoundary = Math.max(Math.min(0, EE), 0);
  const afterBoundary  = Math.max(Math.min(AD, EE), 0);

  let phase: 'before' | 'active' | 'after';
  if (L < beforeBoundary || (backwards && L === beforeBoundary && !atTimelineBoundary))
    phase = 'before';
  else if (L > afterBoundary || (!backwards && L === afterBoundary && !atTimelineBoundary))
    phase = 'after';
  else phase = 'active';

  let activeTime: number | null;
  if (phase === 'before')
    activeTime = t.fill === 'backwards' || t.fill === 'both' ? 0 : null;
  else if (phase === 'after')
    activeTime = t.fill === 'forwards' || t.fill === 'both' ? AD : null;
  else activeTime = L;
  if (activeTime === null) return null;

  // Suite strictement WA1 §4.8 (overall → simple → current iteration → directed).
  return wa1IterationProgress(activeTime, AD, D, t, phase);
  // Easing de l'effet = linear pour une CSSAnimation (timing-function par keyframe).
}
```

`wa1IterationProgress` est la transcription des sections WA1
`#calculating-the-overall-progress` à `#calculating-the-directed-progress` (y
compris le cas `D = 0`). Elle n'a rien de propre au scroll ; un moteur qui
« pilote une `CSSAnimation` existante » (§4.7 de la spec Udixio) l'obtient du
navigateur au lieu de la réimplémenter.

### 4.1 Oracle disponible dans les moteurs natifs

Pour comparer un fallback au natif dans une suite de conformance :
`anim.timeline.currentTime` (CSSUnitValue %), `anim.startTime` (% = début de
plage), `anim.currentTime` (%), `anim.effect.getComputedTiming().progress`
(progression d'itération), `.duration` (%), `anim.rangeStart`/`rangeEnd`
(`TimelineRangeOffset`), `ViewTimeline.startOffset`/`endOffset` (px de `cover`
depuis l'origine). C'est ce que font les WPT cités.

---

## 5. Sujet sticky : algorithme earliest / latest

Avec un sujet (ou un ancêtre) sticky, la position du bord de début du sujet
dans le scrollport est une fonction `f(s)` du défilement, continue,
**non croissante** et affine par morceaux (pentes −1 ou 0). Pour une seule boîte
sticky de position statique `Q` (repère contenu), taille `H` dans l'axe, insets
sticky `t` (début) / `b` (fin) relatifs au **scrollport** (pas à la zone de
visibilité), bloc conteneur `[Cs, Ce]` (boîte de contenu du parent) :

```ts
function stickyDelta(s: number, Q: number, H: number, V: number,
                     t: number | null, b: number | null, Cs: number, Ce: number): number {
  let d = 0;
  if (b !== null && Q + H - s > V - b)                 // poussé depuis la fin
    d = Math.max((V - b) - (Q + H - s), Cs - Q);
  if (t !== null && Q + d - s < t)                     // poussé depuis le début (prioritaire)
    d = Math.min(t - (Q - s), Ce - H - Q);
  return d;
}
const f = (s: number) => Q - s + stickyDelta(s /* … */);   // bord de début, repère scrollport
```

Résoudre `f(s) = cible` (ou `f(s) + Z = cible` pour le bord de fin) donne un
**intervalle** `[sLo, sHi]` (plat si le sujet est collé). Règle de choix
(texte de §3.1) :

| Borne | Condition | Choix |
|---|---|---|
| cover 0 % | début du sujet = fin de la zone | **latest** (`sHi`) |
| cover 100 % | fin du sujet = début de la zone | **earliest** (`sLo`) |
| contain 0 % | l'une ou l'autre des coïncidences A/B | **earliest** des deux |
| contain 100 % | l'une ou l'autre | **latest** des deux |
| entry-crossing 0 % / exit-crossing 0 % | début = fin / début = début | **latest** |
| entry-crossing 100 % / exit-crossing 100 % | fin = fin / fin = début | **earliest** |

Les points de rupture de `f` sont en nombre fini (`Q − t`, `Ce − H − t`,
`Q + H − (V − b)`, `Cs + H − (V − b)`) : on trie, on résout l'équation affine sur
chaque segment, on prend `sLo`/`sHi`. Vérification sur le WPT
`view-timeline-sticky-block.html` (`Q = 700, H = 50, V = 500, t = b = 0,
[Cs, Ce] = [500, 1000]`) : cover = [0, 1000], contain = [50, 950] ✓.

⚠️ Limites : (1) aucune API DOM ne donne la position **statique** `Q` d'un
élément collé (`offsetTop` et `getBoundingClientRect` incluent le décalage
courant) ; (2) sticky imbriqués : les deltas se composent ; (3) les insets
sticky en `%` se résolvent sur le scrollport ; (4) le polyfill
`flackr/scroll-timeline` ne gère pas le sticky (TODO dans `calculateRange`).

---

## 6. `animation-trigger` (déclenchement par timeline)

### 6.1 État de la spec

- Spécifié aujourd'hui dans **CSS Animation Triggers Level 1**
  (https://drafts.csswg.org/animation-triggers-1/, ED du 16 octobre 2026),
  sorti de CSS Animations 2 (PR 13571). Historique visible dans les changelogs
  de CSS Animations 2 : `animation-trigger-type` → `-behavior` → refonte en
  `animation-trigger` + actions (PR 13009). Toutes les valeurs restent susceptibles
  de bouger.
- Deux types de triggers : **timeline triggers** (`timeline-trigger*`) et
  **event triggers** (`event-trigger*` : `click()`, `pointerenter()`,
  `keypress("…")`, etc., hors périmètre ici).

### 6.2 Déclaration

```css
.source { timeline-trigger: --t view() entry 100% exit 0% / entry 0% exit 100%; }
.cible  { animation: reveal 600ms both; animation-trigger: --t play-forwards play-backwards; }
```

- `timeline-trigger: <nom> <source> [<activation-range> [/ <active-range>]]`,
  **ordre imposé** (ambiguïtés de syntaxe). `none` = `none none normal`.
- `timeline-trigger-source` : mêmes valeurs qu'`animation-timeline`
  (`auto`, `none`, nom, `scroll()`, `view()`) ; avec `view()`, le sujet est
  l'élément qui **déclare** le trigger.
- `timeline-trigger-activation-range-start/end` : même syntaxe et sens
  qu'`animation-range-*` (défaut `normal`). Les longueurs sans nom sont mesurées
  depuis le début de la timeline : avec `view()`, `150px` = `cover 0% + 150px`
  (WPT `animation-trigger-play-forwards-backwards.tentative.html`).
- `timeline-trigger-active-range-start/end` : idem + `auto` (défaut) = même
  borne que la plage d'activation. L'active range **contient toujours**
  l'activation range.
- `trigger-scope: none | all | <dashed-ident>#` : les noms de triggers sont
  **globaux** par défaut ; plusieurs déclarations du même nom deviennent des
  « attachments » de la même instance de trigger.
- `animation-trigger: none | [ <dashed-ident> <animation-action>+ ]+` (#), sous-
  propriété *reset-only* du raccourci `animation`. Un timeline trigger accepte
  1 action (entrée) ou 2 (entrée, sortie) ; un mauvais nombre d'actions est
  syntaxiquement valide mais **sans effet**. Si un même nom apparaît plusieurs
  fois, seul le dernier compte ; triggers simultanés appliqués dans l'ordre.

### 6.3 Machine d'états 📄

Instance de trigger : drapeau *did trigger* (faux au départ) et état
`pending` → `active` / `inactive`.

```
pending  ──(timeline DANS activation range)──▶ active   : applique l'action d'entrée
active   ──(timeline HORS de active range)───▶ inactive : applique l'action de sortie (si fournie)
inactive ──(timeline DANS activation range)──▶ active   : action d'entrée
```

Activation range vs active range : on **active** en entrant dans la plage
(étroite) d'activation, on ne **désactive** qu'en sortant de la plage (large)
active. Exemple de la spec : démarrer quand l'élément approche du centre,
n'arrêter que quand il a complètement quitté l'écran (`cover`).

⚠️ §3.1 se contredit : « quand **toutes** les activation ranges associées sont
entrées… », puis « formant ainsi un **OU** logique ». À clarifier en lisant les
issues avant d'implémenter un trigger à plusieurs timelines.

### 6.4 Actions (`<animation-action>`), tableau normatif

| Action | Effet préalable | état initial | en lecture | en pause | terminée |
|---|---|---|---|---|---|
| `none` | — | — | — | — | — |
| `play` | — | `play()` | — | `play()` | `play()` |
| `play-once` | — | `play()` | — | `play()` | — |
| `play-forwards` | `playbackRate` → positif | `play()` | — | `play()` | `play()` |
| `play-backwards` | `playbackRate` → négatif | `play()` | — | `play()` | `play()` |
| `pause` | — | — | `pause()` | — | — |
| `reset` | progression → 0 | — | `pause()` | `pause()` | `pause()` |
| `replay` | progression → 0 | `play()` | — | `play()` | `play()` |

Les anciennes notions `once` / `repeat` / `alternate` / `state` se réécrivent
avec ces actions (WPT : `play-once` ; `play-forwards reset` ;
`play-forwards play-backwards` ; `play-once pause`).

### 6.5 Comportements aux bords établis par les WPT

- ✅ **Sujet déjà dans la plage au chargement** → le trigger s'active
  (`timeline-trigger-source-starts-in-trigger-range.tentative.html`). Le test
  d'état est donc un test d'**appartenance** à chaque mise à jour, pas de
  franchissement.
- ⚠️ Conséquence non testée : un saut de défilement (ancre, `scrollTo`
  instantané, défilement très rapide) qui **enjambe** une activation range
  étroite sans frame à l'intérieur n'activerait pas le trigger. À mesurer.
- ✅ **Avant déclenchement**, l'animation existe (`getAnimations()` la renvoie,
  `animation-trigger-untriggered-animations-exposed.tentative.html`), en pause à
  `currentTime = 0`, `playState = "paused"`
  (`animation-trigger-disarmed-by-apis.tentative.html`) ; avec
  `fill: both`/`backwards` la 1re image est donc appliquée, avec `fill: none`
  rien n'est appliqué (tests de référence `animation-trigger-fill-mode-{both,none}`).
- ✅ `play-forwards` sur une animation **déjà terminée à la fin** ne la relance
  pas ; elle ne repart que si l'action **inverse le sens**
  (`animation-trigger-play-forwards-backwards.tentative.html`). Le tableau 6.4
  dit `play()` dans l'état « terminée » : le WPT montre un `play()` **sans
  auto-rewind**.
- ✅ Appeler `cancel()` sur l'animation la détache du trigger (« disarmed ») ;
  sorties et entrées ultérieures n'ont plus d'effet.
- ⚠️ Inclusivité des bornes des plages de trigger : non trouvée ; à mesurer.
- Les animations déclenchées sont **temporelles** (document timeline) : leur
  durée est en secondes, la timeline ne sert qu'à décider quand agir. Les tests
  laissent un frame au compositeur pour observer le défilement, puis un frame au
  thread principal pour observer la réaction du trigger (`support/support.js`) :
  la réaction native peut donc arriver jusqu'à deux frames après le défilement.

### 6.6 API JS : la spec et Chrome ne concordent pas ⚠️

- Spec (Animation Triggers §6) : `new AnimationTrigger({ timeline, behavior,
  activationRangeStart/End, activeRangeStart/End })` ; WA2 ajoute
  `Animation.trigger` et `KeyframeAnimationOptions.trigger`. L'IDL garde un
  attribut `behavior` (défaut `"once"`) **qui ne correspond plus** au modèle CSS
  par actions.
- WPT (et donc Chrome) : `new TimelineTrigger([{ timeline, activationRangeStart,
  activationRangeEnd, … }])`, puis `trigger.addAnimation(anim, "play-forwards",
  "play-backwards")`, `trigger.getAnimations()`
  (`animation-trigger-addAnimation.tentative.html`). R1 nomme l'interface
  `AnimationTrigger` d'après les notes de version : divergence de sources à
  lever (détection par `'TimelineTrigger' in window`).
- Intent to Ship : WA « pas encore à jour, suivra la spec CSS » (blink-dev,
  novembre 2025).

### 6.7 Implémentation Chrome

- Livré par défaut en **Chrome 146** (R1, BCD ; notes de version du
  2026-03-10). Le blog Chrome annonçait 145, l'Intent to Ship visait 144 : les
  sources se contredisent, R1 fait foi. Aucun moteur non-Chromium (positions
  [mozilla#1315](https://github.com/mozilla/standards-positions/issues/1315),
  [webkit#576](https://github.com/WebKit/standards-positions/issues/576) sans
  signal à l'Intent to Ship).
- Exécution possible hors du thread principal (compositeur) : c'est l'argument
  de la fonctionnalité.
- Le blog ne documente que `play-forwards` / `play-backwards` et renvoie à la
  spec pour le reste. La démo officielle utilise un `IntersectionObserver` en
  repli.

---

## 7. API JS des timelines et contrôle d'une `CSSAnimation`

### 7.1 Interfaces

- `new ScrollTimeline({ source?, axis? })` : `source` par défaut =
  `document.scrollingElement`. `source`/`currentTime` sont recalculés à chaque
  lecture. Durée = 100 %.
- `new ViewTimeline({ subject, axis?, inset? })` : `source` = plus proche
  ancêtre défilable dans l'axe ; `startOffset` / `endOffset` = bornes de `cover`
  en px depuis l'origine (≠ `scrollLeft` en rtl) ; `null` si inactive.
- `AnimationTimeline.currentTime` : `CSSUnitValue` en **%** pour une timeline
  progress-based, `null` si inactive. `getCurrentTime(rangeName)` a été retiré
  (#8765) ; la progression par animation passe par `Animation.overallProgress`.
- `element.animate(kf, { timeline, rangeStart, rangeEnd })` : `rangeStart`/
  `rangeEnd` acceptent `"entry 10%"`, `{ rangeName, offset }`, un
  `CSSNumericValue` ou `"normal"`. `duration` omise = `auto` (remplit la plage) ;
  une durée en ms est convertie en proportions (§3.3).

### 7.2 `currentTime` / `startTime` en pourcentage ✅

Sur une timeline progress-based, `Animation.currentTime` et `startTime` sont des
`CSSNumericValue` en %. Les **affecter avec un nombre lève `TypeError`**
(« validate a CSSNumberish time ») ; il faut `CSS.percent(x)`. Inversement, sur
une timeline temporelle, un `CSSNumericValue` doit être en unités de durée. Fixer
`currentTime` ou `startTime` **désactive l'auto-alignement** du start time (la
plage n'est plus suivie automatiquement). `pause()` sur une timeline finie ne
fixe pas de hold time tant que la plage n'est pas calculée (WA2 §2.3.8).

### 7.3 `CSSAnimation.timeline` et précédence de l'API ✅

CSS Animations 2 §2 : après un appel réussi à `updateTiming()`, les changements
ultérieurs des propriétés CSS correspondantes sont **ignorés** pour cette
animation ; après `play()`/`pause()`, `animation-play-state` n'est plus suivi ;
après `setKeyframes()`, les `@keyframes` ne le sont plus. Changer `effect` ne
bloque pas `animation-timeline` (changelog). ⚠️ Le cas d'une affectation
`anim.timeline = …` par script n'est **pas** dans la liste des précédences : on
ne sait pas si un changement ultérieur de `animation-timeline` l'écrase. Changer
de timeline préserve la progression (WA2 §2.3.1 : `previous progress ×
end time`).

### 7.4 Moteur sans support des timelines (faits, sans recommandation)

- `animation-timeline: view()` est une déclaration invalide → ignorée ;
  l'animation reste attachée à la **document timeline** (temporelle).
- `animation-duration: auto` : supporté (BCD) par Chrome 115, Safari 18.4,
  Firefox 159. Dans un moteur qui ne le supporte pas, `animation-duration: auto`
  est ignoré, et **un raccourci `animation:` contenant `auto` est invalide en
  entier** (aucune animation). Sans durée, le raccourci donne `0s` (valeur
  initiale Level 1, ou `auto` résolu à `0s`). Safari 18.4–25 forme un cas
  particulier : il accepte `auto` mais pas les timelines, donc `auto` y vaut `0s`.
- Une animation CSS de durée `0s` : `animationstart`/`animationend` partent
  immédiatement ; avec `fill: forwards|both`, l'**image finale** est appliquée
  dès le premier rendu ; avec `fill: none`, aucun effet visible.
- **Visibilité par `getAnimations()`** : une animation temporelle **terminée
  sans fill** n'est plus « relevant » (WA1 §4.6.7), donc **absente de
  `getAnimations()`**. Une animation scroll-driven non idle, elle, reste toujours
  « current », donc visible même hors plage. Une `CSSAnimation` `0s` + `fill:
  none` dans un moteur sans support est donc introuvable par `getAnimations()`
  après le premier frame (l'objet existe tant que `animation-name` s'applique).
- Prise de contrôle : `pause()`, `effect.updateTiming({ duration })` (prend la
  précédence sur `animation-duration`), puis `currentTime = …` en ms. Avec une
  durée `0s` non modifiée, seuls les états « avant » et « après » existent ; on
  ne peut pas obtenir de valeur intermédiaire. Détails et pièges : R4.

### 7.5 Ce que le mapping temps ↔ progression ne reproduit pas tel quel

Si l'on pilote une animation **temporelle** (durée `Dms`) avec `currentTime =
p × Dms`, la mathématique WA1 est la même (même interpolation, même `direction`,
même `iteration-count` si la durée active est `Dms`), **sauf** :

1. **Bord de timeline** : la fin exclusive s'applique toujours en temporel ;
   en scroll-driven elle devient inclusive au défilement min/max (🆕 §3.4). Un
   `fill: none` dont la plage finit au défilement max garde sa dernière image en
   natif et la perd en temporel avec `currentTime = Dms`.
2. **Timeline inactive** : en natif, aucun effet même avec `fill: both` ; en
   temporel en pause, l'effet appliqué est celui du `currentTime` fixé.
3. **`iteration-count: infinite`** : dégénère à 0 en natif (§3.3), pas en
   temporel.
4. **Délais** : ignorés (durée `auto`) en natif CSS, proportionnels en natif JS,
   absolus en temporel.
5. **Keyframes positionnées sur une plage** (`entry 0% {…}`) : ignorées par un
   moteur sans support (§3.6), donc absentes de l'animation à piloter.
6. **Événements** : le natif émet `animationstart`/`end` selon les phases en
   défilant ; un `currentTime` affecté par script les émet aussi (CSS Animations 2
   §5.1 : dispatch par changement de phase, y compris au seek) ⚠️ à vérifier par
   moteur.
7. **Échantillonnage** : natif mis à jour à l'étape d'animation du frame (voire
   sur le compositeur) ; un fallback le fait au mieux dans `requestAnimationFrame`
   ou après un `scroll`, donc souvent avec un frame de retard.

---

## 8. Divergences connues (navigateurs / spec)

| # | Sujet | Constat | Source |
|---|---|---|---|
| D1 | 🆕 *At timeline boundary* | Spec réécrite le 2026-08-24 (fin inclusive au défilement min/max). Avant : procédure fondée sur la progression effective de l'animation. Safari TP 217 rendait toutes les animations actives au défilement max (pastilles de carrousel toutes allumées), alors que Chrome 135 n'implémentait pas le drapeau. Les moteurs livrés peuvent suivre l'une ou l'autre version. | [#12134](https://github.com/w3c/csswg-drafts/issues/12134), [PR #13819](https://github.com/w3c/csswg-drafts/pull/13819), [#5223](https://github.com/w3c/csswg-drafts/issues/5223) |
| D2 | View timeline dans un scroller qui ne déborde pas | Le WPT `contain-alignment.html` la veut active (progression calculable) alors que le texte dit « inactive si pas d'overflow défilable ». Gecko échoue ce test. | WPT, bug Mozilla 2047776 |
| D3 | 🆕 Résolution des noms de timeline | ED : noms globaux, ancêtres d'abord puis dernière définition (résolution du 2026-01-28, *Needs Edits*). Les implémentations historiques (Chrome 115+, Safari 26) n'exposaient les noms qu'au sous-arbre + `timeline-scope`. Risque de retard d'implémentation. | [#13364](https://github.com/w3c/csswg-drafts/issues/13364), [#12581](https://github.com/w3c/csswg-drafts/issues/12581) |
| D4 | Raccourci `animation` et `animation-timeline` | La grammaire du brouillon CSS Animations 2 inclut `<single-animation-timeline>` dans `animation`. Chrome : *reset-only* (le raccourci remet à `auto` sans pouvoir définir) ; Firefox/Safari : ne réinitialise pas (R1, BCD). L'ordre des déclarations compte. | CSS Animations 2 §4.12, R1 §3.1 |
| D5 | `<time>` en durée scroll-driven | Spec CSS : traitée comme `auto`. API JS : convertie en proportions. Comportement réel des moteurs pour du CSS `animation: x 1s 0.5s` : non établi (MDN : effet visible sur `view()`). | CSS Animations 2 §4.1, WA2 §2.3, MDN `animation-duration` |
| D6 | `view-timeline-inset` en chaîne dans le constructeur | WPT : `em`/`vw` refusés (`TypeError`) en attendant une résolution. | [#13852](https://github.com/w3c/csswg-drafts/issues/13852) |
| D7 | Firefox | Livré en 159 (2026-10-27) d'après R1, mais score Interop 2026 « scroll-driven » de 70,1 % contre 97,5 % (Chrome) et 96,5 % (Safari) : des écarts de conformité subsistent ; prévoir des tests dédiés. | R1 §3.1 |
| D8 | Plage `scroll` | Récente : Chrome 147, Safari 26.5, Firefox 159. | R1 |
| D9 | API trigger | Spec : `AnimationTrigger` + `Animation.trigger` + `behavior`. WPT/Chrome : `TimelineTrigger([…])` + `addAnimation(anim, entrée, sortie)`. | §6.6 |
| D10 | Contradiction interne de la spec trigger | « toutes les activation ranges » vs « OU logique » (§3.1). | Animation Triggers 1 §3.1 |
| D11 | Action `play` sur animation terminée | Tableau : `play()`. WPT : pas de redémarrage si le sens ne change pas (pas d'auto-rewind). | §6.5 |
| D12 | Version Chrome du trigger | Blog : 145 ; Intent to Ship : 144 ; notes de version / BCD : 146. | §6.7 |
| D13 | Origine en *content-distribution* inversée | La spec elle-même hésite (issue inline « Is this what we want? ») ; `currentTime` < 0 % ou > 100 % non tranché. | Scroll-driven 1 §2.2.2 |
| D14 | Échantillonnage | Les moteurs à défilement asynchrone peuvent échantillonner sur le compositeur ; l'état rendu peut différer de `scrollTop` lu par script pendant un frame. | Scroll-driven 1 §1.2, §5.1 |
| D15 | Polyfill de référence | `flackr/scroll-timeline` : mêmes formules que §4 (`calculateRange`), mais `offsetTop` (entier), sans sticky (TODO), `sideways-lr` non géré. | `src/scroll-timeline-base.js` |

---

## 9. Liste des cas limites et comportement natif

| Cas | Comportement natif | Réf. |
|---|---|---|
| Scroller sans plage de défilement (`scroll()`) | timeline inactive, aucun effet même avec `fill` | §1.5 |
| `scroll(self)` sur une boîte non scroll container | inactive | §1.2 |
| Ancêtre `overflow-x: clip; overflow-y: auto`, axe inline | ancêtre sauté, repli racine | §1.2 |
| `overflow: hidden` | compte comme scroller | §1.2 |
| Sujet `position: absolute`, bloc conteneur hors du scroller | le scroller intermédiaire est ignoré | §1.2 |
| rtl / `vertical-rl` | progression depuis l'origine (bord droit) ; `-scrollLeft` | §1.3 |
| `column-reverse`, `justify-content: end` | ⚠️ origine / 0 % à mesurer | §1.3, D13 |
| Sujet transformé (y compris par sa propre animation) | transform ignoré | §2.5 |
| Ancêtre transformé entre sujet et scroller | transform ignoré | §2.5 |
| Sujet `position: relative` décalé | décalage pris en compte | §2.5 |
| Sujet ou ancêtre sticky | position collée prise en compte, règle earliest/latest | §2.5, §5 |
| Sujet plus grand que la zone | `contain` = période de recouvrement ; `entry` ≠ `entry-crossing` | §2.3 |
| Sujet de la taille exacte de la zone | `contain` de longueur nulle | §2.3, §3.5 |
| Sujet en haut de page | `cover 0%` inatteignable ; progression initiale > 0 | §2.3 |
| `fill: none`, défilement hors plage | aucun effet (valeur de base) | §3.4 |
| `fill: none`, exactement à la fin de la plage | non appliqué… | §3.4 |
| …sauf si cette fin = défilement max (ou début = min) | appliqué (🆕 *timeline boundary*) | §3.4, D1 |
| Pourcentage hors [0, 100] dans `animation-range` | extrapolé | §3.1 |
| Longueur dans `animation-range` | px de défilement depuis le début de la plage nommée (ou de la timeline) | §3.1 |
| Plage d'attache de longueur nulle | durée 0, règles WA1 des durées nulles | §3.5 |
| Plage inversée (`exit entry`) | ⚠️ vraisemblablement durée 0 | §3.5 |
| `iteration-count: infinite` | durée d'itération et active = 0 | §3.3 |
| `animation-delay` en secondes | ignoré (spec) ⚠️ moteurs | §3.3, D5 |
| Délais en % (JS) | relatifs à la plage d'attache ; ≥ 100 % → inactif | §3.3 |
| Remonter la page | `playbackRate` inchangé ; `animationstart` émis à la fin de l'intervalle | §3.2, §3.8 |
| `animation-timeline: --n` introuvable | pas de timeline, aucun effet | §3.7 |
| Deux `--n` dans le document, sans `timeline-scope` | ancêtre proche, sinon dernière définition (🆕) | §3.7, D3 |
| `scroll-timeline` et `view-timeline` de même nom sur un élément | la scroll timeline gagne | §3.7 |
| Lecture `getComputedStyle` juste après création | timeline vue « stale » jusqu'au frame suivant | §1.6 |
| Contenu qui rétrécit jusqu'à supprimer le défilement | timeline devient inactive au frame suivant | §1.5 |
| `view-timeline-inset: auto` | = `scroll-padding` du scroller | §2.2 |
| Inset en % | relatif à la taille du scrollport | §2.2 |
| Impression | timelines visant le viewport inactives | §1.5 |
| Trigger : sujet déjà dans l'activation range au chargement | s'active | §6.5 |
| Trigger : saut qui enjambe l'activation range | ⚠️ probablement pas d'activation | §6.5 |
| Trigger : animation en attente | en pause à 0, exposée par `getAnimations()`, `fill` backwards visible | §6.5 |
| Trigger : 2 actions, sortie de l'**active** range | action de sortie ; rentrer dans l'active range sans l'activation range ne fait rien | §6.3 |
| Trigger : mauvais nombre d'actions | valide mais sans effet | §6.2 |
| Trigger : `cancel()` de l'animation | détachée du trigger | §6.5 |

---

## 10. Tests WPT à reprendre comme oracles (sélection)

Base : https://github.com/web-platform-tests/wpt/tree/master/scroll-animations
(résultats : https://wpt.fyi/results/scroll-animations).

- **Plages view** : `view-timelines/view-timeline-range.html`,
  `view-timeline-range-large-subject.html`, `view-timeline-inset.html`,
  `view-timeline-snapport.html`, `contain-alignment.html`,
  `view-timeline-sticky-{block,inline,inline-ancestor,subpixel-adjustment}.html`,
  `intermediate-transform.html`, `view-timeline-relative-{subject,ancestor}.html`,
  `view-timeline-abspos-*.html`, `inline-subject.html`,
  `block-view-timeline-current-time-vertical-rl.tentative.html`.
- **CSS** : `css/view-timeline-with-transform-on-subject.html`,
  `css/animation-range-normal-matches-cover.html`,
  `css/animation-range-scroll-timeline.html`, `css/animation-range-ignored.html`,
  `css/animation-fill-outside-range-test.html`,
  `css/animation-inactive-outside-range-test.html`,
  `css/view-timeline-with-delay-and-range.tentative.html`,
  `css/scroll-timeline-with-percent-delay.tentative.html`,
  `css/timeline-offset-keyframes-*.html`, `css/timeline-scope*.html`,
  `css/view-timeline-lookup.html`, `css/scroll-timeline-inactive.html`,
  `css/scroll-timeline-axis-writing-mode.html`,
  `css/animation-duration-auto.tentative.html`.
- **Timing / API** : `scroll-timelines/scroll-animation-effect-fill-modes.tentative.html`,
  `scroll-animation-effect-phases.tentative.html`,
  `intrinsic-iteration-duration.tentative.html`,
  `progress-based-effect-delay.tentative.html`, `setting-current-time.html`,
  `setting-start-time.html`, `current-time-writing-modes.html`,
  `scroll-timeline-source-single-axis-*.html`,
  `view-timelines/range-boundary.tentative.html` (inclusivité des bornes).
- **Triggers** : `animation-trigger/animation-trigger-{play,once,repeat,alternate,state,replay,play-forwards-backwards}.tentative.html`,
  `timeline-trigger-source-starts-in-trigger-range.tentative.html`,
  `animation-trigger-fill-mode-{both,none}.tentative.html`,
  `animation-trigger-disarmed-by-apis.tentative.html`,
  `animation-trigger-addAnimation.tentative.html`, `trigger-scope-*.tentative.html`.

---

## 11. Questions ouvertes pour S1 (mesures, pas décisions)

1. Valeur de `P` sans transform : `offsetTop` cumulé (arrondi entier) contre
   `getBoundingClientRect` corrigé, et coût de chacune (cf. R4).
2. Position statique d'un sujet sticky (§5).
3. Comportement de chaque moteur au défilement max pour `fill: none` (D1).
4. `animation: x 1s 0.5s` + `animation-timeline` dans les 3 moteurs (D5).
5. Origine / signe de la progression pour `column-reverse` (D13).
6. Activation d'un trigger enjambé par un saut de défilement (§6.5).
7. Nom réel de l'interface trigger exposée par Chrome (D9).
8. Nom de plage `view` utilisé sur une `scroll()` (§3.1).

## Sources

- Specs : liens §0 (ED du 2026-11-03).
- Issues / PR : [csswg-drafts#12134](https://github.com/w3c/csswg-drafts/issues/12134),
  [#13819](https://github.com/w3c/csswg-drafts/pull/13819),
  [#13364](https://github.com/w3c/csswg-drafts/issues/13364),
  [#12581](https://github.com/w3c/csswg-drafts/issues/12581),
  [#13852](https://github.com/w3c/csswg-drafts/issues/13852),
  [#5223](https://github.com/w3c/csswg-drafts/issues/5223),
  [#9181](https://github.com/w3c/csswg-drafts/issues/9181),
  [#8438](https://github.com/w3c/csswg-drafts/issues/8438),
  [#13010](https://github.com/w3c/csswg-drafts/issues/13010).
- Chrome : https://developer.chrome.com/blog/scroll-triggered-animations,
  https://developer.chrome.com/release-notes/146, Intent to Ship
  https://groups.google.com/a/chromium.org/g/blink-dev/c/TZLFLjzt4II,
  explainer https://github.com/explainers-by-googlers/scroll-triggered-animations.
- Archive CSSWG (carrousel Safari/Chrome) :
  https://lists.w3.org/Archives/Public/public-css-archive/2025Apr/0790.html.
- MDN `animation-duration` (note sur les durées en secondes) :
  https://developer.mozilla.org/docs/Web/CSS/animation-duration ; BCD
  https://github.com/mdn/browser-compat-data.
- Polyfill : https://github.com/flackr/scroll-timeline (`src/scroll-timeline-base.js`).
- WPT : §10.
