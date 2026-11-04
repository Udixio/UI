# M3 — Choix de vocabulaire : vue, scroll, boucles, seuils (R12)

### M3-V01 — Verbe `reveal` pour l'entrée à la vue
- Énoncé : l'entrée au franchissement d'un seuil s'écrit `reveal` ; une fois par défaut, `repeat` pour rejouer à chaque franchissement ; défaut de reprise `restart` ; rendu réduit `fade`, ou `instant` si le fondu est inapplicable. `enter` et `in` sont exclus (noms natifs Angular et Svelte).
- Familles : F3, F4
- Nature : global (observateur partagé)
- Avantages : nom court sans homonyme natif ; même mot que le mécanisme du runtime (M3-01 R10) ; un seul verbe pour toute la vue
- Limites : ne dit pas le sens du mouvement (voir V06) ; la sortie n'est pas un `reveal` mais un état (voir V09)
- Conflits : M2-S03 (présence = état, pas verbe) ; M5-S02 (`disappear` concurrent)

### M3-V02 — Verbe `scrub` et plages en mots CSS
- Énoncé : la progression liée à la position de défilement s'écrit `scrub` ; l'option `range` prend `entry | exit | cover | contain`, mots exacts de `animation-range` ; `scroller` nomme le conteneur ; pas de reprise (la position est la donnée) ; rendu réduit `instant` au point neutre.
- Familles : F5
- Nature : instance
- Avantages : mêmes mots qu'en CSS natif, aucune traduction à apprendre ; `scrub` est le mot de GSAP (R2) ; `range` fermé, donc aucun pourcentage libre
- Limites : `scrub` est peu connu hors GSAP ; `cover` et `contain` demandent une explication ; hors Firefox 159 la plage repose sur le repli nommé (M3-06 R10)
- Conflits : M5-S02 (`follow` absorbe `scrub`) ; M3-S01 (R11)

### M3-V03 — `scrollTo` comme action, pas comme verbe
- Énoncé : le défilement programmé est une action `scrollTo(cible, { duration, easing })`, nommée comme la méthode native parce qu'elle a le même sens ; durée et courbe sont des jetons ; aucun équivalent en attribut HTML en v1 ; rendu réduit `instant`.
- Familles : F6, F20
- Nature : instance
- Avantages : pas de seizième verbe ; le sens est celui du natif, seule la courbe change ; un agent le reconnaît sans lire la doc
- Limites : impossible en HTML pur sans JS ; le `smooth` natif ne règle pas la durée, d'où le repli tween
- Conflits : M5-S02 (`scroll` comme verbe, à retirer) ; M3-S02 (R11)

### M3-V04 — Verbe `loop` avec `pause` obligatoire
- Énoncé : toute boucle s'écrit `loop`, toujours infinie (une répétition finie est un `reveal repeat` ou une séquence) ; `pause` est obligatoire, valeur `control` (un contrôle est exposé) ou `essential` (animation justifiée, relue au lint) ; presets `pulse`, `blink`, `indeterminate` ; défaut `restart` ; rendu réduit figé sur l'état neutre.
- Familles : F24, F20, F21
- Nature : global (abonnement au runtime, M5-S09)
- Avantages : WCAG 2.2.2 devient une donnée vérifiée, pas un oubli ; `essential` rend l'exception explicite ; les presets évitent que chaque auteur réinvente la pulsation
- Limites : pas de boucle finie en v1, ce qui oblige à passer par un autre verbe ; `control` suppose un composant de contrôle
- Conflits : M5-S09 (abonnés) ; M5-S10 (lint de `pause`) ; M3-S03 (R11)

### M3-V05 — Seuils et marges en jetons nommés
- Énoncé : `threshold` prend `touch | quarter | half | full` (fraction de la cible visible) et `margin` prend `none | near | far` ; les valeurs réelles vivent dans `tokens.json`, jamais de nombre dans la grammaire.
- Familles : F4, F1
- Nature : global
- Avantages : un agent ne peut pas écrire `0.37` ; les mots reprennent l'intuition « quart, moitié, entièrement » ; une seule source pour toute la marque
- Limites : cinq mots ne couvrent pas tous les cas ; `margin` reste une distance relative à la fenêtre, à documenter
- Conflits : M3-S06 (R11, mêmes seuils) ; M5-S05 (tokens)

### M3-V06 — Direction par origine, jamais par sens
- Énoncé : l'option `from` prend `top | bottom | start | end | left | right` et désigne le côté d'où vient l'élément (convention « origine » de tw-animate) ; `start` et `end` suivent le sens de lecture ; `rise` vaut `from: bottom` ; aucun nom ne contient `up` ou `down`.
- Familles : F3, F4
- Nature : instance (option de verbe)
- Avantages : lève l'ambiguïté « down » relevée dans R2, où un même mot désigne deux mouvements opposés ; cohérent avec `slide-in-from-*` de Tailwind ; `start` et `end` tiennent en RTL
- Limites : migration à documenter pour qui vient d'AOS (`fade-down` devient `from: top`) ; `from` peut se lire comme une position absolue
- Conflits : V10 (presets) ; M5-S04 (classes Tailwind à aligner)

### M3-V07 — Grammaire HTML : verbe seul, options en `data-motion-<option>`
- Énoncé : `data-motion="reveal"` nomme le verbe ou la définition ; chaque option est un attribut `data-motion-<option>` à valeur de jeton fermé (`data-motion-from="bottom"`, `data-motion-threshold="half"`) ; noms et valeurs en anglais, kebab-case, minuscules ; `motion check` refuse toute valeur hors liste.
- Familles : F22, F23, F1
- Nature : global
- Avantages : chaque option s'observe à part (`attributeFilter`) ; chaque valeur est une référence à un jeton, ce qui respecte « attribut = référence » (R11) ; lint simple
- Limites : plusieurs attributs à garder synchrones avec la définition TS ; un élément très chargé devient verbeux ; une chaîne unique serait plus compacte mais non observable
- Conflits : M5-S01 (acquis R11) ; M5-S02 (grammaire) ; M4-S09 (spec verbeuse en attribut)

### M3-V08 — `stagger` pour la cascade, nom convergent
- Énoncé : la cascade s'écrit option `stagger` sur le groupe (`data-motion-group`), valeur fermée `tight | snug | medium | loose | wide` (noms de J4) ; ordre par index par défaut ; les valeurs réelles sont en jetons.
- Familles : F10, F11
- Nature : instance
- Avantages : `stagger` est déjà le mot de Motion, GSAP et anime.js (R2) ; le groupe se résout une fois (M3-S09 R11)
- Limites : `stagger` désigne une cascade, pas une séquence (F11 reste à part) ; un élément ajouté après le déclenchement sort de la cascade
- Conflits : M5-S02 (`sequence`) ; M3-S09 (groupes) ; M2-S04 (clé de liste)

### M3-V09 — États écrits par le runtime, jamais par l'auteur
- Énoncé : `data-view="in" | "out"` (observation), `data-presence="entering" | "present" | "exiting"` (présence) sont lus en CSS et par les agents, écrits seulement par le runtime ; le lint refuse leur écriture dans le HTML source.
- Familles : F3, F4, F21
- Nature : global
- Avantages : séparation nette entre ce que l'auteur déclare et ce que le runtime observe ; un agent ne peut pas forger un état ; noms observables par `attributeFilter`
- Limites : un état posé par JS n'existe pas au rendu serveur (premier affichage, M3-02 R10) ; deux espaces de noms à documenter
- Conflits : M2-S03 (présence) ; M3-01 et M3-02 (R10)

### M3-V10 — Presets livrés nommés par effet, sans direction dans le nom
- Énoncé : Udixio livre des définitions prêtes à l'emploi nommées par l'effet : `fade`, `rise` (reveal, `from: bottom`), `grow` (échelle), `parallax` (scrub, distance en jeton), `pulse`, `blink`, `indeterminate` (loop) ; aucun nom ne contient de direction (`fade-up`, `slide-down` exclus).
- Familles : F1, F2, F3, F4, F5, F24
- Nature : global (définitions partagées)
- Avantages : un preset ne se trompe pas de sens ; la direction reste une option commune à tous ; peu de noms à retenir
- Limites : `rise` est moins parlant que `fade-up` pour un débutant ; la liste doit rester courte pour être apprise
- Conflits : M4-S04 (définitions prêtes, acquis R11) ; V06 (direction)
