# R8 — Synthèse du débat : forme de l'API de @udixio/motion

Date : 2026-11-03 · Participants : P1 (classes Tailwind), P2 (formes par
framework), P3 (arbitre) · Statut : **consensus des trois agents, en attente
de validation par l'utilisateur** (entrée du brainstorming B1).

Fichiers sources : `P1-tour1..3.md`, `P2-tour1..3.md`, `P3-tour1.md`,
`P3-consensus.md`. Cette synthèse intègre le consensus de P3 **et** les
amendements de P2 (tour 3) et P1 (tour 3), qui ne se contredisent pas.

## Architecture retenue

**Un nom, plusieurs encodages.** Une animation est *définie une seule fois* en
TypeScript (nom + `MotionSpec` typé, dans un registre fermé `MotionName`).
Chaque environnement la *référence* sous sa forme naturelle. La forme permise
est déduite de la spec elle-même, pas d'un jugement de « complexité ».

Rejetés comme architectures : classes pures (échouent sur sortie, layout,
séquence, drag) et formes par framework seules (dérive entre frameworks, pas
de solution entre îles). Les formes par framework restent des *encodages*.

## Règles

| # | Règle |
|---|---|
| R1 | **Définir une fois** : nom + `MotionSpec` typé + entrée du registre fermé. Aucune syntaxe ne définit une animation. |
| R2 | **Référencer par encodage** : classe ou `data-udx-motion` (HTML/Astro), prop React, directive Angular, attachment Svelte. Tous résolvent la même clé typée. |
| R3 | **Prédicat de cycle** (liste fermée) : la spec requiert `exit`, `identity`, `measure`, `control` ou `continuousInput`, ou un état non exprimable en attributs/variables CSS → encodage framework (ou appel d'API core en HTML : `exit(el)`, `layout(el)`, `drag(el, name)`) **obligatoire**. |
| R4 | **Prédicat de moteur** : spring, déclenchement à la vue, valeurs réactives, compteurs, boucles. Si R3 est faux, classe ou attribut admis ; le JS se charge au besoin. |
| R5 | **Asymétrie** : l'encodage framework est toujours légal ; classe **et attribut** interdits si R3 est vrai. Vérification : classes par le plugin Tailwind au build (faisabilité à confirmer) ; attributs, props, directives par la suite de conformité et un scanner CLI. |
| R6 | **Forme ≠ moteur** : basculer du natif au JS ne change jamais l'écriture. |
| R7 | **Chargement** : une définition = un module. Un chunk JS par nom **qui a une part JS** ; un nom purement natif n'émet que du CSS. Le runtime ne choisit que parmi les noms du registre fermé ; un nom inconnu est une erreur visible. |
| R8 | **Îles** : l'identité partagée est un nom dans le DOM (`data-udx-shared`, `view-transition-name`). Jamais de contexte de framework ni de global. |
| R9 | **État, pas CSS** : un variant Tailwind associe un état à un nom via une variable CSS (`md:[--udx-motion:…]`). Un observateur par **type** de variant : `matchMedia` (breakpoints), `MutationObserver` (attributs `data-[…]`), `pointerenter/leave` (`hover:` — divergence tactile à documenter). |
| R10 | **Plugin de bundler optionnel** : le plugin Tailwind Udixio est requis ; aucun plugin Vite/esbuild ne l'est. `import()` est le chemin portable. La suite de conformité passe avec et sans plugin. Registre écrit à la main typé `satisfies Record<MotionName, Loader>` (`tsc` attrape un nom sans loader) ou généré par un script CLI. |

## Cas-tests

| Cas | HTML / Astro | React | Angular | Svelte | Chargement |
|---|---|---|---|---|---|
| T1a apparition à la vue, une fois | classe `motion-card-reveal-once` | `<Motion.div animation="card-reveal-once">` | `udxMotion="card-reveal-once"` | `{@attach motion('card-reveal-once')}` | IntersectionObserver partagé + attribut d'état, puis transition CSS * |
| T1b liée au scroll | classe `motion-card-reveal-scrub` | idem | idem | idem | 0 JS (`view()` natif) ; chunk de repli sinon |
| T2 dialog qui sort | `exit(el)` + `allow-discrete` natif | `<Motion.div presence>` (seul cas d'un wrapper de présence) | `animate.leave` natif via `udxMotion` | `transition:` natif | sortie native sans JS si supportée |
| T3 liste réordonnée | `layout(el)` + `data-key` | `<Motion.ul layout>` + `key` | `udxMotion="list-layout"` + `track` | `animate:flip` natif ou attachment | chunk layout seulement si utilisé |
| T4 élément partagé entre îles | `data-udx-shared="hero"` | `<Motion.div shared="hero">` | `udxShared="hero"` | `{@attach shared('hero')}` | 0 JS via View Transitions ; FLIP sinon |
| T5 séquence pilotée | handle `motion.get(el)` | ref + handle | `viewChild` + méthodes | contrôleur `$state` | chunk de la timeline |
| T6 drag | `drag(el, name)` | `<Motion.div drag="card-physics">` | `udxDrag` | `{@attach drag('card-physics')}` | chargé au premier `pointerdown` |
| T7 variants Tailwind | `md:[--udx-motion:…]` | même className | même classe | même classe | observateur par type de variant |
| T8 nom venu des données | `data-udx-motion={p.motion}` (`z.enum`) | `animation={p.motion}` typé | `[udxMotion]="p.motion"` | `motion(p.motion)` | chunk choisi parmi ceux du build |

\* Note de Claude (non débattue) : `animation-trigger` (Chromium seulement
selon R1) permettrait un « une fois » natif ; IntersectionObserver reste le
chemin des autres navigateurs, sans changement d'écriture (R6).

## Points ouverts (à traiter en B2/B3 ou en spike)

1. **R5** : le plugin Tailwind peut-il refuser un `motion-*` inconnu à partir
   du registre ? Sinon, les classes ne sont vérifiées que par conformité/scanner.
2. **CSS sans plugin de bundler** : un fichier unique pour tous les noms, ou un
   script CLI qui n'émet que les noms utilisés — à mesurer.
3. **Mesure avant mutation en React** (T3) : rect mémorisé au commit précédent
   (données distantes) et/ou capture au moment de l'événement utilisateur ;
   Angular à vérifier.
4. **`animationcancel`** au retrait d'`animation-name` : à vérifier ; repli sur
   les observateurs de R9.
5. **Présence dans une île HTML sans démontage** : limite à documenter.
6. **Svelte** : un `animation=` sur un élément HTML nu passe sans erreur ; lint
   de paquet à prévoir.
7. **`hover:` sur moteur JS en tactile** : divergence avec `:hover` à
   documenter ou à ne pas promettre.
