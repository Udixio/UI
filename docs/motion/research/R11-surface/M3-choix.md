# M3 — Choix de surface : déclenchement, défilement, boucles, inscription

### M3-S01 — Deux verbes de vue : `reveal` et `scrub`
- Énoncé : le déclenchement à la vue (une fois, ou à chaque franchissement avec `repeat`) s'écrit `reveal` ; la progression liée à la position de défilement s'écrit `scrub` avec `range` et `axis` ; aucun des deux n'utilise `enter`, `exit`, `in` ou `out`, noms déjà pris par Angular et Svelte.
- Familles : F3, F4, F5
- Nature : les deux (`reveal` global via l'observateur partagé ; `scrub` instance par timeline)
- Avantages : deux noms sans collision avec les frameworks ; le typage refuse `scrub` avec seuil et `reveal` avec `range` ; l'agent ne choisit qu'entre deux verbes
- Limites : deux verbes à apprendre au lieu d'un ; hors Chromium, `reveal` repose sur IntersectionObserver et `scrub` sur un repli nommé
- Conflits : M5-01 (ne garde que `reveal`, `track` devient `scrub`) ; M3-06 (repli de `scrub`)

### M3-S02 — Défilement programmé : action `scrollTo`, pas un verbe
- Énoncé : le défilement animé est une action `scrollTo(cible, options)` qui renvoie un handle ; natif (`behavior: smooth`) par défaut, tween JS seulement si `duration` ou `easing` est imposé ; `prefers-reduced-motion` force l'instantané.
- Familles : F6, F20
- Nature : instance
- Avantages : un défilement n'est pas un effet d'élément, donc pas de verbe HTML ; ancres et restauration de position restent natives ; même handle que le reste de la surface
- Limites : la durée du `smooth` natif n'est pas réglable ; pas d'équivalent en attribut pour le HTML pur (attribut à trancher)
- Conflits : M5-08 (handle) ; M3-07 (R10, même principe)

### M3-S03 — Boucles inscrites au runtime : `loop` avec `pause` obligatoire
- Énoncé : toute boucle s'écrit `loop` et exige une option `pause` (WCAG 2.2.2) ; une boucle CSS est suspendue par `animation-play-state` quand l'état hors-vue ou onglet caché du runtime l'indique ; une boucle JS s'abonne à la frame unique.
- Familles : F24, F20, F21
- Nature : global (inscription au runtime, pause partagée)
- Avantages : une boucle hors écran coûte zéro sans code par composant ; l'onglet caché et le hors-vue passent par le même chemin ; l'exigence de pause est vérifiée à la compilation
- Limites : une boucle sur un élément jamais observé tourne toujours ; une boucle n'a pas de `finished`, donc la reprise recale le temps
- Conflits : M1-04 (abonnement à la frame) ; M3-01 (état hors-vue) ; M4-03 (boucle en sortie)

### M3-S04 — Continuité déclarée : `continuity: position | velocity`
- Énoncé : tout verbe interruptible (`state`, `reveal` répété, `scrub`, `layout`) déclare `continuity` ; `velocity` impose le backend JS et la reprise à la vitesse exacte ; `position` autorise WAAPI et une reprise depuis la position rendue ; l'omission est une erreur au build.
- Familles : F2, F13, F18
- Nature : instance
- Avantages : WAAPI ne perd plus la vitesse en silence, l'auteur choisit le coût ; la tension (a) de R10 devient un choix écrit dans le code ; un agent voit la contrainte
- Limites : une option de plus, obligatoire ; `velocity` fait basculer le backend et coûte du JS par frame
- Conflits : M1-01 (le backend dépend de cette option) ; M5-08 (reprise par vitesse) ; M1-02 (table `linear()` sans vitesse)

### M3-S05 — Valeurs de défilement et de curseur en propriétés CSS
- Énoncé : une valeur continue liée au défilement ou au curseur s'exprime par une propriété personnalisée (`--udx-progress`, `--udx-pointer-x`, `--udx-pointer-y`) lue par `calc`, `transform` ou une couleur ; un seul écouteur par page écrit ces propriétés, et seul le repli JS (M3-06) le crée.
- Familles : F5, F14
- Nature : global
- Avantages : le CSS consomme la valeur sans JS sur le chemin natif ; les écritures sont groupées par frame (M1-04) ; une écriture par frame quel que soit le nombre d'éléments
- Limites : animer une propriété personnalisée par timeline exige `@property` (support à vérifier) ; le repli écrit des styles et recalcule
- Conflits : M1-09 (écriture DOM directe, alternative) ; M4-07 (signal, à trancher) ; M3-06

### M3-S06 — Seuils et marges en tokens fermés
- Énoncé : les seuils et marges de déclenchement se nomment (`view.margin: near | edge | half`, `view.threshold: touch | quarter | most`) dans `tokens.json`, avec une valeur réglée par le designer ; le code fixe les noms, jamais un nombre littéral.
- Familles : F4, F1, F23
- Nature : global
- Avantages : un seuil nouveau est une valeur de token, pas une modification de code ; l'agent ne peut pas écrire `threshold: 0.37` ; le même nom traverse HTML, JS et CSS
- Limites : un jeu fermé peut ne pas couvrir un besoin réel (ajout = version) ; un nom de seuil ne dit pas la distance réelle
- Conflits : aucun connu

### M3-S07 — Vérification des déclencheurs au build et en dev
- Énoncé : `motion check` refuse `scrub` sans `range` ni conteneur déclaré, refuse `reveal` sur une cible qui porte un `transform` statique, et refuse un `reveal` sans sentinelle (M3-03) ; en dev, un `reveal` jamais franchi après hydratation est signalé.
- Familles : F4, F5, F23
- Nature : global
- Avantages : les erreurs muettes du déclenchement deviennent visibles avant le navigateur ; la même règle vaut pour HTML, React, Angular et Svelte ; le message nomme la règle
- Limites : le `transform` posé par JS échappe à la détection statique ; le signalement en dev dépend d'un observateur (M3-01)
- Conflits : M5-02 (grammaire à brancher) ; M3-03 (sentinelle exigée)

### M3-S08 — Inscription par nom dans un registre de page
- Énoncé : chaque attribut, prop, directive ou attachment porte le nom d'une animation du registre fermé ; le runtime résout ce nom au premier attach, une fois, et inscrit l'élément ; nom inconnu = erreur visible, jamais de scan du document.
- Familles : F19, F4, F22
- Nature : les deux (registre global, inscription par instance)
- Avantages : une seule résolution par élément ; îles et frameworks partagent le même nom sans contexte ; un agent n'écrit que des noms existants
- Limites : le registre doit être complet au build, sinon une animation tierce est refusée ; l'ordre d'arrivée des îles n'est pas garanti
- Conflits : M5-07 (même registre) ; M5-05 (chargement par page, tension 23 de R10)

### M3-S09 — Groupes à une sentinelle, décalage par index
- Énoncé : une liste animée à l'entrée (F10) s'inscrit comme groupe : une seule sentinelle observe le groupe, et le décalage (stagger) se calcule par index dans le groupe ; les enfants n'ont pas chacun un observateur.
- Familles : F10, F11, F4, F21
- Nature : les deux (une sentinelle par groupe, décalage par instance)
- Avantages : coût proportionnel au nombre de groupes et non d'éléments, critique pour les milliers d'éléments ; le groupe joue une seule cascade ; le décalage reste déclaré dans la surface
- Limites : un élément ajouté après le déclenchement ne rejoint pas la cascade (exception documentée) ; un groupe très grand doit être découpé
- Conflits : M4-03 (sortie de groupe) ; M1-05 (séquence) ; M3-01 (une sentinelle par groupe)

### M3-S10 — Variantes d'état et de breakpoint : Tailwind comme encodage
- Énoncé : Tailwind n'écrit qu'une correspondance état → nom via une variable CSS (`md:[--udx-motion:card-in]`, `data-[state=open]:`) ; le plugin génère ces classes à partir du registre fermé et ne définit aucune animation ; le runtime observe chaque type de variant une fois (`matchMedia`, `MutationObserver` ciblé, `pointerenter` pour `hover:`) ; les valeurs arbitraires sont refusées.
- Familles : F19, F2, F22
- Nature : global (un observateur par type de variant)
- Avantages : Tailwind reste l'encodage de l'écosystème sans porter la surface ; un breakpoint est une variable, pas une règle dupliquée ; le même nom traverse les variants
- Limites : `hover:` tactile diverge (à documenter) ; un `MutationObserver` ciblé coûte si beaucoup d'attributs sont suivis ; une classe seule ne peut pas inscrire un élément
- Conflits : M5-04 (plugin, réduit à générateur) ; M3-04 (inscription par classe, contestée) ; M5-02 (syntaxes)
