# R12 — Registre de choix : vocabulaire de @udixio/motion

Consolidation neutre de `M1-choix.md` à `M5-choix.md` (50 choix) et de `M1-annotations.md` à `M5-annotations.md` (5 × 40 annotations). Le fond n'est ni ajouté, ni retiré, ni reformulé. Les seuls textes produits sont les libellés de section, les décisions de fusion (« Option signalée », « Égalité », « non retenu »), les comptes de voix et les règles ci-dessous.

**Bilan** : 28 choix conservés (11 ids gardés + 17 non fusionnés), 11 groupes de doublons retenus (22 ids fusionnés), 18 propositions de fusion non retenues (1.2), 37 contradictions (13 ouvertes, 24 couvertes par une fusion retenue ; section 3).

**Règles appliquées**
- Vote par fusion X → K : une voix par expert qui propose d'absorber X dans K, explicitement ou partiellement (« partie de X »). Fusion retenue si au moins 2 voix dans le même sens. Id gardé : sens majoritaire ; égalité : id le plus anciennement numéroté (ordre M1 < M2 < … < M5, puis V01 < V02 …), signalée.
- Un id n'est absorbé qu'une fois. Une fusion dont la cible est elle-même absorbée n'est pas appliquée. Si un id est proposé vers deux cibles retenues, la cible à plus de voix l'emporte ; égalité : cible la plus anciennement numérotée.
- Énoncé / Familles / Nature : repris tels quels du choix gardé. Variantes : une ligne par id fusionné, avec son énoncé repris tel quel et ses verdicts.
- Avantages / Limites : texte original du choix gardé, suivi des points ajoutés en annotation par les experts (préfixés `[Mx]`). Les annotations portées par les ids fusionnés ne sont pas reprises ; leurs verdicts le sont.
- Conflits : union dédupliquée du champ « Conflits » du choix gardé et des choix fusionnés, et des champs « conflits: » des annotations portées par le choix gardé ; hors id du bloc et ids fusionnés dans ce bloc. Identifiants repris tels qu'écrits (références R10 et R11 comprises).
- Verdicts : annotations reçues par l'id conservé, une par expert autre que l'auteur (4 par choix). Pour une variante : verdicts de l'id fusionné.
- Section 3 : paires dont une annotation, ou un passage « à trancher », « contre », « contredit » ou « alors que » des sections Doublons, désigne une incompatibilité. Les simples champs « conflits: » n'y figurent pas.

---

## 1. Groupes de doublons

### 1.1 Groupes retenus (11)

Votes lus dans les sections « Doublons à fusionner » et dans les annotations. Un id fusionné est absorbé une seule fois.

1. **G1 — Présence.** Garder **M4-V03** (M1, M2, M3, M5 : 4 voix ; M4 garde M2-V03 : 1 voix). Fusionnés : **M2-V03** (M1, M2, M3, M5 : 4 voix), **M1-V07** (M2, M3, M5 : 3 voix ; M4 la propose vers M2-V03). Non retenu : M3-V09 vers M4-V03 (M5 seul, 1.2).
2. **G2 — Verbe `shared`.** Garder **M2-V02** (M1, M2 : 2 voix). Fusionné : **M4-V06** (M1, M2 : 2 voix). M3, M4 et M5 demandent de trancher le placement de `shared` sans fusionner (contradiction 7).
3. **G3 — Reveal, présence de `reveal` et `follow` dans M4-V04.** Égalité 2–2 : garder **M3-V01** (M1, M5 : 2 voix) contre M4-V04 (M2, M3 : 2 voix), M3-V01 retenu par numérotation. Fusionné : **M4-V04** (M1 partie `reveal` et M5 partie `reveal` : 2 voix). Les fusions M3-V02 → M4-V04 et M1-V06 → M4-V04 (M2, M3) ne sont pas appliquées : cible absorbée (1.2).
4. **G4 — Défilement programmé (`scrollTo`).** Garder **M3-V03** (M1, M3, M4, M5 : 4 voix ; M2 garde M5-V08 : 1 voix). Fusionnés : **M4-V05** (M1, M3, M5 : 3 voix), **M1-V08** (M3, M4, M5 : 3 voix), **M5-V08** (M1 partie `scrollTo`, M3, M4 partie défilement : 3 voix).
5. **G5 — Cascade (`stagger`).** Garder **M2-V04** (M1, M3, M4, M5 : 4 voix ; M2 garde M3-V08 : 1 voix). Fusionné : **M3-V08** (M1, M3, M4, M5 : 4 voix).
6. **G6 — Grammaire HTML (options en attributs séparés).** Garder **M5-V04** (M1, M2, M4, M5 : 4 voix ; M3 garde M4-V10 : 1 voix). Fusionnés : **M3-V07** (M1 sauf le verbe écrit en HTML, M2, M4, M5 : 4 voix ; M3, M4 et M5 signalent le verbe comme à trancher), **M1-V10** (M2, M4, M5 : 3 voix), **M4-V10** (M1, M2, M5 : 3 voix ; égalité avec M5-V06, cible M5-V04 retenue par numérotation).
7. **G7 — Langue et casse.** Garder **M5-V06** (M1, M2, M3, M4, M5 : 5 voix). Fusionné : **M2-V10** (5 voix). La partie casse de M4-V10 (M1, M2, M5) est notée en variante, M4-V10 étant absorbé dans G6.
8. **G8 — Réserve de noms.** Garder **M5-V07** (M1, M2, M3, M4 : 4 voix ; M5 garde M4-V01 : 1 voix). Fusionné : **M4-V01** (4 voix).
9. **G9 — Presets livrés.** Garder **M5-V05** (M1, M2, M3, M4, M5 : 5 voix). Fusionnés : **M3-V10** (5 voix), **M2-V08** (M2, M5 : 2 voix ; M3 le déclare « non retenu en l'état »), **M4-V09** (M2, M5 partiel sur le préfixe `udx-` : 2 voix ; M3 le déclare « non retenu en l'état »).
10. **G10 — Options à domaine fermé.** Garder **M5-V03** (M1, M2, M3, M4, M5 : 5 voix). Fusionnés : **M3-V05** (5 voix, M1 sous réserve d'arbitrage), **M1-V09** (4 voix), **M4-V07** (M1, M2 partiel, M3, M5 : 4 voix).
11. **G11 — Défauts de reprise et de réduction.** Garder **M5-V02** (M1, M2, M3, M4, M5 : 5 voix). Fusionnés : **M1-V03** (5 voix), **M1-V04** (M2, M3, M4, M5 : 4 voix), **M2-V06** (M1, M2, M3, M5 : 4 voix ; M4 le juge « à réviser »).

### 1.2 Doublons proposés, non retenus ou non appliqués (18)

- **N1** — M5-V01 vers M2-V01 (partie `layout`) : M1 seul.
- **N2** — M5-V01 vers M3-V01 (partie `reveal`) : M1 seul.
- **N3** — M5-V01 vers M3-V02 (partie `scrub`) : M1 seul.
- **N4** — M5-V01 vers M4-V04 : M3 seul.
- **N5** — M4-V04 vers M3-V02 (partie `scrub`) : M5 seul ; M4-V04 est déjà absorbé dans G3.
- **N6** — M3-V02 vers M4-V04 (plages CSS) : M2, M3 (2 voix), *non appliquée* : cible M4-V04 absorbée dans G3.
- **N7** — M1-V06 vers M4-V04 (`follow`) : M2, M3 (2 voix), *non appliquée* : cible M4-V04 absorbée dans G3. M1-V06 reste un choix distinct.
- **N8** — M4-V08 vers M3-V06 (valeurs `start` et `end`) : M1 seul (partie).
- **N9** — M3-V09 vers M4-V03 : M5 seul.
- **N10** — M2-V09 vers M5-V04 (« se range en option ») : M2 seul.
- **N11** — M4-V07 vers M2-V04 (partie `stagger`) : M3 seul.
- **N12** — M5-V03 vers M2-V04 (partie `stagger`) : M3 seul.
- **N13** — M4-V10 vers M5-V06 (partie casse) : M1, M2, M5 (3 voix), *non appliquée* : M4-V10 absorbé une seule fois dans G6 (égalité 3–3, cible M5-V04 retenue par numérotation). Le contenu est repris en variante de G7.
- **N14** — M1-V10, M3-V07 et M5-V04 vers M4-V10 : M3 seul, sens inverse de G6.
- **N15** — M2-V04 vers M3-V08 : M2 seul, sens inverse de G5.
- **N16** — M5-V07 vers M4-V01 : M5 seul, sens inverse de G8.
- **N17** — M4-V05, M1-V08 et M3-V03 vers M5-V08 : M2 seul, sens inverse de G4.
- **N18** — M1-V07 vers M2-V03 : M4 seul, sens inverse de G1.

Renommage proposé, non compté comme fusion : `direction` (M5-V03) vers `from` (M1).

### 1.3 Ids absorbés une seule fois

- **M4-V04** : absorbé dans G3 (cible M3-V01) ; ses propositions vers M3-V02 et M1-V06 ne sont pas appliquées.
- **M4-V10** : absorbé dans G6 (cible M5-V04) ; sa partie casse est notée en G7.
- **M5-V08** : absorbé dans G4 pour sa partie défilement ; ses autres éléments (`reorder`, retrait de `drag` et `follow`) restent visibles dans la variante de G4.

## 2. Registre

Choix conservés : 28 (11 ids gardés, 17 non fusionnés). Chaque bloc suit l'ordre M1 à M5. Les ids fusionnés n'ont pas de bloc propre : ils apparaissent dans la ligne « variantes » de leur id gardé.

### M1-V01 — Chaque verbe déclare sa classe de moteur [fusionne : —]
- Énoncé / Familles / Nature : chaque verbe appartient à une classe de moteur fixe publiée dans le manifeste : `css` (`state`, `appear`, `disappear`, `reveal`, `draw`, `loop` sans vitesse), `waapi` (`layout`, `tween` numérique), `js` (`drag`, `follow`, `morph`, `split` animé), `scroll` (`scrub`, timeline native). L'auteur n'a pas à connaître le moteur ; une option (`continuity`) peut faire monter la classe, jamais la baisser. — Familles : F1 à F24 — Nature : global
- Avantages : coût prévisible par nom ; un agent sait quel verbe charge du JS sans lire le code ; le build peut refuser une option qui ferait descendre la classe ; [M2] coût prévisible par nom ; le build refuse une option qui ferait descendre la classe de moteur ; [M3] coût prévisible par nom, un agent voit quel verbe charge du JS ; [M4] coût prévisible par nom, le manifeste publie la classe de moteur, donc le SSR sait ce qui est CSS ; [M5] coût prévisible par nom, le build peut refuser une option qui ferait descendre la classe
- Limites : une classe par verbe reste une approximation (un `state` peut monter en `waapi`) ; la table doit suivre les moteurs ; le manifeste doit publier aussi la classe effective ; [M2] une classe par verbe reste approximative ; la classe effective de `layout` doit être publiée ; [M3] une classe par verbe reste une approximation (un `state` peut monter) ; [M4] une classe par verbe reste une approximation (un `state` peut monter en `waapi`) ; [M5] classe par verbe approximative, table à suivre avec les moteurs
- Conflits : M5-S08, M1-01, M5-V01
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-V02 — `carry` garde la position, la vitesse n'est exigée que pour un ressort [fusionne : —]
- Énoncé / Familles / Nature : `carry` signifie continuité de la valeur rendue : WAAPI repart de la valeur courante (retarget natif). La vitesse, donc le moteur JS, n'est exigée que si l'animation est un ressort, ou si le verbe est `drag` ou `follow`. Le handle expose `velocity.source` dans ces cas, et `position` sinon. — Familles : F2, F7, F12, F13, F18 — Nature : instance
- Avantages : `state` et `layout` restent natifs en `carry` ; le coût JS n'apparaît qu'avec le ressort ; supprime l'équivalence implicite « carry = physique » ; [M2] `layout` reste natif en `carry` ; le JS n'arrive qu'avec un ressort, `drag` ou `follow` ; [M3] `state` et `layout` restent natifs en `carry` ; le JS n'apparaît qu'avec le ressort ; [M4] `state` et `layout` restent natifs en `carry` ; le JS n'apparaît qu'avec un ressort, réduisant le coût sur les îles ; [M5] supprime l'équivalence « carry = physique », `state` et `layout` restent natifs
- Limites : deux niveaux de continuité à expliquer ; une transition non ressort peut avoir une vitesse visuelle différente ; l'estimation WAAPI reste bruitée ; [M2] une interruption de FLIP sans vitesse peut avoir une vitesse visuelle différente ; [M3] deux niveaux de continuité à expliquer ; [M4] deux niveaux de continuité à expliquer ; vitesse visuelle différente sur une transition non ressort ; [M5] deux niveaux de continuité à expliquer
- Conflits : M5-S08, M1-03, M1-02, M5-V02
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-V05 — Ressorts et courbes : tokens d'option, jamais des verbes [fusionne : —]
- Énoncé / Familles / Nature : une courbe (`ease`) ou un ressort (`spring`) est une option dont la valeur est un token nommé du designer (`snappy`, `gentle`, `standard`). Aucun verbe ne porte un nom de physique. Un token de ressort garde ses paramètres physiques (raideur, amortissement, masse) : compilés en `linear()` pour CSS, utilisés tels quels par le moteur JS. — Familles : F1, F13, F18 — Nature : global
- Avantages : le verbe reste stable quand le ressort change de moteur ; le designer règle la physique sans toucher au code ; une seule source pour CSS et JS ; [M2] le verbe reste stable quand le ressort change de moteur, une seule source CSS et JS ; [M3] le verbe reste stable quand le ressort change de moteur ; [M4] le verbe reste stable quand le ressort change de moteur ; une seule source CSS et JS ; [M5] verbe stable quand le ressort change de moteur, une source pour CSS et JS
- Limites : `linear()` absent des vieux Chrome de `defaults` (repli JS) ; deux représentations du même token à tester ; la table `linear()` ne transporte pas la vitesse ; [M2] la table `linear()` ne transporte pas la vitesse d'interruption, donc `layout` en `carry` exige le JS ; [M3] `linear()` absent des vieux Chrome de `defaults` ; [M4] `linear()` absent des vieux Chrome ; deux représentations à tester ; la table ne porte pas la vitesse ; [M5] repli JS sur vieux Chrome, table sans vitesse
- Conflits : M5-S05, M1-02, M5-V03, M4-V07
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-V06 — Trois verbes de mouvement continu : `reveal`, `scrub`, `follow` [fusionne : —]
- Énoncé / Familles / Nature : `reveal` = déclenchement à la vue (observateur global) ; `scrub` = progression liée à la position de défilement (timeline native, instance) ; `follow` = valeur qui suit une source continue (curseur, parallaxe), abonné nommé du runtime (M5-S09). `follow` n'est jamais utilisé pour le défilement. Trois moteurs distincts, donc trois noms distincts. — Familles : F4, F5, F14 — Nature : les deux (`reveal` global ; `scrub` et `follow` par instance)
- Avantages : chaque nom correspond à un moteur et à une nature ; lève le `follow` ambigu de R11 ; le typage refuse `scrub` avec seuil et `reveal` avec `range` ; [M2] trois noms pour trois moteurs (vue, défilement, valeur) ; [M3] un nom par moteur et par nature, typage qui refuse `scrub` avec `range` ; [M4] noms alignés sur un moteur chacun ; `scrub` et `reveal` restent distincts ; [M5] un nom par moteur et par nature
- Limites : trois mots à apprendre ; `scrub` hors Chromium repose sur un repli nommé ; `follow` et `scrub` restent proches pour un débutant ; [M2] `follow` hors de ma spécialité ; sa survie dépend de M5-V08 ; [M3] `follow` ne sert pas le défilement et est retiré par M5-V08 ; [M4] `follow` pour une valeur continue duplique `defineValue` (F14, F15) et sort du vocabulaire en M5-V08 ; [M5] réintroduit `follow` comme verbe alors que F14 passe par `defineValue`, doublon de M4-V04
- Conflits : M5-S02, M3-S01, M5-V08, M3-V02, M5-V01, M4-V04
- Verdicts : valide 1 (M3) · neutre 1 (M2) · conteste 2 (M4, M5)

### M2-V01 — Verbe `layout` nommé par le résultat, défaut `carry` [fusionne : —]
- Énoncé / Familles / Nature : le verbe qui fait changer la mise en page d'un élément s'écrit `layout` (`data-motion="layout"`, `layout(el, mutate)`), jamais `flip`, `morph` ou `measure` ; il ne nomme pas le mécanisme FLIP. Son défaut de reprise est `carry` : une mise en page interrompue repart de la position rendue. — Familles : F7, F10 — Nature : instance
- Avantages : nom présent chez Motion (`layout`) et anime.js (`createLayout`), Svelte nomme le même effet `animate:flip` (mécanisme) ; aucun homonyme natif ; `carry` évite un saut sur réordonnancement interrompu ; [M1] nom convergent chez Motion et anime.js (`layout`), aucun homonyme natif ; [M3] nom présent chez Motion et anime.js, aucun homonyme natif, `carry` évite le saut sur réordonnancement ; [M4] nom présent chez Motion et anime.js ; `carry` évite le saut d'une mise en page interrompue ; [M5] nom convergent (Motion, anime.js), aucun homonyme natif, `carry` évite le saut
- Limites : « layout » est ambigu avec la mise en page CSS (`display`, `grid`) ; le défaut `carry` impose le backend JS (M5-S08) ; un débutant peut attendre un verbe de geste ; [M1] le défaut `carry` impose le JS pour tout layout, contraire à M1-V02 ; [M3] `layout` ambigu avec la mise en page CSS ; [M4] « layout » se confond avec la mise en page CSS ; `carry` impose le JS ; [M5] « layout » proche de la mise en page CSS ; `carry` impose le JS (M5-S08)
- Conflits : M2-V02, M5-S02, M1-V02, M1-V03, M5-V08
- Verdicts : valide 3 (M3, M4, M5) · neutre 0 · conteste 1 (M1)

### M2-V02 — Verbe `shared` pour l'élément partagé, distinct de `layout` [fusionne : M4-V06]
- Énoncé / Familles / Nature : un élément qui traverse une navigation ou deux îles s'écrit `shared` avec un nom de partage (`data-motion-shared="card-hero"`, M2-V09) ; `layout` reste réservé au déplacement dans un même document. Le défaut de reprise de `shared` est `restart`, car une transition de vue n'est pas interruptible. — Familles : F8, F9 — Nature : les deux (identité globale, verbe par instance)
- variantes :
  - M4-V06 : l'identité d'un élément partagé (F8) s'écrit `shared` ; la transition de page (F9) s'écrit `page`. Le préfixe `view-transition` est réservé au natif et interdit dans tout nom de Udixio. Le nom `view-transition-name` est généré par le runtime, jamais écrit par l'auteur. — Familles : F8, F9 — Nature : les deux (identité par élément ; `page` global, état du document). Verdicts de M4-V06 : valide 0 · neutre 2 (M3, M5) · conteste 2 (M1, M2).
  - Option signalée : M3, M4 et M5 demandent de trancher le placement de `shared` (verbe ou option de `layout`) sans fusion ; M1 retient le préfixe `view-transition` de M4-V06 et rejette son verbe `page`.
- Avantages : le verbe dit l'intention (« partagé ») et non l'API (`layoutId`, `view-transition-name`) ; deux mécanismes (FLIP, VT) sous un seul mot ; `restart` est honnête sur la VT ; [M1] `shared` dit l'intention et `restart` est honnête sur une VT ; [M3] l'intention « partagé » est dite sans nommer la technique ; [M4] l'intention « partagé » reste lisible ; `restart` honnête pour la VT ; [M5] intention « partagé » plutôt que nom d'API
- Limites : deux verbes proches (`layout`, `shared`) à expliquer ; `shared` ne dit pas quelle technique est choisie (à documenter dans le manifeste) ; le nom doit être unique dans sa portée ; [M1] deux verbes proches (`layout`, `shared`) ; contredit M5-V08 qui en fait une option de `layout` ; [M3] `shared` est en verbe ici, en option de `layout` pour M5-V08, en verbe pour M4-V06 : trois places possibles ; [M4] `shared` verbe ici, mais option de `layout` dans M5-V08 : deux placements incompatibles ; [M5] huitième verbe alors que mon V08 fait de `shared` une option de `layout`
- Conflits : M2-V01, M1-S10, M4-S09, M5-V08, M5-V01, M2-V09
- Verdicts : valide 1 (M1) · neutre 1 (M3) · conteste 2 (M4, M5)

### M2-V04 — `stagger` en option de conteneur, pas en verbe [fusionne : M3-V08]
- Énoncé / Familles / Nature : le décalage d'une liste est une option `stagger` posée sur le conteneur, en millisecondes ou en token fermé (`stagger: "fast" | "normal" | "slow"`), avec `from: "first" | "last" | "center"`. Ce n'est jamais un verbe. — Familles : F10, F11 — Nature : instance (conteneur)
- variantes :
  - M3-V08 : la cascade s'écrit option `stagger` sur le groupe (`data-motion-group`), valeur fermée `tight | snug | medium | loose | wide` (noms de J4) ; ordre par index par défaut ; les valeurs réelles sont en jetons. — Familles : F10, F11 — Nature : instance. Verdicts de M3-V08 : valide 3 (M2, M4, M5) · neutre 0 · conteste 1 (M1).
  - Option signalée : M2 demande de garder M3-V08 comme id (1 voix), avec `from` de M2-V04 repris comme option de `stagger` ; M1 et M4 demandent d'arbitrer les tokens de cascade (`fast|normal|slow` contre `tight…wide`).
- Avantages : nom convergent (GSAP `stagger`, anime.js `stagger`, Motion `staggerChildren`) ; une option ne double pas le verbe de l'enfant ; `from` évite le sens de lecture implicite ; [M1] nom convergent (GSAP, anime.js, Motion), option de conteneur et non verbe ; [M3] nom convergent (Motion, GSAP, anime.js), `from` évite le sens de lecture implicite ; [M4] nom convergent (GSAP, anime.js, Motion) ; option de conteneur qui ne double pas le verbe enfant ; [M5] nom convergent (GSAP, anime.js, Motion), `from` évite le sens de lecture implicite
- Limites : `stagger` n'exprime pas une séquence complète (rôle de `sequence`) ; le token reste à régler par le designer (M3) ; sur une liste virtualisée, le calcul par index est faux ; [M1] ne couvre pas une séquence ; faux sur liste virtualisée ; [M3] `stagger` n'exprime pas une séquence complète ; [M4] `stagger` n'est pas une séquence ; faux sur liste virtualisée ; [M5] ne décrit pas une séquence (F11) ; valeurs à aligner sur M3-V08
- Conflits : M3-S09, M2-S04, M5-S02
- Verdicts : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0

### M2-V05 — `reorder` comme verbe de geste, `drag` réservé au déplacement libre [fusionne : —]
- Énoncé / Familles / Nature : le geste de réordonnancement s'écrit `reorder` (défaut `carry`, option `axis`) ; `drag` n'est pas un verbe de v1. Le déplacement libre sans réordonnancement, s'il existe un jour, prendra un autre nom. — Familles : F18, F10 — Nature : instance
- Avantages : `drag` est déjà un nom d'événement DOM (`dragstart`, `drag`) : homonyme évité ; `reorder` dit le résultat pour la liste ; cohérent avec M1-S09 (pas de moteur de geste en v1) ; [M1] `drag` évité (événement DOM), `reorder` dit le résultat ; [M3] `drag` est un nom d'événement DOM évité, `reorder` dit le résultat ; [M4] `drag` évité car homonyme d'événement DOM ; `reorder` nomme le résultat ; [M5] `drag` évité (événement DOM), `reorder` dit le résultat
- Limites : aucun nom pour le déplacement libre ; `reorder` ne couvre pas un geste de type « swipe » ; le clavier doit exister sous ce même verbe (F20) ; [M1] aucun nom pour le déplacement libre ; le défaut `carry` demande la vitesse ; [M3] aucun nom pour le déplacement libre ; [M4] aucun nom pour le déplacement libre ; le clavier doit exister sous ce verbe ; [M5] aucun nom pour le déplacement libre ; verbe ou primitive à trancher (mon V08)
- Conflits : M5-S02, M2-S05, M1-S09, M5-V08
- Verdicts : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0

### M2-V07 — Options de mesure et de correction : `measure` et `correct`, pas `scale` [fusionne : —]
- Énoncé / Familles / Nature : le layout se règle par `measure: "position" | "size" | "both"` (défaut `both`) et `correct: "children" | "radius" | "none"` (défaut `children`) ; le mot `scale` n'est pas une option, car il désigne à la fois une animation et une correction. — Familles : F7, F8, F14 — Nature : instance
- Avantages : deux noms qui disent ce qui est mesuré et ce qui est corrigé ; `scale` ne se confond plus avec la propriété d'animation (`scale`, `zoom`) ; valeurs fermées, testables ; [M1] `measure` et `correct` disent ce qui est mesuré et ce qui est corrigé ; valeurs fermées ; [M3] deux noms qui disent ce qui est mesuré et ce qui est corrigé ; [M4] `measure` et `correct` disent ce qui est mesuré et corrigé ; `scale` ne se confond plus avec l'animation ; [M5] `measure` et `correct` disent ce qui est mesuré et corrigé
- Limites : `measure: "size"` seul reste rare et source d'erreurs ; `correct` ne couvre pas `box-shadow` ni `border-width` (limites de M2-S01) ; deux options à apprendre ; [M1] `measure: size` rare ; ne couvre pas `box-shadow` ; [M3] `measure: size` rare et source d'erreurs ; [M4] `measure: size` seul reste rare ; `correct` ne couvre pas `box-shadow` ; [M5] `correct` ne couvre ni `box-shadow` ni `border-width` ; options absentes de mon V03
- Conflits : M2-S01, M2-03, M5-V03
- Verdicts : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0

### M2-V09 — Grammaire HTML : `data-motion-shared` comme nom de partage [fusionne : —]
- Énoncé / Familles / Nature : le partage s'écrit `data-motion-shared="<nom>"` : un nom de référence, jamais une valeur libre. `data-motion` désigne toujours une définition ou un verbe ; les options passent par la définition, pas par des attributs supplémentaires. — Familles : F8, F9, F22 — Nature : les deux (attribut par élément, nom global)
- Avantages : compatible avec « attribut = référence » (R11) ; l'identité est sérialisable au SSR et visible dans les îles HTML ; un attribut séparé évite de mêler verbe et identité ; [M1] identité sérialisable au SSR, `data-motion-shared` reste une référence ; [M3] `data-motion-shared` est une référence de nom, cohérente avec « attribut = référence » ; [M4] `data-motion-shared` garde l'identité sérialisable au SSR ; [M5] identité sérialisable au SSR et visible dans les îles HTML
- Limites : un second attribut à maintenir ; la portée du nom reste à régler (M2-S07 de R11, `data-layout-scope`) ; le nom doit être unique dans la page ; [M1] une valeur libre de nom de partage contredit le « tokens seulement » de M5-V03 et M5-V04 ; [M3] un second attribut à maintenir, portée du nom à régler ; [M4] interdit les options en attributs, donc contredit M1-V10, M3-V07 et M5-V04 ; attribut supplémentaire à maintenir ; [M5] un attribut de plus, nom unique par page, valeur libre à encadrer
- Conflits : M2-S02, M5-S01, M1-S10, M5-V04, M5-V03, M2-V02, M4-V06, M1-V10, M3-V07
- Verdicts : valide 1 (M3) · neutre 2 (M1, M5) · conteste 1 (M4)

### M3-V01 — Verbe `reveal` pour l'entrée à la vue [fusionne : M4-V04]
- Énoncé / Familles / Nature : l'entrée au franchissement d'un seuil s'écrit `reveal` ; une fois par défaut, `repeat` pour rejouer à chaque franchissement ; défaut de reprise `restart` ; rendu réduit `fade`, ou `instant` si le fondu est inapplicable. `enter` et `in` sont exclus (noms natifs Angular et Svelte). — Familles : F3, F4 — Nature : global (observateur partagé)
- variantes :
  - M4-V04 : `reveal` déclenche une fois à la vue (option `repeat` pour rejouer) ; `scrub` lie la progression à la position de défilement ; `follow` suit une valeur continue (curseur, parallaxe). `once` et `repeat` restent des options de `reveal`, jamais des verbes. Le typage refuse `scrub` avec seuil et `reveal` avec `range`. — Familles : F3, F4, F5, F14 — Nature : les deux (`reveal` global via l'observateur partagé ; `scrub` et `follow` par instance). Verdicts de M4-V04 : valide 1 (M3) · neutre 1 (M2) · conteste 2 (M1, M5).
  - Égalité 2–2 (M1, M5 gardent M3-V01 ; M2, M3 gardent M4-V04) : M3-V01 retenu par numérotation. Option signalée : M2 et M3 demandent de garder M4-V04 comme id (« trois intentions, typage ») et M3 absorbe `repeat` de M3-V01 ; M1 et M5 gardent `reveal` (M3-V01) et `scrub` (M3-V02) séparés. Les fusions M3-V02 → M4-V04 et M1-V06 → M4-V04 (M2, M3) ne sont pas appliquées : M4-V04 est absorbé.
- Avantages : nom court sans homonyme natif ; même mot que le mécanisme du runtime (M3-01 R10) ; un seul verbe pour toute la vue ; [M1] nom court, sans homonyme natif, même mot que le mécanisme du runtime ; [M2] nom court sans homonyme natif, même mot que le mécanisme du runtime ; [M4] nom court sans homonyme natif, même mot que le mécanisme du runtime ; [M5] nom court sans homonyme, même mot que le mécanisme du runtime
- Limites : ne dit pas le sens du mouvement (voir V06) ; la sortie n'est pas un `reveal` mais un état (voir V09) ; [M1] ne dit pas le sens du mouvement (cf. M3-V06) ; [M2] `reveal` et `appear` se recouvrent pour l'entrée à la vue ; le sens du mouvement n'est pas dit ; [M4] ne dit pas le sens ; la sortie passe par l'état, pas par `reveal` ; [M5] ne dit pas le sens du mouvement (voir M3-V06)
- Conflits : M2-S03, M5-S02, M3-S01, M2-V03, M5-V01
- Verdicts : valide 4 (M1, M2, M4, M5) · neutre 0 · conteste 0

### M3-V02 — Verbe `scrub` et plages en mots CSS [fusionne : —]
- Énoncé / Familles / Nature : la progression liée à la position de défilement s'écrit `scrub` ; l'option `range` prend `entry | exit | cover | contain`, mots exacts de `animation-range` ; `scroller` nomme le conteneur ; pas de reprise (la position est la donnée) ; rendu réduit `instant` au point neutre. — Familles : F5 — Nature : instance
- Avantages : mêmes mots qu'en CSS natif, aucune traduction à apprendre ; `scrub` est le mot de GSAP (R2) ; `range` fermé, donc aucun pourcentage libre ; [M1] mots CSS natifs (`entry`, `exit`, `cover`, `contain`), `range` fermé ; [M2] mots exacts de `animation-range`, rien à traduire ; [M4] mots exacts de `animation-range`, aucune traduction à apprendre ; [M5] mots de `animation-range` natifs, `range` fermé
- Limites : `scrub` est peu connu hors GSAP ; `cover` et `contain` demandent une explication ; hors Firefox 159 la plage repose sur le repli nommé (M3-06 R10) ; [M1] `scrub` peu connu hors GSAP ; [M2] `scrub` peu connu hors GSAP ; [M4] `scrub` peu connu hors GSAP ; `cover` et `contain` à expliquer ; [M5] `scrub` peu connu hors GSAP ; repli nommé hors Firefox 159
- Conflits : M5-S02, M3-S01, M5-V01, M1-V06
- Verdicts : valide 3 (M1, M4, M5) · neutre 1 (M2) · conteste 0

### M3-V03 — `scrollTo` comme action, pas comme verbe [fusionne : M1-V08, M4-V05, M5-V08]
- Énoncé / Familles / Nature : le défilement programmé est une action `scrollTo(cible, { duration, easing })`, nommée comme la méthode native parce qu'elle a le même sens ; durée et courbe sont des jetons ; aucun équivalent en attribut HTML en v1 ; rendu réduit `instant`. — Familles : F6, F20 — Nature : instance
- variantes :
  - M1-V08 : `scroll` n'est plus un verbe : le défilement programmé est une action `scrollTo` qui renvoie un handle (M3-S02). `tween` n'est plus un verbe : c'est une option numérique interne (`to:`) de `state` et de `count`. Le vocabulaire passe de quinze à quatorze verbes : `state`, `appear`, `disappear`, `reveal`, `scrub`, `follow`, `layout`, `sequence`, `loop`, `split`, `draw`, `morph`, `drag`, `page`. — Familles : F6, F15 — Nature : les deux (`state`, `page` global ; les autres par instance). Verdicts de M1-V08 : valide 2 (M3, M4) · neutre 2 (M2, M5) · conteste 0.
  - M4-V05 : aucun verbe ne s'appelle `scroll` ni `view`, noms des fonctions CSS `scroll()` et `view()` et de l'événement `scroll`. Le défilement programmé est l'action `scrollTo(cible, options)` sur le handle commun ; `scroll()` et `view()` restent des fonctions CSS internes au runtime. — Familles : F5, F6 — Nature : instance. Verdicts de M4-V05 : valide 3 (M1, M3, M5) · neutre 1 (M2) · conteste 0.
  - M5-V08 : `scrollTo(cible, options)` est une action qui renvoie un handle ; `reorder` est une primitive de geste (M2-S05) ; la transition de page relève de `layout` avec l'option `shared` (R13), et non d'un verbe `page`. `drag`, `scroll`, `page` et `follow` sortent du vocabulaire de M5-S02 ; `follow` est remplacé par `defineValue`. — Familles : F6, F9, F14, F18 — Nature : instance. Verdicts de M5-V08 : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0.
  - Option signalée : M2 demande de garder M5-V08 comme id (1 voix) ; M1 demande de conserver `page` (de M1-V08) ; M1 et M4 ne proposent que la partie défilement de M5-V08, M3 propose sa fusion complète.
- Avantages : pas de seizième verbe ; le sens est celui du natif, seule la courbe change ; un agent le reconnaît sans lire la doc ; [M1] action au sens natif, pas de seizième verbe ; [M2] défilement programmé sans verbe d'élément, sens natif conservé ; [M4] action nommée comme la méthode native, pas de seizième verbe ; [M5] pas de seizième verbe, le sens est celui du natif
- Limites : impossible en HTML pur sans JS ; le `smooth` natif ne règle pas la durée, d'où le repli tween ; [M1] impossible en HTML pur sans JS ; [M2] pas d'attribut HTML pur, donc JS obligatoire ; [M4] impossible en HTML pur sans JS ; le `smooth` natif ne règle pas la durée ; [M5] impossible en HTML pur sans JS
- Conflits : M5-S02, M3-S02, M2-S05, M1-S09
- Verdicts : valide 3 (M1, M4, M5) · neutre 1 (M2) · conteste 0

### M3-V04 — Verbe `loop` avec `pause` obligatoire [fusionne : —]
- Énoncé / Familles / Nature : toute boucle s'écrit `loop`, toujours infinie (une répétition finie est un `reveal repeat` ou une séquence) ; `pause` est obligatoire, valeur `control` (un contrôle est exposé) ou `essential` (animation justifiée, relue au lint) ; presets `pulse`, `blink`, `indeterminate` ; défaut `restart` ; rendu réduit figé sur l'état neutre. — Familles : F24, F20, F21 — Nature : global (abonnement au runtime, M5-S09)
- Avantages : WCAG 2.2.2 devient une donnée vérifiée, pas un oubli ; `essential` rend l'exception explicite ; les presets évitent que chaque auteur réinvente la pulsation ; [M1] WCAG 2.2.2 devient une donnée vérifiée, `essential` rend l'exception explicite ; [M2] WCAG 2.2.2 devient une donnée vérifiée ; [M4] WCAG 2.2.2 devient une donnée vérifiée ; `essential` rend l'exception explicite ; [M5] WCAG 2.2.2 devient une donnée vérifiée, `essential` rend l'exception explicite
- Limites : pas de boucle finie en v1, ce qui oblige à passer par un autre verbe ; `control` suppose un composant de contrôle ; [M1] pas de boucle finie ; défaut `restart` contredit M5-V02 ; [M2] pas de boucle finie en v1 ; [M4] réduction « figé » contredit M5-V02 (« pause contrôlable ») et M1-V04 (« frame neutre + pause »), et `restart` contredit M5-V02 (« sans reprise ») ; [M5] aucune boucle finie en v1 ; `pause` absente de mon V03
- Conflits : M5-S09, M5-S10, M3-S03, M5-V02, M1-V04, M5-V03, M5-V05
- Verdicts : valide 2 (M1, M5) · neutre 2 (M2, M4) · conteste 0

### M3-V06 — Direction par origine, jamais par sens [fusionne : —]
- Énoncé / Familles / Nature : l'option `from` prend `top | bottom | start | end | left | right` et désigne le côté d'où vient l'élément (convention « origine » de tw-animate) ; `start` et `end` suivent le sens de lecture ; `rise` vaut `from: bottom` ; aucun nom ne contient `up` ou `down`. — Familles : F3, F4 — Nature : instance (option de verbe)
- Avantages : lève l'ambiguïté « down » relevée dans R2, où un même mot désigne deux mouvements opposés ; cohérent avec `slide-in-from-*` de Tailwind ; `start` et `end` tiennent en RTL ; [M1] lève l'ambiguïté du `down`, convention d'origine de tw-animate ; [M2] `from` dit d'où vient l'élément, utile pour choisir le bord d'une sortie ; [M4] lève l'ambiguïté « down » par l'origine, cohérent avec `slide-in-from-*` ; [M5] lève l'ambiguïté « down » par l'origine, `start` et `end` pour le RTL
- Limites : migration à documenter pour qui vient d'AOS (`fade-down` devient `from: top`) ; `from` peut se lire comme une position absolue ; [M1] `from` contredit `direction` de M5-V03 et les `up` ou `down` de M4-V08 et M5-V06 ; [M2] « origine » contredit le « sens du mouvement » de M2-V08 (`rise`, `drop`, `sink`, `lift`) ; `from` est lu comme position absolue ; [M4] `from` remplace `direction` de M5-V03 et interdit `up`/`down` que M4-V08 et M5-V06 acceptent comme valeurs ; [M5] contredit M4-V08 (`up`, `down`) et M2-V08 (sens du mouvement) ; migration depuis AOS
- Conflits : M5-S04, M5-V03, M4-V08, M5-V06, M2-V08
- Verdicts : valide 0 · neutre 0 · conteste 4 (M1, M2, M4, M5)

### M3-V09 — États écrits par le runtime, jamais par l'auteur [fusionne : —]
- Énoncé / Familles / Nature : `data-view="in" | "out"` (observation), `data-presence="entering" | "present" | "exiting"` (présence) sont lus en CSS et par les agents, écrits seulement par le runtime ; le lint refuse leur écriture dans le HTML source. — Familles : F3, F4, F21 — Nature : global
- Avantages : séparation nette entre ce que l'auteur déclare et ce que le runtime observe ; un agent ne peut pas forger un état ; noms observables par `attributeFilter` ; [M1] séparation nette entre ce que l'auteur déclare et ce que le runtime observe ; [M2] `data-presence` et `data-view` écrits seulement par le runtime, séparation nette ; [M4] séparation nette entre ce que l'auteur déclare et ce que le runtime observe ; un agent ne peut pas forger un état ; [M5] l'auteur déclare, le runtime observe : un agent ne peut pas forger un état
- Limites : un état posé par JS n'existe pas au rendu serveur (premier affichage, M3-02 R10) ; deux espaces de noms à documenter ; [M1] état posé par JS absent au rendu serveur ; [M2] un état posé par JS n'existe pas au rendu serveur ; [M4] un état JS n'existe pas au rendu serveur ; deux espaces de noms à documenter ; [M5] état JS absent au rendu serveur
- Conflits : M2-S03, M3-01, M3-02, M2-V03, M1-V07
- Verdicts : valide 4 (M1, M2, M4, M5) · neutre 0 · conteste 0

### M4-V02 — Homonyme d'attribut HTML toléré seulement si le natif ne s'applique pas à l'élément [fusionne : —]
- Énoncé / Familles / Nature : un nom identique à un attribut HTML est toléré quand l'attribut natif n'existe pas sur l'élément visé (`loop` sur un `<div>`, pas sur `<video>` ou `<audio>`). Sinon le nom est renommé. `track` (`<track>`), `fill` (attribut SVG) et `hidden` (global) sont interdits sur tout élément ; `loop` est toléré seulement hors média. — Familles : F2, F3, F4, F7, F24 — Nature : global
- Avantages : évite des renommages inutiles (`loop` reste naturel pour une boucle) ; la règle est vérifiable par le parseur d'attributs au build ; le lecteur HTML n'est pas trompé sur les médias ; [M1] évite des renommages inutiles (`loop` reste naturel) ; [M2] `loop` reste naturel hors média ; [M3] `loop` reste naturel sur un `<div>` sans renommage inutile ; [M5] évite des renommages inutiles (`loop` hors média)
- Limites : le lint doit connaître l'élément cible, donc la validation ne vaut qu'à partir du HTML réel ; une règle conditionnelle est plus difficile à expliquer qu'une liste simple ; [M1] règle conditionnelle inutile si le verbe est une valeur de `data-motion` ; lint plus complexe ; [M2] règle conditionnelle à expliquer ; [M3] le lint doit connaître l'élément cible ; [M5] règle conditionnelle à l'élément, plus difficile à expliquer
- Conflits : M5-S01, M5-S10, M5-V07, M5-V04
- Verdicts : valide 2 (M3, M5) · neutre 1 (M2) · conteste 1 (M1)

### M4-V03 — Présence : verbes `appear` et `disappear`, état `data-presence` en lecture seule, rendu réduit en fondu [fusionne : M1-V07, M2-V03]
- Énoncé / Familles / Nature : l'entrée et la sortie s'écrivent `appear` et `disappear` ; `disappear` retient le nœud jusqu'à `finished` (M4-03). L'état se lit dans `data-presence="entering | present | exiting"`, posé par le runtime et jamais écrit par l'auteur. Sous réduction de mouvement, les deux verbes passent en fondu seul par défaut. — Familles : F3, F10, F11 — Nature : instance
- variantes :
  - M1-V07 : l'auteur écrit `disappear` pour retirer un élément. Le runtime retient le nœud jusqu'à `finished` (M4-03) et publie `data-presence="exiting"` pendant la sortie, en lecture seule pour le CSS. `dismiss` n'existe pas, et `data-presence` n'est jamais écrit par l'auteur. — Familles : F3, F10, F11 — Nature : instance. Verdicts de M1-V07 : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0.
  - M2-V03 : l'entrée et la sortie s'écrivent `appear` et `disappear` ; l'état `data-presence` de M2-S03 reste un détail d'implémentation du runtime et n'est pas un vocabulaire public. Aucun nom `enter`, `exit`, `leave`, `dismiss`, `remove`. — Familles : F3, F10, F11 — Nature : instance (retenue par le scope, M4-10). Verdicts de M2-V03 : valide 2 (M4, M5) · neutre 0 · conteste 2 (M1, M3).
  - Option signalée : M4 garde M2-V03 comme id (« état `data-presence` public ou non : à trancher avec M2-V03 ») ; M1 ne retient de M2-V03 que les noms (état non public rejeté) ; M5 signale le retrait de l'état du vocabulaire public comme à trancher ; M3 indique que M2-V03 est contesté.
- Avantages : aucun homonyme (`enter`/`exit` évités) ; l'état est stylable et observable par un agent ; le rendu réduit est décidé par le verbe, pas par le composant ; [M1] état stylable et observable, rendu réduit décidé par le verbe ; [M2] mêmes verbes que ma M2-V03 ; le rendu réduit est décidé par le verbe ; [M3] `data-presence` lisible par agent et stylable, rendu réduit décidé par le verbe ; [M5] aucun homonyme, rendu réduit décidé par le verbe
- Limites : `disappear` sonne moins naturellement qu'`exit` ; React doit retenir les enfants sortants ; l'état `data-presence` doit précéder le retrait du nœud ; [M1] le fondu réduit de `disappear` contredit M5-V02 (instantané) ; [M2] `disappear` sonne moins naturellement ; `data-presence` doit précéder le retrait ; [M3] `disappear` sonne moins naturellement qu'`exit` ; [M5] `disappear` sonne moins naturellement qu'`exit` ; en réduit, fondu pour `disappear` là où mon V02 dit `instant`
- Conflits : M5-S02, M2-S03, M4-S02, M5-V02
- Verdicts : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0

### M4-V08 — Directions logiques `start`, `end`, `up`, `down` ; pas de `in`/`out`/`left`/`right` comme valeurs d'effet [fusionne : —]
- Énoncé / Familles / Nature : les directions d'un effet d'entrée ou de sortie sont `start`, `end`, `up`, `down` (logiques, RTL inclus). `in` et `out` ne sont pas des valeurs d'effet (collision avec les directives Svelte). `left` et `right` ne sont pas des valeurs d'effet ; un effet de translation utilise `start` ou `end`. `down` est accepté malgré son homonyme `pointerdown` (il ne vit que comme valeur). — Familles : F2, F7, F18 — Nature : global
- Avantages : une même spec se lit dans les deux sens de l'écriture ; pas de confusion avec `in:`/`out:` ; `start`/`end` sont déjà des termes CSS logiques ; [M1] directions logiques, `start` et `end` valent en RTL ; [M2] `start` et `end` suivent le sens du texte, utile aux sorties en RTL ; [M3] une même spec se lit dans les deux sens de l'écriture, `start` et `end` tiennent en RTL ; [M5] directions logiques, lisibles en RTL
- Limites : `up` et `down` restent physiques, donc un effet vertical n'est pas miroité en RTL ; `start`/`end` demandent une règle d'interprétation par `dir` ; `down` peut surprendre à la lecture rapide ; [M1] `up` et `down` restent physiques ; `left` et `right` contredits par M5-V03 ; [M2] `left` et `right` exclus contredisent M5-V03 ; [M3] `up` et `down` désignent le sens, contre `from` (origine) de M3-V06 ; `left` et `right` exclus, contre M5-V03 ; [M5] `left` et `right` exclus, alors que M3-V06 refuse `up` et `down` et que mon V03 garde `left` et `right`
- Conflits : M5-S04, M1-S09, M5-V03, M3-V06
- Verdicts : valide 0 · neutre 3 (M1, M2, M5) · conteste 1 (M3)

### M5-V01 — Sept verbes d'intention fermés [fusionne : —]
- Énoncé / Familles / Nature : sept verbes au plus, chacun désigne un résultat : `appear` (entrer), `disappear` (sortir, retenu jusqu'à `finished`), `emphasize` (accentuer un état ou attirer l'attention), `reveal` (révéler à la vue), `scrub` (lier à la position de défilement), `loop` (boucler), `layout` (partager une géométrie). Les valeurs continues ne sont pas des verbes (`defineValue`, F14 et F15). Remplace M5-S02 (quinze verbes, noté 3,0 à 6,0). — Familles : F2, F3, F4, F5, F7, F8, F24 (F16 à F18 en R14) — Nature : les deux (`reveal` et `loop` globaux ; les autres par instance)
- Avantages : sept mots à apprendre au lieu de quinze ; noms convergents (`scrub` chez GSAP, `layout` chez Motion et anime.js, `appear` et `disappear` en paire) ; aucun homonyme natif retenu par V07 ; [M1] sept verbes au lieu de quinze, noms convergents ; [M2] sept verbes à apprendre, paire `appear`/`disappear` convergente ; [M3] sept mots au lieu de quinze, noms convergents (`scrub`, `layout`, `appear` / `disappear`) ; [M4] sept mots au lieu de quinze, noms convergents, paire `appear`/`disappear`
- Limites : `emphasize` couvre à la fois les états (F2) et l'attention, à scinder si les besoins divergent ; `layout` recouvre F7 et F8, à détailler en R13 ; F16 à F18 restent hors verbes jusqu'en R14 ; [M1] contredit M1-V06 et M1-V08 (`follow`, `page`), M4-V04 et M2-V02 ; [M2] `layout` recouvre F7 et F8 : contredit ma M2-V02 (`shared` distinct, défaut `restart`) ; [M3] `follow` retiré alors que M1-V06 et M4-V04 le gardent ; `emphasize` à scinder ; [M4] `emphasize` mêle états et attention ; `layout` recouvre F7 et F8
- Conflits : M5-S02, M3-S01, M2-S03, M4-S02, M1-V06, M1-V08, M2-V02, M4-V04, M2-V03, M2-V01, M2-V05
- Verdicts : valide 3 (M1, M3, M4) · neutre 0 · conteste 1 (M2)

### M5-V02 — Défaut de reprise et de réduction par verbe, dans le manifeste [fusionne : M1-V03, M1-V04, M2-V06]
- Énoncé / Familles / Nature : chaque verbe porte son défaut, écrit une fois dans le manifeste : `appear` : restart, réduit en fondu seul ; `disappear` : restart, réduit instantané ; `emphasize` : restart, réduit statique ; `reveal` : restart, réduit instantané ; `scrub` : sans reprise (position), réduit à la position neutre ; `loop` : sans reprise, réduit en pause contrôlable ; `layout` : carry, réduit instantané. Un auteur n'écrit le défaut que pour le changer. — Familles : F2, F3, F4, F5, F13, F20, F24 — Nature : global (table du manifeste)
- variantes :
  - M1-V03 : chaque verbe a un défaut de reprise fixe dans le manifeste, écrit seulement pour le changer. `restart` pour `appear`, `disappear`, `reveal`, `tween`, `page`, `split`, `draw`, `morph`, `sequence`, `loop` ; `carry` pour `state`, `layout`, `scrub`, et `drag` ou `follow` avec vitesse (M1-V02). — Familles : F2, F3, F7, F10, F12, F13, F14, F18 — Nature : global. Verdicts de M1-V03 : valide 3 (M3, M4, M5) · neutre 0 · conteste 1 (M2).
  - M1-V04 : sous `prefers-reduced-motion`, chaque verbe a un rendu réduit fixe parmi `fade` (opacité seule, durée courte) et `instant` (état final immédiat). `loop` devient une frame neutre avec pause exposée ; `scrub` et `follow` deviennent `instant` ; `drag` garde le retour d'état sans inertie. Le choix est publié dans le manifeste, jamais écrit par l'auteur. — Familles : F2, F3, F4, F5, F14, F18, F20, F24 — Nature : global. Verdicts de M1-V04 : valide 3 (M3, M4, M5) · neutre 1 (M2) · conteste 0.
  - M2-V06 : `layout`, `appear` et `disappear` ont pour défaut `carry` ; `shared` a pour défaut `restart`. Le manifeste écrit ces défauts une fois ; l'auteur n'écrit `continuity` que pour changer le défaut. — Familles : F7, F3, F8, F13 — Nature : global (table du manifeste). Verdicts de M2-V06 : valide 0 · neutre 0 · conteste 4 (M1, M3, M4, M5).
  - Option signalée : M2 demande que `disappear` passe en `carry` (défaut de M2-V06) ; M3 propose de retirer M2-V06 (`appear` et `disappear` restent en `restart`) ; M4 demande de réviser M2-V06 ; M1 signale le défaut de `loop` (M1-V03) à aligner.
- Avantages : les cas courants ne demandent aucune décision de reprise ; la réduction de mouvement est tranchée par verbe, pas par composant (F20) ; la table est testable et lisible par un agent ; [M1] les cas courants ne demandent aucune décision de reprise, réduction tranchée par verbe ; [M2] défauts publiés par verbe, réduction tranchée par verbe, `layout` en `carry` ; [M3] les cas courants n'exigent aucune décision de reprise, réduction tranchée par verbe ; [M4] la plupart des cas ne demandent aucune décision de reprise ; réduction tranchée par verbe
- Limites : sept défauts à justifier et à réviser ; `layout` en carry force le moteur JS et son coût ; `loop` réduit en pause impose un choix d'accessibilité que l'auteur ne peut pas désactiver sans le déclarer ; [M1] `loop` sans reprise contredit M3-V04 ; `layout` en `carry` force le JS ; [M2] `disappear` en `restart` peut sauter pendant un `appear` (contredit M2-V06) ; [M3] `loop` sans reprise contredit M3-V04 (restart) ; sept défauts à justifier ; [M4] sept défauts à justifier ; `loop` réduit en pause impose un choix d'accessibilité
- Conflits : M5-S08, M3-S03, M5-S09, M4-03, M5-S04, M1-S10, M3-V04
- Verdicts : valide 3 (M1, M3, M4) · neutre 0 · conteste 1 (M2)

### M5-V03 — Options fermées, valeurs = noms de tokens ou mots-clés, jamais de nombre [fusionne : M1-V09, M3-V05, M4-V07]
- Énoncé / Familles / Nature : options à mots-clés fermés : `trigger` (load, view, state), `repeat` (once, always), `direction` (up, down, left, right), `axis`, `range`, `group`. Options à token : `delay`, `stagger`, `duration`, `easing`, `distance`, `threshold`, `margin`. Aucun nombre ni unité dans un attribut ou dans un nom de token ; les tokens de durée sont en millisecondes. — Familles : F1, F4, F5, F10, F11, F20 — Nature : global
- variantes :
  - M1-V09 : chaque option a un domaine fermé publié, rempli uniquement par des tokens : `rhythm: tight|snug|medium|loose|wide`, `duration: short|medium|long`, `threshold: touch|quarter|most`, `distance`, `direction`, `group`. Un nombre littéral est refusé au build. Les options qui changent le moteur (`duration`, `ease`, `spring`, `threshold`) ne prennent jamais de valeur libre, pour que le moteur soit choisi par le nom. — Familles : F1, F4, F7, F10, F13, F23 — Nature : global. Verdicts de M1-V09 : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0.
  - M3-V05 : `threshold` prend `touch | quarter | half | full` (fraction de la cible visible) et `margin` prend `none | near | far` ; les valeurs réelles vivent dans `tokens.json`, jamais de nombre dans la grammaire. — Familles : F4, F1 — Nature : global. Verdicts de M3-V05 : valide 2 (M4, M5) · neutre 2 (M1, M2) · conteste 0.
  - M4-V07 : les options de temps s'appellent `duration`, `delay` et `easing` (noms des paramètres Svelte et de CSS), avec des valeurs de tokens (`duration: md`, `delay: stagger`). La cascade s'appelle `stagger` et le groupe `group`. Ne sont pas utilisés : `ease` (nom de Motion), `transition` (natif Svelte et React), `each`, `for`, `track` (mots-clés de boucle). — Familles : F1, F2, F7, F10, F11 — Nature : global. Verdicts de M4-V07 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
  - Option signalée : M1 n'accepte la fusion de M3-V05 qu'après arbitrage des mots ; M1 retient `duration`, `delay`, `easing` de M4-V07 ; M1 propose de renommer `direction` (M5-V03) en `from` (renommage, non compté comme fusion) ; M2 retient les noms de temps de M4-V07 ; M3 et M5 signalent les seuils de M1-V09 et M3-V05 à unifier.
- Avantages : une durée ou un seuil se change dans les tokens, jamais dans le HTML (règle de M3-S06) ; un agent ne peut pas écrire `0.37` ni `300ms` ; une seule unité évite le piège secondes contre millisecondes relevé en R2 §17 ; [M1] une durée ou un seuil se change dans les tokens, jamais dans le HTML ; [M2] une seule unité (millisecondes), aucun nombre dans un attribut ; [M3] une seule unité (ms), un agent ne peut pas écrire `0.37` ou `300ms` ; [M4] une durée ou un seuil se change dans les tokens ; une seule unité (ms) évite le piège de R2 §17
- Limites : liste fermée à faire évoluer par version ; `direction`, `axis` et `range` ne sont pas personnalisables ; un besoin rare exige une définition TS ; [M1] liste fermée à faire évoluer par version ; [M2] `direction`, `axis` et `range` non personnalisables ; [M3] liste fermée, `direction` non personnalisable ; `direction` contre `from` (M3-V06) ; [M4] liste fermée à faire évoluer par version ; `direction`, `axis`, `range` non personnalisables
- Conflits : M3-S06, M4-S05, M5-S05, M3-V06, M4-V08
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 (M2) · conteste 0

### M5-V04 — Grammaire HTML : une référence, des options en attributs séparés [fusionne : M1-V10, M3-V07, M4-V10]
- Énoncé / Familles / Nature : `data-motion="<référence>"` porte une seule référence, preset livré ou définition TS ; chaque option s'écrit dans son propre attribut `data-motion-<option>="<token ou mot-clé>"` ; aucune chaîne composite (`"fade delay:md"`) ; le verbe n'est jamais écrit en HTML, il est porté par le preset. Tout attribut inconnu échoue au build. — Familles : F1, F3, F4, F22, F23 — Nature : instance
- variantes :
  - M1-V10 : une animation s'écrit `data-motion="reveal"` ou `data-motion="card-enter"` (référence), et chaque option a son propre attribut `data-motion-<option>` (`data-motion-rhythm="snug"`). La liste des attributs observés est fermée et générée depuis le manifeste ; le runtime s'abonne par `attributeFilter` à cette seule liste. — Familles : F1, F2, F3, F4, F22, F23 — Nature : les deux (liste d'observation globale ; valeurs par élément). Verdicts de M1-V10 : valide 3 (M2, M3, M5) · neutre 1 (M4) · conteste 0.
  - M3-V07 : `data-motion="reveal"` nomme le verbe ou la définition ; chaque option est un attribut `data-motion-<option>` à valeur de jeton fermé (`data-motion-from="bottom"`, `data-motion-threshold="half"`) ; noms et valeurs en anglais, kebab-case, minuscules ; `motion check` refuse toute valeur hors liste. — Familles : F22, F23, F1 — Nature : global. Verdicts de M3-V07 : valide 1 (M2) · neutre 3 (M1, M4, M5) · conteste 0.
  - M4-V10 : `data-motion="card-enter"` porte seulement la référence (nom de définition ou de preset). Chaque option s'écrit dans un attribut séparé `data-motion-<option>="<token>"` (`data-motion-duration="md"`), validé au build. Une chaîne unique d'options est refusée. La casse suit la couche : kebab-case en HTML et CSS (`card-enter`), camelCase en TS (`cardEnter`, `duration`), verbes en mot anglais unique et minuscule. — Familles : F1, F2, F3, F4, F22, F23 — Nature : global. Verdicts de M4-V10 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
  - Option signalée : M3 demande de garder M4-V10 comme id (1 voix : référence seule, options séparées, casse par couche) ; le verbe écrit dans `data-motion` (M3-V07) reste à trancher (M3, M4, M5) ; M1 rejette le verbe écrit en HTML ; la partie casse de M4-V10 est signalée par M1, M2 et M5 vers M5-V06 (voir G7).
- Avantages : `[data-motion]` et `[data-motion-*]` restent interrogeables, observables avec `attributeFilter` et analysables sans parseur de chaîne ; une option fausse échoue par son nom d'attribut ; compatible avec « référence seulement » (M5-S01) ; [M1] `[data-motion-*]` observable par `attributeFilter`, pas de parseur de chaîne ; [M2] `data-motion-<option>` observable et analysable sans parseur de chaîne ; [M3] `[data-motion-*]` interrogeable et observable sans parseur de chaîne ; [M4] attributs interrogeables et observables, sans parseur de chaîne ; une option fausse échoue par son nom
- Limites : beaucoup d'attributs sur un élément très animé ; un même effet peut s'écrire en preset ou en définition ; une page HTML pure ne peut pas porter une option hors liste ; [M1] beaucoup d'attributs sur un élément très animé ; [M2] beaucoup d'attributs sur un élément très animé ; ma M2-V09 (`data-motion-shared`) s'y range ; [M3] beaucoup d'attributs sur un élément très animé ; verbe jamais écrit en HTML, contre M3-V07 ; [M4] beaucoup d'attributs sur un élément très animé ; verbe absent du HTML, contre M1-V10 et M3-V07
- Conflits : M5-S01, M2-S02, M2-S03, M4-S09, M5-S02, M5-S10, M2-V09
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-V05 — Dix presets livrés, nommés par effet [fusionne : M2-V08, M3-V10, M4-V09]
- Énoncé / Familles / Nature : `fade`, `slide`, `scale`, `collapse`, `press`, `pulse`, `shake`, `spin`, `shimmer`, `blink`. Chacun porte un verbe par défaut : `fade`, `slide`, `scale`, `collapse` en `appear` et `disappear` (`slide` en `reveal` avec `trigger="view"`) ; `press`, `pulse`, `shake` en `emphasize` ; `spin`, `shimmer`, `blink` en `loop`. La direction est une option (`direction`), jamais une partie du nom. — Familles : F2, F3, F4, F24 — Nature : global
- variantes :
  - M2-V08 : les presets livrés s'appellent `fade`, `rise` (vient du bas), `drop` (vient du haut), `grow`, `shrink`, `sink` (sort vers le bas) et `lift` (sort vers le haut) ; `appear` et `disappear` partagent les mêmes noms. Les noms d'origine (`slide-in-from-top`, `from-*`) sont refusés. — Familles : F3, F4 — Nature : global (presets livrés). Verdicts de M2-V08 : valide 0 · neutre 0 · conteste 4 (M1, M3, M4, M5).
  - M3-V10 : Udixio livre des définitions prêtes à l'emploi nommées par l'effet : `fade`, `rise` (reveal, `from: bottom`), `grow` (échelle), `parallax` (scrub, distance en jeton), `pulse`, `blink`, `indeterminate` (loop) ; aucun nom ne contient de direction (`fade-up`, `slide-down` exclus). — Familles : F1, F2, F3, F4, F5, F24 — Nature : global (définitions partagées). Verdicts de M3-V10 : valide 2 (M1, M2) · neutre 1 (M5) · conteste 1 (M4).
  - M4-V09 : les presets livrés par Udixio se nomment `<verbe>-<variante>` en kebab-case, dans l'espace `udx-` : `udx-reveal-fade-up`, `udx-appear-fade`, `udx-disappear-fade`, `udx-follow-cursor`, `udx-loop-pulse`. Une définition de l'utilisateur ne doit pas commencer par `udx-`. Un preset se référence comme une définition (M4-S04), sans import séparé. — Familles : F1 à F4, F20, F22, F24 — Nature : global. Verdicts de M4-V09 : valide 0 · neutre 1 (M2) · conteste 3 (M1, M3, M5).
  - Option signalée : M3 ne retient pas M2-V08 ni M4-V09 (« non retenus en l'état ») ; M4 demande de trancher le préfixe `udx-` ; M5 reprend `udx-` comme espace de noms sans noms directionnels ; M1 propose de reprendre `rise` et `parallax` de M3-V10 si utiles.
- Avantages : convergence forte (`fade`, `slide`, `scale`, `spin` chez Tailwind, Motion, AOS et Rombo) ; pas de `fade-up` ni de `slide-down` qui mélangent effet et direction ; dix noms couvrent les cas simples sans `defineMotion` ; [M1] convergence forte (`fade`, `slide`, `scale`, `spin`), direction en option ; [M2] `fade`, `slide`, `scale`, `collapse` en `appear`/`disappear` ; `collapse` pour les listes ; [M3] convergence forte (`fade`, `slide`, `scale`, `spin`), pas de direction dans le nom ; [M4] convergence forte (`fade`, `slide`, `scale`, `spin`) ; direction en option, pas dans le nom
- Limites : `collapse` exige la mesure de la taille (F2) ; `pulse` et `spin` coïncident avec les classes cœur de Tailwind, sans collision en attribut mais source de confusion pour un agent ; dix presets à maintenir face aux effets réels ; [M1] `collapse` exige la mesure ; `pulse` et `spin` proches des noms cœur de Tailwind ; [M2] `collapse` exige la mesure ; `pulse` et `spin` proches des classes cœur de Tailwind ; [M3] `pulse` en `emphasize` contre `pulse` en boucle (M3-V10) ; `collapse` exige la mesure ; [M4] `collapse` exige la mesure ; `pulse`, `spin` recoupent les classes cœur de Tailwind
- Conflits : M4-S04, M2-S03, M5-S04, M5-S06, M3-S01, M5-S07
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-V06 — Langue et casse : anglais, kebab-case en HTML, camelCase en TS [fusionne : M2-V10]
- Énoncé / Familles / Nature : noms en anglais, sans abréviation, au singulier ; kebab-case dans HTML et CSS (`data-motion-stagger`, `collapse`) ; camelCase en TS (`defineMotion`, `udxMotion`, `useMotion`). Les mots `down` et `up` ne sont jamais un nom de verbe ou de preset, seulement une valeur de `direction`. La documentation reste en français. — Familles : F22, F23 — Nature : global
- variantes :
  - M2-V10 : les noms sont en anglais ; les verbes à l'infinitif (`layout`, `shared`, `appear`, `reorder`) ; les options en nom (`stagger`, `measure`, `correct`) ; les valeurs fermées et les attributs en kebab-case (`data-motion-shared`) ; TypeScript en camelCase (`layoutId`, `defineMotion`). Aucun nom qui reprend un événement DOM ou une API native (`drag`, `exit`, `leave`, `flip`, `animate`). — Familles : F23, F22 — Nature : global. Verdicts de M2-V10 : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0.
  - Option signalée : partie casse de M4-V10 (M1, M2, M5) : non absorbée ici, M4-V10 étant absorbé dans G6 (égalité, numérotation) ; M3 reprend la règle « verbes à l'infinitif » de M2-V10.
- Avantages : un seul sens par mot, ce qui évite le `down` d'AOS contre celui de tw-animate relevé en R2 §17 ; le kebab-case est cohérent avec les attributs HTML insensibles à la casse ; un agent qui connaît Tailwind ou AOS retrouve les formes ; [M1] un seul sens par mot, évite le `down` d'AOS contre celui de tw-animate ; [M2] même casse que ma M2-V10, un seul sens par mot ; [M3] un seul sens par mot, évite le « down » contradictoire de R2 ; [M4] un seul sens par mot (évite le `down` d'AOS contre celui de tw-animate) ; kebab-case HTML, camelCase TS
- Limites : l'anglais demande un effort de traduction aux équipes francophones ; la correspondance mécanique entre kebab-case HTML et camelCase TS doit être documentée ; interdire `down` comme nom contredit des usages existants ; [M1] l'anglais demande un effort de traduction aux équipes francophones ; [M2] équipes francophones à former ; [M3] interdit `down` comme nom, contredit M4-V09 qui l'emploie ; [M4] l'effort de traduction en anglais ; interdire `down` contredit des usages existants
- Conflits : M5-S07, M4-S04, M4-S02, M5-S03, M4-V08, M4-V10, M4-V09, M3-V06
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-V07 — Politique de réserve : noms natifs et noms cœur de Tailwind [fusionne : M4-V01]
- Énoncé / Familles / Nature : le manifeste liste les noms réservés (`enter`, `exit`, `in`, `out`, `transition`, `animate`, `initial`, `old`, `new`, `view-transition-*`, `AnimatePresence`) ; un verbe, un preset ou une option qui en reprend un est refusé au build, sauf exception justifiée dans le manifeste. Les tokens du plugin sont en `--udx-motion-*` et ne redéfinissent jamais `--animate-*`, dont les noms cœur (`spin`, `pulse`, `ping`, `bounce`) ne doivent pas être écrasés. — Familles : F3, F9, F22, F23 — Nature : global
- variantes :
  - M4-V01 : un fichier unique liste les noms natifs à éviter pour verbes, options et presets : Angular (`animate.enter`, `animate.leave`, `@for … track`), Svelte (`in`, `out`, `transition`, `animate`, `each`), React-Motion (`initial`, `animate`, `exit`, `layout`, `drag`, `transition`, `AnimatePresence`), CSS (`transition-*`, `animation-*`, `scroll()`, `view()`, `view-transition-*`), HTML (voir M4-V02). Le lint refuse un nom de la liste dans un verbe, une option ou un preset, et cite la liste. — Familles : F1 à F24 (toutes) — Nature : global. Verdicts de M4-V01 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
  - Option signalée : M5 demande de garder M4-V01 comme id (1 voix, liste issue des API natives) ; M5 note que `layout` est gardé contre la liste de M4-V01 (M2-V01, M5-V01).
- Avantages : pas de collision silencieuse ni avec les frameworks ni avec les variables cœur de Tailwind ; une seule liste pour le lint, les types et la doc ; chaque exception est tracée ; [M1] liste unique pour lint, types et doc, chaque exception tracée ; [M2] une liste de réserve pour lint, types et doc ; [M3] pas de collision silencieuse avec les frameworks ni avec les variables cœur de Tailwind ; [M4] aucune collision silencieuse ni avec les frameworks ni avec les variables cœur de Tailwind ; une seule liste pour lint, types et doc
- Limites : liste à suivre à chaque version de framework ; `initial` et `new` sont des mots courants qui gênent le choix de noms ; une exception mal justifiée ouvre la porte aux homonymes ; [M1] liste à suivre à chaque version de framework ; [M2] liste à suivre à chaque version ; `initial` et `new` gênent le choix de noms ; [M3] liste à suivre à chaque version ; [M4] liste à suivre à chaque version ; `initial` et `new` gênent le choix de noms
- Conflits : M5-S03, M5-S04, M4-S02, M5-S02, M4-V02, M3-V10
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-V09 — Liste fermée et versionnée, entrée par fiche [fusionne : —]
- Énoncé / Familles / Nature : un verbe ou un preset n'entre dans le vocabulaire que s'il déclare une famille, un défaut de reprise et de réduction (M5-V02), aucun nom réservé (M5-V07) et un test de couverture. Ajouter un preset est une version mineure ; ajouter ou retirer un verbe est une version majeure ; chaque entrée a une fiche dans le manifeste. — Familles : F21, F22, F23 — Nature : global
- Avantages : le vocabulaire ne dérive pas en silence ; une fiche courte remplace les débats d'avis ; l'agent sait quelle version du vocabulaire il lit ; [M1] une fiche courte par entrée, version majeure pour tout retrait ; [M2] le vocabulaire ne dérive pas en silence ; [M3] une fiche par entrée, le vocabulaire ne dérive pas en silence ; [M4] le vocabulaire ne dérive pas en silence ; une fiche remplace les débats d'avis
- Limites : une règle de plus à appliquer en revue ; un besoin urgent attend la prochaine version ; les fiches demandent une maintenance documentaire ; [M1] une règle de plus à appliquer en revue ; [M2] une règle de revue en plus ; [M3] une règle de plus en revue ; [M4] une règle de plus en revue ; un besoin urgent attend la version suivante
- Conflits : M5-S10, M5-S02
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 (M2) · conteste 0

### M5-V10 — Alias de diagnostic pour les agents, jamais d'alias silencieux [fusionne : —]
- Énoncé / Familles / Nature : le manifeste déclare des alias de diagnostic : `enter` vers `appear`, `exit` vers `disappear`, `fade-in` vers `fade`, `fade-up` vers `slide` avec `direction="up"`, et les anciens noms d'easing d'anime.js v3 vers leur token. Le build et le lint échouent et citent le nom canonique ; un alias n'est jamais accepté en silence. `llms.txt` liste les noms à ne pas écrire. — Familles : F22, F23 — Nature : global
- Avantages : les échecs silencieux, les plus coûteux selon R2 §16.3, deviennent des erreurs visibles ; un agent formé sur Motion, AOS ou anime.js v3 reçoit la forme correcte ; la table est testable ; [M1] les échecs silencieux deviennent des erreurs visibles, citant le nom canonique ; [M2] les erreurs deviennent visibles, `enter` renvoie vers `appear` ; [M3] les échecs silencieux deviennent des erreurs qui citent le nom canonique ; [M4] les échecs silencieux deviennent des erreurs visibles ; un agent formé sur Motion ou AOS reçoit la bonne forme
- Limites : la table vieillit avec les données d'entraînement des modèles ; un alias mal pointé induit un faux diagnostic ; `fade-up` vers `slide` plus `direction` n'est pas une correspondance biunivoque ; [M1] la table vieillit ; `fade-up` vers `slide` n'est pas biunivoque ; [M2] la table vieillit avec les données d'entraînement ; [M3] la table vieillit avec les données d'entraînement ; `fade-up` vers `slide` plus `direction` n'est pas biunivoque ; [M4] la table vieillit avec les données d'entraînement ; `fade-up` vers `slide` plus `direction` n'est pas biunivoque
- Conflits : M5-S10, M5-V07, M4-V09
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 (M2) · conteste 0


---

## 3. Contradictions ouvertes

Critère : une annotation, ou un passage « à trancher », « contre », « contredit » ou « alors que » des sections Doublons, désigne une incompatibilité entre les deux ids. Chaque ligne est une paire. Statut : **ouverte** = aucune fusion retenue ne règle la paire ; **couverte** = un des deux ids est absorbé dans une fusion retenue (le point restant est indiqué).

### 3.1 À trancher (plusieurs experts)

1. **Convention de direction** — M3-V06 (`from`, origine) ↔ M4-V08 (`start`/`end`/`up`/`down`, sens). Source : M1, M3, M5. *Ouverte.*
2. **Convention de direction** — M3-V06 ↔ M5-V03 (`direction` : up/down/left/right ; M1 propose de le renommer en `from`). Source : M1, M3, M4. *Ouverte.*
3. **Convention de direction** — M3-V06 ↔ M2-V08 (`rise`, `drop`, `sink`, `lift`, sens du mouvement). Source : M1, M2, M3, M5. *Couverte par G9 (M2-V08 absorbé) ; la convention reste à trancher.*
4. **Convention de direction** — M3-V06 ↔ M5-V06 (`up`/`down` refusés dans les noms par M3-V06, acceptés comme valeurs par M5-V06). Source : M1, M4. *Ouverte.*
5. **Convention de direction** — M4-V08 ↔ M5-V03 (`left`/`right` exclus d'un effet d'entrée ou de sortie, inclus dans `direction`). Source : M1, M2, M3, M5. *Ouverte.*
6. **Convention de direction** — M3-V06 ↔ M3-V10 (`rise` inscrit une direction dans le nom, contre `from`). Source : M5. *Couverte par G9 (M3-V10 absorbé).*
7. **Verbe `shared` ou option de `layout`** — M2-V02 (verbe) ↔ M5-V08 (option de `layout`). Source : M1, M3, M4, M5. *Couverte par G4 (M5-V08 absorbé) ; placement à trancher. M2-V02 reste id gardé de G2.*
8. **Verbe `shared` ou option de `layout`** — M2-V02 ↔ M5-V01 (`layout` recouvre F7 et F8, `shared` distinct). Source : M1, M2. *Ouverte.*
9. **`follow` contre `defineValue`** — M1-V06 et M4-V04 (`follow`, valeur continue) ↔ M5-V08 (`follow` remplacé par `defineValue`). Source : M1, M2, M3, M4, M5. *Couverte par G3 et G4 (M4-V04 et M5-V08 absorbés) ; `defineValue` à trancher, M1-V06 reste distinct.*
10. **`follow`** — M1-V06 ↔ M5-V01 (les sept verbes de M5-V01 n'incluent pas `follow`). Source : M1. *Ouverte.*
11. **`scrub` contre `follow`** — M3-V02 (`scrub`) ↔ M1-V06 (`follow`). Source : M4 (recouvrements). *Ouverte.*
12. **`reveal` contre `follow`** — M3-V01 (`reveal`) ↔ M1-V06 (`follow`). Source : M4 (recouvrements). *Ouverte.*

### 3.2 Autres contradictions

13. **`layout`** — M2-V01 (`layout`, défaut `carry`) ↔ M1-V02 (`carry` natif sauf ressort). Source : M1. *Ouverte.*
14. **`layout`** — M2-V01 ↔ M4-V01 (liste réservée qui refuse `layout` et `drag`). Source : M5. *Couverte par G8 (M4-V01 absorbé) ; `layout` à confirmer.*
15. **État `data-presence`** — M2-V03 (état interne, non public) ↔ M1-V07 et M3-V09 (`data-presence` lu en CSS et par les agents). Source : M1, M2, M3, M4, M5. *Couverte par G1 (M2-V03 et M1-V07 absorbés) ; statut public de l'état à trancher pour M3-V09.*
16. **État `data-presence`** — M2-V03 ↔ M4-V03 (état lu en CSS, rendu réduit par verbe). Source : M1, M5. *Couverte par G1 (M2-V03 absorbé).*
17. **Réduction de `disappear`** — M4-V03 (fondu seul par défaut) ↔ M5-V02 (instantané). Source : M1, M5. *Ouverte.*
18. **Défaut de présence** — M2-V06 (`carry` pour `appear` et `disappear`) ↔ M5-V02 (`restart`) et M1-V03 (`disappear` en `restart` saute). Source : M1, M2, M3, M4, M5. *Couverte par G11 (M2-V06 et M1-V03 absorbés) ; défaut à arbitrer.*
19. **Défaut de `loop`** — M3-V04 (`restart`, réduit figé) ↔ M5-V02 (sans reprise, réduit en pause contrôlable). Source : M1, M3, M4. *Ouverte.*
20. **Défaut de `loop` et `scrub`** — M1-V03 (`loop` en `restart`, `scrub` en `carry`) ↔ M5-V02. Source : M5. *Couverte par G11 (M1-V03 absorbé).*
21. **Réduction de `loop`** — M3-V04 (réduit figé) ↔ M1-V04 (frame neutre + pause). Source : M4. *Couverte par G11 (M1-V04 absorbé).*
22. **`page`** — M4-V06 et M1-V08 (verbe `page` conservé) ↔ M5-V08 (`page` retiré du vocabulaire). Source : M1, M2, M3, M5. *Couverte par G2 et G4 ; la place de `page` reste à trancher.*
23. **Alias de diagnostic** — M4-V09 (`udx-reveal-fade-up`, nom porteur de direction) ↔ M5-V10 (alias `fade-up` vers `slide` avec `direction`). Source : M3. *Ouverte.*
24. **Presets : préfixe et direction** — M4-V09 ↔ M3-V10 (aucun nom directionnel, préfixe `udx-` à arbitrer). Source : M1, M2, M3, M4. *Couverte par G9 (M3-V10 et M4-V09 absorbés) ; préfixe `udx-` à trancher (M4).*
25. **Presets : direction dans le nom** — M4-V09 ↔ M5-V05 (presets nommés par effet). Source : M1, M2, M5. *Couverte par G9 (M4-V09 absorbé).*
26. **Presets : `up`/`down`** — M4-V09 ↔ M5-V06 (`down` interdit comme nom ; `up`/`down` valeurs seulement). Source : M3, M5. *Couverte par G9 (M4-V09 absorbé).*
27. **Presets : sens du mouvement** — M2-V08 (`rise`, `drop`, `sink`, `lift`) ↔ M5-V05 (direction en option, jamais dans le nom). Source : M1, M4, M5. *Couverte par G9 (M2-V08 absorbé).*
28. **Presets : `rise`** — M2-V08 ↔ M3-V10 (aucune direction dans le nom). Source : M1, M3. *Couverte par G9 ; M3 ne retient pas M2-V08.*
29. **`pulse`** — M5-V05 (`pulse` en `emphasize`) ↔ M3-V10 (`pulse` en boucle). Source : M3. *Couverte par G9 (M3-V10 absorbé) ; l'emploi de `pulse` reste à trancher.*
30. **Noms cœur de Tailwind** — M3-V10 (`pulse`, `blink`) ↔ M5-V07 (`--animate-*` non écrasés). Source : M4. *Couverte par G9 (M3-V10 absorbé).*
31. **Seuils** — M1-V09 (`touch|quarter|most`) ↔ M3-V05 (`touch|quarter|half|full`). Source : M3, M5. *Couverte par G10 ; valeurs de seuil à arbitrer.*
32. **Tokens de cascade** — M2-V04 (`fast|normal|slow`) ↔ M3-V08 (`tight…wide`). Source : M1. *Couverte par G5 ; tokens à arbitrer (M1, M4).*
33. **Durée : `ease` / `easing`** — M4-V07 (exclut `ease`) ↔ M1-V05 et M1-V09 (utilisent `ease`). Source : M3. *Couverte par G10 (M4-V07 absorbé) ; nom à trancher.*
34. **Verbe dans `data-motion`** — M3-V07 (`data-motion="reveal"` nomme le verbe) ↔ M5-V04 (verbe jamais écrit en HTML). Source : M1, M3, M4, M5. *Couverte par G6 (M3-V07 absorbé) ; à trancher (M3, M4, M5).*
35. **Verbe dans `data-motion`** — M1-V10 (exemple `data-motion="reveal"`) ↔ M5-V04. Source : M4. *Couverte par G6 (M1-V10 absorbé).*
36. **Options en attributs** — M2-V09 (`data-motion-shared`, valeur libre) ↔ M5-V04 et M5-V03 (options tokenisées en `data-motion-*`). Source : M1, M4. M2-V09 n'est pas retenu comme fusion (1 voix). *Ouverte.*
37. **`reorder`** — M2-V05 (primitive `reorder`) ↔ M5-V08 (verbe ou primitive « à trancher »). Source : M5. *Couverte par G4 (M5-V08 absorbé) ; verbe ou primitive à trancher.*
