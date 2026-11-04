# R10 — Registre de choix de conception pour @udixio/motion

## Le projet

Udixio UI : bibliothèque de composants Material 3 open source, en React,
Angular et Svelte, utilisée aussi dans des sites Astro (« îles » : des
morceaux React, Svelte ou HTML pur cohabitent sur une page **sans contexte
partagé**, hydratés à des moments différents). On conçoit `@udixio/motion`,
la couche d'animation commune : utilisée par les composants Udixio eux-mêmes
et par les sites construits avec.

But : rendre le motion banal, fiable et agréable — pour un humain comme pour
un agent IA (une seule façon d'écrire, erreurs visibles plutôt que silencieuses).

## Étendue à supporter (les 24 familles)

| # | Famille | Exemples |
|---|---|---|
| F1 | Tokens | durées, easings, springs Material 3, easings personnalisés |
| F2 | Transitions d'état | hover, focus, `data-state`, propriétés discrètes, tailles `auto` |
| F3 | Présence | entrée / sortie au montage / démontage, `display:none` |
| F4 | Déclenchement à la vue | une fois / répété, seuils, direction (type AOS) |
| F5 | Lié au scroll | progression liée au défilement, plages, axe, conteneur |
| F6 | Scroll piloté | scrollTo animé, smooth scroll |
| F7 | Layout | FLIP : taille, position, `justify-*`, réordonnancement |
| F8 | Élément partagé | `layoutId` entre composants et entre îles |
| F9 | View Transitions | transitions de page / route (Astro inclus) |
| F10 | Listes | stagger, ajout / suppression, réordonnancement |
| F11 | Chorégraphie | séquences, décalages relatifs, propagation parent → enfants |
| F12 | Contrôle | play / pause / reverse / seek, promesses, événements |
| F13 | Interruption et physique | reprise d'une animation en conservant la vitesse |
| F14 | Valeurs réactives | suivi du curseur, parallaxe, mapping de valeurs |
| F15 | Valeurs / compteurs | animer un nombre, `animate(value)` |
| F16 | Texte | découpage lettres / mots / lignes, brouillage |
| F17 | SVG | tracé, morphing, trajectoire |
| F18 | Gestes | drag, lancer, inertie, swipe, drag-to-reorder |
| F19 | Responsive / scopes | comportement par breakpoint, nettoyage groupé |
| F20 | Accessibilité | reduced motion par famille, pause des boucles, focus |
| F21 | Performance | pause onglet caché, budgets, chargement à la demande |
| F22 | Usage interne | les composants Udixio (FAB, tabs, snackbar, text-field…) migrent dessus |
| F23 | Outillage IA | types stricts, détection des noms inconnus, doc pour agents |
| F24 | Boucles | progression indéterminée, curseur clignotant, pulsation |

## Une distinction structurante (observation du porteur)

Une partie de ces familles peut fonctionner **globalement** — un runtime qui
scanne la page et pose des observateurs, comme AOS (F4, F5, F24, une partie de
F2/F3). D'autres exigent une **coordination par instance ou entre instances** —
mesurer avant/après une mutation, retenir un nœud qui sort, relier deux
éléments par une identité, suivre un geste, piloter une séquence (F7, F8, F11,
F12, F13, F18, sorties de F3). Toute solution doit dire comment elle traite
ces deux natures, et comment elles cohabitent (y compris entre îles Astro).

## Préférences actuelles du porteur (CONTESTABLES, arguments à l'appui)

- Tailwind CSS est utilisé dans tout l'écosystème Udixio.
- anime.js v4 est le moteur JS envisagé ; le natif (CSS, WAAPI, View
  Transitions, scroll-driven) d'abord quand il existe.
- Navigateurs : browserslist `defaults`.
- Chaque framework tire parti de ses forces sans être bridé par les autres.
- Ne charger que ce qui est utilisé.

## Faits déjà établis (ne pas re-vérifier, vérifier le reste si besoin)

- Scroll-driven animations : Baseline depuis Firefox 159 (oct. 2026) ;
  `@starting-style`, `linear()`, View Transitions same-document : bloqués
  seulement par de vieux Chrome de `defaults` ; Chromium seul :
  `animation-trigger`, `interpolate-size`, `element.startViewTransition()`.
  Firefox ne transitionne pas vers `display:none`.
- Une déclaration CSS non supportée est jetée au parsing ; une `CSSAnimation`
  est recréée quand `animation-name` change ; un polyfill scroll-timeline
  global est à exclure (non maintenu, casse `@layer`).
- anime.js v4 : modulaire (animate ≈ 13 kB, layout ≈ 21 kB min+gz), Layout
  avec `data-layout-id`, `enterFrom/leaveTo`, Draggable, onScroll, splitText,
  morphTo, Timeline, `timeline.sync()` peut piloter une animation native ;
  son Layout coupe les `transition` CSS des descendants pendant le diff.
- Motion (motion.dev) vanilla propose `animateLayout` avec `data-layout-id` ;
  Motion React a dû créer `m` + `LazyMotion` car `motion.div` chargeait trop.
- Une animation d'entrée qui pousse l'élément hors écran peut empêcher son
  propre déclenchement IntersectionObserver.
- Débats précédents disponibles (entrées, PAS conclusions) :
  `docs/motion/research/R8-api-debat/R8-synthese.md`,
  `docs/motion/research/R9-tournoi/J2-finale-solution.md`.

## Ce qu'est un « choix »

Une décision de conception précise et nommée, qui s'applique à une ou
plusieurs familles. Exemples de forme (pas de fond) : « runtime global unique
qui scanne le DOM pour F4/F5/F24 », « identité partagée portée par un attribut
DOM », « séquences définies en TS et pilotées par un handle ». Chaque choix
porte : identifiant, énoncé, familles concernées, nature (global / instance /
les deux), avantages, limites, conflits avec d'autres choix, statut (proposé /
validé par X / contesté par Y).

## Règles

- Théorie et conception d'experts ; recherche web autorisée si un argument en
  dépend (citer la source). Pas d'audit du dépôt.
- Chacun n'écrit QUE ses propres fichiers dans `docs/motion/research/R10-choix/`.
- Aucune commande git. Respecter les limites de longueur.
