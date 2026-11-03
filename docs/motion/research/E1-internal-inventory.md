# E1 — Inventaire interne de tout ce qui anime

> Travail 📚 E1 de la spec `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§5, §7 phase 0).
> Date : 2026-11-03, branche `feat/anime` (HEAD `415f4388`). Lecture seule : aucune modification du code.
> Périmètre : `packages/*`, `apps/doc/src` (hors `node_modules`, `dist`, `.vercel`, et la copie
> `packages/mcp/src/bundled/doc-src`, qui relève de E3). Aucune décision n'est prise ici.

## 0. Synthèse

- **Aucun import runtime de `motion/react` dans les paquets publiés** (`core`, `ui-react`, `ui-angular`, `ui-svelte`). Le seul usage de `motion/react` se trouve dans l'app de doc (4 fichiers).
- **Motion (vanilla `motion`) : 12 fichiers runtime dans `@udixio/core/dom`** : carousel, circular-progress, custom-scroll (`scroll()`), date-picker, fab-menu, linear-indeterminate, navigation-rail-item, side-sheet, slider, snackbar, state-layer (`animate` + `press`), tabs.
- **anime.js : 7 fichiers runtime dans `@udixio/core/dom`** : auto-layout (`createLayout`), badge, fab (`cubicBezier`), search, split-button, switch, tooltip. text-field passe par auto-layout.
- **Le type `Transition` de Motion est public** : 5 interfaces de core (`button`, `icon-button`, `side-sheet`, `snackbar`, `state-layer`), 2 constantes exportées (`DEFAULT_CAROUSEL_TRANSITION`, `DEFAULT_BUTTON_SHAPE_TRANSITION`, ce dernier au format Motion sans être typé `Transition`), les options de 4 contrôleurs exportés, et 3 props React locales (`Chip`, `NavigationRail`, `NavigationRailItem`).
- **Les unités de durée ne sont pas cohérentes** sur l'API publique : secondes (Motion, chip, state-layer, nav rail) contre millisecondes (anime : badge, tooltip ; progress `transitionDuration`).
- **Il n'existe aucun token de motion M3** (aucun `emphasized`, `short1…extraLong4`, `md.sys.motion`). Les durées et easings sont codés en dur, contrôleur par contrôleur. La seule centralisation est `fab-motion.ts`, qui n'est pas exportée.
- **Dépendance en trop : `lenis`** (dépendance dure de ui-react, en plus inlinée dans le bundle) sert `SmoothScroll`.
- **Anomalies relevées** (§6) : le fallback `scrollDriven.ts` est désaccordé du plugin `anim-*` ; la clé `--anim-eases` comporte une faute de frappe ; anime.js est inliné dans `dist` de core alors qu'il est aussi déclaré en dépendance ; `RippleEffect` est exporté mais orphelin ; le curseur clignotant de Chips n'existe pas en Angular.

Légende « Moteur » : **M** = `motion` vanilla, **A** = anime.js v4, **CSS** = transition/animation CSS (Tailwind ou style inline), **Lenis**, **IO** = IntersectionObserver, **natif** = API DOM (`scrollTo({behavior:'smooth'})`…).
Légende « Adaptateurs » : **R** = React, **Ng** = Angular, **S** = Svelte. Câblage habituel : R = `useEffect`/`useLayoutEffect` + `destroy()` au cleanup ; Ng = `afterRenderEffect`/`afterNextRender` + `DestroyRef` ; S = `$effect` (ou attachment `{@attach}`) avec `untrack` sur les options. Les trois adaptateurs appellent **le même contrôleur core** pour tous les effets JS. Aucun adaptateur n'utilise d'API d'animation propre à son framework : ni `@angular/animations`, ni `animate.enter/leave`, ni `svelte/transition`, ni `animate:`.

---

## 1. Tableau principal (trié par famille §5)

Une ligne correspond à un effet. Quand un effet relève de plusieurs familles, il est rangé sous sa famille principale et les autres familles sont indiquées entre parenthèses.

### F1 — Tokens (durées, easings, springs)

| Fichier:ligne | Composant | Effet / contenu | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/fab-motion.ts:2-8` | Fab, FabMenu | `FAB_MOTION_DURATION_MS = 300`, `FAB_MOTION_EASING = [0,0,0.58,1]` et la classe Tailwind équivalente `duration-300 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none`, pour accorder le JS et le CSS | A (via `cubicBezier`), M (tableau), CSS | **Non** : ni `src/index.ts` ni `dom.ts` ne l'exportent (contraire à la règle « tout exporter ») | consommé par `fab.ts`, `fab-menu.ts`, `fab.style.ts`, `fab-menu.style.ts` |
| `packages/core/src/lib/behaviors/button.behavior.ts:10-14` | Button, IconButton | `DEFAULT_BUTTON_SHAPE_TRANSITION = { type:'spring', visualDuration:0.3, bounce:0.2 }` (format Motion) | M | Oui (exportée par `behaviors/index`) | R, Ng, S via `getButtonShapeTransition` / `getIconButtonShapeTransition` |
| `packages/core/src/lib/dom/carousel.ts:8-14` | Carousel | `DEFAULT_CAROUSEL_TRANSITION`, un spring `{stiffness:260, damping:32, mass:0.6, restDelta:0.0005}` | M | Oui (constante exportée, typée `Transition`) | R, Ng, S |
| `packages/core/src/lib/dom/tabs.ts:14,100-104` | Tabs, TabPanel | indicateur `{duration:0.3}` ; panneau en spring `{stiffness:400, damping:40}` | M | Non (constantes internes ; surchargeables via l'option `transition`) | R, Ng, S |
| `packages/tailwind/src/plugins-tailwind/animation.ts:421-475` | plugin `anim-*` | échelles `anim-duration-{75…3000}`, `anim-delay-*`, `anim-ease-{linear,in,out,in-out}` (courbes M2 `0.4,0,0.2,1` etc.) ; valeurs par défaut `300ms` et `cubic-bezier(0.4,0,0.2,1)` | CSS | Oui (utilitaires publics de `@udixio/tailwind`) | indépendant du framework |
| `packages/tailwind/src/plugins-tailwind/state-group.ts:5,17-18` et `emit/state.css.ts:5,29-30` | utilitaires `state-*` | transition des couleurs d'état `transition-colors duration-150` | CSS | Oui (utilitaires) | tous |
| durées codées en dur dans chaque contrôleur (voir F2/F3) | — | exemples : 0.1 s snackbar, 100 ms slider, 150 ms switch (`inQuart`), 200 ms badge, auto-layout, text-field (`outCubic`), 240 ms split-button (`out(3)`), 0.22 s date-picker, 300 ms tooltip, 0.3 s side-sheet, nav-rail, tabs, chip, 0.5/0.3 s ripple, 1.5 s progress | M/A | via les options (§2) | — |

### F2 — Transitions d'état

| Fichier:ligne | Composant | Effet visuel | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/state-layer.ts:128` (`applyShape`) (+F13) | Button, IconButton (StateLayer) | Le rayon de bordure se transforme en spring (« shape morph ») à la pression ou au basculement | M `animate(borderRadius)` | **Oui** : `ButtonProps.transition`, `IconButtonProps.transition`, `StateLayerShapeTransition.transition` (type `Transition`) | R `StateLayer.tsx`, Ng `state-layer.ts` (input `shapeTransition`), S `StateLayer.svelte` |
| `packages/core/src/lib/dom/split-button.ts:208` (+F13) | SplitButton | Les coins intérieurs passent d'un rayon à l'autre (tween d'un objet JS ; `onUpdate` écrit le style) | A `animate({value})`, `out(3)`, 240 ms | Non (codé en dur) | R, Ng, S |
| `packages/core/src/lib/dom/split-button.ts:390` | SplitButton | Le chevron du menu tourne de 0° à 180° | A, `out(3)`, 240 ms | Non | R, Ng, S |
| `packages/core/src/lib/dom/switch.ts:63` | Switch | La poignée se déplace (`translate [from,to]`) | A, `inQuart`, 150 ms | Option `duration` du contrôleur (pas de prop) | R `useLayoutEffect`, Ng, S |
| `packages/core/src/lib/styles/switch.style.ts:40` | Switch | La poignée change de taille (`transition-[width,height] duration-100`) | CSS | Non | tous (classes partagées) |
| `packages/core/src/lib/styles/slider.style.ts:17,20,23` | Slider | Pistes et poignée animées par `transition-all duration-100` | CSS | Non | tous |
| `packages/core/src/lib/styles/checkbox.style.ts:21` | Checkbox | Couleur de la case (`transition-colors duration-200`) | CSS | Non | tous |
| `packages/core/src/lib/styles/menu-item.style.ts:12` | MenuItem | Couleurs (`transition-colors duration-200`) | CSS | Non | tous |
| `packages/core/src/lib/styles/search.style.ts:14,41,49` | Search | Couleur de l'outline de focus (`transition-[outline-color] duration-200 ease-out motion-reduce:transition-none`) | CSS | Non | tous |
| `packages/core/src/lib/styles/text-field.style.ts:21,59,78,92` | TextField | Bordure (200 ms), label flottant `transition-all duration-300`, indicateur actif `transition-all duration-300`, astuce autofill `duration-[5000000ms]` (gèle la couleur d'autofill, ce n'est pas une animation) | CSS | Non | tous |
| `packages/core/src/lib/styles/date-picker.style.ts:25` | DatePicker (cellule jour) | `transition-all duration-200` | CSS | Non | tous |
| `ui-react/.../DatePicker.tsx:259`, `ui-angular/.../date-picker.ts:97`, `ui-svelte/.../DatePicker.svelte:183` | DatePicker | Chevron année : `transition-transform duration-200` + `rotate-180` | CSS | Non | dupliqué dans chaque adaptateur |
| `packages/core/src/lib/styles/fab.style.ts:19-20` | Fab | Le padding et le `column-gap` de la pilule suivent le label (`transition-[padding,column-gap]` + `FAB_MOTION_TIMING_CLASS`) | CSS | Non | tous |
| `packages/core/src/lib/styles/fab-menu.style.ts:14-15` | FabMenu | Couleurs du déclencheur (`transition-[background-color,color]` + timing FAB) | CSS | Non | tous |
| `ui-react/.../StateLayer.tsx:107-109`, `ui-angular/.../state-layer.ts:71-72`, `ui-svelte/.../StateLayer.svelte:67` | StateLayer (Chip, Tab…) | `transition: <n>s` en style inline quand `transitionDuration` est fourni ; la couche d'état fond au lieu de sauter | CSS inline | **Oui** : `StateLayerProps.transitionDuration` (secondes) | R, Ng, S |
| `ui-react/.../Chip.tsx:184,396,400`, `ui-angular/.../chip.ts:50,70,149`, `ui-svelte/.../Chip.svelte:244,268,287` | Chip | Fondu de la couleur de sélection (`transition: <d>s`, toutes propriétés) | CSS inline | **Oui** : core `ChipProps.transition?: {duration?}` (s). **R** surcharge avec le type Motion `Transition` (`Chip.tsx:15,28`) | R, Ng, S |
| `ui-react/.../Tab.tsx:178`, `ui-svelte/.../Tab.svelte:94`, `ui-angular/.../tabs/tab.ts:87` | Tab | La couche d'état fond en 0.3 s : R et S passent `transitionDuration={0.3}` à StateLayer ; Ng écrit `style="transition: 0.3s"` en dur sur l'hôte `udx-state-layer` | CSS inline | Non | R, S, Ng (mécanismes différents) |
| `ui-react/.../NavigationRail.tsx:144,150`, `ui-angular/.../navigation-rail.ts:81`, `ui-svelte/.../NavigationRail.svelte:111` (+F7) | NavigationRail | `transition: 0.3s` inline sur le conteneur (largeur repliée/étendue) | CSS inline | **R seulement** : `transition?: Transition` (Motion), dont seule `duration` est lue. Ng et S codent 0.3 s en dur | R, Ng, S |
| `ui-react/.../NavigationRailItem.tsx:260-287`, `ui-angular/.../navigation-rail-item.ts:92,189`, `ui-svelte/.../NavigationRailItem.svelte:105,119,129` (+F11) | NavigationRailItem | `transition: 0.3s, gap d/2 (ou d/3) avec délai` : le gap est décalé par rapport au reste | CSS inline | R : `transition?: Transition` | R, Ng, S |
| `ui-react/.../ProgressIndicator.tsx:154-168,212`, `ui-angular/.../progress-indicator.ts:91-101,150,210-229`, `ui-svelte/.../ProgressIndicator.svelte:43-56,167` (+F15, F17) | ProgressIndicator (déterminé) | La largeur suit la valeur (`width Xms ease-in-out`) ; `max-height 200ms 0.5s` à 100 % ; cercle animé en `stroke-dashoffset` | CSS inline | **Oui** : `transitionDuration` (ms, défaut 1000) | R, Ng, S (chaînes dupliquées dans les 3) |

### F3 — Présence (entrée / sortie)

| Fichier:ligne | Composant | Effet visuel | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/badge.ts:147` | Badge | Apparition et disparition par `scale` + `opacity` de 0 à 1 ; masqué ensuite | A, `outCubic`, 200 ms | **Oui** : `BadgeProps.transition: BadgeTransition {duration (ms), ease (nom anime)}` | R `useEffect`, Ng `afterRenderEffect` (+ input `udxBadgeTransition`), S `$effect` |
| `packages/core/src/lib/dom/tooltip.ts:137` | Tooltip | Ouverture et fermeture par `opacity` + `height` (de 16 px à la hauteur mesurée) ; la surface reste montée | A, `outCubic`, 300 ms | **Oui** : `TooltipProps.transition: TooltipTransition {duration (ms), ease}` | R, Ng (input `transition`), S (attachment `tooltip.attachment.svelte.ts:173`) |
| `packages/core/src/lib/dom/search.ts:127` (+F7) | Search | Le panneau de résultats se déplie (`height` vers la hauteur cible, `opacity`) | A, `outCubic` | Option `duration` du contrôleur (pas de prop) | R, Ng, S |
| `packages/core/src/lib/dom/snackbar.ts:88` (+F7) | Snackbar | `height` de `0px` à `auto` à l'ouverture et à la fermeture | M, défaut `{duration:0.1}` | **Oui** : `SnackbarProps.transition: Transition` | R, Ng (input), S |
| `packages/core/src/lib/dom/side-sheet.ts:150,168` (+F7) | SideSheet | Largeur du conteneur de `0px` à `auto`, opacité de l'overlay | M, défaut `{duration:0.3}` | **Oui** : `SideSheetProps.transition: Transition` | R, Ng (input), S |
| `packages/core/src/lib/dom/tabs.ts:113-134` `animateTabPanelEnter` | TabPanel | Le panneau entrant glisse (`x ±100% → 0`) et apparaît en fondu (pas d'animation de sortie) | M spring | Fonction exportée, `transition?: Transition` | R `TabPanels.tsx` (`useLayoutEffect`), Ng `tab-panel.ts`, S `TabPanel.svelte` |
| `packages/core/src/lib/dom/date-picker.ts:46` | DatePicker (changement de mois) | Le nouveau mois glisse (`x ±distance → 0`) et apparaît en fondu | M, `easeOut`, 0.22 s | Option du contrôleur | R, Ng, S (`DatePicker.svelte` **et** `TextField.svelte`, qui embarque un date picker) |
| `packages/core/src/lib/dom/slider.ts:175` | Slider (bulle de valeur) | La bulle apparaît et disparaît par `scale 0↔1` | M, 0.1 s | Option `duration` | R, Ng, S |
| `packages/core/src/lib/dom/fab-menu.ts:207,218,268,279` (+F10, F11) | FabMenu (actions) | Les actions sont révélées par `clipPath inset` et fondu, en cascade (`ACTION_STAGGER = 0.06 s`), puis fermées en ordre inverse | M, `[0.4,0,0.2,1]`, 0.3/0.15/0.2 s | Non | R, Ng, S |
| `packages/core/src/lib/dom/navigation-rail-item.ts:76` (+F7, F11) | NavigationRailItem | Le label apparaît ou disparaît (`width/height: auto↔0`, opacité sur la moitié de la durée, retardée) | M, 0.3 s | R : prop `transition.duration` ; option `duration` | R `useLayoutEffect`, Ng, S |
| `packages/core/src/lib/dom/progress-visibility.ts:12-24` | ProgressIndicator | Pas d'animation : une minuterie masque l'indicateur `transitionDuration` ms après 100 %, pour séquencer la fin de la transition CSS | setTimeout | `transitionDuration` | R, Ng, S |

### F4 — Déclenchement à la vue

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/ui-react/src/lib/effects/AnimateOnScroll.ts:225-388` | `initAnimateOnScroll` (alias `AnimateOnScrollInit`, `animateOnScroll`) | Pose `data-anim-in-run` / `data-anim-out-run` quand un élément `anim-*` entre ou sort du viewport (IO, seuil `IO_THRESHOLD`, sens de défilement, `once`) ; lance des keyframes CSS | IO + CSS du plugin `anim-*` | **Oui** (exporté par ui-react ; appelé par `apps/doc/src/layouts/layout.astro:77-78`) | **R seulement**, mais le code est sans React. Ni Ng ni S ne l'exposent |
| `packages/tailwind/src/plugins-tailwind/animation.ts:100-218,347-410` | plugin `anim-*` | Keyframes `fade`, `scale`, `slide` (8 directions et alias), déclencheurs `anim-in`/`anim-out`, `anim-in-run`/`paused`, `@keyframes enter/exit` ; `spin` est commenté (l.306) | CSS | **Oui** (classes publiques) | tous |

### F5 — Lié au scroll

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/tailwind/src/plugins-tailwind/animation.ts:121-130,403-410` | `anim-*-scroll` | `animation-timeline: var(--anim-timeline, view())`, plage par défaut `entry 20% → cover 50%`, `anim-timeline-{block,inline,x,y}`, `data-anim-start/end` | CSS natif | Oui | tous |
| `packages/ui-react/src/lib/effects/AnimateOnScroll.ts:300-385` + `scrollDriven.ts:170-238` | fallback scroll-driven | Sans `animation-timeline`, import dynamique de `scrollDriven`, qui interpole opacité, translate, scale et rotate dans `requestAnimationFrame` au scroll. **Désaccordé, voir §6** | JS rAF | `initScrollViewFallback` n'est pas réexporté par `effects/index.ts` | R |
| `packages/core/src/lib/dom/custom-scroll.ts:170,177` | CustomScroll (Carousel) | Progression du scroll sur les axes x et y via `scroll()` de Motion, avec throttle de 75 ms, vers `onScroll` / `onProgress`. Pas d'animation en soi : Motion sert d'**écouteur de progression** | M `scroll()` | Option et métriques exportées (`CustomScrollMetrics`…) | R `effects/custom-scroll/custom-scroll.effect.tsx` (composant `CustomScroll` exporté), Ng `carousel.ts`, S `Carousel.svelte` |
| `packages/core/src/lib/dom/carousel.ts:120` (+F14, F13) | Carousel | La progression brute du scroll est lissée par un spring Motion (animation d'une **valeur**, `onUpdate`), puis les largeurs des items sont recalculées | M spring sur un nombre | **Oui** : `CarouselControllerOptions.transition: Transition`, `DEFAULT_CAROUSEL_TRANSITION` | R, Ng, S |

### F6 — Scroll piloté

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/ui-react/src/lib/effects/smooth-scroll.effect.tsx:54-111` | `SmoothScroll` | Défilement lissé du document par Lenis, boucle rAF permanente, easeOutQuint, 1.2 s | **Lenis** | **Oui** : props `transition` (s ou chaîne), `easing`, `orientation`, `smoothTouch`, `touchMultiplier` | R seulement |
| `packages/core/src/lib/dom/custom-scroll.ts:243-263` | CustomScroll | `scrollTo({progress\|scroll})` et l'événement `udx:customScroll:set` : saut **instantané** (`scrollLeft/Top =`) | aucun | Oui | R, Ng, S |
| `ui-react/.../Tabs.tsx:133` | Tabs défilables | Centre l'onglet sélectionné avec `scrollTo({behavior:'smooth'})` | natif | Non | **R seulement** (rien d'équivalent trouvé en Ng ou S) |
| `ui-react/.../Chips.tsx:140,250-253`, `ui-svelte/.../Chips.svelte:134` | Chips | Défilement doux vers la puce ajoutée ou sélectionnée | natif | Non | R, S (pas en Ng) |
| `ui-react/.../DatePicker.tsx:113`, `ui-angular/.../date-picker.ts:372`, `ui-svelte/.../DatePicker.svelte:117`, `TextField.svelte:304` | DatePicker (années) | `scrollIntoView({block:'center'})` **instantané** | natif | Non | R, Ng, S |

### F7 — Layout (dont tailles `auto`)

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/auto-layout.ts:70-113` | `createAutoLayoutController` | FLIP générique via `createLayout` ; contourne la restauration du scroll d'anime Layout (l.91-103) ; muet sous reduced motion | A Layout, `outCubic`, 200 ms | **Oui** (exporté par `@udixio/core/dom`) | pas d'appel direct par les adaptateurs ; utilisé par fab et text-field |
| `packages/core/src/lib/dom/fab.ts:67-98` | Fab (étendu ↔ replié) | La largeur `auto↔0` et l'opacité du label passent par Layout | A Layout, `cubicBezier(0,0,0.58,1)`, 300 ms | Option `duration` | R `Fab.tsx` (`useLayoutEffect`), Ng `fab.ts`, S `Fab.svelte` |
| `packages/core/src/lib/dom/text-field.ts:46-57` | TextField (label et encoche de l'outline) | Layout sur une racine étroite autour du label | A Layout, `outCubic`, 200 ms | Option | R, Ng, S |
| `packages/core/src/lib/dom/fab-menu.ts:158` | FabMenu (déclencheur) | Le déclencheur passe de la taille du FAB à celle du bouton de fermeture : `width`, `height`, `borderRadius` mesurés (FLIP manuel) | M, timing FAB | Non | R, Ng, S |
| `packages/core/src/lib/dom/tabs.ts:76` (+F8) | Tabs (indicateur) | L'indicateur suit l'onglet actif (`x`, `width` mesurés) ; ResizeObserver | M, 0.3 s | Option `transition: Transition` ; aucune prop Tabs | R `useLayoutEffect`, Ng, S |
| (voir F3) snackbar, side-sheet, search, navigation-rail-item | — | animations de `height` / `width` vers `auto` | M/A | — | — |

### F8 — Élément partagé

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `apps/doc/src/components/Sidebar.tsx:289-292` | Doc : sommaire | Le cadre de la section active glisse d'un lien à l'autre (`layoutId="doc-sidebar-button"`) | `motion/react` | Doc uniquement | R (doc) |
| (Tabs indicator ci-dessus) | Tabs | Ce n'est pas un élément partagé au sens strict, mais il joue le même rôle | M | — | — |

### F10 / F11 — Listes, stagger, chorégraphie

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/fab-menu.ts:27,205-226,265-290` | FabMenu | Délai calculé `(n-i-1) × 0.06 s`, fondu décalé de 0.15 s après le clip, ordre inversé à la fermeture, compteur `generation` contre les interruptions | M | Non | R, Ng, S |
| `packages/core/src/lib/dom/linear-indeterminate.ts:35,49,54` (+F12) | ProgressIndicator linéaire indéterminé | 3 barres en keyframes à `times` synchronisés, `repeat: Infinity` | M, `easeInOut`, 1.5 s | Option `duration` | R, Ng, S |
| `apps/doc/src/components/theme/TokenGallery.tsx:154-192` | Doc : galerie de tokens | `AnimatePresence` sur la hauteur et l'opacité, `variants` de grille en cascade, `layout` sur les items | `motion/react` | Doc | R (doc) |

### F12 — Contrôle

Tous les contrôleurs conservent leurs handles (`AnimationPlaybackControls` de Motion, `JSAnimation` d'anime) et appellent `.stop()` / `.cancel()` / `.then()` en interne, pour l'interruption, la fin et la remise à `auto`. Aucun contrôle play/pause/seek n'est exposé publiquement. Les types `AnimationPlaybackControls*` (M) et `JSAnimation` (A) restent internes : aucune interface publique ne les retourne, **sauf** `animateTabPanelEnter`, qui retourne `AnimationPlaybackControlsWithThen | undefined` (type Motion public, `tabs.ts:123`).

### F13 — Interruption et physique

Les springs Motion qui reprennent avec la vitesse courante sont : la forme Button/IconButton (`state-layer.ts:128`), le lissage du Carousel (`carousel.ts:120`) et le panneau Tab (`tabs.ts:130`). Côté anime (split-button, switch, badge, tooltip), l'interruption se fait par `cancel()` puis un nouveau tween depuis la valeur courante, sans conserver la vitesse.

### F14 — Valeurs réactives

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/state-layer.ts:137-180` | Ripple (StateLayer) | `press()` de Motion (détection du geste), puis le ripple est animé via la **variable CSS** `--udixio-ripple-radius 0%→100%` (`easeOut`, 0.5 s) et sort en fondu (0.3 s) | M `press` + `animate` (variable CSS) | Options `enterDuration` / `exitDuration` ; aucune prop | R `StateLayer.tsx` et `effects/ripple/RippleEffect.tsx`, Ng, S |
| `apps/doc/src/components/theme/PaletteToneRow.tsx:58-76,142-166` | Doc : rangée de tons | `useMotionValue` (curseur), `useSpring`, `useTransform` vers largeur, position et opacité | `motion/react` | Doc | R (doc) |
| carousel (F5) | — | spring appliqué à un nombre | M | — | — |

### F15 — Animation de valeurs

Pas de compteur. Proches : le tween du rayon dans split-button (objet `{value}`, `split-button.ts:208`), le spring du carousel (nombre) et la largeur du progress déterminé (CSS).

### F17 — SVG

| Fichier:ligne | Composant | Effet | Moteur | API publique ? | Adaptateurs |
|---|---|---|---|---|---|
| `packages/core/src/lib/dom/circular-progress.ts:32,37` (+F12) | ProgressIndicator circulaire indéterminé, Button `loading` | Le SVG tourne (`rotate -90→270`, linéaire) et le cercle combine `pathLength [0.1,0.9,0.1]` + `rotate`, `repeat: Infinity` | M (`pathLength` est spécifique à Motion) | Option `duration` | R `ProgressIndicator.tsx`, Ng `progress-indicator.ts` **et** `button/button-loading-indicator.ts`, S |
| ProgressIndicator déterminé (F2) | — | `stroke-dashoffset` en transition CSS | CSS | `transitionDuration` | R, Ng, S |
| `apps/doc/src/components/theme/ThemePicker.tsx:480-505` | Doc : chevron et accordéon | `motion.svg animate={{rotate}}` + `AnimatePresence` sur la hauteur | `motion/react` | Doc | R (doc) |

### F18 — Gestes

| Fichier:ligne | Composant | Effet | Moteur | API publique ? |
|---|---|---|---|---|
| `packages/core/src/lib/dom/state-layer.ts:137` | StateLayer | `press()` de Motion : seul usage de Motion pour les gestes (pointeur et clavier unifiés) | M | Non |
| `packages/core/src/lib/dom/custom-scroll.ts:~190-225` | CustomScroll | Glisser à la souris (`dragSensitivity`), sans inertie | DOM | Option `draggable`, `dragSensitivity` |
| `packages/core/src/lib/dom/slider.ts:50` | Slider | Glisser du pointeur (logique de valeur, sans animation) | DOM | — |

### F20 — Accessibilité (reduced motion)

- **17 copies** de `function systemPrefersReducedMotion()` dans `packages/core/src/lib/dom/*.ts`. Chaque contrôleur accepte `reducedMotion?: () => boolean` (option exportée) et saute alors à l'état final, ou met la durée à 0 pour le ripple.
- CSS : `motion-reduce:transition-none` seulement dans `FAB_MOTION_TIMING_CLASS` et `search.style.ts`. **Toutes les autres transitions CSS** (checkbox, slider, switch, text-field, date-picker, menu-item, state-*, styles inline des chips, nav rail et progress) **ignorent reduced motion**.
- Plugin `anim-*` : aucune règle `prefers-reduced-motion` en CSS. Seul le JS `initAnimateOnScroll` renvoie un no-op sous reduced motion (`AnimateOnScroll.ts:230`), si bien que les éléments `anim-*` restent dans leur état `paused` initial (à vérifier en E3/S1).
- `SmoothScroll` (Lenis) n'a aucune garde reduced motion.

### F21 — Performance

Aucune pause en onglet caché. Points notables : `SmoothScroll` fait tourner une boucle rAF permanente ; les indéterminés circulaire et linéaire répètent à l'infini sans `IntersectionObserver` ; le fallback scroll-driven pose un `MutationObserver` sur tout le document (`scrollDriven.ts:220`, `AnimateOnScroll.ts:320`).

### F22 — Usage interne (synthèse pour la migration)

| Moteur | Fichiers runtime core/dom |
|---|---|
| `motion` (12) | carousel, circular-progress, custom-scroll, date-picker, fab-menu, linear-indeterminate, navigation-rail-item, side-sheet, slider, snackbar, state-layer, tabs |
| `animejs` (7 + 2 dépendants) | auto-layout, badge, fab (`cubicBezier` + auto-layout), search, split-button, switch, tooltip ; text-field via auto-layout |

Les tests reflètent cette répartition : 17 specs core, ainsi que `ui-react/src/tests/{Search,Slider}.spec.tsx` et `ui-angular/src/lib/slider/slider.spec.ts`, font `vi.mock('motion' | 'animejs')`. Ils devront migrer avec les contrôleurs.

### Familles sans aucun existant

F9 (View Transitions de route), F16 (texte), F19 (scopes responsive), F23 (outillage agents). F15 n'est couverte que partiellement.

**Hors catalogue §5** : *boucles infinies et keyframes décoratives* (progress indéterminés et curseur clignotant des Chips, `ui-react/.../Chips.tsx:305-320` et `ui-svelte/.../Chips.svelte:140-142`, keyframes CSS `blink` injectées par une balise `<style>`, **absentes en Angular**). Ce motif ne trouve pas sa place dans F1–F23 ; on peut le ranger sous F11/F12 ou ouvrir une famille dédiée (à trancher en B1).

---

## 2. API publiques impactées (breaking changes potentiels)

### 2.1 Type `Transition` de Motion exposé

| Emplacement | Symbole | Remarque |
|---|---|---|
| `packages/core/src/lib/interfaces/button.interface.ts:2,79` | `ButtonProps.transition?: Transition` | Ng input `button.ts:150`, S `button.types.ts`, R `Button.tsx:192` |
| `packages/core/src/lib/interfaces/icon-button.interface.ts:1,40` | `IconButtonProps.transition?: Transition` | Ng input `icon-button.ts:137` ; repris par `Toolbar.tsx:231` (`action.transition`) |
| `packages/core/src/lib/interfaces/state-layer.interface.ts:1,7,33` | `StateLayerShapeTransition.transition: Transition`, `StateLayerProps.shapeTransition` | Ng input `shapeTransition` |
| `packages/core/src/lib/interfaces/side-sheet.interface.ts:1,30` | `SideSheetProps.transition?: Transition` | Ng input `side-sheet.ts:149` |
| `packages/core/src/lib/interfaces/snackbar.interface.ts:1,20` | `SnackbarProps.transition?: Transition` | Ng input `snackbar.ts:92` |
| `packages/core/src/lib/dom/carousel.ts:8,32` | `DEFAULT_CAROUSEL_TRANSITION`, `CarouselControllerOptions.transition` | |
| `packages/core/src/lib/dom/tabs.ts:24,122-123` | `TabsIndicatorControllerOptions.transition`, `animateTabPanelEnter({transition})` et son type de retour Motion | |
| `packages/core/src/lib/dom/side-sheet.ts:105`, `snackbar.ts:35` | options des contrôleurs | |
| `packages/core/src/lib/behaviors/button.behavior.ts:10` | `DEFAULT_BUTTON_SHAPE_TRANSITION` (littéral Motion `visualDuration`/`bounce`) | |
| `packages/ui-react/src/lib/components/Chip.tsx:15,28` | `Chip` prop `transition?: Transition` | **diverge** du core (`{duration?: number}`) |
| `packages/ui-react/src/lib/components/NavigationRail.tsx:13,37` et `NavigationRailItem.tsx:14,46` | prop `transition?: Transition` (seule `duration` est lue) | **Absente en Ng et S** : écart de parité |

Ng et S reçoivent ces types par les interfaces core (`SideSheetProps['transition']`…). Le `.d.ts` de core importe donc `motion`, ce qui justifie que `motion` y soit une **dépendance dure** tant que ces types restent publics.

### 2.2 Types de transition propres à anime.js

- `BadgeTransition` (`badge.interface.ts:2-7`) et `TooltipTransition` (`tooltip.interface.ts:14-19`) : `{duration (ms), ease?: string}`, où `ease` est un **nom d'easing anime.js** (`'outCubic'`). Ce vocabulaire de moteur fuit dans l'API.
- `AutoLayoutControllerOptions.ease?: EasingParam` (`auto-layout.ts:21`) : type anime.js public.

### 2.3 Autres surfaces publiques liées au motion

- `transitionDuration` : `StateLayerProps` (en **secondes**) et `ProgressIndicatorProps` (en **ms**, défaut 1000). Même nom, unités différentes.
- `ChipProps.transition?: {duration?: number}` (secondes).
- `reducedMotion?: () => boolean` et `duration` dans les options de **tous** les contrôleurs exportés par `@udixio/core/dom` (24 modules).
- ui-react : `SmoothScroll` (+ `SmoothScrollProps`), `initAnimateOnScroll` / `AnimateOnScrollInit` / `animateOnScroll` (+ `AnimateOnScrollOptions`), `CustomScroll` / `ReactCustomScrollProps`, `RippleEffect`.
- `@udixio/tailwind` : toute la famille de classes `anim-*` (et les attributs `data-anim-*`).

### 2.4 Unités incohérentes (à normaliser par B2)

Sont en secondes : les `Transition` Motion, `ChipProps.transition.duration`, `StateLayerProps.transitionDuration`, la nav rail, les options `duration` des contrôleurs Motion (date-picker 0.22, slider 0.1, circular 1.5…).
Sont en millisecondes : `BadgeTransition`, `TooltipTransition`, `ProgressIndicatorProps.transitionDuration`, les options `duration` des contrôleurs anime (switch 150, auto-layout 200, fab 300, search…).

---

## 3. Dépendances

| package.json | `motion` | `animejs` | `react` | autres |
|---|---|---|---|---|
| racine | — | — | — | `@emotion/is-prop-valid` (dev ; faux positif « motion ») |
| `packages/core` | **dep** `^12.23.0` | **dep** `^4.5.0` | **peer** `>19.0.0` + dev `^19.1.1` | — |
| `packages/ui-react` | **dep** `^12.23.0` (n'est utilisée **que pour des imports de type** + tests) | dev `^4.5.0` (tests) | peer `>19.0.0` | **`lenis` dep `^1.2.3`** (SmoothScroll) |
| `packages/ui-angular` | dev `^12.23.0` (`slider.spec.ts`) | — | — | arrive transitivement par `@udixio/core` (peer) |
| `packages/ui-svelte` | — | — | — | idem, transitif via core |
| `packages/tailwind`, `theme`, `mcp` | — | — | — | — |
| `apps/doc` | dep `^12.23.3` (`motion/react` ×4) | — | dep | `@angular/animations ~21.2.18` (déclarée, aucun import trouvé) |

**Bundling** :
- `packages/core/vite.config.mts:43-51` : `external` liste `motion` et `motion/react`, mais **pas `animejs`**. anime.js est donc **inliné** dans `dist/dom.js` (le `dist` local du 25/10, ~129 Ko, ne contient aucun `from "animejs"`) tout en restant déclaré en `dependencies`. Le code est doublé chez un consommateur qui installe animejs lui-même. `motion/react` est externalisé alors qu'il n'est plus importé.
- `packages/ui-react/vite.config.ts:78-91` : `lenis` n'est pas externalisé (il est inliné) bien qu'il soit déclaré en dépendance.

**Pourquoi `react` est peer de `@udixio/core`** : un seul fichier, `packages/core/src/lib/utils/component.ts:1-2` (`import { JSX } from 'react/jsx-runtime'` ; `import React from 'react'`). Il sert au seul type utilitaire `ReactProps<T>` (`JSX.IntrinsicElements`, `React.RefObject`), réexporté par `utils/index.ts` puis par `src/index.ts`. Ce sont des imports de types seulement (marqués externes dans vite), mais ils sont écrits en `import` valeur et non en `import type`. La peer et le `jsx: react-jsx` des tsconfig n'existent que pour ce type. Aucun lien avec Motion. La dépendance pourrait migrer vers ui-react, hors périmètre de ce travail.

---

## 4. Tokens de motion existants

- **Theme (`@udixio/theme`)** : aucun token de motion. Le paquet ne traite que la couleur et la typographie.
- **Tailwind (`@udixio/tailwind`)** :
  - plugin `anim-*` (`plugins-tailwind/animation.ts`) : échelles `anim-duration-*` (75 à 3000 ms), `anim-delay-*`, `anim-ease-{linear,in,out,in-out}` avec les courbes **standard M2** (`0.4,0,1,1` / `0,0,0.2,1` / `0.4,0,0.2,1`), défauts `300ms` et `cubic-bezier(0.4,0,0.2,1)`, via les variables CSS `--anim-duration|delay|ease`.
  - `state-group.ts` et `emit/state.css.ts` : constante `DURATION = 150` pour les couleurs d'état.
  - Les utilitaires Tailwind natifs (`duration-*`, `ease-*`) sont utilisés tels quels par les styles de core.
- **Core** : `fab-motion.ts` (FAB 300 ms, `cubic-bezier(0,0,0.58,1)`, soit le `easeOut` CSS standard, présenté comme « courbe tween par défaut de Motion »), `DEFAULT_BUTTON_SHAPE_TRANSITION` (spring Motion), `DEFAULT_CAROUSEL_TRANSITION`, et une quinzaine de constantes `DEFAULT_TRANSITION` / `duration` locales.
- **Rien de M3** : aucun `emphasized`, `emphasizedDecelerate/Accelerate`, `standard (0.2,0,0,1)`, `short1…extraLong4`, ni spring `expressive`/`standard` M3. F1 part de zéro.

---

## 5. Faux positifs écartés

| Motif trouvé | Où | Pourquoi ce n'est pas une animation |
|---|---|---|
| `get*Transition` : `getCheckboxChangeTransition`, `getSwitchChangeTransition`, `getSliderKeyboardTransition`, `getSearchExpansionTransition`, `getSearchKeyboardTransition`, `getSplitButtonOpenTransition`, `getChipSelectionTransition`, `getMenuItemSelectionTransition`… | `core/src/lib/behaviors/*` et tous les adaptateurs | Transitions de **machine à états** (`{blocked, nextX}`), pas des animations |
| « Called once for each accepted … transition » | JSDoc des interfaces (carousel, date-picker, search, slider, menu-item, nav rail types S) | vocabulaire d'état |
| `FAB_MOTION_*`, `fab-motion.ts` | core | constantes internes. **Retenu en F1**, mais sans lien avec la lib Motion |
| `reducedMotion`, `systemPrefersReducedMotion`, `prefers-reduced-motion`, `motion-reduce:` | partout | politique d'accessibilité (F20), pas un import Motion |
| Commentaires « Motion's free tier has no layout… » | `auto-layout.ts`, `fab.ts`, `text-field.ts`, `fab.style.ts` | prose historique |
| `@emotion/is-prop-valid` | `package.json` racine | sous-chaîne « motion » |
| `requestAnimationFrame` de focus et de sélection | `Chips.tsx:116`, `Chip.svelte:119`, `Chips.svelte:95-98`, `TextField.tsx:163`, `text-field.ts:506` (Ng), `TextField.svelte:254-301`, `DatePicker.svelte:124`, `menu.ts:259-261` | sert à reporter le focus ou la sélection, pas à animer |
| `block-scroll.effect.tsx` | ui-react | bloque et redirige la molette (marqué « will be removed soon ») ; pas d'animation |
| `text-field-autosize.ts`, `anchor-positioner.ts`, `menu.ts` (hors rAF) | core/dom | mesure et positionnement sans animation. **Les menus et context menus ne sont pas animés aujourd'hui** |
| `autofill:transition-colors autofill:duration-[5000000ms]` | `text-field.style.ts:78` | astuce qui neutralise le fond d'autofill du navigateur |
| `import ... from 'motion' / 'animejs'` dans `*.spec.ts(x)` (≈20 fichiers) | tests | mocks `vi.mock` ; aucun effet runtime, mais ils migreront avec les contrôleurs |
| `transition` dans `apps/doc` (pages MDX, prose) et `packages/mcp/src/bundled/doc-src/**` | doc | copie de la doc, relève de E3 |
| `@angular/animations` | `apps/doc/package.json` | déclarée sans import trouvé (probablement requise par l'intégration Angular d'Astro, à confirmer en E3) |

---

## 6. Anomalies relevées en passant (pour B/S/phase 4, sans action ici)

1. **Le fallback scroll-driven est inerte** : `scrollDriven.ts:155-166` cible `.udx-view*.animate-in|out` et lit `--tw-enter-*`, alors que le plugin émet `anim-*` / `--anim-enter-*` et que `AnimateOnScroll.ts:370` ne l'importe que pour des candidats `anim-*scroll`. Ce sont deux vocabulaires différents : sans `animation-timeline` (Firefox), rien ne bouge.
2. **Faute de frappe `--anim-eases`** (`animation.ts:388`) dans les variantes directionnelles de `slide` : `anim-ease-*` n'y a aucun effet.
3. **anime.js inliné** dans la dist de core malgré sa déclaration en dépendance ; `lenis` est inliné dans ui-react ; `motion/react` est externalisé sans être utilisé.
4. **`motion` en dépendance dure de ui-react** alors que ui-react n'en fait qu'un usage de type (il l'obtient déjà par core).
5. **Écarts de parité liés au motion** : la prop `transition` de NavigationRail/Item n'existe qu'en React ; le défilement doux de Tabs n'existe qu'en React ; celui de Chips existe en R et S mais pas en Ng ; le curseur clignotant de Chips n'existe pas en Ng ; le type de `transition` de Chip diverge en React.
6. **`fab-motion.ts` n'est pas exporté**, ce qui contredit la règle projet « jamais de logique internal-only ».
7. **`RippleEffect` est exporté mais n'est utilisé par aucun composant** (StateLayer appelle directement le contrôleur).
8. **Les transitions CSS n'ont pas de garde reduced motion** (voir F20).
