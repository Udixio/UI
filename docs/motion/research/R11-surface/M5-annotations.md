# M5 — Annotations des choix M1 à M4 (R11, surface d'écriture)

## M1 — moteur et rendu

- M1-S01 : valide — +garantie `value` ou `velocity` publiée au manifeste et vérifiable au build / −le moteur change selon une option, l'auteur doit lire la garantie / conflits: M5-S08
- M1-S02 : valide — +ressort défini en paramètres physiques, deux représentations générées, lieu du calcul tranché / −test d'écart de tracé à maintenir, repli JS sur vieux Chrome / conflits: M5-S05
- M1-S03 : valide — +file de rejeu pour les îles tardives, résout l'ordre d'enregistrement que M5-S06 laissait ouvert / −file à borner, ordre de rejeu non garanti / conflits: M5-S09
- M1-S04 : conteste — +classes limitées au palier CSS, refus au build des specs qui exigent du JS / −autorise des classes d'effet, contraire à M5-S04 ; `motion-${x}` invisible au scanner / conflits: M5-S04, M3-S10
- M1-S05 : valide — +un prédicat unique fixe les encodages admis, alimente le manifeste et la CI sans plugin / −le prédicat doit suivre chaque moteur, faux refus si trop large / conflits: M5-S10
- M1-S06 : valide — +défilement programmé natif, aucune boucle permanente, aucun moyen de détourner la molette / −durée du `smooth` non réglable, pas d'inertie / conflits: —
- M1-S07 : valide — +cellule écrite en phase write, identique en HTML, React, Angular et Svelte, zéro re-rendu / −écriture hors framework, nœud texte réécrit casse le compteur / conflits: M4-S04
- M1-S08 : valide — +découpe du texte au rendu serveur, tracé natif par `pathLength`, morphing isolé en chunk / −DOM plus lourde, découpe serveur et client à rendre identique / conflits: —
- M1-S09 : conteste — +vitesse de relâchement transmise au handle, une règle de reprise pour geste et animation / −pas de verbe `drag` en v1 (contraire à M5-S02), clavier non traité (bloque F20) / conflits: M5-S02, M2-S05
- M1-S10 : valide — +nom de VT posé par le runtime, jamais écrit par l'auteur / −une VT à la fois, non interruptible, Chromium seul pour `startViewTransition` / conflits: M5-S08, M4-S09

## M2 — layout, partage et présence

- M2-S01 : valide — +entrée impérative unique pour le layout, mesure explicite, identique dans les quatre surfaces / −un appel oublié donne un saut silencieux, seul M2-S10 le signale / conflits: —
- M2-S02 : valide — +identité sérialisable, visible au SSR et dans les îles HTML, même nom partout / −paire hors portée impossible, unicité d'auteur / conflits: M5-S01
- M2-S03 : valide — +présence en état `data-presence`, sans collision avec `enter` ou `exit`, stylable en CSS / −l'état doit précéder le retrait, React garde les enfants sortants / conflits: M5-S02
- M2-S04 : valide — +la clé native du framework devient l'identité, même règle pour ajout, retrait et réordonnancement / −liste sans clé stable refusée, virtualisation perd l'identité / conflits: M2-S02
- M2-S05 : neutre — +une primitive de réordonnancement déclinée en quatre surfaces / −`touch-action` et pointeur divergent, clavier à définir pour F20, mesures figées au départ / conflits: M1-S09, M5-S02
- M2-S06 : valide — +reprise `continuous` ou `exact` choisie par l'auteur, rend visible la tension (a) / −deux comportements à tester, `exact` coûte du JS par frame / conflits: M5-S08, M1-S01
- M2-S07 : valide — +tokens et variants d'état seulement, même frontière que M5-S04 / −aucune expressivité pour le layout, valeurs arbitraires sans callback / conflits: M5-S04
- M2-S08 : valide — +deux rôles seulement (donnée sérialisable, preset nommé), sans troisième dialecte / −options non nommables inexprimables en attribut, preset inconnu à faire échouer / conflits: M5-S01
- M2-S09 : valide — +tokens de layout et de présence en custom properties, une retouche pour la marque / −ressort en `linear()` sans vitesse, tokens sans valeurs calculées à l'exécution / conflits: M5-S05, M1-S02
- M2-S10 : valide — +erreurs de surface citant la règle, message exploitable par un agent, zéro coût en production / −détection de mutation par échantillonnage (faux négatifs), le mode dev change le rendu / conflits: M5-S10, M1-S05

## M3 — déclenchement, défilement, boucles, inscription

- M3-S01 : valide — +deux verbes de vue sans collision avec Angular ni Svelte, typage qui refuse `scrub` avec seuil / −deux verbes à apprendre au lieu d'un, repli nommé hors Chromium / conflits: M5-S02
- M3-S02 : valide — +défilement programmé en action et non en verbe, handle commun, natif par défaut / −durée du `smooth` non réglable, pas d'attribut pour le HTML pur / conflits: M5-S02, M1-S06
- M3-S03 : valide — +pause obligatoire vérifiée à la compilation, hors-vue et onglet caché traités par le runtime / −une boucle sur élément jamais observé tourne toujours, pas de `finished` / conflits: M5-S09, M4-S08
- M3-S04 : valide — +`continuity` obligatoire, une omission échoue au build : l'erreur est visible / −une option de plus, `velocity` fait basculer en JS par frame / conflits: M5-S08, M1-S01, M2-S06, M4-S07
- M3-S05 : valide — +valeurs de défilement et de curseur lues par CSS sans JS sur le chemin natif / −`@property` requis pour animer par timeline, le repli écrit des styles / conflits: M1-S07
- M3-S06 : valide — +seuil nouveau = valeur de token, l'agent ne peut pas écrire `0.37` / −jeu fermé qui peut manquer un besoin, le nom ne dit pas la distance réelle / conflits: —
- M3-S07 : valide — +erreurs muettes du déclenchement rendues visibles avant le navigateur, même règle partout / −un `transform` posé par JS échappe à la détection statique / conflits: M5-S10, M1-S05
- M3-S08 : valide — +résolution du nom une fois par élément, nom inconnu = erreur visible, pas de scan / −registre complet au build, ordre d'arrivée des îles non garanti / conflits: M5-S06
- M3-S09 : valide — +coût proportionnel au nombre de groupes et non d'éléments, cascade déclarée / −un élément ajouté après le déclenchement ne rejoint pas la cascade / conflits: —
- M3-S10 : neutre — +breakpoint en variable, le même nom traverse les variants / −`hover:` tactile diverge, `MutationObserver` ciblé coûteux, classe seule incapable d'inscrire / conflits: M5-S04, M5-S06

## M4 — intégration par framework

- M4-S01 : valide — +même spec partout, aucun élément ajouté, pas de règles des hooks sur les listes / −ref callback React 19 requis, attachment Svelte 5 récent / conflits: M5-S07
- M4-S02 : valide — +aucun nom natif repris, `enter` et `exit` remplacés, lint anti-homonyme / −`dismiss` moins immédiat, F6, F16, F17 et F18 non portés / conflits: M5-S02, M5-S03
- M4-S03 : valide — +préférence Tailwind respectée, frontière nette sur l'inscription, référence aux tokens par `var()` / −classes dynamiques invisibles au scanner, deux chemins pour une même intention / conflits: M5-S04
- M4-S04 : valide — +définitions animation et valeur réutilisables entre îles, F14 et F15 dans la même surface / −indirection nom vers définition, inline hors surface / conflits: M5-S06, M1-S07
- M4-S05 : valide — +source unique pour CSS, Tailwind et runtime, intention portée par le token, lint des valeurs en dur / −springs restent des approximations, un token mal classé fausse la réduction / conflits: M5-S05, M1-S02, M2-S09
- M4-S06 : valide — +fautes remontées au build, aucune erreur avalée en production / −deux parseurs à garder identiques, avertissements seulement en dev / conflits: M5-S10, M1-S05
- M4-S07 : conteste — +spec qui dit si la vitesse compte, WAAPI exclu quand elle est promise / −défaut `state` silencieux : un geste mal déclaré saute, contraire à « erreurs visibles » / conflits: M3-S04
- M4-S08 : valide — +boucle enregistrée, un composant ne peut pas oublier de l'arrêter, pause exposée pour WCAG 2.2.2 / −une tâche lente retarde toutes les boucles, phase à choisir par l'auteur / conflits: M3-S03, M5-S09
- M4-S09 : valide — +pages sans JS si l'effet est CSS, F8 et F9 sans nouvelle API / −spec verbeuse en attribut, VT limitée à Chromium, décalage d'hydratation possible / conflits: M1-S10, M5-S01
- M4-S10 : valide — +dogfood : un défaut de surface apparaît d'abord dans nos composants / −tout changement de surface oblige à retoucher les composants / conflits: M5-S07

## Doublons à fusionner

- Reprise à la vitesse (`continuity`, `interrupt`) : M1-S01, M2-S06, M3-S04, M4-S07, M5-S08 → garder M3-S04 (obligatoire au build, nom le plus simple) ; M4-S07 à corriger sur le défaut silencieux
- Définitions nommées et registre : M3-S08, M4-S04, M5-S06 → garder M5-S06 ; M3-S08 (résolution une fois, erreur visible) et la partie valeur de M4-S04 (à arbitrer avec M1-S07) en sous-points
- Tokens : M1-S02 (ressort), M2-S09 (layout et présence), M3-S06 (seuils), M4-S05 (source unique), M5-S05 → garder M4-S05 (source unique, intention, lint des valeurs en dur) ; M1-S02 ajoute la représentation JS des ressorts
- Frontière Tailwind : M2-S07, M4-S03, M5-S04 → garder M5-S04 ; M1-S04 et M3-S10 restent à arbitrer (classes d'effet et encodage des variants)
- Vocabulaire : M4-S02, M3-S01 → garder M5-S02 (table couvrant les 24 familles) ; `scrub` ou `follow` et `dismiss` ou `disappear` à trancher
- Garde-fous et vérification : M1-S05, M2-S10, M3-S07, M4-S06, M5-S10 → garder M5-S10 ; les règles des autres deviennent des contrôles de son manifeste (dont le lint de M5-S03)
- Boucles : M3-S03, M4-S08, M5-S09 → garder M3-S03 (pause obligatoire) ; phase déclarée (M4-S08) et abonné nommé (M5-S09) en sous-points
- Défilement programmé : M1-S06, M3-S02 → garder M3-S02 (action, non verbe) ; retirer le verbe `scroll` de M5-S02
- Forme par framework : M4-S01, M5-S07 → garder M5-S07 ; M4-S10 absorbé (dogfood)
- Spec sérialisable et preset : M2-S08, M5-S01 → garder M5-S01
- Geste : M1-S09, M2-S05 → garder M2-S05 ; le désaccord sur un verbe `drag` en v1 reste à trancher
