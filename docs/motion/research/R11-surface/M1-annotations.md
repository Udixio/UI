# M1 — Annotations des choix M2 à M5 (R11, surface d'écriture)

## Annotations

- M2-S01 : valide — +un seul point d'entrée, mesure avant mutation explicite et traçable / −appel oublié = saut silencieux, détecté seulement par échantillon (M2-S10) / conflits: M2-S10
- M2-S02 : valide — +identité sérialisable au SSR et dans les îles HTML, même nom dans les quatre environnements / −paire hors portée impossible ; unicité laissée à l'auteur / conflits: M5-S01, M4-S09
- M2-S03 : valide — +présence lisible en CSS et par un agent, sans collision avec `animate.leave` / −état à poser avant le retrait ; nœud fantôme si l'état reste `exiting` / conflits: M5-S02, M4-S02
- M2-S04 : valide — +aucun identifiant à inventer, la clé du framework sert d'identité / −liste sans clé stable inanimable ; listes virtualisées perdent l'identité / conflits: M2-S02
- M2-S05 : valide — +une logique de geste pour quatre surfaces, fantôme en `transform` / −`touch-action` et pointeur diffèrent par framework ; mesures figées au départ / conflits: M1-S09, M2-S06
- M2-S06 : valide — +rend visible la tension WAAPI / vitesse par `interrupt: continuous | exact` / −deux comportements à tester ; `exact` coûte du JS par frame / conflits: M1-02, M2-04, M5-S08 (doublon)
- M2-S07 : valide — +Tailwind reste à sa place (tokens, états), jamais porteur d'inscription / −aucune expressivité pour le layout / conflits: M5-S04, M4-S03, M1-S04 (doublons ou voisins)
- M2-S08 : conteste — +forme sérialisable et preset TS nommé, deux formes sans dérive de parité / −attributs d'identité et d'état contredisent M5-S01 (attribut = référence seule) / conflits: M5-S01
- M2-S09 : valide — +tokens de layout en custom properties, presets sans valeur codée en dur / −ressort en table `linear()` sans vitesse / conflits: M5-S05, M1-S02
- M2-S10 : neutre — +erreurs de surface en dev, coût nul en production / −détection de mutation par échantillon, faux négatifs / conflits: M5-S10 (doublon)
- M3-S01 : valide — +deux verbes sans collision avec Angular et Svelte, typage qui refuse le mélange / −deux verbes à apprendre au lieu d'un / conflits: M5-S02 (`follow` absorbe `scrub`)
- M3-S02 : valide — +défilement non détourné, même handle que le reste de la surface / −durée du `smooth` natif non réglable ; pas d'attribut HTML défini / conflits: M5-S02 (verbe `scroll`)
- M3-S03 : valide — +boucle hors écran à coût nul, pause exigée à la compilation / −une boucle sur un élément jamais observé tourne toujours / conflits: M5-S09, M4-S08 (doublons)
- M3-S04 : valide — +omission = erreur au build : la vitesse n'est jamais perdue en silence / −option obligatoire de plus ; `velocity` bascule en JS / conflits: M5-S08, M1-01, M1-02
- M3-S05 : valide — +le CSS consomme la valeur sans JS sur le chemin natif, un écouteur au plus / −`@property` requis pour animer une propriété par timeline / conflits: M1-S07, M4-S04
- M3-S06 : valide — +seuils et marges nommés, aucun nombre littéral dans le code / −un jeu fermé peut ne pas couvrir un besoin réel / conflits: —
- M3-S07 : neutre — +refus au build des déclencheurs mal écrits, message nommé / −un `transform` posé par JS échappe à la détection statique / conflits: M5-S10 (doublon)
- M3-S08 : valide — +résolution une fois au premier attach, aucun scan du document / −registre complet requis au build ; ordre d'arrivée des îles non garanti / conflits: M4-S04, M5-S06 (doublons), M5-07
- M3-S09 : valide — +coût proportionnel au nombre de groupes, pas d'éléments / −un élément ajouté après déclenchement ne rejoint pas la cascade / conflits: M4-03, M1-05
- M3-S10 : valide — +un observateur par type de variant, breakpoint porté par une variable / −`hover:` tactile diverge ; `MutationObserver` ciblé coûte / conflits: M5-S04, M3-04
- M4-S01 : valide — +une spec sérialisable, adaptateurs minces sans composant wrapper / −cleanup de ref exige React 19 ; quatre formes à expliquer / conflits: M5-S07 (doublon)
- M4-S02 : valide — +noms sans homonyme natif, lint contre `animate.enter` et `in:` / −`dismiss` diverge de `disappear` (M5-S02) / conflits: M5-S02, M5-S03
- M4-S03 : valide — +Tailwind en couche CSS seule, purge native, frontière nette avec le runtime / −classes dynamiques invisibles au scanner ; deux chemins pour une intention / conflits: M5-S04, M2-S07 (doublons)
- M4-S04 : valide — +définition nommée réutilisée par îles et frameworks, F14 et F15 dans la surface / −indirection nom vers définition ; inline hors registre / conflits: M1-S07 (« aucun signal » contre lecture par signal), M1-09, M4-07
- M4-S05 : valide — +le designer modifie un fichier, lint contre les valeurs en dur / −springs restent des approximations `linear()` / conflits: M5-S05 (doublon), M1-S02
- M4-S06 : valide — +fautes remontées au build, aucune erreur avalée en production / −deux parseurs à garder identiques / conflits: M5-S10 (doublon)
- M4-S07 : conteste — +la spec déclare si la vitesse compte, plus de déduction depuis un nom / −défaut `state` provoque un saut silencieux, contraire à M5-S08 et M3-S04 / conflits: M5-S08, M3-S04, M1-02
- M4-S08 : valide — +une seule boucle par page, pause exposée pour WCAG 2.2.2 / −une tâche lente retarde toutes les boucles / conflits: M5-S09 (doublon), M1-04
- M4-S09 : valide — +pages statiques sans JS d'animation, îles sans contexte partagé / −VT limitée à Chromium ; décalage d'hydratation si l'attribut diffère / conflits: M1-S10 (doublon), M2-S02 (deux attributs d'identité)
- M4-S10 : valide — +un défaut de surface apparaît d'abord dans nos propres composants / −toute évolution de surface oblige à retoucher les composants / conflits: M5-S07 (doublon)
- M5-S01 : valide — +une seule forme à documenter ; un agent ne peut pas inventer une valeur dans un attribut / −effets à fonction restent en TS ; grammaire réduite / conflits: M2-S02, M2-S08, M4-S09
- M5-S02 : valide — +les 24 familles ont un verbe ou une option testée, F16, F17, F6, F9, F18 entrent / −quinze verbes restent beaucoup ; `split`, `draw`, `morph` se recoupent / conflits: M3-S01, M3-S02, M4-S02, M2-S03
- M5-S03 : valide — +lint contre les noms natifs dans les trois frameworks / −liste à suivre selon les versions des frameworks / conflits: M4-S02 (fusion partielle)
- M5-S04 : valide — +Tailwind retirable, élagage natif, pas de second vocabulaire à aligner / −un effet ne s'écrit pas en classe seule, ce qui contredit M1-S04 / conflits: M1-S04, M2-S07, M4-S03
- M5-S05 : conteste — +une valeur de marque se modifie en un endroit, aucun solveur pour les tokens / −compile tous les ressorts en `linear()` au build, retirant les paramètres JS nécessaires à `carry` / conflits: M1-S02, M5-S08
- M5-S06 : valide — +définition partagée entre îles sans import commun, F19 couvert sans logique par composant / −registre à charger avant usage ; `at:` peut diverger du JS / conflits: M4-S04, M3-S08 (doublons), M5-07
- M5-S07 : valide — +un exemple vaut pour cinq formes, le dogfood révèle les lacunes / −cinq formes à tester ; durées de vie de ref et attachment différentes / conflits: M4-S01 (doublon), M4-S10
- M5-S08 : valide — +vitesse déclarée, source exacte ou estimée visible, aucune dégradation silencieuse / −`carry` peut faire perdre le gain natif ; estimation WAAPI bruitée / conflits: M1-01, M1-03, M3-S04, M2-S06, M4-S07
- M5-S09 : valide — +une horloge par page, abonnés visibles en dev et dans les tests / −un abonné lent retarde la frame ; libération dépend du scope / conflits: M1-04, M4-10, M3-09
- M5-S10 : valide — +une seule source pour types, build, runtime dev et tests / −génération à tenir en CI ; manifeste long pour le contexte d'un agent / conflits: M4-S06, M2-S10, M3-S07 (doublons), M5-10

## Doublons à fusionner

- Continuité (vitesse ou position) : garder M5-S08 ; fusionner M1-S01, M2-S06, M3-S04, M4-S07. Défaut à trancher : M3-S04 (option obligatoire) contre M1-S01 (`value`) et M4-S07 (`state`) ; je retiens l'obligation.
- Forme par framework : garder M4-S01 ; fusionner M5-S07 (table de parité).
- Composants Udixio sur la surface publique : garder M4-S10 ; fusionner la clause dogfood de M5-S07.
- Rôles attribut et objet : garder M5-S01 ; fusionner M2-S08 (les attributs d'identité restent à trancher, voir M5-S01).
- Vocabulaire fermé : garder M5-S02 ; fusionner M5-S03 et la règle de noms réservés de M4-S02. `dismiss` (M4-S02) contre `disappear` (M5-S02) : à trancher.
- Présence, non fusionné : M2-S03 (état) contre `disappear` (M5-S02) et `dismiss` (M4-S02). Une seule forme doit rester ; je propose l'état de M2-S03.
- Tailwind en CSS seul : garder M5-S04 ; fusionner M2-S07 et M4-S03. M1-S04 (classes de palier statique) reste à arbitrer avec M5-S04 sur les classes d'effet.
- Tokens : garder M5-S05 pour le lieu de compilation, amendé selon M1-S02 ; fusionner M4-S05 (lint, intention) et M2-S09.
- Garde-fous : garder M5-S10 ; fusionner M4-S06, M3-S07 et la détection par échantillon de M2-S10.
- Boucles et abonnés : garder M5-S09 ; fusionner M4-S08, M3-S03 (pause obligatoire) et M1-S03.
- Définitions nommées : garder M4-S04 ; fusionner M5-S06 (variantes `at:`) et M3-S08 (résolution au premier attach).
- Valeurs continues : garder M1-S07 ; fusionner M3-S05 (noms des variables). Arbitrage à faire avec M4-S04 sur la lecture par signal.
- Défilement programmé : garder M3-S02 ; fusionner M1-S06.
- View Transitions : garder M1-S10 ; fusionner M4-S09 (`udx-shared`), à aligner sur le nom d'attribut de M2-S02.

Note : parmi les groupes, j'ai gardé deux de mes propres choix (M1-S07, M1-S10) pour leur précision engine. Les autres gardés viennent d'autres experts, et chacun peut contester.
