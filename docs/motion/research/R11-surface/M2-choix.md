# M2 — Choix de conception : surface d'écriture du layout, du partagé et de la présence

### M2-S01 — Mutation encadrée : une seule entrée impérative pour le layout
- Énoncé : toute mutation qui doit être animée en layout passe par `layout(el, mutate)` (mesure avant, mutation, puis lecture après et FLIP) ; aucune détection automatique du DOM. Le handle retourné est enregistré auprès du runtime global (M5-07) et la boucle reste celle de M1-04.
- Familles : F7, F10
- Nature : instance
- Avantages : un seul point d'entrée pour HTML, React, Angular et Svelte ; le moment de la mesure est explicite et traçable ; la mutation reste celle du framework
- Limites : un appel oublié donne un saut silencieux (détecté seulement par S10) ; un agent doit apprendre qu'il faut encadrer ; en React, la mutation est le rendu, donc le hook doit mesurer avant le commit
- Conflits : M1-06 (même idée, en cours de fusion), S10

### M2-S02 — Identité partagée écrite comme donnée de l'élément
- Énoncé : `layoutId` est une prop (React, Angular, Svelte) ou `data-layout-id` (HTML) ; sa portée est le composant ou le `data-layout-scope` le plus proche (M2-07) ; la résolution des paires passe par le registre global (M5-07), sans contexte partagé.
- Familles : F8, F9
- Nature : les deux (identité par élément, registre global)
- Avantages : sérialisable, donc visible au SSR et dans les îles HTML ; même nom dans les quatre environnements ; la portée évite les collisions de clés
- Limites : une paire hors portée devient impossible, ce qui gêne les îles sans scope commun ; l'unicité est une règle d'auteur, à contrôler (S10)
- Conflits : M2-01 (résolution globale), M2-07 (portée bornée), M5-02 (attribut et prop à unifier)

### M2-S03 — Présence comme état de l'élément, pas comme verbe
- Énoncé : la sortie se lit dans `data-presence="entering" | "present" | "exiting"` ; le framework ne fait que basculer cet état, et le runtime retient le nœud jusqu'à `finished` (M4-03). Les équivalents natifs (`animate.leave`, `out:`) restent utilisés quand ils suffisent.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : pas de collision avec `enter` / `exit` d'Angular et de Svelte ; l'état est stylable en CSS (`data-[presence=exiting]:`) ; lisible par un agent et testable
- Limites : l'état doit être posé avant le retrait du nœud ; React doit garder les enfants sortants (hook dédié) ; un nœud fantôme si l'état reste `exiting`
- Conflits : M5-01 (verbes fermés, à remplacer pour la présence), M1-07 (retenue par homologue), M3-09 (pause hors-vue)

### M2-S04 — Listes : identité par clé du framework, stagger sur le conteneur
- Énoncé : les éléments de liste reprennent la clé native du framework (`key` React, `track` Angular, clé `each` Svelte) qui devient le `layoutId` ; le stagger et le réordonnancement sont déclarés une fois sur le conteneur, pas sur chaque élément.
- Familles : F10, F7
- Nature : instance
- Avantages : aucun identifiant à inventer ; réordonnancement et ajout/suppression traités par la même règle ; équivalent aux `animate:` de Svelte sans les séparer
- Limites : une liste sans clé stable n'est pas animable ; la clé d'index est refusée (erreur en dev) ; les listes virtualisées sortent du DOM et perdent leur identité
- Conflits : M2-06 (sortie hors flux), S02 (identité par donnée)

### M2-S05 — Réordonnancement par geste : une primitive unique
- Énoncé : `reorder` (pointeur, seuil, fantôme, FLIP des voisins, lâcher repositionné) est exposé une fois, puis décliné en composant React, directive Angular, attachment Svelte et attribut `data-reorderable` en HTML ; il s'appuie sur M2-10.
- Familles : F18, F7, F10
- Nature : instance
- Avantages : une seule logique de geste pour quatre surfaces ; le fantôme reste en `transform` ; le lâcher reprend par la règle de reprise (S06)
- Limites : `touch-action` et événements de pointeur diffèrent selon le framework ; le clavier doit être défini (F20), sinon le geste est inaccessible ; mesures figées au départ
- Conflits : M2-08 (reprise au lâcher), S06

### M2-S06 — Reprise graduée : continue ou exacte, choisie par l'auteur
- Énoncé : une interruption se déclare `interrupt: "continuous" | "exact"` ; `continuous` accepte WAAPI et une vitesse estimée (M1-03) ; `exact` force le moteur JS (M1-01) et transmet la vitesse réelle au handle (M5-08). La surface ne promet jamais une vitesse exacte sur WAAPI.
- Familles : F13, F2, F18
- Nature : instance
- Avantages : résout la tension entre WAAPI sans vitesse et reprise exacte, en la rendant visible ; le coût de l'exactitude est explicite ; un geste passe en `exact` sans changer de code
- Limites : deux comportements à tester ; `exact` coûte du JS par frame ; un ressort en `linear()` ne tient pas `exact` (M1-02)
- Conflits : M1-02 (table figée), M5-03 (tokens en linear), M2-04 (VT non interruptible)

### M2-S07 — Tailwind : tokens et variants d'état, jamais d'inscription ni de layout
- Énoncé : Tailwind porte les tokens (`duration-*`, `ease-*` via `@theme`) et les variants d'état (`motion-reduce:`, `data-[presence=exiting]:`) ; aucune classe n'inscrit un élément ni ne déclare un layout.
- Familles : F1, F2, F20
- Nature : global
- Avantages : respecte la préférence Tailwind sans la faire porter ce qu'elle ne peut pas porter ; les classes restent statiques donc élaguées ; cohérent avec les états de S03
- Limites : aucune expressivité Tailwind pour le layout ; les valeurs arbitraires ne portent pas de callbacks ; l'écart avec la préférence du porteur doit être assumé
- Conflits : M5-04 (plugin CSS-first), M3-04 (une classe n'inscrit pas), M5-02 (syntaxes équivalentes)

### M2-S08 — Deux formes seulement : donnée sérialisable et preset TS nommé
- Énoncé : l'identité et l'état s'écrivent en attributs sérialisables (`data-layout-id`, `data-presence`, `data-layout-preset="card"`) ; le comportement riche (callbacks, options) vit dans un preset TS nommé, résolu par son nom. Il n'existe pas de troisième syntaxe équivalente.
- Familles : F7, F8, F22, F23
- Nature : les deux
- Avantages : SSR et îles HTML lisibles sans JS de framework ; un preset se nomme, se documente et se teste une fois ; contrairement à trois syntaxes, aucune dérive de parité
- Limites : les options non nommables ne sont pas exprimables en attribut ; un preset inconnu doit échouer en dev ; deux formes à expliquer
- Conflits : M5-02 (trois syntaxes équivalentes, mal notée), M5-01 (vocabulaire fermé)

### M2-S09 — Tokens de layout et de présence en custom properties
- Énoncé : durées, distances et ressorts de layout et de présence sont des `--udx-motion-*` émis par le build et lus par les presets (S08) et par `@theme` ; les valeurs sont celles du designer (M3), la forme CSS est fixe.
- Familles : F1, F7, F3
- Nature : global
- Avantages : une seule retouche pour la marque ; lisibles dans les îles sans contexte partagé ; un preset ne code jamais une valeur en dur
- Limites : un ressort en CSS est une table `linear()` (M1-02) qui n'expose pas la vitesse ; les tokens ne couvrent pas les valeurs calculées à l'exécution
- Conflits : M5-03 (tokens et calcul du ressort, à séparer), M1-02

### M2-S10 — Vérifications de surface : contrôles dev et helpers de test
- Énoncé : en développement seulement, le runtime signale un `layoutId` dupliqué dans une portée, une liste sans clé stable, un preset inconnu, et une mutation de géométrie sans `layout()` (écart mesuré sur un échantillon) ; un helper de test expose les géométries avant et après.
- Familles : F23, F19
- Nature : les deux (contrôles par runtime, helpers par instance)
- Avantages : les erreurs de surface remontent tôt et citent la règle ; un agent reçoit un message exploitable ; zéro coût en production
- Limites : la détection de mutation non encadrée est un échantillonnage, donc à faux négatifs ; le mode dev change le comportement de rendu (coûts) ; ne remplace pas le typage
- Conflits : M5-10 (manifeste), S01 (détection hors chemin de production)
