# M3 — Choix de conception : scroll, déclencheurs, runtime global

### M3-01 — Observateur de visibilité partagé par document
- Énoncé : un seul IntersectionObserver par document et par couple (marge, seuil), créé à la première inscription ; il écrit `data-udx-view` (in / out) sur chaque cible inscrite, référencée par une WeakMap élément → rappels. Il ne joue aucune animation : il publie un état que le CSS ou le moteur consomment.
- Familles : F3, F4, F21
- Nature : global
- Avantages : coût constant par seuil quel que soit le nombre d'éléments ; aucun observateur par composant ; état lisible en CSS, en DOM et dans les tests
- Limites : une instance par couple (marge, seuil) ; un bug dans le singleton touche toutes les îles de la page ; l'écriture d'attributs doit être groupée par frame
- Conflits : aucun connu

### M3-02 — Masquage initial seulement après inscription effective
- Énoncé : aucun état « avant entrée » n'est posé en CSS statique ; le runtime l'applique au moment où l'élément est inscrit (`data-udx-view="pending"`), et seulement si l'inscription réussit. Sans JS, ou si le script échoue, le contenu reste visible.
- Familles : F3, F4
- Nature : les deux
- Avantages : pas de contenu invisible sans JS (défaut d'AOS évité) ; une île hydratée tard n'a pas à masquer le reste de la page
- Limites : un élément sous le pli peut clignoter avant son inscription ; atténuation possible par un marqueur `js` posé par un script inline d'une ligne, dont le coût est à accepter
- Conflits : aucun connu (dépend de M3-01)

### M3-03 — Sentinelle sans transformée pour le déclenchement
- Énoncé : le déclenchement observe un nœud sans `transform` (boîte de hauteur nulle, ou le wrapper de M3-04), jamais la cible animée ; la cible reçoit l'état, la sentinelle fournit la géométrie. Une entrée qui translate hors écran ne peut plus empêcher sa propre intersection.
- Familles : F3, F4
- Nature : instance
- Avantages : entrées décalées (translate, scale) déclenchables sans marge corrigée à la main ; même mécanisme pour `once` et `repeat`
- Limites : un nœud de plus dans le DOM, que le SSR et l'hydratation doivent produire ; sur grille ou flex, une sentinelle de hauteur nulle peut modifier la mise en page (à tester)
- Conflits : aucun connu

### M3-04 — Inscription par cycle de vie d'élément, sans scan
- Énoncé : un élément qui demande un déclencheur ou un suivi s'inscrit par son propre cycle de vie (élément personnalisé `udx-view`, sans shadow DOM, connectedCallback / disconnectedCallback) ; aucun `querySelectorAll` au démarrage, aucun MutationObserver sur `document`.
- Familles : F4, F19, F21
- Nature : les deux (définition globale, inscription par instance)
- Avantages : le retrait DOM libère l'inscription sans observateur ; même écriture dans React, Angular, Svelte et HTML / Astro ; coût nul sur une page qui n'en contient pas
- Limites : l'élément doit être défini avant la première peinture, sinon M3-02 ne tient pas ; hydratation React et Angular à tester avec des balises personnalisées ; une simple classe Tailwind ne peut pas inscrire un élément, ce qui va contre la préférence Tailwind du cadre
- Conflits : R8 R2 (encodage par classe ou attribut) ; dépend de M3-02 pour l'ordre de définition

### M3-05 — Progression et déclenchement, deux intentions distinctes
- Énoncé : `scrub` (la valeur suit la position de défilement, `animation-timeline: view()` ou `scroll()`) et `once` (l'animation se joue au franchissement d'un seuil, `animation-trigger` puis M3-01) ne partagent ni nom ni attribut ; une même intention ne change pas de nature selon le navigateur.
- Familles : F4, F5
- Nature : instance
- Avantages : chaque intention a son repli logique (état final pour `once`, position neutre pour `scrub`) ; le typage refuse « scrub avec seuil »
- Limites : deux notions à apprendre au lieu d'un « révéler au défilement » ; hors Chromium, `once` repose sur IntersectionObserver
- Conflits : R9 J4 (`enter` avec `on: 'view'`) et R9 J2 (`scroll`) : frontière et nom à trancher

### M3-06 — Repli scroll-linked statique par défaut, JS nommé
- Énoncé : sans timeline native, un `scrub` reste à sa position neutre ou finale, sans JS ; le repli JS (listener passif + anime.js onScroll) n'est chargé que si l'auteur le nomme (`fallback: 'js'`) et si la page contient au moins un tel nœud.
- Familles : F5, F20, F21
- Nature : les deux (politique de chargement globale, repli par instance)
- Avantages : zéro JS et zéro listener sur les navigateurs à timeline ; pas de polyfill global (exclu par le cadre) ; le coût du repli se lit dans le code de la page
- Limites : sur les vieux Chrome de `defaults`, l'effet disparaît au lieu d'être approché ; l'auteur doit choisir le repli, ce qui ajoute un point de décision
- Conflits : aucun connu (décide de l'existence du listener de M3-08)

### M3-07 — Défilement natif, jamais détourné
- Énoncé : aucun lissage de molette ni interception du scroll ; un défilement programmé passe par `scrollTo({ behavior })` ou `scroll-behavior: smooth`, et seul un tween JS à courbe ou durée imposée est permis ; `prefers-reduced-motion` force l'instantané.
- Familles : F6, F20
- Nature : instance
- Avantages : restauration de position, trackpads, ancres et clavier restent natifs ; aucune boucle rAF permanente ; aucune bibliothèque de lissage à charger
- Limites : la durée du `smooth` natif n'est pas réglable et varie selon le navigateur ; pas d'inertie « à la ScrollSmoother »
- Conflits : aucun connu (conflit possible avec tout choix de smooth-scroll global d'un autre expert)

### M3-08 — Progression en propriété CSS, un seul listener de repli
- Énoncé : une valeur liée au défilement (parallaxe, progression, F14) s'exprime comme propriété personnalisée (`--udx-progress`) alimentée par la timeline ; si M3-06 autorise le repli JS, un unique listener passif par document, cadencé par rAF, écrit cette propriété pour tous les éléments inscrits, lectures groupées avant écritures ; il est retiré quand le nombre d'inscrits tombe à zéro.
- Familles : F5, F14
- Nature : global
- Avantages : une passe par frame quel que soit le nombre d'éléments ; le CSS consomme la valeur (`calc`, `transform`, couleur) sans JS ; jamais de listener par élément
- Limites : animer une propriété personnalisée par timeline exige `@property` (support à vérifier) ; le repli écrit des styles, donc recalcul sur grands DOM
- Conflits : M3-06 (c'est elle qui décide si le listener existe)

### M3-09 — Pause hors-vue et onglet caché, reprise sans saut
- Énoncé : les boucles (F24) et les tweens JS sont suspendus par deux signaux partagés, `visibilitychange` (un listener par document) et l'état `data-udx-view` de M3-01 ; à la reprise, le temps écoulé est recalé pour éviter le saut. Les animations CSS et WAAPI sont mises en pause (`animation-play-state`, `pause()`), jamais retirées.
- Familles : F24, F21, F12
- Nature : global
- Avantages : un indicateur ou une pulsation hors écran coûte zéro ; pas de rattrapage brutal au retour sur l'onglet ; un seul listener pour toute la page
- Limites : une présence en cours hors écran est figée, donc sa promesse de fin est retardée ; l'option de pause sur onglet caché d'anime.js v4 (à vérifier) ne couvre pas le hors-vue
- Conflits : M3-01 (source de l'état hors-vue)

### M3-10 — Timelines et noms d'animation scopés par île
- Énoncé : les timelines nommées (`--udx-card-view`) et les `animation-name` générés sont déclarés dans un `timeline-scope` propre à chaque île ou composant, jamais dans `:root`, parce que les îles Astro partagent un seul espace de noms CSS.
- Familles : F5, F19
- Nature : instance
- Avantages : deux îles au même composant ne se marchent pas dessus ; un nom de timeline n'est jamais résolu vers l'île voisine
- Limites : une règle de scope de plus par île ; les noms doivent être générés au build (plugin Tailwind) ou à l'inscription
- Conflits : M3-01 (la clé d'état doit être scopée de la même façon)
