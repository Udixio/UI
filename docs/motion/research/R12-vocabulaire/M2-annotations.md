# M2 — Annotations des choix M1, M3, M4, M5 (vocabulaire, R12)

Lecture depuis la spécialité layout / élément partagé / présence / listes / réordonnancement. valide = compatible avec mes choix layout-présence ; conteste = contredit une contrainte de layout ou de présence ; neutre = hors de ma spécialité ou sans effet direct.

## M1 — moteur et rendu

- M1-V01 : valide — +coût prévisible par nom ; le build refuse une option qui ferait descendre la classe de moteur / −une classe par verbe reste approximative ; la classe effective de `layout` doit être publiée / conflits: M5-S08, M1-01
- M1-V02 : valide — +`layout` reste natif en `carry` ; le JS n'arrive qu'avec un ressort, `drag` ou `follow` / −une interruption de FLIP sans vitesse peut avoir une vitesse visuelle différente / conflits: M5-S08, M1-03
- M1-V03 : conteste — +défaut lisible par l'agent sans table externe ; `layout` en `carry` est juste / −`disappear` en `restart` saute si un `appear` l'interrompt, ce qui contredit le défaut `carry` de M2-V06 / conflits: M2-V06, M4-03
- M1-V04 : neutre — +un rendu réduit fixé par verbe, publié dans le manifeste / −`instant` retire le nœud sans transition de sortie ; le rendu réduit de `layout` n'est pas précisé / conflits: M5-V02
- M1-V05 : valide — +le verbe reste stable quand le ressort change de moteur, une seule source CSS et JS / −la table `linear()` ne transporte pas la vitesse d'interruption, donc `layout` en `carry` exige le JS / conflits: M5-S05, M1-02
- M1-V06 : neutre — +trois noms pour trois moteurs (vue, défilement, valeur) / −`follow` hors de ma spécialité ; sa survie dépend de M5-V08 / conflits: M5-V08, M3-V02
- M1-V07 : valide — +un seul verbe pour la sortie, un état lisible en CSS, nœud retenu jusqu'à `finished` / −deux noms pour une sortie à expliquer ; l'état exposé en CSS contredit M2-V03 (état interne) / conflits: M2-V03, M4-V03
- M1-V08 : neutre — +`scrollTo` est une action unique, le défilement n'est pas un effet d'élément / −`tween` perd son nom pour un débutant / conflits: M3-V03
- M1-V09 : valide — +`stagger`, `duration` et `threshold` à domaine fermé : un agent ne peut pas inventer une valeur de layout / −un domaine fermé manque peut-être une distance de layout / conflits: M5-V03, M3-V05
- M1-V10 : valide — +chaque option s'observe par `attributeFilter`, validée au build / −plusieurs attributs alourdissent les éléments de liste / conflits: M5-V04, M3-V07, M4-V10

## M3 — vue, défilement, boucles, seuils

- M3-V01 : valide — +nom court sans homonyme natif, même mot que le mécanisme du runtime / −`reveal` et `appear` se recouvrent pour l'entrée à la vue ; le sens du mouvement n'est pas dit / conflits: M2-V03, M5-V01
- M3-V02 : neutre — +mots exacts de `animation-range`, rien à traduire / −`scrub` peu connu hors GSAP / conflits: M5-V01, M1-V06
- M3-V03 : neutre — +défilement programmé sans verbe d'élément, sens natif conservé / −pas d'attribut HTML pur, donc JS obligatoire / conflits: M5-V08, M1-V08
- M3-V04 : neutre — +WCAG 2.2.2 devient une donnée vérifiée / −pas de boucle finie en v1 / conflits: M5-V02
- M3-V05 : neutre — +aucun nombre littéral, seuils en jetons / −cinq mots ne couvrent pas tous les cas / conflits: M1-V09, M5-V03
- M3-V06 : conteste — +`from` dit d'où vient l'élément, utile pour choisir le bord d'une sortie / −« origine » contredit le « sens du mouvement » de M2-V08 (`rise`, `drop`, `sink`, `lift`) ; `from` est lu comme position absolue / conflits: M2-V08, M4-V08, M5-V03
- M3-V07 : valide — +chaque option s'observe à part, valeurs de jetons fermées / −plusieurs attributs à garder synchrones avec la définition / conflits: M1-V10, M4-V10, M5-V04
- M3-V08 : valide — +`stagger` sur le groupe, mot convergent, cohérent avec ma M2-V04 / −une cascade n'est pas une séquence ; un élément ajouté sort de la cascade / conflits: M2-V04, M5-V01
- M3-V09 : valide — +`data-presence` et `data-view` écrits seulement par le runtime, séparation nette / −un état posé par JS n'existe pas au rendu serveur / conflits: M2-V03, M1-V07
- M3-V10 : valide — +peu de noms, aucun sens dans le nom, direction en option / −`rise` moins parlant ; liste différente de M5-V05 / conflits: M2-V08, M4-V09, M5-V05

## M4 — intégration frameworks, HTML

- M4-V01 : valide — +une seule liste de noms natifs pour les quatre environnements / −liste à réviser à chaque majeure ; refuse `layout` et `drag` par précaution / conflits: M5-V07
- M4-V02 : neutre — +`loop` reste naturel hors média / −règle conditionnelle à expliquer / conflits: M5-V04
- M4-V03 : valide — +mêmes verbes que ma M2-V03 ; le rendu réduit est décidé par le verbe / −`disappear` sonne moins naturellement ; `data-presence` doit précéder le retrait / conflits: M2-V03, M1-V07
- M4-V04 : neutre — +noms par mécanisme (vue, défilement, valeur) et typage qui sépare les options / −trois verbes à apprendre ; `follow` contredit M5-V08 / conflits: M5-V08, M1-V06, M3-V02
- M4-V05 : neutre — +aucun verbe `scroll` ni `view`, pas de collision avec CSS / −F6 perd son verbe / conflits: M5-V08, M3-V03
- M4-V06 : conteste — +`shared` est le mot de ma M2-V02, identité distincte de `layout` / −`page` contredit M5-V08 (F9 sous `layout`) ; `shared` est générique / conflits: M5-V08, M2-V02, M4-S09
- M4-V07 : valide — +`duration`, `delay`, `easing` reprennent les noms Svelte et CSS ; `stagger` et `group` cohérents / −`ease` plus court chez Motion ; `group` générique / conflits: M3-V08, M1-V09
- M4-V08 : neutre — +`start` et `end` suivent le sens du texte, utile aux sorties en RTL / −`left` et `right` exclus contredisent M5-V03 / conflits: M3-V06, M5-V03
- M4-V09 : neutre — +le nom dit le verbe et la variante, espace `udx-` sans collision / −`fade-up` met la direction dans le nom, contraire à M3-V10 et M5-V05 / conflits: M3-V10, M5-V05
- M4-V10 : valide — +référence seule dans `data-motion`, options séparées, casse fixée par couche / −plusieurs attributs à valider au build / conflits: M5-V04, M3-V07, M1-V10

## M5 — API, vocabulaire, outillage

- M5-V01 : conteste — +sept verbes à apprendre, paire `appear`/`disappear` convergente / −`layout` recouvre F7 et F8 : contredit ma M2-V02 (`shared` distinct, défaut `restart`) / conflits: M2-V02, M2-V01, M2-V03
- M5-V02 : conteste — +défauts publiés par verbe, réduction tranchée par verbe, `layout` en `carry` / −`disappear` en `restart` peut sauter pendant un `appear` (contredit M2-V06) / conflits: M2-V06, M1-V03, M3-V04
- M5-V03 : neutre — +une seule unité (millisecondes), aucun nombre dans un attribut / −`direction`, `axis` et `range` non personnalisables / conflits: M1-V09, M3-V05, M4-V07
- M5-V04 : valide — +`data-motion-<option>` observable et analysable sans parseur de chaîne / −beaucoup d'attributs sur un élément très animé ; ma M2-V09 (`data-motion-shared`) s'y range / conflits: M2-V09, M1-V10, M3-V07, M4-V10
- M5-V05 : valide — +`fade`, `slide`, `scale`, `collapse` en `appear`/`disappear` ; `collapse` pour les listes / −`collapse` exige la mesure ; `pulse` et `spin` proches des classes cœur de Tailwind / conflits: M2-V08, M3-V10, M4-V09
- M5-V06 : valide — +même casse que ma M2-V10, un seul sens par mot / −équipes francophones à former / conflits: M2-V10, M4-V10
- M5-V07 : valide — +une liste de réserve pour lint, types et doc / −liste à suivre à chaque version ; `initial` et `new` gênent le choix de noms / conflits: M4-V01
- M5-V08 : valide — +`reorder` et `scrollTo` hors vocabulaire, cohérent avec ma M2-V05 (pas de `drag`) / −F9 sans nom propre (contredit M4-V06) ; F18 provisoire / conflits: M4-V06, M2-V05, M3-V03
- M5-V09 : neutre — +le vocabulaire ne dérive pas en silence / −une règle de revue en plus / conflits: M5-S10
- M5-V10 : neutre — +les erreurs deviennent visibles, `enter` renvoie vers `appear` / −la table vieillit avec les données d'entraînement / conflits: M5-V07

## Doublons à fusionner

Id gardé en gras. Les ids listés après « ← » sont absorbés par l'id gardé.

1. Présence : **M4-V03** (état en lecture seule, rendu réduit par verbe) ← M2-V03 (état interne, à corriger en lecture seule), M1-V07.
2. Vue et progression : **M4-V04** ← M3-V01, M3-V02, M1-V06 (`follow` à retirer selon M5-V08).
3. Défauts de reprise et de réduction : **M5-V02** ← M1-V03, M1-V04, M2-V06 ; amender `disappear` en `carry` (demande de M2-V06, contredit M1-V03 et M5-V02).
4. Grammaire HTML : **M5-V04** ← M1-V10, M3-V07, M4-V10 ; M2-V09 se range en option.
5. Options à domaine fermé : **M5-V03** ← M1-V09, M3-V05 ; M4-V07 pour les noms de temps.
6. Presets livrés : **M5-V05** ← M3-V10, M4-V09, M2-V08 (directions retirées des noms).
7. Cascade : **M3-V08** ← M2-V04 (`from` retenu comme option de `stagger`).
8. Langue et casse : **M5-V06** ← M2-V10, M4-V10 (casse par couche).
9. Noms réservés : **M5-V07** ← M4-V01.
10. Actions hors vocabulaire : **M5-V08** ← M3-V03, M4-V05, M1-V08 (`tween` et `scroll` sortis).
11. Identité partagée : **M2-V02** (`shared`) ← partie `shared` de M4-V06 ; `page` reste en litige avec M5-V08.

Chevauchements non fusionnés (conflits restants) : direction (M3-V06 « origine », M4-V08 « logique », M5-V03 « direction ») ; M2-V08 (sens du mouvement) contre M3-V10 (aucune direction dans le nom) ; `layout` (M5-V01) contre `shared` (M2-V02).
