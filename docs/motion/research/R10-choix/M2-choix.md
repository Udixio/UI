# M2 — Choix de conception : layout et éléments partagés

### M2-01 — Identité layoutId portée par le DOM, registre global
- Énoncé : un élément se déclare `data-layout-id="<clé>"` ; un registre unique par page, attaché à `globalThis` sous un symbole versionné (`Symbol.for('udixio.motion.layout@1')`), résout les paires entre instances, îles et frameworks sans contexte partagé.
- Familles : F7, F8, F9
- Nature : les deux (registre global, handle par instance)
- Avantages : marche entre îles Astro hydratées à des moments différents ; visible dans le HTML (SSR, HTML pur) ; inspectable au DOM
- Limites : clés en collision silencieuse sans règle d'unicité ; deux copies du paquet sans symbole versionné = deux registres ; entrée à purger au démontage
- Conflits : M2-07 (une portée bornée refuse les paires hors portée)

### M2-02 — Scheduler lecture/écriture partagé par page
- Énoncé : toutes les mesures d'une frame (avant/après) sont faites en une phase de lecture groupée, puis toutes les écritures (transform, style) en une phase d'écriture, dans une seule boucle rAF par page, partagée entre îles via le registre de M2-01.
- Familles : F7, F10, F13
- Nature : global
- Avantages : aucun thrashing de layout entre composants ; coût fixe quel que soit le nombre d'instances ; pas de rAF par composant
- Limites : une instance lente retarde la frame de toutes ; une île hydratée en retard rate la frame en cours ; couplage fort entre îles
- Conflits : M2-04 (la VT native a son propre cycle de rendu)

### M2-03 — FLIP en transform seul + correction d'échelle par variables CSS
- Énoncé : position et taille s'inversent uniquement par `transform` (translate + scale) ; les enfants reçoivent `--m-sx` / `--m-sy` (inverse de l'échelle du parent) pour rester nets et proportionnés ; `border-radius` corrigé de la même façon.
- Familles : F7, F8
- Nature : instance
- Avantages : compositeur seul, aucun relayout pendant l'animation ; texte et images non déformés ; même logique qu'anime.js Layout et Motion
- Limites : enfants ayant leur propre `transform` à compenser ; `box-shadow` et `border-width` faux pendant le scale ; correction à recalculer si le parent se redimensionne en cours
- Conflits : M2-09 (hauteur animée par taille réelle, pas par scale)

### M2-04 — Natif d'abord : View Transitions pour l'élément partagé
- Énoncé : quand `document.startViewTransition` existe, `view-transition-name` (généré par le composant) porte l'identité d'une paire ; le FLIP JS n'est qu'un repli, jamais exécuté en plus de la VT.
- Familles : F8, F9
- Nature : global (la VT est un état du document)
- Avantages : zéro JS par frame ; navigations cross-document natives (Astro) ; snapshots gérés par le navigateur
- Limites : un seul nom actif par élément et une seule VT à la fois ; non interruptible proprement ; `element.startViewTransition()` Chromium seul, repli obligatoire ailleurs
- Conflits : M2-08 (pas de reprise en vol en VT), M2-02 (cycle de rendu distinct)

### M2-05 — Sortie : désmontage différé du nœud réel
- Énoncé : un élément qui quitte reste dans le DOM réel pendant sa sortie, marqué `inert` et `aria-hidden` ; le framework ne le démonte qu'à la fin (fin d'animation filtrée), sans clone.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : état, focus et refs préservés ; pas de clone à synchroniser ; `display:none` posé seulement à la fin
- Limites : le nœud occupe encore sa place dans le flux ; chaque framework a son mécanisme (Svelte `out:`, Angular `animation.done`, React : état de présence) ; une sortie bloquée exige un délai de sécurité
- Conflits : M2-06 (sortie hors flux)

### M2-06 — Sortie de liste hors flux à la dernière rect
- Énoncé : lors d'une suppression, le nœud est figé en `position:absolute` à sa dernière rect mesurée dans son conteneur pendant sa sortie, afin que les voisins se réorganisent (FLIP) tout de suite.
- Familles : F10, F7, F3
- Nature : instance (portée par le conteneur de liste)
- Avantages : les voisins glissent sans attendre la fin de la sortie ; même chemin pour retrait et réordonnancement
- Limites : le nœud perd sa largeur sous contraintes flex/grid ; conteneur à `position: relative` requis ; une mesure préalable par suppression
- Conflits : M2-05 (le nœud reste dans le flux)

### M2-07 — Portée de layout déclarée et bornée
- Énoncé : `data-layout-scope` (ou composant équivalent) borne mesure, retarget, nettoyage et résolution des `layoutId` ; une paire ne se résout qu'à l'intérieur de sa portée, qui est un état d'instance et non une liste globale.
- Familles : F19, F7, F20
- Nature : instance
- Avantages : nettoyage groupé au démontage du scope ; collisions de clés cantonnées ; même modèle que `LayoutGroup` (Motion) et `createScope` (anime.js v4)
- Limites : une paire inter-îles devient impossible hors portée ; un scope mal placé isole silencieusement ; un scope par ligne de liste multiplie les observateurs
- Conflits : M2-01 (résolution globale)

### M2-08 — Retarget : reprise depuis la position rendue
- Énoncé : une animation de layout interrompue repart de la transformation réellement rendue (lue sur l'`Animation` WAAPI ou la valeur courante) vers la nouvelle cible, sans jamais revenir à la rect initiale.
- Familles : F13, F7, F12
- Nature : instance
- Avantages : aucun saut à l'interruption ; clics et gestes rapides restent fluides ; même API pour FLIP et paires partagées
- Limites : lire la position impose un coût de style ; conserver la vitesse exige une tangente (spring) et non une simple interpolation ; à tester dans un navigateur réel
- Conflits : M2-04 (VT non interruptible)

### M2-09 — Tailles `auto` : natif puis mesure-puis-tween
- Énoncé : hauteur et largeur `auto` animées par `interpolate-size: allow-keywords` (et `@starting-style` pour l'entrée) ; repli : mesure de la taille cible puis tween de `height` en px, avec une seule règle de détection de support partagée.
- Familles : F2, F7, F3
- Nature : les deux (règle CSS globale, mesure par instance)
- Avantages : natif sans JS là où il existe ; texte net, pas de scale ; repli unique et testable
- Limites : `interpolate-size` Chromium seul ; le repli relayout à chaque image ; une taille mesurée devient fausse si le contenu change en cours
- Conflits : M2-03 (scale au lieu de taille)

### M2-10 — Réordonnancement par geste : fantôme et voisins en FLIP
- Énoncé : pendant un drag, le nœud suit le pointeur en `transform` (fantôme) ; chaque franchissement de seuil change l'index logique et ne déclenche le FLIP que des voisins ; au lâcher, le nœud est repositionné en FLIP depuis sa position visuelle.
- Familles : F18, F7, F10
- Nature : instance
- Avantages : le geste reste sur le pointeur, sans relayout ; même chemin que le réordonnancement de F10 ; seuil d'échange réglable
- Limites : mesures des voisins figées au début du geste (scroll pendant le drag = faux) ; `touch-action` et pointer events à gérer par chaque framework ; clavier non traité ici
- Conflits : M2-08 (le lâcher repart en retarget)
