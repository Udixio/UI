# @udixio/motion — étape 8 : finition avant publication

Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§8.6 étape 8 : F1, F19, F20, F21, F23 ; points
ouverts des §8.3.5 à §8.3.16). Branche `feat/anime`, pas de push. Vérification groupée à la fin de chaque sous-étape.
L'étape 9 (publication) se fait avec l'utilisateur.

## Sous-étapes

### 8a — Justesse (défauts connus de la bibliothèque)

1. **Élément partagé sur une page qui défile avec un élément `sticky`** : le morphing part à y = −23 px (barre latérale
   de la doc). Reproduire dans un spec navigateur, trouver la cause (coordonnées de défilement d'un porteur `sticky` ou
   d'une portée défilée), corriger, puis remettre la barre latérale de la doc sur `layout` + `shared` si c'est le bon
   outil.
2. **Valeurs en ligne au repos** (§8.3.5, §8.3.14) : à la fin d'un mouvement, un champ dont la valeur d'arrivée est la
   valeur neutre (`opacity: 1`, `x`/`y: 0`, `scale: 1`, `rotate: 0`, `draw: 1`, `along` : celle de l'auteur) est rendu
   au CSS ; une valeur non neutre reste en ligne. Ainsi `hover:scale-105` et les classes d'état de l'auteur
   s'appliquent au repos.
3. **Layout** : ancrage du défilement (`overflow-anchor: none` sur la portée pendant un vol, rendu après) ; élément
   suivi imbriqué dans un élément suivi qui change de taille (facteur d'échelle du parent) ; un déplacement clavier
   d'un `drag` vu comme un geste (pas de vol de layout).
4. **Valeurs** : `udxMotionValueChange` (Angular) n'émet qu'au repos et sur un changement de cible, pas à chaque image ;
   un changement de `--udx-motion` d'une valeur temporelle prend effet tout de suite.
5. **SVG** : `pathLength` rendu par un compteur de références ; sous mouvement réduit, `draw` est posé d'un coup (le
   tracé est un mouvement, pas un fondu).
6. **Présence** : un changement de `present` / `state` fait avant la définition d'un nom n'est plus perdu
   (`DeferredMotion` garde le dernier état) ; contenu rendu par le serveur en Angular et Svelte : pas d'entrée rejouée à
   l'hydratation (marquage côté serveur `data-presence="present"` lu à la liaison, comme React).
7. **Scrub** : `--udx-motion-scale` réduit l'amplitude.

### 8b — Poids et adaptateurs

Les adaptateurs chargent `@udixio/motion/value` et `/sequence` à la demande (≈ 7 kB rendus) ; aides d'attente d'une
définition dans le cœur (`valueWhenDefined`, `sequenceWhenDefined`), plus de duplication dans les adaptateurs ;
marge rendue à l'entrée principale.

### 8c — F19 : paliers et portées

`inspect()` (en développement : liaisons actives, définitions, politique) et `revert()` d'une portée (défait toutes les
liaisons sous une racine) ; mouvement conditionnel par palier : `--udx-motion` lu au déclenchement accepte un nom
(`md:[--udx-motion:rise]`) en plus de `none`. À éprouver dans la démo.

### 8d — Calibrage visuel (sous-agent Opus, design)

Revue des mouvements des composants et des presets dans un vrai navigateur (enregistrements image par image) contre
M3 Expressive : choix ressort / courbe par composant (durées allongées par la migration, dépassements des ressorts
spatiaux, sortie dont l'opacité finit avant le déplacement, conteneur et label du FAB, Carousel, FabMenu sans
`clip-path`), valeurs des presets. Sortie : une table de réglages argumentée, puis implémentation.

### 8e — Accessibilité, performance, navigateurs anciens

Audit d'accessibilité (skill `udixio-ui-governance:audit-accessibility` sur les composants migrés et la démo) ;
banc d'essai (layout, nombre d'animations, pause d'onglet caché F21) ; navigateurs anciens (Chrome 109, Firefox ESR,
iOS 18.5) : chemins de repli simulés (`linear()`, `ViewTimeline`, View Transitions, `sibling-index()`, `@property`).

### 8f — Doc et outillage IA (F23)

Doc complète de `@udixio/motion` sur le site (une page par famille, exemples dans les trois frameworks) ; `llms.txt`
et manifeste JSON (`spec.required` du layout, presets) ; exposition par `packages/mcp` ; skill d'usage à jour.
