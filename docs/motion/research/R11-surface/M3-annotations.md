# M3 — Annotations des choix M1, M2, M4, M5 (surface d'écriture)

## M1 — moteur et rendu

- M1-S01 : valide — +garantie de vitesse publiée dans le manifeste, reprise exacte quand elle est demandée / −le même verbe change de moteur selon une option ; WAAPI ne transporte pas la vitesse / conflits: M3-S04, M2-S06, M4-S07, M5-S08 (même contrat, à fusionner)
- M1-S02 : valide — +un token, deux représentations générées, le designer règle des paramètres physiques / −deux représentations à garder égales ; overshoot court approché par N points / conflits: M5-S05 (lieu du calcul, doublon)
- M1-S03 : valide — +aucune boucle écrite par l'auteur, une seule frame par page, file avant chargement / −une spec lourde retarde les autres ; la file avant chargement doit être bornée / conflits: M5-S09, M4-S08, M3-S03 (même boucle, doublons)
- M1-S04 : valide — +zéro JS pour les specs statiques, refus au build de toute classe qui exige du JS / −classes dynamiques invisibles au scanner ; le plugin se couple au registre / conflits: M5-S04, M4-S03, M2-S07 (Tailwind, doublons)
- M1-S05 : valide — +un prédicat unique pour tous les environnements, avec ou sans plugin / −le prédicat doit suivre chaque moteur ; trop large, il produit de faux refus / conflits: M5-S10, M4-S06 (vérification, doublons)
- M1-S06 : valide — +restauration de position, ancres et trackpads natifs ; la surface ne peut pas détourner le scroll / −durée du `smooth` natif non réglable ; pas d'inertie / conflits: M3-S01 (même verbe `scrub`), M3-S02 (`scrollTo` en action)
- M1-S07 : valide — +zéro re-rendu, compteur rendu côté serveur déjà à sa cible finale / −écriture hors framework, collision avec un style inline géré / conflits: M4-S04 (`defineValue`), M3-S05 (propriétés de défilement, doublon)
- M1-S08 : neutre — +texte statique sans mutation de DOM après peinture, tracé SVG natif / −DOM plus lourde ; serveur et client doivent produire la même découpe / conflits: —
- M1-S09 : valide — +une seule règle de reprise pour geste et animation, pas de moteur de geste en v1 / −vitesse estimée sur quelques échantillons ; `touch-action` peut entrer en conflit avec le défilement natif / conflits: M2-S05 (même geste, deux primitives)
- M1-S10 : valide — +zéro JS par frame pour la navigation, le refus de VT concurrente évite un état mixte / −une VT à la fois, `startViewTransition` Chromium seul / conflits: M1-03 (reprise en R10), M4-S09 (nommage, doublon partiel)

## M2 — layout, partagé, présence

- M2-S01 : valide — +un seul point d'entrée pour les quatre environnements, moment de mesure explicite / −un appel oublié donne un saut silencieux, seul M2-S10 le détecte / conflits: M1-06 (fusionné en R10 dans M2-03)
- M2-S02 : valide — +identité sérialisable, visible au SSR et dans les îles HTML / −une paire hors portée devient impossible pour les îles sans scope commun / conflits: M2-01 (résolution globale, absorbée par M5-07)
- M2-S03 : valide — +état `data-presence` stylable en CSS et lisible par l'observateur de vue (M3-01), pas de collision de nom / −l'état doit être posé avant le retrait du nœud / conflits: M5-S02 (`disappear`), M4-S02 (`dismiss`), M4-03 (mécanisme R10)
- M2-S04 : valide — +aucun identifiant à inventer, stagger déclaré une fois sur le conteneur / −liste sans clé stable non animable ; une liste virtualisée perd son identité / conflits: M3-S09 (groupe à une sentinelle, doublon)
- M2-S05 : neutre — +une logique de geste pour quatre surfaces, fantôme en `transform` / −mesures des voisins figées au départ ; un défilement natif pendant le drag les fausse / conflits: M1-S09 (vitesse au lâcher)
- M2-S06 : valide — +rend visible la tension WAAPI / reprise exacte, sans changer le code / −deux comportements à tester ; `exact` coûte du JS par frame / conflits: M1-S01, M4-S07, M5-S08, M3-S04 (doublons)
- M2-S07 : valide — +Tailwind reste à sa place (tokens, variants), aucune classe ne déclare de layout / −aucune expressivité Tailwind pour le layout / conflits: M5-S04, M4-S03, M1-S04 (doublons Tailwind)
- M2-S08 : valide — +deux formes seulement, pas de dérive de parité entre syntaxes / −les options non nommables ne sont pas exprimables en attribut / conflits: M5-S01 (même décision, doublon)
- M2-S09 : valide — +une retouche de marque pour toutes les surfaces, lisible sans contexte partagé / −un ressort en `linear()` n'expose pas la vitesse / conflits: M4-S05, M5-S05 (tokens, doublons)
- M2-S10 : neutre — +erreurs de surface dev citant la règle, zéro coût en production / −détection de mutation par échantillonnage, faux négatifs ; le mode dev change le rendu / conflits: M5-S10, M4-S06, M1-S05 (vérification, doublons)

## M4 — intégration aux frameworks

- M4-S01 : valide — +aucun élément DOM ajouté, pas de règles des hooks pour les listes / −ref callback React 19 requis ; listes Angular à gérer avec `track` / conflits: M5-S07 (formes par framework, doublon)
- M4-S02 : conteste — +noms sans homonyme natif, `dismiss` évite la collision avec `out:` / −`appear` mêle montage et entrée à la vue : il brouille la distinction `reveal` / `scrub` (M3-S01) / conflits: M3-S01, M5-S02, M5-S03
- M4-S03 : valide — +purge native, frontière nette : Tailwind n'inscrit jamais / −deux chemins (classe ou spec) pour une même intention / conflits: M5-S04 (doublon), M1-S04
- M4-S04 : valide — +une définition typée réutilisée par îles et frameworks, le nom sert de contrat à un agent / −indirection à résoudre ; enregistrement avant hydratation de l'île / conflits: M5-S06 (doublon), M3-S08 (registre par nom), M1-S07
- M4-S05 : valide — +le designer modifie un fichier, un lint interdit les valeurs en dur / −les ressorts restent des approximations `linear()` / conflits: M5-S05, M2-S09 (doublons)
- M4-S06 : valide — +fautes d'humain et d'agent remontées au build, aucune erreur silencieuse / −deux parseurs à garder identiques / conflits: M5-S10 (doublon), M1-S05
- M4-S07 : valide — +la spec dit si la vitesse compte, WAAPI jamais choisi quand elle est promise / −`velocity` coûte du JS ; le défaut `state` peut sauter sur un geste mal déclaré / conflits: M5-S08, M2-S06, M1-S01, M3-S04 (doublons)
- M4-S08 : valide — +une boucle par page, pause exposée pour WCAG 2.2.2 / −une tâche lente retarde toutes les boucles ; les boucles CSS infinies restent hors chemin / conflits: M5-S09, M1-S03, M3-S03 (doublons)
- M4-S09 : valide — +pages sans JS d'animation si l'effet est CSS, F8 et F9 sans API nouvelle / −VT limitée à Chromium avec repli à l'état final ; décalage d'hydratation si l'attribut diverge / conflits: M1-S10 (VT, doublon partiel), M5-S01
- M4-S10 : valide — +la surface est éprouvée par nos propres composants avant les sites / −tout changement de surface oblige à retoucher les composants internes / conflits: M5-S07 (dogfood, doublon partiel)

## M5 — API, DX, outillage

- M5-S01 : valide — +une seule forme à maintenir, un agent ne peut pas inventer une valeur dans un attribut / −les effets à callbacks restent en TS / conflits: M2-S08 (doublon), M3-S10
- M5-S02 : conteste — +table famille → verbe testée, chaque famille a un nom vérifiable / −`scroll` comme verbe contredit l'action `scrollTo` (M3-S02) ; `follow` recouvre `scrub` sans le nommer / conflits: M3-S01, M3-S02, M4-S02, M2-S03
- M5-S03 : valide — +corrige la collision avec `animate.enter` et les directives Svelte, lint court / −liste de noms réservés à suivre selon les versions / conflits: M4-S02 (même correction, doublon partiel)
- M5-S04 : valide — +Tailwind reste une couche retirable, élagage natif, pas de second vocabulaire / −un effet ne s'écrit pas en classe seule ; réduction à répliquer en CSS / conflits: M4-S03, M1-S04, M2-S07 (doublons) ; M3-S10 (variables CSS contre `@custom-variant`, à unifier)
- M5-S05 : valide — +tranche le lieu du calcul de ressort, aucun solveur pour les tokens / −N points fixes approximatifs ; `linear()` ne transporte pas la vitesse / conflits: M1-S02 (doublon), M5-S08
- M5-S06 : neutre — +définitions partagées entre îles sans import commun, F19 sans logique par composant / −`at:` traduit en media queries diverge du `matchMedia` de M3-S10 si non traduisible / conflits: M4-S04 (doublon), M3-S10 (breakpoints)
- M5-S07 : valide — +un exemple vaut pour tous les frameworks, le dogfood révèle les lacunes / −cinq formes à tester ; nom `useMotion` différent de `motion()` (M4-S01) / conflits: M4-S01 (doublon), M4-S10
- M5-S08 : valide — +`velocity.source` rend l'approximation visible, `restart` reste disponible / −`carry` peut faire basculer en JS et perdre le gain natif / conflits: M1-S01, M2-S06, M4-S07, M3-S04 (doublons) ; M1-03 (règle de reprise)
- M5-S09 : valide — +une seule horloge, abonnés inspectables, pause et réduction uniformes sans code par composant / −l'abonné doit être libéré par son scope ; un abonné lent retarde la frame / conflits: M1-S03, M4-S08 (doublons), M3-S03 (`loop` avec pause)
- M5-S10 : valide — +une erreur d'attribut casse le build et non l'écran ; agents et types lisent la même source / −génération et vérification à tenir en CI ; le lint ne voit pas les noms construits à l'exécution / conflits: M4-S06, M1-S05, M2-S10 (doublons)

## Doublons à fusionner

- Contrat d'interruption (vitesse) : M1-S01, M2-S06, M4-S07, M3-S04, M5-S08 → garder **M5-S08** (seul à exposer `velocity.source` au handle) ; absorber la garantie publiée de M1-S01 et le défaut de M4-S07.
- Ressort et tokens de mouvement : M1-S02, M5-S05, M2-S09, M4-S05, M3-S06 → garder **M1-S02** pour la compilation double représentation ; absorber le lieu de calcul de M5-S05 et les tokens fermés de M3-S06 dans **M4-S05** (source unique).
- Tailwind : M1-S04, M2-S07, M4-S03, M5-S04, M3-S10 → garder **M5-S04** ; absorber le refus au build de M1-S04 et les valeurs arbitraires par référence à un token de M4-S03.
- Défilement programmé et scrub : M1-S06, M3-S02, M3-S01 → garder **M1-S06** (natif, sans détournement) ; `scrollTo` devient une sous-action de M1-S06.
- Verbes de vue : M3-S01, M5-S02 (`follow`), M4-S02 (`appear`) → garder **M3-S01** (`reveal` / `scrub`, séparés) ; absorber `disappear` de M5-S02 et renommer `follow` en `scrub`.
- Présence : M2-S03, M4-S02 (`dismiss`), M5-S02 (`disappear`), M4-03 (acquis R10) → garder **M2-S03** (état `data-presence`) comme surface, M4-03 comme mécanisme.
- Noms réservés : M5-S03, M5-S02 → garder **M5-S02** (table) et absorber la liste de M5-S03.
- Boucles au runtime : M1-S03, M4-S08, M5-S09, M3-S03 → garder **M5-S09** (horloge partagée, abonnés nommés, inspection) ; absorber la phase déclarée de M4-S08 et la pause obligatoire de M3-S03.
- Définitions nommées : M4-S04, M5-S06, M3-S08 → garder **M4-S04** (`defineMotion` et `defineValue`) ; absorber les variantes `at:` de M5-S06.
- Formes par framework : M4-S01, M5-S07 → garder **M4-S01** (adaptateurs minces) ; absorber la table des cinq formes et le dogfood de M5-S07 et M4-S10.
- Attributs contre objets : M5-S01, M2-S08 → garder **M5-S01** ; absorber le preset nommé de M2-S08.
- Vérification : M5-S10, M4-S06, M1-S05, M2-S10, M3-S07 → garder **M5-S10** (quatre niveaux, source unique) ; absorber les contrôles dev de M2-S10 et la détection de `transform` statique de M3-S07.
- Groupes et stagger : M3-S09, M2-S04 → garder **M3-S09** (une sentinelle par groupe) ; absorber la clé de liste de M2-S04.
- Valeurs continues : M1-S07, M3-S05 → garder **M1-S07** ; absorber les propriétés de défilement et de curseur de M3-S05.
- Chevauchements non fusionnés (à arbitrer) : M1-S09 et M2-S05 (geste en amont et primitive de réordonnancement) ; M1-S10 et M4-S09 (VT, nommage).
