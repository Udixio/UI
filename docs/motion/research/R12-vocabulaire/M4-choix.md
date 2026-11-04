# M4 — Choix de vocabulaire (intégration frameworks, HTML)

### M4-V01 — Liste de noms réservés issue des API natives, appliquée par lint
- Énoncé : un fichier unique liste les noms natifs à éviter pour verbes, options et presets : Angular (`animate.enter`, `animate.leave`, `@for … track`), Svelte (`in`, `out`, `transition`, `animate`, `each`), React-Motion (`initial`, `animate`, `exit`, `layout`, `drag`, `transition`, `AnimatePresence`), CSS (`transition-*`, `animation-*`, `scroll()`, `view()`, `view-transition-*`), HTML (voir M4-V02). Le lint refuse un nom de la liste dans un verbe, une option ou un preset, et cite la liste.
- Familles : F1 à F24 (toutes)
- Nature : global
- Avantages : une seule source pour les quatre environnements ; la liste se vérifie par test de collision ; un agent voit la raison du refus
- Limites : la liste dépend des versions des frameworks et doit être révisée à chaque majeure ; des noms légitimes (`layout`, `drag`) se trouvent refusés par précaution
- Conflits : M5-S03 (noms réservés, même périmètre) ; M5-S02 (`drag`, `layout` à confirmer)

### M4-V02 — Homonyme d'attribut HTML toléré seulement si le natif ne s'applique pas à l'élément
- Énoncé : un nom identique à un attribut HTML est toléré quand l'attribut natif n'existe pas sur l'élément visé (`loop` sur un `<div>`, pas sur `<video>` ou `<audio>`). Sinon le nom est renommé. `track` (`<track>`), `fill` (attribut SVG) et `hidden` (global) sont interdits sur tout élément ; `loop` est toléré seulement hors média.
- Familles : F2, F3, F4, F7, F24
- Nature : global
- Avantages : évite des renommages inutiles (`loop` reste naturel pour une boucle) ; la règle est vérifiable par le parseur d'attributs au build ; le lecteur HTML n'est pas trompé sur les médias
- Limites : le lint doit connaître l'élément cible, donc la validation ne vaut qu'à partir du HTML réel ; une règle conditionnelle est plus difficile à expliquer qu'une liste simple
- Conflits : M5-S01 (attributs = références, tolérance à vérifier) ; M5-S10 (parseur d'attributs)

### M4-V03 — Présence : verbes `appear` et `disappear`, état `data-presence` en lecture seule, rendu réduit en fondu
- Énoncé : l'entrée et la sortie s'écrivent `appear` et `disappear` ; `disappear` retient le nœud jusqu'à `finished` (M4-03). L'état se lit dans `data-presence="entering | present | exiting"`, posé par le runtime et jamais écrit par l'auteur. Sous réduction de mouvement, les deux verbes passent en fondu seul par défaut.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : aucun homonyme (`enter`/`exit` évités) ; l'état est stylable et observable par un agent ; le rendu réduit est décidé par le verbe, pas par le composant
- Limites : `disappear` sonne moins naturellement qu'`exit` ; React doit retenir les enfants sortants ; l'état `data-presence` doit précéder le retrait du nœud
- Conflits : M5-S02 (`disappear` retenu) ; M2-S03 (état `data-presence`, à confirmer) ; M4-S02 (`dismiss` alternatif)

### M4-V04 — Trois intentions de progression : `reveal`, `scrub`, `follow`
- Énoncé : `reveal` déclenche une fois à la vue (option `repeat` pour rejouer) ; `scrub` lie la progression à la position de défilement ; `follow` suit une valeur continue (curseur, parallaxe). `once` et `repeat` restent des options de `reveal`, jamais des verbes. Le typage refuse `scrub` avec seuil et `reveal` avec `range`.
- Familles : F3, F4, F5, F14
- Nature : les deux (`reveal` global via l'observateur partagé ; `scrub` et `follow` par instance)
- Avantages : trois noms qui décrivent le mécanisme et non le moteur ; aucun homonyme natif ; les agents distinguent vue, scroll et curseur
- Limites : trois verbes à apprendre au lieu d'un ; hors Chromium, `reveal` dépend de l'observateur et `scrub` d'un repli nommé
- Conflits : M3-S01 (`scrub` et `reveal`, retenus) ; M5-S02 (`follow` absorbe `scrub`, à trancher)

### M4-V05 — Pas de verbe `scroll` ni `view` ; le défilement programmé est une action
- Énoncé : aucun verbe ne s'appelle `scroll` ni `view`, noms des fonctions CSS `scroll()` et `view()` et de l'événement `scroll`. Le défilement programmé est l'action `scrollTo(cible, options)` sur le handle commun ; `scroll()` et `view()` restent des fonctions CSS internes au runtime.
- Familles : F5, F6
- Nature : instance
- Avantages : pas de collision avec la syntaxe CSS ; un défilement n'est pas un effet d'élément ; le handle reste la seule forme de contrôle
- Limites : la lecture « scroll » dans une spec ne fonctionne plus, il faut apprendre l'action ; F6 n'a plus de verbe, donc sa couverture passe par la documentation
- Conflits : M5-S02 (`scroll` retiré) ; M3-S02 (`scrollTo` retenu)

### M4-V06 — Identité partagée `shared`, page `page`, préfixe `view-transition` interdit
- Énoncé : l'identité d'un élément partagé (F8) s'écrit `shared` ; la transition de page (F9) s'écrit `page`. Le préfixe `view-transition` est réservé au natif et interdit dans tout nom de Udixio. Le nom `view-transition-name` est généré par le runtime, jamais écrit par l'auteur.
- Familles : F8, F9
- Nature : les deux (identité par élément ; `page` global, état du document)
- Avantages : deux mots courts pour les deux familles ; pas de collision avec `view-transition-*` ; l'auteur n'invente pas de nom CSS
- Limites : `shared` est un mot générique qui peut collisionner entre îles ; `page` et `shared` demandent une clé unique (règle d'auteur) ; VT limitée à Chromium pour `startViewTransition`
- Conflits : M4-S09 (`udx-shared` comme clé explicite, à aligner) ; M1-S10 (nom automatique)

### M4-V07 — Options de temps et de cascade en tokens nommés, sans `ease`, `transition` ni `each`
- Énoncé : les options de temps s'appellent `duration`, `delay` et `easing` (noms des paramètres Svelte et de CSS), avec des valeurs de tokens (`duration: md`, `delay: stagger`). La cascade s'appelle `stagger` et le groupe `group`. Ne sont pas utilisés : `ease` (nom de Motion), `transition` (natif Svelte et React), `each`, `for`, `track` (mots-clés de boucle).
- Familles : F1, F2, F7, F10, F11
- Nature : global
- Avantages : un développeur Svelte ou CSS retrouve ses noms ; valeurs fermées par token, pas de nombre littéral ; aucun mot-clé de boucle détourné
- Limites : `ease` est plus court et connu de Motion, donc le passage depuis Motion coûte un renommage ; `group` est un mot générique ; les tokens doivent couvrir chaque durée utile
- Conflits : M3-S06 (seuils en tokens, même règle) ; M5-S05 (tokens de durée)

### M4-V08 — Directions logiques `start`, `end`, `up`, `down` ; pas de `in`/`out`/`left`/`right` comme valeurs d'effet
- Énoncé : les directions d'un effet d'entrée ou de sortie sont `start`, `end`, `up`, `down` (logiques, RTL inclus). `in` et `out` ne sont pas des valeurs d'effet (collision avec les directives Svelte). `left` et `right` ne sont pas des valeurs d'effet ; un effet de translation utilise `start` ou `end`. `down` est accepté malgré son homonyme `pointerdown` (il ne vit que comme valeur).
- Familles : F2, F7, F18
- Nature : global
- Avantages : une même spec se lit dans les deux sens de l'écriture ; pas de confusion avec `in:`/`out:` ; `start`/`end` sont déjà des termes CSS logiques
- Limites : `up` et `down` restent physiques, donc un effet vertical n'est pas miroité en RTL ; `start`/`end` demandent une règle d'interprétation par `dir` ; `down` peut surprendre à la lecture rapide
- Conflits : M5-S04 (tokens d'états, indépendant) ; M1-S09 (geste `drag`, direction du lâcher)

### M4-V09 — Presets livrés nommés `verbe-variante`, espace `udx-`
- Énoncé : les presets livrés par Udixio se nomment `<verbe>-<variante>` en kebab-case, dans l'espace `udx-` : `udx-reveal-fade-up`, `udx-appear-fade`, `udx-disappear-fade`, `udx-follow-cursor`, `udx-loop-pulse`. Une définition de l'utilisateur ne doit pas commencer par `udx-`. Un preset se référence comme une définition (M4-S04), sans import séparé.
- Familles : F1 à F4, F20, F22, F24
- Nature : global
- Avantages : le nom dit le verbe et la variante ; l'espace `udx-` évite les collisions avec les définitions de l'utilisateur ; les cas simples n'exigent aucun `defineMotion`
- Limites : le nom devient long (`udx-reveal-fade-up`) ; le préfixe est à retenir ; une variante renommée casse les références existantes (version majeure)
- Conflits : M5-S06 (définitions nommées, à aligner) ; M5-S07 (même surface dans chaque environnement)

### M4-V10 — Grammaire HTML : une référence dans `data-motion`, options dans `data-motion-*` ; casse fixée par couche
- Énoncé : `data-motion="card-enter"` porte seulement la référence (nom de définition ou de preset). Chaque option s'écrit dans un attribut séparé `data-motion-<option>="<token>"` (`data-motion-duration="md"`), validé au build. Une chaîne unique d'options est refusée. La casse suit la couche : kebab-case en HTML et CSS (`card-enter`), camelCase en TS (`cardEnter`, `duration`), verbes en mot anglais unique et minuscule.
- Familles : F1, F2, F3, F4, F22, F23
- Nature : global
- Avantages : chaque attribut se lit et s'observe seul (`attributeFilter`) ; la référence reste seule, conformément à la règle R11 ; un agent apprend une seule casse par couche
- Limites : plusieurs attributs par élément alourdissent le HTML ; une option non tokenisée doit être refusée au build ; l'ordre et la combinaison des attributs doivent être documentés
- Conflits : M5-S01 (attributs = références, à préciser pour les options) ; M5-S10 (parseur au build)
