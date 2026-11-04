# M5 — Annotations des choix M1 à M4 (R12, vocabulaire)

## M1 — moteur et rendu

- M1-V01 : valide — +coût prévisible par nom, le build peut refuser une option qui ferait descendre la classe / −classe par verbe approximative, table à suivre avec les moteurs / conflits: M5-V01, M5-S08
- M1-V02 : valide — +supprime l'équivalence « carry = physique », `state` et `layout` restent natifs / −deux niveaux de continuité à expliquer / conflits: M5-V02
- M1-V03 : valide — +la plupart des écritures sans option de reprise / −`loop` en `restart` et `scrub` en `carry` diffèrent de mon défaut, à reconfirmer / conflits: M5-V02
- M1-V04 : valide — +une valeur fermée par verbe, vérifiable par lint / −`fade` et `instant` ne couvrent ni la pause de `loop` ni le statique d'`emphasize` / conflits: M5-V02
- M1-V05 : valide — +verbe stable quand le ressort change de moteur, une source pour CSS et JS / −repli JS sur vieux Chrome, table sans vitesse / conflits: M5-S05, M5-V03
- M1-V06 : conteste — +un nom par moteur et par nature / −réintroduit `follow` comme verbe alors que F14 passe par `defineValue`, doublon de M4-V04 / conflits: M5-V01, M5-V08
- M1-V07 : valide — +un verbe pour la sortie, un état lisible en CSS, pas de `dismiss` / −deux noms pour une même sortie à expliquer / conflits: M2-V03, M4-S02
- M1-V08 : neutre — +défilement sorti du vocabulaire, comme dans mon choix / −garde `page` et quatorze verbes, plus large que mes sept / conflits: M5-V01, M5-V08
- M1-V09 : valide — +domaine fermé publié, moteur lisible dans le nom / −ajout de valeur = version ; seuils différents de M3-V05 (`most` contre `half` et `full`) / conflits: M3-V05
- M1-V10 : valide — +pas de parseur de chaîne, `attributeFilter` sur une liste fermée générée / −plus verbeux ; l'ordre des attributs ne doit jamais compter / conflits: M5-V04

## M2 — layout, partage, présence, listes

- M2-V01 : valide — +nom convergent (Motion, anime.js), aucun homonyme natif, `carry` évite le saut / −« layout » proche de la mise en page CSS ; `carry` impose le JS (M5-S08) / conflits: M2-V02
- M2-V02 : conteste — +intention « partagé » plutôt que nom d'API / −huitième verbe alors que mon V08 fait de `shared` une option de `layout` / conflits: M5-V01, M5-V08, M4-V06
- M2-V03 : valide — +deux mots symétriques, sans homonyme / −masque `data-presence` alors que M3-V09 et M1-V07 le lisent en CSS / conflits: M3-V09, M1-V07
- M2-V04 : valide — +nom convergent (GSAP, anime.js, Motion), `from` évite le sens de lecture implicite / −ne décrit pas une séquence (F11) ; valeurs à aligner sur M3-V08 / conflits: M3-V08
- M2-V05 : valide — +`drag` évité (événement DOM), `reorder` dit le résultat / −aucun nom pour le déplacement libre ; verbe ou primitive à trancher (mon V08) / conflits: M5-V08
- M2-V06 : conteste — +un ressort de présence se poursuit sans saut / −`appear` en `carry` impose le JS pour toutes les présences ; contredit mon défaut `restart` / conflits: M5-V02, M1-V03
- M2-V07 : valide — +`measure` et `correct` disent ce qui est mesuré et corrigé / −`correct` ne couvre ni `box-shadow` ni `border-width` ; options absentes de mon V03 / conflits: M5-V03
- M2-V08 : conteste — +résout le « down » par le sens du mouvement / −`rise`, `sink`, `lift` sont contre-intuitifs et contredisent l'origine de M3-V06 ; écarte mes presets `slide` et `collapse` / conflits: M5-V05, M3-V06, M3-V10
- M2-V09 : neutre — +identité sérialisable au SSR et visible dans les îles HTML / −un attribut de plus, nom unique par page, valeur libre à encadrer / conflits: M5-V04, M2-S02
- M2-V10 : valide — +règle de casse lintable, une seule langue pour humains et agents / −un public francophone doit apprendre l'anglais / conflits: M5-V06

## M3 — vue, scroll, boucles, seuils, presets

- M3-V01 : valide — +nom court sans homonyme, même mot que le mécanisme du runtime / −ne dit pas le sens du mouvement (voir M3-V06) / conflits: —
- M3-V02 : valide — +mots de `animation-range` natifs, `range` fermé / −`scrub` peu connu hors GSAP ; repli nommé hors Firefox 159 / conflits: —
- M3-V03 : valide — +pas de seizième verbe, le sens est celui du natif / −impossible en HTML pur sans JS / conflits: —
- M3-V04 : valide — +WCAG 2.2.2 devient une donnée vérifiée, `essential` rend l'exception explicite / −aucune boucle finie en v1 ; `pause` absente de mon V03 / conflits: M5-V03, M5-V05
- M3-V05 : valide — +aucun nombre dans la grammaire, mots intuitifs / −`margin` relatif à la fenêtre, à documenter ; `threshold` diverge de M1-V09 / conflits: M1-V09
- M3-V06 : conteste — +lève l'ambiguïté « down » par l'origine, `start` et `end` pour le RTL / −contredit M4-V08 (`up`, `down`) et M2-V08 (sens du mouvement) ; migration depuis AOS / conflits: M4-V08, M2-V08, M5-V06
- M3-V07 : neutre — +chaque option s'observe seule, valeurs en jetons, lint simple / −le verbe s'écrit en HTML, contraire à mon V04 où le preset porte le verbe / conflits: M5-V04
- M3-V08 : valide — +`stagger` convergent, groupe résolu une seule fois / −cascade et non séquence ; un élément ajouté ne rejoint pas la cascade / conflits: M2-V04
- M3-V09 : valide — +l'auteur déclare, le runtime observe : un agent ne peut pas forger un état / −état JS absent au rendu serveur / conflits: M2-V03
- M3-V10 : neutre — +presets nommés par effet, direction en option / −`rise` inscrit une direction dans le nom, contre M3-V06 ; ne retient ni `slide` ni `press` / conflits: M5-V05, M2-V08, M3-V06

## M4 — intégration par framework, HTML

- M4-V01 : valide — +une seule liste pour les quatre environnements, vérifiée par test de collision / −refuse `layout` et `drag` par précaution, alors que M2-V01 et mon V01 gardent `layout` / conflits: M5-V01, M2-V01
- M4-V02 : valide — +évite des renommages inutiles (`loop` hors média) / −règle conditionnelle à l'élément, plus difficile à expliquer / conflits: M5-V07
- M4-V03 : valide — +aucun homonyme, rendu réduit décidé par le verbe / −`disappear` sonne moins naturellement qu'`exit` ; en réduit, fondu pour `disappear` là où mon V02 dit `instant` / conflits: M5-V02, M2-S03
- M4-V04 : conteste — +trois noms qui décrivent le mécanisme / −réintroduit `follow` alors que F14 passe par `defineValue`, doublon de M1-V06 / conflits: M5-V01, M5-V08
- M4-V05 : valide — +pas de collision avec les fonctions CSS `scroll()` et `view()`, un défilement n'est pas un effet / −F6 sans verbe, couverture par la doc seule / conflits: —
- M4-V06 : neutre — +deux mots courts pour F8 et F9, préfixe `view-transition` réservé / −`page` et `shared` en verbes, contraires à mon V01 et mon V08 ; `shared` est générique / conflits: M5-V01, M5-V08, M2-V02
- M4-V07 : valide — +`duration`, `delay`, `easing` reprennent les noms de Svelte et CSS / −`ease` renommé pour qui vient de Motion ; `group` générique / conflits: —
- M4-V08 : neutre — +directions logiques, lisibles en RTL / −`left` et `right` exclus, alors que M3-V06 refuse `up` et `down` et que mon V03 garde `left` et `right` / conflits: M3-V06, M5-V03
- M4-V09 : conteste — +préfixe `udx-` évite les collisions avec les définitions utilisateur / −noms longs et directionnels (`udx-reveal-fade-up`), contraires à mes V05 et V06 / conflits: M5-V05, M5-V06, M3-V10
- M4-V10 : valide — +chaque attribut se lit seul, une casse par couche / −verbeux ; options non tokenisées refusées au build / conflits: M5-V04

## Doublons à fusionner

- Grammaire HTML (une référence dans `data-motion`, options en attributs séparés) : M1-V10, M3-V07, M4-V10, M5-V04 → garder M5-V04 ; la casse de M4-V10 passe dans M5-V06 ; le verbe écrit en HTML (M3-V07) reste à trancher
- Options fermées et tokens : M1-V09, M3-V05, M4-V07, M5-V03 → garder M5-V03 ; les seuils de M1-V09 et M3-V05 à unifier
- Présence (`appear`, `disappear`, état) : M1-V07, M2-V03, M3-V09, M4-V03 → garder M4-V03 (état lu en CSS, rendu réduit par verbe) ; le retrait de l'état du vocabulaire public (M2-V03) reste à trancher
- Reprise et rendu réduit par verbe : M1-V03, M1-V04, M2-V06, M5-V02 → garder M5-V02 ; défauts divergents de M2-V06 (`appear` en `carry`) et de M1-V03 (`loop` en `restart`) à arbitrer
- Verbes de progression : M1-V06, M4-V04 contre M3-V01, M3-V02 → garder M3-V01 (`reveal`) et M3-V02 (`scrub`), deux moteurs donc deux noms ; `follow` retiré au profit de `defineValue`
- Défilement programmé : M1-V08, M3-V03, M4-V05 → garder M3-V03 (action `scrollTo`)
- Presets livrés : M2-V08, M3-V10, M4-V09, M5-V05 → garder M5-V05 ; le préfixe `udx-` de M4-V09 est repris comme espace de noms, sans les noms directionnels
- Cascade : M2-V04, M3-V08 → garder M2-V04 (`from`, noms convergents) ; les valeurs de jetons de M3-V08 sont reprises
- Liste de noms réservés : M4-V01, M5-V07 → garder M4-V01 ; M5-V07 absorbé
- Langue et casse : M2-V10, M4-V10 (partie casse), M5-V06 → garder M5-V06
- Non fusionnés, à trancher : direction par origine ou par sens (M2-V08, M3-V06, M4-V08) ; `shared` verbe ou option (M2-V02, M4-V06, M5-V08) ; `layout` gardé contre la liste de M4-V01
