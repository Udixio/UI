# P2, tour 3 : réponse au consensus P3

## Verdict

**Amendement.** J'accepte le consensus sur T8 (a), sur le plugin optionnel (b), sur R1, R3, R4, R6, R8, R10, et sur les lignes T2, T4, T5, T6 et T8 du tableau. Je demande sept amendements. Le premier corrige une erreur factuelle du tableau, T1 « once ».

## Amendements

1. **T1 « once » ne peut pas être natif `view()`.** Le tableau donne `motion-card-reveal-once` en `view()` natif. `animation-timeline: view()` est lié à la position de défilement : il est réversible (scrub). Un reveal une fois exige un état JS, posé par IntersectionObserver sur un attribut d'état (`data-state`), puis une transition CSS. Correction : `card-reveal-once` = IO partagé + attribut d'état ; `card-reveal-scrub` = `view()` natif, zéro JS. Deux noms distincts, comme acté.

2. **R5 : les attributs entrent dans l'interdiction.** R2 liste `data-udx-motion` comme encodage, et R5 n'interdit que la classe. Pour une spec à cycle (R3 vrai), ni classe ni attribut ne sont admissibles. En HTML, l'écriture passe par l'appel d'API du core (`exit(el)`, `layout(el)`, `drag(el, name)`, déjà présents dans le tableau). `data-udx-motion` n'est admissible que lorsque R3 est faux.

3. **R7 : pas de chunk JS pour une spec purement native.** Un chunk par nom s'applique aux noms qui ont une part JS (moteur). Un nom natif pur (scrub, bascule d'état) n'émet que du CSS. Sans cette précision, `card-reveal-scrub` charge un module vide, ce que C5 interdit.

4. **Complétude du registre sans plugin.** Le registre écrit à la main (§3b.2) doit être typé `satisfies Record<MotionName, Loader>`. TypeScript signale alors tout nom ajouté à l'union sans loader : la dérive est attrapée par `tsc`, pas par un plugin. À inscrire dans la suite de conformité.

5. **T3 React : mécanisme non spécifié.** `<Motion.ul layout>` doit mesurer avant le réordonnancement, et React n'a pas de point pré-mutation hors `getSnapshotBeforeUpdate` (classe). Deux options à écrire dans le tableau : (i) rect mémorisé au commit précédent, invalidé au resize et au scroll ; (ii) capture dans le setter quand le réordonnancement vient d'un événement utilisateur. Une liste réordonnée à partir de données distantes (aucun événement) ne relève que de (i), avec sa limite documentée. T3 React reste ouvert tant que le choix n'est pas acté ; c'est le même point que W7.

6. **R9 : un observateur par type de variante.** Un changement `md:` ne modifie aucun attribut : le `MutationObserver` ne le voit pas, seul `matchMedia` le signale. `data-[state=…]:` modifie un attribut : `MutationObserver`. `hover:` passe par `pointerenter` / `pointerleave`, mais `pointerenter` se déclenche au toucher, alors que `:hover` reste souvent collé sur tactile. Cette divergence est à documenter, ou bien à ne pas promettre pour `hover:` sur moteur JS tactile. R9 doit désigner l'observateur par type de variante, pas « par élément ».

7. **CSS sans plugin : deux options à mesurer.** Option (i) : un fichier unique listant tous les noms du registre, borné mais chargé sur toutes les pages. Option (ii) : un script CLI (pas un plugin de bundler) qui scanne les sources pour les noms littéraux du registre et n'émet que ceux-là ; C6 est mieux servi, au prix d'un scan textuel. Je propose de mesurer les deux sur un jeu réel avant de trancher. (ii) reste facultatif, (i) est le repli.

## Accords restants

- **T4** : DOM (`data-udx-shared`, `view-transition-name`), sans global. Accord.
- **T5, T6** : accord. T6 est `continuousInput`, donc encodage framework obligatoire, et `drag(el, name)` en HTML.
- **T8 (a) et (b)** : accord, avec les conditions 1 à 4 du consensus. Amendement 4 ajouté au point 2 de (b).
- **R10** : accord. Test de conformité avec et sans plugin ; différences admises : taille CSS par page, préchargement.

## Points ouverts (mis à jour)

- **`animationcancel`** : le pont sentinelle ne devient plus bloquant. Si `animationcancel` ne se comporte pas comme attendu, on retombe sur `MutationObserver` et `pointerenter`, déjà prévus à R9.
- **W7 et T3 React** : voir amendement 5.
- **Angular, capture avant mutation** : à vérifier, inchangé.
- **Présence dans les îles HTML sans démontage** : limite acceptée, à documenter, inchangée.
- **Lint `.svelte` / `@udixio/motion/svelte`** : inchangé.
