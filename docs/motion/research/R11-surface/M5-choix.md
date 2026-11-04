# M5 — Choix de conception : surface d'écriture (R11)

### M5-S01 — Attributs = références, objets = définitions
- Énoncé : les attributs HTML (`data-motion`) et les classes ne désignent qu'une référence (verbe ou définition nommée), jamais une valeur libre ; les objets TS sont le seul lieu où l'on définit. Remplace « trois syntaxes équivalentes » (M5-02) : deux rôles, pas trois dialectes à tenir égaux.
- Familles : F1, F2, F3, F4, F22, F23
- Nature : les deux
- Avantages : une seule forme à maintenir et documenter ; pages HTML et Astro couvertes sans JS de framework ; un agent ne peut pas inventer une valeur dans un attribut
- Limites : les effets à fonction ou callback restent en TS ; une définition nommée doit être déclarée avant son usage ; la grammaire d'attribut se réduit à un nom et une option
- Conflits : M5-02 (remplacé), M3-04 (inscription par élément)

### M5-S02 — Vocabulaire plafonné à quinze verbes, table famille → verbe testée
- Énoncé : quinze verbes au plus : `state`, `appear`, `disappear`, `reveal`, `follow`, `tween`, `layout`, `sequence`, `loop`, `split`, `draw`, `morph`, `drag`, `scroll`, `page` ; `disappear` retient le nœud jusqu'à `finished` (M4-03). Remplace M5-01 : F16 (`split`), F17 (`draw`, `morph`), F6 (`scroll`), F9 (`page`), F18 (`drag`) entrent dans le vocabulaire ; un test vérifie que chacune des 24 familles a un verbe ou une option déclarée.
- Familles : F1 à F24
- Nature : les deux (`state`, `reveal`, `loop`, `page` globaux ; les autres par instance)
- Avantages : chaque famille a un nom vérifiable ; le plafond empêche la dérive ; la table est lisible par un agent sans lire le code
- Limites : quinze verbes restent beaucoup pour un débutant ; `split`, `draw` et `morph` se recoupent parfois ; ajouter un verbe est un changement majeur
- Conflits : M5-01 (remplacé), M3-05 (`scrub` et `once` à absorber dans `follow` et `reveal`)

### M5-S03 — Noms réservés aux API natives, lint anti-collision
- Énoncé : aucun verbe ni option ne reprend un nom natif : pas `enter` ni `exit` (`animate.enter` et `animate.leave` d'Angular), pas `in`, `out`, `transition` ou `animate` (directives Svelte) ; la directive publique est `udxMotion` et l'attribut `data-motion`. Un lint refuse les noms réservés dans attributs et appels. Corrige la collision relevée sur M5-01 par M1, M2, M3 et M5.
- Familles : F3, F4, F22, F23
- Nature : global
- Avantages : aucune ambiguïté à la lecture dans les trois frameworks ; règle de lint courte ; réutilisable dans le guide pour agents
- Limites : liste des noms réservés à suivre selon les versions des frameworks ; `appear` et `disappear` sont moins évidents qu'`enter` pour un débutant
- Conflits : M5-01 (remplacé)

### M5-S04 — Tailwind : tokens et états seulement, jamais inscription
- Énoncé : Tailwind v4 n'expose que les tokens (`@theme` avec `--duration-*`, `--ease-*`, `--animate-*`), des variantes d'état (`@custom-variant` sur `data-state` et `data-udx-view`) et des utilitaires CSS sans paramètre ; aucune classe n'inscrit un élément ni ne porte de logique JS. Les classes construites dynamiquement sont refusées par lint et listées par `@source inline()` depuis le manifeste. Corrige M5-04 (5,4) : une classe ne peut pas inscrire (M3-04) et le plugin doublonnait le vocabulaire.
- Familles : F1, F2, F3, F20, F24
- Nature : global
- Avantages : Tailwind reste une couche retirable, le noyau n'en dépend pas ; élagage natif ; pas de second vocabulaire à aligner
- Limites : un effet ne s'écrit pas en classe seule, il faut l'attribut ; la réduction de mouvement doit être répliquée dans le CSS généré ; `animation-trigger` reste inégal selon les navigateurs
- Conflits : M3-04 (accord : classes sans inscription), M5-09 (réduction répliquée en CSS)

### M5-S05 — Tokens par rôle, émis une fois, ressorts compilés au build
- Énoncé : durées, easings et ressorts sont déclarés une fois par rôle (valeurs fournies par M3) et émis au build en custom properties `--udx-motion-*`, types TS et `@theme`. Un ressort de token est compilé en `linear()` à N points fixes au build ; le calcul de ressort à l'exécution ne sert qu'aux ressorts ad hoc. Tranche le lieu du calcul ouvert entre M1-02 et M5-03.
- Familles : F1, F13, F18
- Nature : global
- Avantages : une valeur de marque se modifie en un endroit ; aucun solveur pour les tokens ; les composants ne codent aucune durée
- Limites : N points fixes sont une approximation ; les ressorts ad hoc restent en JS ; `linear()` ne transporte pas la vitesse d'interruption
- Conflits : M1-02 (calcul déplacé au build), M5-08 (vitesse)

### M5-S06 — Définitions nommées enregistrées, variantes par breakpoint
- Énoncé : `defineMotion('card-in', spec)` produit une référence typée enregistrée dans le registre global (M5-07) ; attributs et adaptateurs l'appellent par nom ; une définition accepte des variantes `at:` par breakpoint, traduites en media queries quand c'est possible ; l'objet inline reste permis dans les composants.
- Familles : F3, F4, F19, F22
- Nature : les deux (registre global ; usage par instance)
- Avantages : une définition partagée entre îles sans import commun ; F19 couvert sans logique par composant ; une faute de nom est une erreur qui cite la définition
- Limites : le registre doit être chargé avant usage, donc un ordre d'îles à garantir ; les définitions inline échappent au registre ; media queries et JS divergent si `at:` n'est pas traduisible
- Conflits : M5-07 (dépend du registre), M4-02 (idempotence par définition)

### M5-S07 — Parité de forme par framework, composants Udixio sur la surface publique
- Énoncé : même verbe, mêmes options, mêmes définitions dans cinq formes : `data-motion` (HTML, Astro), `useMotion(spec)` (React, ref), directive `udxMotion` (Angular, `DestroyRef`), `{@attach motion(spec)}` (Svelte), `motion(el, spec)` (noyau). Les composants Udixio appellent cette surface publique, sans API privée.
- Familles : F3, F7, F12, F22
- Nature : instance
- Avantages : un exemple vaut pour tous les frameworks ; le dogfood révèle les lacunes dans nos propres composants ; la doc n'a qu'une table
- Limites : cinq formes à tester ; le ref React et l'attachment Svelte n'ont pas la même durée de vie ; l'idiome Angular impose une entrée par option
- Conflits : M4-01 (même noyau), M4-03 (présence par framework)

### M5-S08 — Vitesse explicite : `carry` ou `restart`, dégradation visible
- Énoncé : toute interruption déclare `interrupt: 'carry' | 'restart'` ; `carry` exige la vitesse, donc le backend JS pour les ressorts et les propriétés non numériques ; le handle expose `velocity: { value, source: 'exact' | 'estimated' | 'unavailable' }` et ne dégrade jamais en silence. Réponse à la tension (a) de R11 : le coût du WAAPI est déclaré, pas caché.
- Familles : F2, F12, F13, F18
- Nature : instance
- Avantages : l'auteur voit ce qui est approximé ; `restart` reste disponible sans vitesse ; un agent écrit `carry` sans connaître le moteur
- Limites : `carry` peut faire basculer en JS et perdre le gain natif ; le champ `source` est à lire ; l'estimation WAAPI sur 2 à 3 frames reste bruitée
- Conflits : M1-01 (`carry` bascule en JS), M1-03 (règle de reprise), M5-08 (contrat de handle)

### M5-S09 — Boucles et suivis : abonnés nommés, horloge partagée
- Énoncé : `loop` et `follow` s'enregistrent comme abonnés nommés du runtime global (M5-07) sur la frame unique (M1-04) : le runtime possède l'horloge, l'instance possède l'abonnement et son `id` ; `udixio.motion.inspect()` liste les abonnés vivants ; pause hors vue et réduction s'appliquent à tous sans code par composant. Réponse à la tension (b) de R11.
- Familles : F5, F14, F21, F24
- Nature : les deux (horloge globale ; abonnement par instance)
- Avantages : une seule boucle quel que soit le nombre d'îles ; abonnés visibles en dev et dans les tests ; pause et réduction uniformes
- Limites : l'abonné doit être libéré par son scope (M4-10) ; un abonné lent retarde toute la frame (M1-04) ; l'inspection expose des détails internes à maintenir
- Conflits : M1-04 (même boucle, à respecter), M4-10 (libération), M3-09 (pause hors vue)

### M5-S10 — Garde-fous à quatre niveaux, source unique manifeste
- Énoncé : une même source (verbes, options, définitions, noms réservés) alimente quatre garde-fous : type TS (union générée), build (parseur des attributs et lint), runtime dev (erreur qui cite l'identifiant du manifeste), tests (couverture des 24 familles). Le manifeste `llms.txt` et JSON sert la doc et les agents. Reprend M5-10 en le reliant à la surface.
- Familles : F21, F22, F23
- Nature : global
- Avantages : une erreur d'attribut casse le build, pas l'écran ; agents et types lisent la même source ; la doc ne dérive pas
- Limites : génération et vérification à tenir en CI ; un manifeste long consomme le contexte d'un agent ; le lint ne voit pas les noms construits à l'exécution
- Conflits : M5-10 (repris et fusionné), M5-06 (budgets de taille dans le manifeste)
