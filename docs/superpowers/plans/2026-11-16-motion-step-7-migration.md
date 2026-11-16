# @udixio/motion — étape 7 : migration des composants Udixio (F22)

Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§8.6 étape 7 ; Q7 = M4-R01 + M4-R02 ; C7, C15 ;
D2). Inventaire à jour (2026-11-16) : 12 contrôleurs de `@udixio/core/dom` sur `motion` (24 animations), 6 sur
anime.js, 35 points d'API publique de timing, `anim-*` (plugin de 556 lignes, page `/animations`), effets
`ui-react/src/lib/effects/*`, 4 fichiers de la doc sur `motion/react`.
Branche `feat/anime`, pas de push. Vérification groupée à la fin de chaque sous-étape.

## Décisions (Claude, sur délégation)

1. **D2** : suppression immédiate de `anim-*`, du type `Transition` et de la dépendance `motion`, sans alias (C7,
   C15 : pas de coexistence publique). Publier ou non une dernière version dépréciée depuis `main` se décide à
   l'étape 9 avec l'utilisateur.
2. **Primitive publique `animateStyle`** (entrée `@udixio/motion/animate`, à la demande) pour les propriétés hors
   champs visuels (rayon, largeur, hauteur `auto`, `clip-path`, propriétés personnalisées) : WAAPI, timing routé
   comme les verbes (ressort → `linear()`), politique de mouvement et `--udx-motion: none` respectés, départ depuis
   la valeur calculée (`carry`, plus de sauts à l'interruption), `auto` mesuré. Timing : un jeton (`SpringRef`,
   `CurveTiming`) ; en échappatoire documentée, `{ duration (ms), easing (CSS) }` pour les valeurs que M3 fixe
   hors échelle (boucles de progression). Retourne un `MotionHandle`.
3. **`createSpring`** (même entrée) : un nombre lissé par ressort, vitesse conservée au changement de cible
   (carousel). Les composants appellent ces fonctions publiques, comme l'utilisateur (M4-R01).
4. **Pas de bibliothèque pour ce qui n'anime pas** : `press()` de Motion → gestion native pointeur + clavier dans
   core ; `scroll()` de Motion (custom-scroll) → écouteur natif `scroll` limité à une écriture par image.
5. **Prop publique `motion`** (M4-R02, adaptée) : `motion?: { timing?: SpringRef | CurveTiming }` remplace
   `transition`, `transitionDuration` (secondes), `shapeTransition`, `TooltipTransition`, dans core, React,
   Angular et Svelte, avec la même forme partout (parité : la prop de NavigationRail existe dans les trois). La
   forme « nom de définition » de M4-R02 n'est pas retenue : les mouvements des composants animent surtout des
   propriétés hors verbes. Les constantes de timing exportées (`DEFAULT_CAROUSEL_TRANSITION`,
   `DEFAULT_BUTTON_SHAPE_TRANSITION`, `fab-motion`) deviennent des jetons exportés.
6. **Correspondance des timings** : chaque durée actuelle passe au jeton M3 le plus proche (0,3 s → `duration.medium2`,
   0,1 s → `short2`…), chaque ressort Motion au ressort M3 de même rôle (spatial / effets, rapide / défaut) ; le
   calibrage visuel fin est à l'étape 8. Tout écart de durée de plus de 50 ms est noté.
7. **Politique** : tous les contrôleurs migrés lisent la politique du document (`html[data-motion-policy]`) via
   `@udixio/motion`, plus seulement `matchMedia`.
8. **Effets** : `SmoothScroll` (et `lenis`), `RippleEffect`, `scrollDriven` sont supprimés (morts ou inertes) ;
   `AnimateOnScroll` est remplacé par `reveal` (`data-motion`) ; la page `/animations` est réécrite sur
   `@udixio/motion` ou retirée de la navigation ; la doc remplace `motion/react` par `@udixio/motion`.

## Sous-étapes

- **7a** : entrée `@udixio/motion/animate` (`animateStyle`, `createSpring`), specs trois moteurs.
- **7b** : contrôleurs sur `motion` (par lots : state-layer ; tabs ; side-sheet, snackbar, navigation-rail-item ;
  fab-menu, date-picker, slider ; progress, carousel, custom-scroll), leurs specs réécrites sans moquer `motion`.
- **7c** : prop `motion` dans core et les trois adaptateurs, suppression du type `Transition`, balayage de la doc
  (non typée).
- **7d** : retrait de `anim-*`, des effets, de `lenis` et des dépendances `motion` ; doc.
- **7e** : contrôleurs sur anime.js (switch, split-button, fab, search, tooltip, auto-layout / text-field) vers
  `@udixio/motion` ; anime.js ne reste que dans le fournisseur et `morph`.

Garde-fou de régression (mémoire « vérifier avant d'affirmer ») : pour chaque animation migrée, la spec vérifie
les états de départ et d'arrivée calculés, la durée (au jeton près), la continuité à l'interruption et le
mouvement réduit ; le comportement d'avant est relevé dans les notes de tâche (inventaire) pour comparaison.
