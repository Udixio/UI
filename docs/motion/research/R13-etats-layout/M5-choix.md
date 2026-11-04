# M5 — Choix de conception : états, layout, partagé, présence, pages (R13)

Spécialité : API, DX, outillage. Environnements : HTML/Astro `data-motion`, React `useMotion`, Angular `udxMotion`, Svelte `{@attach motion()}`, noyau `motion(el, spec)`. Verbes : `appear`, `disappear`, `emphasize`, `reveal`, `scrub`, `loop`, `layout`. Réservés : `enter`, `exit`, `in`, `out`, `transition`, `animate`, `initial`, `old`, `new`, `view-transition-*`, `AnimatePresence`.

### M5-L01 — Layout : état observable et point pré-mutation explicite
- Énoncé : `layout` ne s'applique qu'à un état observable (classe, `data-*`, contenu). Le noyau expose `mutate(el, fn)` comme point pré-mutation ; les adaptateurs reçoivent l'état surveillé en argument. HTML : `<nav data-motion="nav-indicator">` + `data-[open]:justify-end` (Tailwind, état seul) ; React : `useMotion(navIndicator, { state: open })` ; Angular : `<nav udxMotion="nav-indicator" [udxMotionState]="open()">` ; Svelte : `{@attach motion(navIndicator, { state: open })}` ; noyau : `motion(el, navIndicator, { state })`. Définition : `defineMotion('nav-indicator', { verb: 'layout' })`.
- Familles : F7, F8
- Nature : instance
- Avantages : un seul point d'écriture pour les cinq formes ; HTML pur couvert ; le lint sait quel état est mesuré ; l'auteur ne déclare ni mesure ni FLIP
- Limites : React n'a pas de point pré-mutation public (M4 tranche : mesure en rendu, ou ref) ; Angular : point pré-rendu à confirmer ; en HTML, la mutation passe par du JS
- Conflits : M5-S07 (même forme dans cinq environnements), M4-03 (présence), M1-04 (frame unique)
- Cohérence : verbe `layout` (V01), reprise `carry` par défaut (V02), `data-motion` référence seule (V04), états Tailwind seuls (S04). Nouveauté : paramètre `state` et fonction `mutate`, justifiés car ce sont les seuls moyens de donner un point pré-mutation aux cinq formes.

### M5-L02 — Lint : variantes non observables refusées sur `layout`
- Énoncé : un nœud dont la définition porte `layout` et qui utilise `hover:`, `focus:` ou `group-hover:` (ou une transition CSS écrite à la main) est une erreur de build qui cite la forme correcte : `emphasize` pour un état de survol (L03). Sur `layout`, seul un changement d'état écrit compte. Environnements : HTML et composants Udixio par lint de build ; noyau par erreur dev quand la règle est détectable à l'exécution.
- Familles : F2, F7, F22, F23
- Nature : global
- Avantages : l'erreur la plus probable (animer un survol en `layout`) devient visible ; le message renvoie à la recette (L10)
- Limites : le lint ne voit pas les classes construites dynamiquement (déjà M5-S04) ; un `:hover` dans une feuille CSS écrite à la main demande un parseur CSS ; faux positif si le `hover:` ne change pas l'élément mesuré
- Conflits : M5-S04 (classes dynamiques refusées), M5-S10 (garde-fous), M5-V07 (erreur au build)
- Cohérence : garde-fous de M5-S10, format d'erreur de M5-V10. Nouveauté : règle croisée verbe × variante, justifiée par la limite `:hover` de §4.3. Exception déclarée : `emphasize` accepte `hover:`.

### M5-L03 — Changement d'état non géométrique : `emphasize` avec `interrupt="carry"`
- Énoncé : rotation, couleur, échelle ou propriété personnalisée qui change avec l'état : verbe `emphasize`, aucun verbe nouveau. Définition : `defineMotion('chevron', { verb: 'emphasize', spring: 'soft', interrupt: 'carry' })`. HTML : `<svg data-motion="chevron" class="data-[open]:rotate-180">` ; React : `useMotion(chevron, { state: open })` ; Angular : `<svg udxMotion="chevron" [udxMotionState]="open()">` ; Svelte : `{@attach motion(chevron, { state: open })}` ; noyau : `motion(el, chevron, { state })`. L'attribut `data-motion-interrupt` peut réécrire la valeur par élément.
- Familles : F2, F13
- Nature : instance
- Avantages : aucune grammaire nouvelle ; la reprise avec vitesse est un choix écrit, pas un défaut caché ; même forme pour rotation et couleur
- Limites : `carry` force le backend JS sur les propriétés non numériques (M5-S08) ; une couleur n'a pas de vitesse numérique simple ; `emphasize` est `restart` par défaut, donc exception à déclarer
- Conflits : M5-S08 (carry / restart), M5-V02 (défaut d'`emphasize`), M5-S05 (ressort token), M1-01 (bascule JS)
- Cohérence : verbe `emphasize` (V01), option `interrupt` (S08), ressort en token (S05), `data-motion-interrupt` (V04). Exception : `carry` est écrit dans la définition, pas dans le HTML.

### M5-L04 — Panneau monté : le preset `collapse` devient `layout`
- Énoncé : accordéon, disclosure, hauteur `auto` : le panneau reste dans le DOM et sa hauteur est un `layout`. Le preset `collapse` passe de `appear` / `disappear` à `layout`. L'état reste celui du composant (`hidden`, `open` ou `data-state`) ; le preset pose `inert` tant que le panneau est fermé. HTML : `<section data-motion="collapse" data-state="closed">` ; React : `useMotion('collapse', { state: open })` ; Angular : `<section udxMotion="collapse" [udxMotionState]="open()">` ; Svelte : `{@attach motion('collapse', { state: open })}` ; noyau : `motion(el, 'collapse', { state })`.
- Familles : F2, F3, F7
- Nature : instance
- Avantages : un seul preset pour la hauteur `auto` ; pas de sortie `display:none` à transitionner (piège Firefox, R1) ; `interpolate-size` en Chromium, JS ailleurs, sans que l'auteur choisisse
- Limites : `collapse` change de verbe par rapport à M5-V05 (exception à documenter) ; si l'auteur écrit aussi `hidden` et `inert`, deux sources de vérité ; la mesure de hauteur demande le point pré-mutation (L01)
- Conflits : M5-V05 (`collapse` en `appear` / `disappear`), M5-V01 (`layout`), M5-L01 (point pré-mutation), M2-S03 (présence)
- Cohérence : nom de preset (V05), verbe `layout` (V01), reprise `carry` (V02). Nouveauté : déplacement de `collapse` vers `layout`, justifié parce que le panneau n'est jamais retiré du DOM. Exception explicite à V05.

### M5-L05 — Identité partagée : `data-motion-shared` renvoie à un nom déclaré
- Énoncé : `defineShared('nav-pill')` déclare l'identité et produit une clé typée. HTML : `<a data-motion="nav-indicator" data-motion-shared="nav-pill">` (le lint vérifie que le nom est déclaré) ; React : `useMotion(navIndicator, { shared: navPill })` ; Angular : `[udxMotionShared]="navPill"` ; Svelte : `{@attach motion(navIndicator, { shared: navPill })}` ; noyau : `motion(el, navIndicator, { shared: navPill })`. Deux éléments visibles au même nom : erreur dev. Homologue absent : l'élément reste en `appear` (défaut du manifeste).
- Familles : F8, F9
- Nature : les deux (registre global par nom ; usage par instance)
- Avantages : identité typée, sans chaîne libre ; partage entre îles par le registre global (M5-S06), sans contexte ; le lint repère les noms orphelins
- Limites : un nom partagé entre îles dépend de l'ordre de chargement ; `view-transition-name` n'est jamais exposé (préfixe réservé) ; `match-element` ne vaut que same-document
- Conflits : M5-S01 (référence seule), M5-V04 (option en attribut), M5-S06 (registre), M4-02 (idempotence)
- Cohérence : option `data-motion-<option>` (V04), référence seule (S01), défaut de l'homologue absent par `appear` (V02). Nouveauté : `defineShared`, justifiée car une identité libre violerait S01 et ne serait pas vérifiable.

### M5-L06 — Transitions de page : pas de verbe `page`, `shared` et intégration par routeur
- Énoncé : une page n'est pas un élément, donc pas de verbe. Le conteneur de contenu porte `layout` avec `shared` (V08) ; chaque routeur appelle `motion.navigate(update)` du noyau, qui encadre la mise à jour du DOM. Astro : `ClientRouter` branché sur `navigate` ; React, Angular, SvelteKit : adaptateur de navigation de la même forme. La règle `@view-transition` est émise par le plugin Tailwind, jamais écrite par l'auteur.
- Familles : F9, F8
- Nature : global
- Avantages : aucun verbe pour une chose qui n'est pas un élément ; un seul point d'entrée par routeur ; `view-transition-*` n'est jamais écrit par l'auteur
- Limites : le cross-document manque sur iOS 18 et Firefox ESR (R1) ; chaque routeur doit tenir son adaptateur ; sans `shared`, le contenu reçoit le fondu par défaut
- Conflits : M5-V08 (`shared` sur `layout`), M5-V01, M5-S03 (`view-transition-*` réservé), M5-L01 (pré-mutation)
- Cohérence : réserve `view-transition-*` (V07), `layout` + `shared` (V08), défaut `appear` (V02). Nouveauté : `motion.navigate(update)`, justifiée car un routeur doit pouvoir encadrer la mutation, comme en L01.

### M5-L07 — Présence d'un sous-arbre : `disappear` retient la racine
- Énoncé : quand un parent se démonte, seul le nœud retiré le plus haut porte `disappear` ; ses enfants n'ont pas d'attribut et sortent dans l'ordre DOM avec `data-motion-stagger="tight"` sur la racine. HTML : `<ul data-motion-stagger="tight">` avec `data-motion="list-item-out"` seulement sur les items retirés ; React : `const { ref, mounted } = useMotion(card, { present: open })` ; Angular : `animate.leave` quand il suffit, sinon `udxMotion` ; Svelte : `{#if open}<div {@attach motion(card)}>` avec `out:` si suffisant ; noyau : `motion(el, card, { present })`.
- Familles : F3
- Nature : instance
- Avantages : un seul nœud porte la présence ; l'ordre de sortie suit le DOM sans liste de clés ; `stagger` est un token, jamais des millisecondes
- Limites : la sortie inverse n'est pas dans la liste fermée de M5-V03 (option `order` à arbitrer) ; un gros sous-arbre retient beaucoup de nœuds ; un enfant ajouté pendant la sortie n'est pas couvert (à trancher par M4)
- Conflits : M4-03 (la sortie retient le nœud), M5-V03 (`stagger` token), M5-V02 (`disappear` restart, réduit instantané), M2-S03 (présence comme état)
- Cohérence : options fermées (V03), verbe `disappear` (V01), défaut réduit instantané (V02). Nouveauté : règle de portée « racine seule », à écrire dans le manifeste comme les autres défauts ; `order` reste à arbitrer.

### M5-L08 — `data-presence` : attribut écrit par le runtime seulement
- Énoncé : `data-presence="entering | present | leaving"` est posé par le runtime sur tout nœud qui porte `appear` ou `disappear`. L'auteur ne l'écrit jamais (lint). Il se style avec les variantes Tailwind, par exemple `data-[presence=leaving]:opacity-0`. HTML : lu dans le DOM ; React, Angular, Svelte : posé par `useMotion`, la directive ou l'attachment ; noyau : `el.dataset.presence`. En rendu réduit, `leaving` est posé puis le nœud est retiré sans animation.
- Familles : F3, F20, F23
- Nature : instance
- Avantages : l'état de sortie se style en Tailwind sans JS ; `attributeFilter` et `udxMotion.inspect()` le lisent ; trois valeurs fermées à connaître
- Limites : un attribut posé par le runtime et stylé par l'auteur forme un contrat à tester ; `leaving` doit être posé avant la première frame de sortie, donc au point pré-mutation (L01)
- Conflits : M2-S03 (état `data-presence`, à confirmer), M5-V04 (`data-*` = état, pas option), M5-S04 (variantes Tailwind), M5-V07 (`in` et `out` réservés, pas leurs valeurs)
- Cohérence : états via variantes Tailwind (S04), attributs `data-*` lisibles (V04), valeurs fermées (V03). Nouveauté : attribut posé par le runtime, exception à « l'auteur écrit les attributs », justifiée car c'est une sortie et elle est déclarée dans le manifeste.

### M5-L09 — Types et compatibilité verbe × option générés
- Énoncé : le manifeste produit une table verbe × option : `interrupt` vaut pour `emphasize`, `layout` et `reveal` ; `shared` seulement pour `layout` ; `stagger` pour `appear`, `disappear` et `loop`. L'union TS des options est indexée par verbe : `defineMotion('x', { verb: 'loop', interrupt: 'carry' })` est une erreur de type, une erreur de build en HTML, une erreur dev dans le noyau. Les cinq formes lisent la même table.
- Familles : F2, F3, F7, F8, F9, F24
- Nature : global
- Avantages : une mauvaise combinaison est un défaut de type, visible par un agent avant le build ; une seule table pour cinq formes ; la table est testable (couverture de L01 à L08)
- Limites : l'indexation par verbe rend les messages TS plus longs ; une définition construite à l'exécution échappe au typage ; ajouter une option oblige à mettre la table à jour
- Conflits : M5-S10 (types générés), M5-V03 (liste fermée), M5-S07 (même surface)
- Cohérence : une source pour quatre garde-fous (S10), fiche par entrée (V09). Nouveauté : compatibilité verbe × option, justifiée car sans elle `shared` ou `carry` mal placés passent les types.

### M5-L10 — Fiches « cas » dans le manifeste, erreurs qui citent la recette
- Énoncé : chacun des six cas de R13 a une fiche dans `llms.txt` et dans le JSON du manifeste, avec la recette canonique dans les cinq formes. Une erreur de build ou de lint sur un cas cite la fiche et la forme attendue, par exemple « `:hover` sur `layout` : utiliser `emphasize` (fiche état de survol) ». Les alias de diagnostic de V10 (`enter`, `exit`, `animate-layout`) pointent vers le nom canonique.
- Familles : F22, F23
- Nature : global
- Avantages : l'agent reçoit le cas et la forme exacte au moment de l'erreur ; les recettes sont testées comme la doc ; les cinq formes restent alignées
- Limites : une fiche par cas ajoute du contexte à charger pour un agent ; les recettes vieillissent avec les frameworks ; les messages d'erreur doivent rester courts
- Conflits : M5-V09 (fiche par entrée), M5-V10 (alias), M5-S10 (manifeste)
- Cohérence : fiches (V09), alias (V10), manifeste (S10). Nouveauté : fiche « cas », qui n'est pas un verbe mais une recette à vérifier ; justifiée car un cas n'est pas une intention d'élément.
