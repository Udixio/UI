# M3 — Annotations des choix M1, M2, M4, M5 (vocabulaire, R12)

## M1 — moteur et rendu

- M1-V01 : valide — +coût prévisible par nom, un agent voit quel verbe charge du JS / −une classe par verbe reste une approximation (un `state` peut monter) / conflits: M5-S08, M1-01
- M1-V02 : valide — +`state` et `layout` restent natifs en `carry` ; le JS n'apparaît qu'avec le ressort / −deux niveaux de continuité à expliquer / conflits: M5-S08, M1-03
- M1-V03 : valide — +la plupart des écritures n'ont aucune option de reprise / −`disappear` interrompu par `appear` peut sauter ; défaut de `loop` divergent (restart ici, sans reprise en M5-V02) / conflits: M5-V02, M2-V06, M3-V04
- M1-V04 : valide — +une valeur fermée par verbe, publiée au manifeste / −`instant` supprime l'indication de `reveal` ; défaut de `reveal` à l'accord avec M3-V01 / conflits: M5-V02, M3-V01
- M1-V05 : valide — +le verbe reste stable quand le ressort change de moteur / −`linear()` absent des vieux Chrome de `defaults` / conflits: M5-V03, M5-S05 (retire les paramètres JS), M4-V07 (`ease` contre `easing`)
- M1-V06 : valide — +un nom par moteur et par nature, typage qui refuse `scrub` avec `range` / −`follow` ne sert pas le défilement et est retiré par M5-V08 / conflits: M5-V08, M5-V01, M4-V04
- M1-V07 : valide — +un seul mot pour écrire la sortie, un seul état pour la styler / −deux noms pour une même sortie à expliquer / conflits: M2-V03, M4-V03
- M1-V08 : valide — +un défilement n'est pas un effet d'élément, donc action et non verbe / −`tween` perd son nom pour un débutant / conflits: M5-V08, M3-V03, M4-V05
- M1-V09 : valide — +un agent ne peut pas inventer une valeur, le moteur se lit dans le nom / −domaine fermé à faire évoluer ; valeurs de seuil divergentes (`most` contre `half` et `full`) / conflits: M3-V05, M5-V03
- M1-V10 : valide — +`attributeFilter` sur une liste fermée générée depuis le manifeste / −plusieurs attributs par élément, plus verbeux / conflits: M5-V04 (verbe jamais écrit en HTML), M3-V07

## M2 — layout, partage, présence, listes

- M2-V01 : valide — +nom présent chez Motion et anime.js, aucun homonyme natif, `carry` évite le saut sur réordonnancement / −`layout` ambigu avec la mise en page CSS / conflits: M2-V02, M5-V08
- M2-V02 : neutre — +l'intention « partagé » est dite sans nommer la technique / −`shared` est en verbe ici, en option de `layout` pour M5-V08, en verbe pour M4-V06 : trois places possibles / conflits: M5-V08, M4-V06, M2-V09
- M2-V03 : conteste — +état interne libre de changer sans casser l'API / −contredit M3-V09 et M1-V07, qui lisent `data-presence` en CSS et par les agents / conflits: M3-V09, M1-V07, M4-V03
- M2-V04 : valide — +nom convergent (Motion, GSAP, anime.js), `from` évite le sens de lecture implicite / −`stagger` n'exprime pas une séquence complète / conflits: —
- M2-V05 : valide — +`drag` est un nom d'événement DOM évité, `reorder` dit le résultat / −aucun nom pour le déplacement libre / conflits: M5-V08 (primitive, pas verbe)
- M2-V06 : conteste — +un ressort de présence réapparaissant sur une sortie en cours ne saute pas / −`appear` et `disappear` en `carry` divergent de M1-V03 et M5-V02 (restart) ; coût JS par défaut / conflits: M1-V03, M5-V02, M5-S08
- M2-V07 : valide — +deux noms qui disent ce qui est mesuré et ce qui est corrigé / −`measure: size` rare et source d'erreurs / conflits: M2-03 (R10)
- M2-V08 : conteste — +un même vocabulaire d'effets, `fade` et `grow` convergents / −mélange origine (`rise`, `drop`) et sens (`sink`, `lift`), donc contredit M3-V06 ; `rise` contredit M3-V10 / conflits: M3-V06, M3-V10, M4-V09
- M2-V09 : valide — +`data-motion-shared` est une référence de nom, cohérente avec « attribut = référence » / −un second attribut à maintenir, portée du nom à régler / conflits: M4-V06 (`shared` verbe ou option)
- M2-V10 : valide — +une langue pour humains et agents, casse vérifiable par lint / −effort pour les francophones / conflits: —

## M4 — intégration frameworks, HTML

- M4-V01 : valide — +une seule liste pour les quatre environnements, collision testable / −liste à réviser à chaque majeure des frameworks / conflits: —
- M4-V02 : valide — +`loop` reste naturel sur un `<div>` sans renommage inutile / −le lint doit connaître l'élément cible / conflits: —
- M4-V03 : valide — +`data-presence` lisible par agent et stylable, rendu réduit décidé par le verbe / −`disappear` sonne moins naturellement qu'`exit` / conflits: M2-V03, M4-S02
- M4-V04 : valide — +trois noms qui décrivent le mécanisme, aucun homonyme natif / −`follow` retiré par M5-V01 et M5-V08 ; trois verbes à apprendre / conflits: M5-V01, M5-V08, M1-V06
- M4-V05 : valide — +aucun verbe `scroll` ni `view` ne collisionne avec les fonctions CSS / −F6 n'a plus de verbe, couvert par la doc seule / conflits: —
- M4-V06 : neutre — +deux mots courts pour F8 et F9, préfixe `view-transition` réservé / −`page` est un verbe retiré par M5-V08 et M5-V01 ; `shared` générique, collision entre îles / conflits: M5-V08, M2-V02, M2-V09
- M4-V07 : valide — +noms de Svelte et CSS retrouvés, valeurs par token / −`ease` (nom de Motion) exclu alors que M1-V05 et M1-V09 l'utilisent / conflits: M1-V05, M1-V09, M5-V03
- M4-V08 : conteste — +une même spec se lit dans les deux sens de l'écriture, `start` et `end` tiennent en RTL / −`up` et `down` désignent le sens, contre `from` (origine) de M3-V06 ; `left` et `right` exclus, contre M5-V03 / conflits: M3-V06, M5-V03
- M4-V09 : conteste — +espace `udx-` qui évite les collisions avec les définitions utilisateur / −les noms embarquent la direction (`udx-reveal-fade-up`), contre M3-V10 et M5-V06 ; contradit les alias de M5-V10 / conflits: M3-V10, M3-V06, M5-V05, M5-V06
- M4-V10 : valide — +`attributeFilter` sur chaque option, référence seule, une casse par couche / −plusieurs attributs alourdissent le HTML / conflits: M5-V04 (même règle, à unifier), M3-V07 (verbe écrit en HTML ou non)

## M5 — API, DX, outillage

- M5-V01 : valide — +sept mots au lieu de quinze, noms convergents (`scrub`, `layout`, `appear` / `disappear`) / −`follow` retiré alors que M1-V06 et M4-V04 le gardent ; `emphasize` à scinder / conflits: M1-V06, M4-V04, M2-V05, M2-V02
- M5-V02 : valide — +les cas courants n'exigent aucune décision de reprise, réduction tranchée par verbe / −`loop` sans reprise contredit M3-V04 (restart) ; sept défauts à justifier / conflits: M1-V03, M2-V06, M3-V04, M1-V04
- M5-V03 : valide — +une seule unité (ms), un agent ne peut pas écrire `0.37` ou `300ms` / −liste fermée, `direction` non personnalisable ; `direction` contre `from` (M3-V06) / conflits: M3-V05, M3-V06, M1-V09, M4-V08
- M5-V04 : valide — +`[data-motion-*]` interrogeable et observable sans parseur de chaîne / −beaucoup d'attributs sur un élément très animé ; verbe jamais écrit en HTML, contre M3-V07 / conflits: M3-V07, M4-V10 (même règle)
- M5-V05 : valide — +convergence forte (`fade`, `slide`, `scale`, `spin`), pas de direction dans le nom / −`pulse` en `emphasize` contre `pulse` en boucle (M3-V10) ; `collapse` exige la mesure / conflits: M3-V10, M4-V09, M2-V08
- M5-V06 : valide — +un seul sens par mot, évite le « down » contradictoire de R2 / −interdit `down` comme nom, contredit M4-V09 qui l'emploie / conflits: M4-V09, M2-V10 (même règle)
- M5-V07 : valide — +pas de collision silencieuse avec les frameworks ni avec les variables cœur de Tailwind / −liste à suivre à chaque version / conflits: M4-V01 (même liste)
- M5-V08 : valide — +un défilement ou un geste n'est pas un effet d'élément, le handle reste commun / −F9 sans nom propre dans le vocabulaire, `scrollTo` et `reorder` sans attribut HTML / conflits: M2-V02, M2-V05, M4-V06, M3-V03 (même action)
- M5-V09 : valide — +une fiche par entrée, le vocabulaire ne dérive pas en silence / −une règle de plus en revue / conflits: —
- M5-V10 : valide — +les échecs silencieux deviennent des erreurs qui citent le nom canonique / −la table vieillit avec les données d'entraînement ; `fade-up` vers `slide` plus `direction` n'est pas biunivoque / conflits: M4-V09 (`fade-up` canonique chez M4), M5-V07

## Doublons à fusionner

- Vue et scroll lié (`reveal`, `scrub`, `follow`) : M3-V01, M3-V02, M1-V06, M4-V04, M5-V01 → garder **M4-V04** (trois intentions, typage) ; absorber `repeat` de M3-V01 et les plages CSS de M3-V02 ; `follow` reste à trancher avec M5-V08.
- Défilement programmé : M3-V03, M1-V08, M4-V05, M5-V08 → garder **M3-V03** (action `scrollTo`) ; absorber le retrait du verbe `tween` de M1-V08.
- Défauts de reprise et de réduction : M5-V02, M1-V03, M1-V04, M2-V06 → garder **M5-V02** (table par verbe, une fois, dans le manifeste) ; absorber les valeurs de M1-V04 ; `appear` et `disappear` restent en `restart` (M2-V06 à retirer).
- Cascade : M2-V04, M3-V08, M4-V07 (`stagger`), M5-V03 (`stagger`) → garder **M2-V04** (option de conteneur) ; absorber les tokens de rythme de M3-V08.
- Grammaire HTML : M4-V10, M1-V10, M5-V04, M3-V07 → garder **M4-V10** (référence seule, options séparées, casse par couche) ; absorber `attributeFilter` de M1-V10 ; la question « verbe écrit en HTML ou non » reste à trancher (M3-V07 contre M5-V04).
- Présence : M4-V03, M1-V07, M2-V03, M2-S03 → garder **M4-V03** (`appear` / `disappear`, `data-presence` en lecture seule) ; absorber la clause de sortie de M1-V07 ; M2-V03 est contesté.
- Noms réservés : M5-V07, M4-V01, M5-S03 → garder **M5-V07** ; absorber la liste CSS et React de M4-V01.
- Langue et casse : M5-V06, M2-V10 → garder **M5-V06** ; absorber la règle « verbes à l'infinitif » de M2-V10.
- Presets : M5-V05, M3-V10, M2-V08, M4-V09 → garder **M5-V05** (dix presets, direction en option) ; absorber l'interdiction des directions dans les noms de M3-V10 ; M2-V08 et M4-V09 ne sont pas retenus en l'état.
- Options à domaine fermé : M5-V03, M1-V09, M3-V05, M4-V07 → garder **M5-V03** ; absorber les valeurs de seuil de M3-V05 après arbitrage avec M1-V09.

## Chevauchements non fusionnés (à arbitrer)

- Direction : M3-V06 (`from`, origine), M4-V08 (`up` / `down`, sens), M5-V03 (`direction` avec `up` / `down` / `left` / `right`), M2-V08 (`rise` / `sink`) : quatre conventions pour un même besoin.
- `shared` et `layout` : M2-V01, M2-V02, M5-V08 (option de `layout`), M4-V06 (verbe).
- `follow` : retiré par M5-V01 et M5-V08, gardé par M1-V06 et M4-V04.
