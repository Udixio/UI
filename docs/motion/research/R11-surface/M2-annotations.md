# M2 — Annotations des choix M1, M3, M4, M5 (surface d'écriture, R11)

Lecture depuis la spécialité layout / élément partagé / présence. valide = compatible avec la surface layout-présence ; conteste = contredit une contrainte de layout ou de présence ; neutre = hors de ma spécialité ou sans effet direct.

## M1 — moteur et rendu

- M1-S01 : valide — +garantie de vitesse publiée dans le manifeste, routage JS explicite / −le même verbe change de moteur selon une option ; WAAPI reste par valeur / conflits: M3-S04, M4-S07, M5-S08
- M1-S02 : neutre — +un token, deux représentations générées, l'auteur ne choisit pas / −test d'écart de tracé requis ; N points fixes, overshoot court approché / conflits: M5-S05
- M1-S03 : valide — +une boucle par page, y compris pour les îles tardives, file bornée sous le même `globalThis` / −une spec lourde retarde toutes les autres ; ordre de rejeu non garanti sans phase / conflits: M5-S09
- M1-S04 : neutre — +refus au build des classes qui exigent du JS, CSS limité aux classes détectées / −`motion-${x}` invisible au scanner ; couplage au registre / conflits: M5-S04, M3-S10
- M1-S05 : neutre — +un même prédicat pour tous les environnements, erreur au build et en CI / −prédicat à suivre à chaque moteur ; faux refus si trop large / conflits: M5-S10
- M1-S06 : valide — +scrub natif, `scrollTo` natif, restauration de position et ancres préservées / −durée du `smooth` natif non réglable ; sans timeline, scrub neutre / conflits: M3-S02
- M1-S07 : neutre — +zéro re-rendu, écriture identique dans les quatre environnements / −collision avec un style inline géré par le framework ; un nœud texte réécrit casse le compteur / conflits: M3-S05, M4-S04
- M1-S08 : valide — +texte et tracé SVG sans mutation après peinture, chunk JS seulement pour le morphing / −les spans de découpe peuvent casser retours à la ligne et sélection ; découpe serveur et client à aligner / conflits: —
- M1-S09 : valide — +la vitesse au relâchement suit la règle de reprise commune, pas de moteur de geste en v1 / −vitesse estimée sur peu d'échantillons, bruitée ; clavier non traité / conflits: M5-S02, M2-S05
- M1-S10 : valide — +nom de VT posé au premier attach, zéro JS par frame, refus explicite d'une reprise en vol / −une VT à la fois ; collisions de nom entre îles / conflits: M4-S09, M1-S01

## M3 — déclenchement, défilement, boucles, inscription

- M3-S01 : valide — +`reveal` et `scrub` évitent `enter`, `exit`, `in`, `out` ; le typage refuse le mélange seuil / intervalle / −`scrub` reste un nom distinct alors que M5-S02 l'absorbe dans `follow` / conflits: M5-S02
- M3-S02 : valide — +défilement programmé = action à handle, pas un verbe d'élément ; ancres et restauration natives / −pas d'équivalent en attribut pour le HTML pur (à trancher) / conflits: M5-S02, M1-S06
- M3-S03 : neutre — +pause obligatoire vérifiée à la compilation ; une boucle hors écran coûte zéro / −une boucle sur élément jamais observé tourne ; pas de `finished` pour la reprise / conflits: M5-S09, M4-S08
- M3-S04 : valide — +WAAPI ne perd plus la vitesse en silence, le choix est écrit dans le code / −option obligatoire de plus ; défaut contradictoire avec M4-S07 et M1-S01 / conflits: M5-S08, M4-S07, M1-S01
- M3-S05 : valide — +valeurs de défilement et de curseur lues par le CSS, une écriture par frame / −une propriété personnalisée animée par timeline exige `@property` / conflits: M1-S07, M4-S04
- M3-S06 : neutre — +seuils nommés en tokens, aucun nombre littéral dans le code / −un jeu fermé ne couvre pas tous les besoins ; le nom ne dit pas la distance réelle / conflits: —
- M3-S07 : valide — +refuse un `reveal` sur une cible à `transform` statique et sans sentinelle : protège le déclenchement et la présence / −un `transform` posé par JS échappe à la détection statique / conflits: M5-S10
- M3-S08 : valide — +résolution par nom au premier attach, nom inconnu = erreur, aucun scan du document / −registre complet au build ; ordre d'arrivée des îles non garanti / conflits: M4-S04, M5-S06
- M3-S09 : valide — +un groupe, une sentinelle, décalage par index : coût proportionnel aux groupes, adapté aux listes / −un élément ajouté après déclenchement ne rejoint pas la cascade / conflits: M2-S04
- M3-S10 : neutre — +Tailwind encode les variants, le runtime observe chaque type une fois / −`hover:` tactile diverge ; `MutationObserver` ciblé coûte si nombreux / conflits: M5-S04, M4-S03

## M4 — formes par framework, vocabulaire, Tailwind, définitions

- M4-S01 : valide — +même spec sérialisable pour quatre adaptateurs, ref React 19 sans wrapper ; `track` explicite rejoint M2-S04 / −quatre formes à expliquer ; listes Angular demandent `track` / conflits: M5-S07
- M4-S02 : valide — +refus des noms natifs (`animate.enter`, `in:`, `out:`) : supprime la confusion de lecture / −`dismiss` moins immédiat qu'`exit` ; F6, F16 à F18 non portés / conflits: M5-S02, M5-S03
- M4-S03 : valide — +Tailwind sans présence ni inscription, valeurs arbitraires seulement par référence à un token / −classes dynamiques invisibles au scanner / conflits: M5-S04, M3-S10
- M4-S04 : valide — +définitions typées et sérialisables, F14 et F15 dans la même surface, le nom sert de contrat / −une définition enregistrée avant l'hydratation de l'île ; les animations inline sortent de la surface / conflits: M1-S07, M5-S06, M3-S08
- M4-S05 : valide — +aucune valeur en dur dans une spec, l'intention est portée par le token / −ressorts restent des approximations `linear()` ; passage par le build / conflits: M1-S02, M5-S05
- M4-S06 : neutre — +trois étages (typage, build, dev) et lint sur les verbes sans intention / −deux parseurs à garder identiques / conflits: M5-S10
- M4-S07 : valide — +la spec dit si la vitesse compte ; WAAPI n'est pas choisi si `velocity` est promise / −défaut `state` peut produire un saut sur un geste mal déclaré / conflits: M3-S04, M5-S08, M1-S01
- M4-S08 : valide — +boucle abonnée à la frame unique, pause exposée, aucun `requestAnimationFrame` par composant / −une tâche lente retarde toutes les boucles / conflits: M5-S09, M1-S03
- M4-S09 : valide — +îles hydratées tard reçoivent l'état final (M4-03) ; attribut statique sans contexte partagé / −`udx-shared` explicite contre le nom automatique de M1-S10 ; VT limitée à Chromium / conflits: M1-S10, M2-S02
- M4-S10 : valide — +les composants internes testent la surface avant les sites : un défaut apparaît d'abord en interne / −toute évolution de surface oblige à retoucher les composants / conflits: M5-S07

## M5 — API, vocabulaire, outillage

- M5-S01 : valide — +deux rôles seulement (attributs = références, objets = définitions) ; un agent ne peut pas inventer de valeur / −effets à fonction restent en TS ; grammaire réduite à un nom et une option / conflits: M2-S08, M4-S04
- M5-S02 : valide — +table famille vers verbe testée, les 24 familles couvertes dont F16 à F18 / −quinze verbes pour un débutant ; `drag` contredit M1-S09 ; `scroll` contredit M3-S02 ; `disappear` (verbe) contredit l'état de M2-S03 ; `follow` absorbe `scrub` / conflits: M3-S01, M3-S02, M1-S09, M2-S03, M4-S02
- M5-S03 : valide — +lint anti-collision : `udxMotion` et `data-motion` sans homonyme natif / −liste des noms réservés à suivre selon les versions des frameworks / conflits: M4-S02
- M5-S04 : valide — +Tailwind limité aux tokens et aux états, pas de second vocabulaire / −un effet ne s'écrit pas en classe seule ; réduction à répliquer en CSS / conflits: M4-S03, M1-S04, M3-S10
- M5-S05 : neutre — +ressort de token compilé au build, une valeur de marque en un seul endroit / −N points fixes approximatifs ; `linear()` ne transporte pas la vitesse (tension a) / conflits: M1-S02
- M5-S06 : valide — +définition partagée entre îles sans import commun, une faute de nom cite la définition / −les définitions inline échappent au registre ; `at:` non traduisible diverge / conflits: M4-S04, M3-S08
- M5-S07 : valide — +une forme par framework, composants Udixio sur la surface publique : le dogfood révèle les lacunes / −cinq formes à tester ; ref React et attachment Svelte n'ont pas la même durée de vie / conflits: M4-S01, M4-S10
- M5-S08 : valide — +`carry` / `restart` et `velocity.source` : la dégradation se voit, jamais en silence / −`carry` peut basculer en JS et perdre le gain natif / conflits: M1-S01, M3-S04, M4-S07
- M5-S09 : valide — +horloge unique, abonnés nommés, `inspect()` liste les abonnés vivants en dev / −un abonné doit être libéré par son scope ; un abonné lent retarde la frame / conflits: M4-S08, M1-S03, M3-S03
- M5-S10 : valide — +une seule source alimente types, build, dev et tests : aucune erreur silencieuse / −génération à tenir en CI ; le lint ne voit pas les noms construits à l'exécution / conflits: M4-S06, M1-S05, M3-S07

## Doublons à fusionner

Id gardé en gras. Les ids listés après « ← » sont absorbés par l'id gardé.

1. Continuité et reprise (5 propositions) : **M5-S08** ← M2-S06, M1-S01, M3-S04, M4-S07. Défaut à trancher : obligatoire (M3-S04) ou `state` / `value` par défaut (M4-S07, M1-S01).
2. Présence, mécanisme : **M2-S03** (état `data-presence`) ; M5-S02 (`disappear`) et M4-S02 (`dismiss`) sont des noms pour un même mécanisme, à arbitrer.
3. Vocabulaire et noms réservés : **M5-S02** ← M4-S02, M5-S03 (même périmètre : pas de nom natif).
4. Tailwind couche CSS : **M5-S04** ← M4-S03, M1-S04 (refus au build des classes exigeant du JS).
5. Tokens de mouvement : **M5-S05** ← M1-S02, M4-S05, M2-S09.
6. Vérification : **M5-S10** ← M4-S06, M1-S05, M3-S07, M2-S10.
7. Formes par framework : **M5-S07** ← M4-S01, M4-S10.
8. Définitions nommées : **M4-S04** ← M5-S06, M3-S08, M5-S01, M2-S08.
9. Boucles et abonnés au runtime : **M5-S09** ← M4-S08, M1-S03, M3-S03.
10. Défilement programmé : **M3-S02** ← M1-S06.
11. Valeurs de défilement et de curseur en CSS : **M3-S05** ← M1-S07 (variante « texte du compteur » à garder à part).
12. Geste de réordonnancement : **M2-S05** ← M1-S09 (passage de la vitesse au relâchement).

Chevauchements non fusionnés (conflits restants) : M3-S09 / M2-S04 (décalage de groupe contre identité de liste) ; M1-S10 / M4-S09 (nom de VT automatique contre `udx-shared`) ; M3-S01 / M5-S02 (`scrub` contre `follow`).
