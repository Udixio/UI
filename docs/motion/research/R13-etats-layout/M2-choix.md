# R13 — Choix de M2 (layout, partagé, présence)

Couverture : Q1 → L01, L02, L10 ; Q2 → L03 ; Q3 → L04 ; Q4 → L05, L06 ; Q5 → L07 ; Q6 → L08, L09, L10.

### M2-L01 — Mesure mémorisée au commit précédent, lecture pré-mutation par environnement
- Énoncé : chaque instance `layout` garde la géométrie lue en fin de cycle (phase lecture, M1-04) ; au changement détecté, « avant » = cette mémoire, relue seulement si invalidée (scroll, resize, ResizeObserver). Lecture réelle avant mutation là où elle existe : React `getSnapshotBeforeUpdate` (nœud classe interne), Svelte `$effect.pre`, Angular `effect()` de composant (à confirmer par spike), HTML pur via `motion.capture(el)` au point de mutation.
- Familles : F7, F8, F10
- Nature : instance
- Avantages : une seule règle de FLIP par environnement ; pas de lecture forcée en HTML pur ; lecture exacte là où le framework la permet
- Limites : mémoire périmée si le mouvement n'est pas observé (défilement d'un parent, transition CSS en cours) ; une lecture de plus par nœud modifié
- Conflits : aucun connu (précise M1-04)
- Cohérence : réutilise `layout` (verbe), `duration` et `easing` ; rien de nouveau dans la grammaire, la mesure est interne au runtime

### M2-L02 — Changements purement CSS : pas de layout implicite, pont par propriété enregistrée
- Énoncé : un `layout` ne se déclenche jamais sur un état purement CSS (`:hover`, media, container query) : erreur de lint au build et erreur dev citant le manifeste. Géométrie au survol : `interpolate-size` natif (Chromium seul) ou bascule d'attribut posée par une variante Tailwind. Pont optionnel, réservé au diagnostic : `@property` enregistrée + `transition-behavior: allow-discrete` (technique R4), sans polling.
- Familles : F2, F7, F19
- Nature : les deux (pont global, décision par instance)
- Avantages : aucun polling ; un agent qui écrit `hover:justify-end` reçoit une erreur claire ; contrat net avec Tailwind
- Limites : le pont est fragile sur les propriétés personnalisées (bugs signalés en R4) ; pas de géométrie au survol hors Chromium sans bascule d'attribut
- Conflits : aucun connu (précise §4.3)
- Cohérence : réutilise la règle « l'état vit dans un attribut, Tailwind pose les variantes » (§8.0 bis) et l'erreur de build du manifeste (M5-S10) ; nouveauté : une erreur de build pour une combinaison verbe/déclencheur, à inscrire au manifeste comme exception justifiée

### M2-L03 — État non géométrique : propriété `@property` animée, reprise `carry`, sans nouveau verbe
- Énoncé : rotation, couleur, échelle ou autre propriété liée à un état passe par `emphasize`, déclenché par changement de `data-state` ou d'attribut `data-motion`. La valeur animée est une propriété enregistrée (`@property --udx-rotate`, `--udx-scale`) : le provider anime la variable (anime.js à ressort, WAAPI sinon) et le rendu reste `transform: rotate(var(--udx-rotate))`, posé par Tailwind. Reprise `carry` par défaut pour ce verbe (§8.0 bis #4).
- Familles : F1, F2, F13, F15
- Nature : instance (la vitesse de reprise est par élément)
- Avantages : aucun nouveau verbe ; le CSS reste seule source de rendu ; avec anime.js, la vitesse de reprise est exacte
- Limites : toute valeur animée doit être déclarée avec `@property`, sinon elle saute sans transition (dégradation silencieuse, R1) ; WAAPI n'expose pas la vitesse (tension §8.0 a)
- Conflits : M2-L02 (un changement purement CSS ne déclenche pas `emphasize`)
- Cohérence : réutilise `emphasize` (§8.1 #2), `carry` / `restart` (§8.0 bis #4), `duration`, `easing`, `data-motion` ; nouveauté : `@property` comme unité d'animation, justifiée par « le moteur ne lit que le style calculé » (§4.2) ; exception : pas de `trigger`, un changement d'état est son propre déclencheur

### M2-L04 — Panneau qui reste monté : pas une présence, `inert` immédiat, hauteur native puis FLIP
- Énoncé : accordéon ou disclosure ne passe pas par la présence (F3), le nœud reste dans le DOM. Fermeture : `inert` et `aria-expanded` posés à l'instant du changement ; hauteur animée par `interpolate-size: allow-keywords` avec `height: auto` (et `::details-content` pour `<details>`, à vérifier par navigateur), sinon `layout` sur la hauteur mesurée. `hidden` (ou `hidden="until-found"` si R1 confirme le support) seulement à `finished`. Verbe : `layout` sur `data-state`.
- Familles : F2, F3, F7
- Nature : instance
- Avantages : contenu présent pour la recherche et les ancres ; accessibilité immédiate ; un seul verbe
- Limites : `interpolate-size` est Chromium seul (environ 17 % de `defaults` sans support) ; `::details-content` et `until-found` à vérifier ; le FLIP de hauteur impose une mesure
- Conflits : M2-L01 (mesure du fallback JS)
- Cohérence : réutilise `layout` et `data-state` (état = attribut), rendu réduit en fondu (§8.1 corrigé) ; nouveauté : `inert` avant la fin de l'animation, exception à la règle « le nœud est retenu jusqu'à `finished` » (§8.0 #2), justifiée car le nœud n'est jamais sorti du DOM

### M2-L05 — Identité partagée : `data-motion-shared` et registre sur `globalThis`
- Énoncé : identité écrite `data-motion="layout"` + `data-motion-shared="<clé>"` (texte, référence seule). Registre dans le runtime global (`Symbol.for('udixio.motion@1')`, §8.0 #1), indexé par clé : React, Svelte et HTML des îles partagent la clé sans contexte. Une clé est active une fois par document ; doublon = erreur dev, dernier monté gagne en production. Homologue absent à la mutation : pas de transition partagée, l'élément suit son verbe par défaut (`appear` ou `disappear`), sans erreur en production.
- Familles : F8, F7, F9
- Nature : les deux (registre global, paires par instance)
- Avantages : aucune dépendance à un framework ; attribut observable et interrogeable par les agents ; fonctionne entre îles
- Limites : une clé orpheline suit sans erreur, à rendre visible par `inspect()` ; deux îles chargées à des moments différents doivent s'accorder sur le registre
- Conflits : aucun connu
- Cohérence : réutilise `data-motion` et `data-motion-<option>`, le verbe `layout` « y compris élément partagé » (§8.1 #2) et `inspect()` (§8.0 bis #2) ; nouveauté : aucune, `data-motion-shared` est une option comme les autres

### M2-L06 — Élément partagé en FLIP JS unique, `match-element` non utilisé
- Énoncé : tout élément partagé est animé par le FLIP du runtime, sur tous les navigateurs, y compris ceux qui offrent `view-transition-name: match-element`. Les View Transitions ne servent qu'à la navigation (L07). Raison : snapshot VT et transform FLIP donnent deux rendus, donc une fidélité cassée (§4.7) ; `match-element` n'est pas Baseline (Chrome 137, Firefox 144, Safari 18.4).
- Familles : F8, F9
- Nature : instance
- Avantages : un seul rendu à tester ; interruptible et reprenable avec vitesse (`carry`) ; pas de nom de transition unique à gérer
- Limites : contredit C3 et l'ordre natif d'abord (§4.5) ; à démontrer par spike et comparaison visuelle ; moins fluide que le snapshot VT sur les grands changements
- Conflits : aucun connu, mais contredit C3 si la démonstration échoue
- Cohérence : réutilise `layout`, `carry` (§8.0 bis #4) ; exception explicite à C3 et §4.5 pour l'élément partagé, à consigner au journal si retenue

### M2-L07 — Transitions de page : View Transitions comme provider de navigation, sans verbe
- Énoncé : une navigation n'est pas un verbe mais une intégration. Même document : `document.startViewTransition` ; entre documents : `@view-transition { navigation: auto }`, émis par le plugin Tailwind (Chrome 126, Safari 18.2, pas Firefox). Éléments nommés par `data-motion-transition="<nom>"`. Intégrations : Astro (`ClientRouter`, API à vérifier en R2), SvelteKit `onNavigate`, Angular `withViewTransitions()`, React Router (prop `viewTransition`, à vérifier selon la version). Sans support : swap instantané ; réduit : pas d'animation.
- Familles : F9, F8, F20
- Nature : global (navigation) et instance (noms)
- Avantages : natif réel, sans JS de navigation ; une surface pour Astro et les routeurs ; pas de fallback fragile
- Limites : pas de cross-document sur Firefox ; une seule transition document-scopée à la fois (la suivante saute la précédente) ; un adaptateur par routeur
- Conflits : M2-L06 (pas de FLIP pour les noms de page)
- Cohérence : réutilise `data-motion-<option>` (même grammaire que `data-motion-shared`) et la règle de rendu réduit (§8.0 bis) ; nouveauté : une intégration sans verbe, justifiée car une navigation n'est pas l'état d'un composant ; à inscrire au manifeste comme exception

### M2-L08 — Sortie de sous-arbre : la présence se gère à la racine démontée
- Énoncé : quand un parent se démonte, seule sa racine est retenue ; les enfants suivent sans sortie programmée séparément. Leur ordre de sortie suit `stagger` (token `tight` / `normal` / `loose`) relatif à la déclaration dans la liste. Adaptateurs : React, un hook `usePresence` sur le nœud racine ; Angular, `animate.leave` sur l'élément racine ; Svelte, `out:` sur le bloc racine.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : un seul point de décision par sous-arbre ; ordre de sortie prévisible ; pas de sorties concurrentes
- Limites : un enfant ajouté pendant la sortie du parent doit avoir une règle (non définie) ; `animate.leave` ne vise que l'élément porteur de la directive
- Conflits : aucun connu (précise M4-03, §8.0 #2)
- Cohérence : réutilise `stagger` en token, `disappear`, la forme de handle `finished` (§8.0 #4) ; exception : la présence est portée par la racine, non par chaque enfant, à justifier par F11

### M2-L09 — `data-presence` comme contrat lisible, rendu réduit sans changer `finished`
- Énoncé : chaque nœud en présence expose `data-presence="entering" | "present" | "exiting"`, écrit par le runtime et jamais par l'auteur ; Tailwind peut le cibler (`data-[presence=exiting]:…`). Sous `prefers-reduced-motion`, la sortie devient un fondu (§8.1 corrigé) ou un retrait immédiat, mais `finished` se résout dans le même tick, pour que le code appelant garde la même forme.
- Familles : F3, F12, F20
- Nature : instance
- Avantages : état visible en CSS et interrogeable par les agents ; même promesse avec ou sans animation ; aucune branche dans le code applicatif
- Limites : attribut produit par le runtime, donc absent en HTML statique sans runtime (à documenter) ; à ne pas écrire à la main
- Conflits : aucun connu
- Cohérence : réutilise la grammaire `data-*` de `data-motion`, « `finished` ne rejette jamais » (§8.0 #4) et le rendu réduit par verbe (§8.1 #5) ; exception : un attribut écrit par le runtime et non par l'auteur, à justifier

### M2-L10 — Sortie en `popLayout` : le nœud sortant quitte le flux, les frères FLIP
- Énoncé : dans une liste, le nœud `exiting` passe en `position` fixée à sa géométrie mesurée avant mutation (L01) ; les frères se réajustent tout de suite en FLIP ; le nœud disparaît à `finished`. Réordonnancement et sortie se mesurent dans la même frame de lecture (M1-04). Même traitement quand un frère change de taille.
- Familles : F7, F10, F3
- Nature : les deux (frame de lecture globale, géométrie retenue par instance)
- Avantages : les frères ne sautent pas pendant la sortie ; pas de trou visible ; même mécanisme que le réordonnancement
- Limites : le nœud sortant peut chevaucher ses voisins ; `position` fixée casse les dimensions en pourcentage et les grilles CSS sur ce nœud ; test visuel nécessaire
- Conflits : aucun connu (distinct de M2-L04 : pas de popLayout sur un panneau monté)
- Cohérence : réutilise `layout`, `disappear`, `stagger` ; nouveauté : option `data-motion-exit="pop"`, à déclarer au manifeste comme option à part entière car elle change la géométrie du flux
