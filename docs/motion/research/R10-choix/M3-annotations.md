# M3 — Annotations des choix M1, M2, M4, M5 (scroll, déclencheurs, runtime global)

## M1 — moteur et rendu

- M1-01 : valide — +backend exposé et tracé, le choix WAAPI / JS devient vérifiable en dev / −les fins d'animation (`finished`, `fill`) diffèrent entre WAAPI et JS, à aligner pour un repli de M3-06 / conflits: —
- M1-02 : neutre — +table `linear()` bornée et mise en cache, un ressort se calcule une fois / −repli JS obligatoire sur vieux Chrome de `defaults` : un ressort d'entrée déclenché par M3-01 n'est pas garanti natif / conflits: —
- M1-03 : valide — +reprise à la vitesse courante utile à un `repeat` de M3-05 (sortie puis retour à la vue sans à-coup) / −un `scrub` (M3-05) n'a pas de vitesse à transférer, la règle ne couvre que les déclenchements / conflits: —
- M1-04 : valide — +phase d'écriture unique où la variable `--udx-progress` de M3-08 peut s'écrire sans second rAF / −une passe JS lente sur défilement retarde toutes les animations de la page ; une copie du paquet = une boucle / conflits: M3-08 (doublon : un rAF de repli), M2-02 (doublon)
- M1-05 : neutre — +handle `seek(t)` réutilisable par un repli JS de scrub (M3-06) au lieu d'un listener propre / −deux horloges (WAAPI et frame) dérivent, resynchronisation à chaque seek / conflits: M4-08 (doublon de handle)
- M1-06 : valide — +mesure explicite, traçable, transform seul / −`getBoundingClientRect` est relatif au viewport : un défilement entre `measure()` et la mutation fausse l'inversion sans recalage par `scrollY` / conflits: M2-03 (doublon FLIP)
- M1-07 : valide — +traverse les îles sans contexte, même mécanisme pour sorties et entrées / −une entrée retenue hors écran reste en mémoire tant que son homologue n'arrive pas ; le runtime de vue (M3-01) ne la voit pas / conflits: M2-01, M4-05, M5-07 (doublons de registre)
- M1-08 : valide — +confirme la règle du cadre : pas de polyfill, zéro JS par frame quand `animation-timeline` existe / −état final sans JS hors Firefox 159 et vieux Chrome : « une fois à l'entrée » (F4) n'est pas couvert sans IntersectionObserver / conflits: M3-06 (repli JS nommé), M3-05 (distinction scrub / once)
- M1-09 : valide — +valeur écrite en variable CSS dans la frame, lue par le CSS sans JS de rendu (mécanisme de M3-08) / −écriture hors framework, collision possible avec un style inline géré par React ou Angular / conflits: M4-07 (alternative par signal), M3-08 (doublon de mécanisme)
- M1-10 : valide — +une règle de réduction pour les effets de défilement : un `scrub` réduit tombe à sa position neutre, cohérent avec M3-05 / −ne dit pas si un effet lié au défilement est décoratif : c'est l'auteur qui classe / conflits: M5-09, M4-09 (doublons)

## M2 — layout et éléments partagés

- M2-01 : valide — +résolution par le DOM, aucune table JS à synchroniser avec le HTML / −clés en collision sans règle d'unicité ; deux copies sans symbole versionné = deux registres / conflits: M2-07 (portée), M1-07, M4-05, M5-07 (doublons de registre)
- M2-02 : valide — +lecture groupée d'une même frame, utile aux mesures de vue de M3-01 / −une instance lente retarde toute la frame, observateurs de sortie compris / conflits: M1-04 (doublon), M2-04 (cycle de rendu VT)
- M2-03 : valide — +correction d'échelle des enfants par variables CSS, compatible avec un repli de M3-06 sans JS / −`box-shadow` faux pendant le scale, visible sur les cartes révélées au défilement / conflits: M1-06 (doublon FLIP)
- M2-04 : valide — +élément partagé natif : aucun observateur ni rAF côté page / −une VT en cours et un défilement programmé se disputent la capture de l'écran (à tester) / conflits: M2-02 (cycle de rendu distinct)
- M2-05 : valide — +le nœud sorti reste dans le DOM : l'observateur de vue (M3-01) voit la sortie sans réinscription / −pendant la sortie, un nœud `inert` occupe toujours sa place dans le défilement / conflits: M2-06, M4-03 (doublon de présence)
- M2-06 : neutre — +voisins réorganisés tout de suite, utile quand le contenu sous le pli bouge / −en conteneur à `overflow` défilant, la rect figée devient fausse si le conteneur défile pendant la sortie / conflits: M2-05
- M2-07 : valide — +même principe que M3-10 (portée bornée contre les collisions entre îles) / −une paire hors portée devient impossible, donc pas de `layoutId` inter-îles par défaut / conflits: M2-01 ; doublon partiel de M4-10
- M2-08 : valide — +retarget depuis la position rendue : un `repeat` inversé (M3-05) repart sans saut / −lire la position rendue force un calcul de style à chaque interruption / conflits: M2-04 (VT non interruptible)
- M2-09 : neutre — +hauteur `auto` native par `interpolate-size`, sans scale, pour les sections révélées par M3-02 / −repli relayout à chaque image ; mesure périmée si le contenu change pendant le reveal / conflits: M2-03 (taille contre scale)
- M2-10 : neutre — +voisins en FLIP pendant un drag, sans relayout du nœud suivi / −mesures figées au début du geste ; un défilement natif pendant le drag les rend fausses, aucun écouteur de défilement n'est prévu / conflits: M2-08 (lâcher)

## M4 — intégration aux frameworks

- M4-01 : valide — +noyau testable en Node, handle `{ finished, cancel, dispose }` cohérent avec M5-08 / −trois surfaces à garder alignées ; le noyau n'expose aucun point d'inscription pour les îles de vue / conflits: doublon partiel de M5-08
- M4-02 : valide — +idempotence qui évite de dupliquer l'inscription de vue (M3-04) au remontage / −un WeakMap par copie de module casse l'idempotence entre îles / conflits: M4-05 ; à articuler avec M3-04
- M4-03 : valide — +contrat « retiré = sortie terminée », réutilisable pour une sortie signalée par M3-01 / −React doit retenir des enfants hors de la source de vérité ; un nœud fantôme si le dispose arrive pendant la sortie / conflits: M2-05 (doublon de présence), M4-10 (sortie au dispose)
- M4-04 : valide — +pas de flash : état final dans le HTML, état d'entrée posé après montage / −fallback JS obligatoire sans `@starting-style`, deux chemins à tester / conflits: M3-02 (doublon du premier affichage)
- M4-05 : valide — +registre versionné avec dégradation vers un noyau local, robuste pour des îles hétérogènes / −état global : isolation et tests plus difficiles ; `astro:after-swap` annule les handles / conflits: M4-02, M5-07 (doublon de registre), M1-07, M2-01
- M4-06 : conteste — +garde un élément déjà visible à son état final à l'hydratation / −mêle trois responsabilités (vue, premier affichage, pause hors écran) ; une sentinelle par instance coûte du DOM / conflits: M3-01, M3-03 (doublons), M3-02 (doublon), M3-09 (pause)
- M4-07 : valide — +valeur animée en signal lu par le rendu, sans cycle de détection / −écrire un signal à chaque image pour un défilement relance le graphe réactif ; M3-08 écrit une propriété CSS sans état / conflits: M1-09 (écriture DOM directe), M3-08
- M4-08 : valide — +statut explicite `completed` / `cancelled` : une séquence de vue se retire au démontage sans rejet / −un handle ne survit pas au remontage, la séquence liée au défilement est recréée / conflits: doublon de M5-08 et M1-05
- M4-09 : neutre — +store unique, lisible aussi par un observateur de visibilité (M3-01) / −chaque île lit `matchMedia` sans registre ; les effets de défilement ne sont pas classés / conflits: M5-09 (doublon)
- M4-10 : valide — +scope par racine : un `dispose` retire les abonnements de vue et de frame / −l'observateur partagé (M3-01) ne doit pas être déconnecté, seul le désabonnement est permis ; `transition:persist` d'Astro garde une île vivante / conflits: M4-03, M4-02 ; doublon partiel de M2-07

## M5 — API, DX, outillage

- M5-01 : neutre — +les verbes `state`, `reveal`, `loop` restent globaux, ce qui colle à la distinction F4 / F5 / F24 / −aucun verbe distinct entre progression (scrub) et déclenchement (once) / conflits: M3-05
- M5-02 : valide — +`data-motion` parsable au build, `enter` et `reveal` sans JS / −aucune place pour `fallback` ni `on: view` : le repli de M3-06 doit entrer dans la grammaire / conflits: —
- M5-03 : valide — +`--udx-motion-*` traverse les îles sans `timeline-scope`, pour les durées et les courbes / −`linear()` ne conserve pas la vitesse et ne couvre pas un `animation-timeline` / conflits: M1-02 (doublon partiel), M5-08
- M5-04 : valide — +`motion-reveal-once` en CSS seul pour `animation-trigger` (Chromium), zéro JS / −une déclaration non supportée est jetée au parsing : le repli IntersectionObserver de M3-05 doit exister côté CSS aussi / conflits: M5-09 (réduction à répliquer)
- M5-05 : valide — +drapeau par page : aucun runtime de vue (M3-01) sur une page sans `once` ni `scrub` / −une progression construite à l'exécution n'est pas détectée et n'est pas inscrite / conflits: M5-07 (chargement par page contre singleton)
- M5-06 : neutre — +sous-chemins `/scroll` et `/reveal` séparés : un site sans défilement n'embarque pas M3-01 / −`/reveal` et `/scroll` partagent l'observateur : duplication si les versions divergent / conflits: M5-07
- M5-07 : valide — +singleton versionné unique pour scanner et observateurs : une passe DOM par page / −compteur de références : une fuite si un unmount est manqué ; à relier à M4-10 / conflits: M4-05, M2-01, M1-07 (doublons de registre)
- M5-08 : valide — +`finished` ne rejette jamais, contrat de contrôle unique / −vitesse conservée seulement pour les propriétés numériques : une reprise de M3-05 sur une propriété non numérique saute / conflits: M5-03 (springs CSS) ; doublon de M4-08, M1-05, M4-01
- M5-09 : valide — +intention par donnée : une règle unique pour les effets de défilement (`scrub` décoratif = position neutre) / −décoratif contre essentiel reste un jugement ; deux implémentations à garder identiques / conflits: M5-04 (règle en CSS), M4-09, M1-10 (doublons)
- M5-10 : neutre — +la nature (global / instance) et le repli d'une option de vue deviennent lisibles par un agent / −manifeste régénéré en CI, et trop long il consomme le budget d'un agent / conflits: M5-01, M5-06

## Doublons à fusionner

- Registre global versionné : M1-07, M2-01, M4-05, M5-07 → garder **M5-07** (clé unique `udixio.motion@1`) ; absorber la dégradation de M4-05 ; M2-01 perd sa clé `udixio.motion.layout@1`.
- Frame lecture / écriture : M1-04, M2-02 (et le rAF de M3-08) → garder **M1-04** (phases déclarées par abonné).
- FLIP en transform : M1-06, M2-03 → garder **M2-03** ; absorber `measure()` de M1-06.
- Présence et nœud retenu à la sortie : M2-05, M4-03 → garder **M4-03** (contrat `finished`) ; absorber `inert` / `aria-hidden` de M2-05.
- Préférence de mouvement : M1-10, M4-09, M5-09 → garder **M5-09** (prédicat unique + intention) ; absorber la fonction unique de M1-10 et le store de M4-09.
- Handle de contrôle : M4-01, M4-08, M5-08 → garder **M5-08** ; absorber le statut explicite de M4-08. La compilation de séquence de M1-05 reste séparée.
- Premier affichage : M3-02, M4-04, M4-06 (règle d'hydratation) → garder **M3-02** ; absorber le rendu serveur de M4-04.
- Déclenchement à la vue : M3-01, M3-03, M4-06 → garder **M3-01** et **M3-03** ; M4-06 est scindée entre M3-02 (état final à l'hydratation) et M3-09 (pause hors écran).
- Écriture de valeur par variable CSS : M1-09, M3-08 → garder **M1-09** (mécanisme général) ; M3-08 devient un usage de scroll.
- Scope de cycle de vie : M4-10, M2-07 → garder **M4-10** ; M2-07 devient une variante de portée de layout. M3-10 (noms CSS) reste séparé.
- Ressort en `linear()` : M1-02, M5-03 → garder **M1-02** (algorithme et cache) ; M5-03 ne garde que l'émission des tokens.
