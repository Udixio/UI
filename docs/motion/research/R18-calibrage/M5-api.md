# R18 — M5 : calibrage et contrat API

Recherche du 5 novembre 2026. Périmètre : P1–P3 du cadre R18, avec priorité à une API prévisible et identique entre les formes. Les chiffres proposés ci-dessous sont des **hypothèses de conception**, pas des prescriptions M3 ni des résultats de tests utilisateurs.

| Point | Proposition | Confiance |
|---|---|---|
| P1 | `spring.default.spatial` par défaut au relâchement vers un point de repos ; Expressive : ratio 0,8, raideur 380 ; Standard : 0,9, 700 | Moyenne pour le rôle ; faible pour le choix perceptif avant démo |
| P2 | Conserver `sm` 8 px, `md` 24 px, `lg` 64 px ; `md` par défaut | Faible à moyenne |
| P3 | Conserver `tight` 30 ms, `normal` 60 ms, `loose` 120 ms et plafond de départ 400 ms ; `normal` par défaut | Moyenne pour l'ordre de grandeur, faible pour chaque chiffre exact |

## P1 — Ressort du relâchement

**Faits.** [M3 : fonctionnement](https://m3.material.io/styles/motion/overview/how-it-works) et [table des valeurs](https://m3.material.io/styles/motion/overview/specs), relevés dans [R17](../R17-m3-motion-tokens.md), distinguent les ressorts spatiaux `fast`, `default`, `slow` et deux schémas globaux. `fast` vise les petits composants, `default` les surfaces partielles et `slow` le plein écran ; M3 précise aussi que ses composants utilisent les tokens Expressive fast. Sa conversion web en courbe vise les animations sans geste ni interruption. Elle ne désigne pas un ressort universel de relâchement de geste. [Apple](https://developer.apple.com/documentation/uikit/uispringtimingparameters/initialvelocity) recommande de transmettre la vitesse initiale pour raccorder un geste au ressort ; son API UIKit normalise cette vitesse par la distance jusqu'à la cible. [Motion drag](https://motion.dev/docs/drag) conserve par défaut la vitesse dans une animation **d'inertie**, distincte d'un ressort vers une cible.

**Déduction et choix.** Choisir `default.spatial` comme valeur stable et explicite pour une primitive générique de relâchement vers un point de repos : son amortissement Expressive 0,8 est plus retenu que le 0,6 de `fast`, et la même valeur est déjà retenue pour `layout`. Ce choix ne découle pas d'une mesure comparative et le couple 380/0,8 ne se compare directement à UIKit que si les conventions physiques et unités du moteur sont identiques. Conserver les schémas globaux : ne pas figer les valeurs Expressive dans le contrat. Pas de sélection automatique par taille : celle-ci introduirait des seuils non sourcés et ferait changer le comportement au redimensionnement. Un petit contrôle peut choisir `fast.spatial`, une surface plein écran `slow.spatial`, explicitement dans sa définition.

Le contrat doit conserver position et vitesse au raccord, adapter les unités au moteur et traiter séparément le cas distance résiduelle nulle avant toute normalisation. `carry` décrit la continuité ; il ne décide ni la cible ni la physique. Un lancer libre peut nécessiter une inertie puis un ressort aux limites : ne pas le présenter comme équivalent à un `snap`. Le détail de cette composition reste à définir, sans inventer d'option publique supplémentaire. Le mouvement réduit conserve l'interaction et applique le repos sans animation de relâchement, conformément au §8.2.4.

## P2 — Distances

**Faits.** [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) associe la durée à l'ampleur du déplacement et de la transformation ; il ne prescrit pas ces trois distances. [WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) est un critère AAA sur la possibilité de désactiver les animations de mouvement non essentielles déclenchées par une interaction : il ne définit aucun seuil de pixels sûr. Une petite translation reste une translation.

**Déduction et choix.** Conserver `8 / 24 / 64 px` comme amplitude de translation initiale, mesurée en pixels CSS, et `md` comme défaut hypothétique : `sm` pour un indice discret, `md` pour une entrée courante, `lg` pour une entrée plus marquée et choisie explicitement. Ces usages sont des repères Udixio, pas des catégories M3. La distance n'est ni une taille de composant ni une durée : éviter de l'inférer automatiquement du viewport ou de l'élément. Une entrée depuis un bord hors écran dépend de la géométrie réelle et n'est pas représentée par `lg`. La direction détermine axe et signe ; `distance` exprime une magnitude positive et ne doit pas inverser la direction.

Sous préférence de mouvement réduit, appliquer le rendu réduit prévu par le verbe, sans translation décorative ; ne pas prétendre que `sm` suffit à satisfaire WCAG. Tester notamment mobile, écran agrandi, grands panneaux et juxtaposition d'éléments.

## P3 — Cascade

**Faits.** [Motion `stagger`](https://motion.dev/docs/stagger) définit un écart entre départs et donne des exemples à 50 et 100 ms ; son [exemple de texte](https://motion.dev/docs/text-animation) utilise 30 ms par caractère. Ce sont des exemples d'API, pas des recommandations universelles. Aucune de ces sources ne prescrit un plafond de 400 ms.

**Déduction et choix.** Conserver 30 / 60 / 120 ms pour couvrir densité forte, liste courante et accent ponctuel. Le plafond de **400 ms concerne l'écart entre le premier et le dernier départ**, pas la durée complète de l'animation ; chaque enfant conserve sa propre durée. Pour `n` éléments simultanément connus et un rang `i` de 0 à `n−1`, utiliser `pasEffectif = min(pasToken, 400 / (n−1))` si `n > 1`, puis `délai(i) = i × pasEffectif` ; pour `n ≤ 1`, délai zéro. Le départ éventuel de la séquence s'ajoute ensuite et ne compte pas dans le plafond de cascade. Exemple : 10 éléments en `normal` → pas ≈ 44,44 ms, derniers départs à 400 ms ; 4 éléments → 0, 60, 120, 180 ms. Cette compression conserve un rythme uniforme, contrairement à un simple `min(i × pas, 400)` qui groupe artificiellement les derniers. Le rang doit suivre l'ordre choisi par le contrat de séquence ; la décision DOM/visuel et le comportement d'éléments ajoutés en cours de lecture restent à arbitrer séparément.

En mouvement réduit, les enfants adoptent immédiatement leur rendu réduit, sans conserver un délai décoratif. Un long effet sur des caractères peut retarder la lecture : privilégier la disponibilité immédiate du contenu et tester les grandes listes.

## Surface proposée et vérifications

Dans la grammaire existante de la spec, `spring`, `distance` et `stagger` acceptent des **noms de tokens**, avec omission donnant les défauts ci-dessus ; les attributs HTML restent des références ou mots-clés fermés, jamais des nombres libres. Exemple de valeurs conceptuelles : `spring: 'default.spatial'`, `distance: 'md'`, `stagger: 'normal'`. La syntaxe précise reste à aligner sur les types et la table verbe × option : ces exemples ne créent pas de nouvelle API. Une source TS unique émet les variables CSS de distance et de stagger et alimente manifeste et validateurs, conformément au principe R14 M5-R01/R03 ; la résolution du schéma de ressort reste globale. La valeur de plafond est une politique explicite partagée par les moteurs, exprimée en ms.

Avant de lever les drapeaux provisoires : comparer `fast`/`default` en drag court, swipe rapide et snap de panneau ; vérifier continuité lors d'une interruption et une vitesse nulle ; comparer les trois distances à diverses tailles ; mesurer les départs pour 0, 1, 4 et 10 enfants et contrôler le rendu réduit. Faire apprécier les variantes sur de vraies démos, y compris par des personnes sensibles au mouvement : aucun document cité ne valide perceptivement ces valeurs pour Udixio.
