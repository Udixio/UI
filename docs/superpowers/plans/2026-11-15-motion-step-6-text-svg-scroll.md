# @udixio/motion — étape 6 : texte, SVG, `scrollTo` (F16, F17, F6)

Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§8.4 lignes F6, F16, F17 ; I27 ; Q3, Q4 ; M3-V03).
Branche `feat/anime`, pas de push. Vérification groupée à la fin de l'étape, pas à chaque modification.

## Décisions (Claude, sur délégation)

1. **Texte découpé = option `split` d'une définition**, pas un verbe : `split: 'chars' | 'words' | 'lines'`,
   pour `appear`, `disappear`, `reveal`. Les morceaux jouent les images clés de la définition en cascade
   (rang = ordre du texte, `origin` appliqué ; `stagger` vaut `tight` par défaut quand `split` est donné).
   Le découpage vit dans l'entrée `@udixio/motion/text`, chargée à la demande par la liaison (comme les gestes) ;
   `splitText(el, { by })` et `getSplit(el)` sont publics (règle : pas de logique interne seulement).
2. **Accessibilité du découpage (I27)** : les nœuds d'origine sont déplacés dans une copie visuellement masquée
   (lue par les lecteurs d'écran, sémantique `em`/`strong`/`abbr` conservée) ; la copie visuelle découpée est
   `aria-hidden="true"`. Un élément qui contient un descendant interactif (`a[href]`, `button`, `input`,
   `select`, `textarea`, `[tabindex]`, `[contenteditable]`) n'est pas découpé : il s'anime en entier
   (avertissement en développement).
3. **Écritures liées** : en `chars`, une écriture à liaisons (arabe, syriaque, N'Ko, mongol, scripts indiens,
   thaï, lao, tibétain, birman, khmer) est découpée en mots, pas en lettres (une lettre isolée perd sa forme).
4. **Lignes** : regroupement des mots par `offsetTop` ; un `ResizeObserver` sur la largeur reconstruit les
   lignes au repos (après la fin d'un mouvement en cours, jamais pendant).
5. **Mouvement réduit, `--udx-motion: none`** : pas de découpage ; l'élément entier suit la règle réduite du verbe.
6. **SVG** : les verbes acceptent `HTMLElement | SVGElement` (type `MotionElement`). Deux champs visuels :
   `draw` (fraction du trait dessinée, 0…1, par `stroke-dasharray`/`stroke-dashoffset` calculés depuis
   `getTotalLength()`) et `along` (fraction du chemin `offset-path` posé par l'auteur, 0…1, par
   `offset-distance`). Natifs (WAAPI), non composités. Au repos à `draw: 1`, les styles en ligne du tracé sont
   retirés.
7. **Morphing** : action `morph(path, to, { timing })` de l'entrée `@udixio/motion/svg`, par `morphTo`
   d'anime.js (rééchantillonnage). `to` : un `SVGPathElement` ou une chaîne `d`. Mouvement réduit : `d` posé
   d'un coup. Retourne un `MotionHandle`.
8. **`scrollTo`** : action de l'entrée `@udixio/motion/scroll` : `scrollTo(target, { container, timing,
   offset, focus })`. Ressort intégré par image (`spring-step`, `spring.slow.spatial` par défaut), destination
   relue à chaque image (suit les décalages de mise en page), `scroll-margin` de la cible et `scroll-padding`
   du conteneur respectés, bornée au défilement maximal. La main de l'utilisateur (`wheel`, `touchstart`,
   `pointerdown`, `keydown`) annule. Mouvement réduit ou `--udx-motion: none` : saut immédiat. `focus: true`
   donne le focus à la cible à l'arrivée (`preventScroll`). Retourne `{ finished, cancel() }`.
9. **Poids** : l'entrée principale (17,94 / 18,1 kB) ne reçoit que le chargeur du texte et la branche `split`
   de la liaison. Un dépassement est rapporté avec la mesure, sans élargir la limite.

## Tâches

1. Entrée `@udixio/motion/text` : `splitText`, `getSplit`, `revert`, lignes au redimensionnement, écritures
   liées, refus des descendants interactifs ; specs navigateur trois moteurs.
2. Option `split` : manifeste (domaine, `splitVerbs`), validation, types, liaison (chargement à la demande,
   cascade des morceaux, mouvement réduit), adaptateurs inchangés ; specs.
3. SVG : `MotionElement`, champs `draw` et `along`, entrée `@udixio/motion/svg` avec `morph` ; specs.
4. Entrée `@udixio/motion/scroll` avec `scrollTo` ; specs.
5. Démo (`/motion/demo`), README, tests de la doc, budgets de taille des nouvelles entrées (mesure + 10 %).
