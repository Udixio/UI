# P1 — Tour 1 : API centrée sur les classes Tailwind

## Thèse

Le mouvement est un **style** porté par l'élément. Il s'écrit donc comme les autres styles de l'écosystème : une classe Tailwind, conditionnable par variant (`hover:`, `md:`, `motion-safe:`, `data-[state=closed]:`, `supports-[…]:`). Cette classe n'est pas arbitraire : c'est le **nom** d'une définition TS.

```ts
export const motions = defineMotions({
  'card-reveal': {
    keyframes: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
    duration: 'md', ease: 'emphasized',
    trigger: 'view', observe: 'parent',  // provider JS chargé pour ce nom seulement
    reduced: 'fade',                      // repli typé pour prefers-reduced-motion
  },
  'list-item': { keyframes: { /* … */ }, stagger: 60 },
});
```

```html
<section class="motion-card-reveal">…</section>
<li class="motion-list-item">…</li>
<button class="hover:motion-lift md:motion-none data-[state=closed]:motion-fade-out">…</button>
```

Une seule source, deux sorties : un plugin Tailwind émet le CSS (keyframes, `animation`, tokens) et un registre typé (`MotionName`) sert au JS. Le framework n'intervient que là où le besoin est réel.

## Comment chaque régime de familles s'exprime

**A. Classe seule, natif pur (zéro JS).** Tokens (thème Tailwind étendu), transitions d'état (`hover:`, `focus-visible:`, `data-[…]:`), présence d'entrée (`@starting-style`), boucles (`infinite`), responsive (`md:`), accessibilité (`motion-safe:` / `motion-reduce:`), dessin SVG (`pathLength="1"` + `stroke-dashoffset`), scroll piloté (`animation-timeline: view()`), stagger (`animation-delay: calc(var(--motion-i) * 60ms)`, index posé par la liste), `view-transition-name` pour les éléments partagés en natif.

**B. Classe + variables CSS écrites par le JS.** Valeurs réactives (curseur, parallaxe : le runtime écrit `--motion-x`, la classe consomme via `calc`), contrôle play/pause (`data-motion-state="paused"` relié à `animation-play-state`).

**C. Classe marqueur + provider JS chargé à la demande.** Déclenchement à la vue (IntersectionObserver), layout/FLIP, drag, ressort (interruption physique), découpe de texte, compteurs, morphing SVG. La classe dit *quoi*, la définition dit *quel provider*.

**D. Définition TS seule, sans classe.** Séquences entre éléments distants, timelines, `seek`, orchestration de `startViewTransition`. Ce sont des objets, pas des classes : c'est la concession principale (voir « Ce que la classe ne couvre pas »).

**E. Transverse.** Accessibilité (variants + runtime qui lit `matchMedia`), perf (`will-change` uniquement dans les définitions, budget vérifié au build), outillage IA (liste des noms générée, donc complétable et vérifiable).

## Stratégie de chargement

Le chargement suit les **noms utilisés**, pas les composants importés. Trois paliers :

1. **CSS.** Tailwind n'émet que les classes trouvées dans les sources. Une page sans `motion-*` ne charge aucun CSS de mouvement ; un `motion-card-reveal` n'ajoute que sa règle.
2. **Runtime partagé minimal** (IntersectionObserver, écriture de variables). Chargé seulement si une famille correspondante apparaît dans le build, grâce à un manifeste produit par le même scanner que Tailwind.
3. **Providers lourds** (layout, ressort, drag, texte, séquences). Un chunk par provider, importé dynamiquement, avec des modules anime.js séparés (`animate`, `layout`). Le repli JS d'une famille native (scroll piloté) est un chunk distinct, chargé seulement si `CSS.supports('animation-timeline: view()')` est faux.

`motion.section` n'existe pas dans ce modèle : le composant porte un nom, et la granularité est le nom, plus fine que le composant. C'est la leçon de Motion (`m` + `LazyMotion`) appliquée : ce qui est chargé dépend de ce qui est nommé, pas de ce qui est importé.

Contrainte d'implémentation : les définitions doivent rester évaluables en Node (config Tailwind), donc sans DOM ni import navigateur à l'évaluation.

## Faiblesses reconnues et correctifs

**W1. Chargement dynamique impossible.** `motion-${x}` est invisible au scanner. Correctif : interdit par lint, les noms sont énumérés (clés de `defineMotions`). Coût réel : il faut un scanner par bundler (Vite, Astro, Angular CLI, SvelteKit). C'est une dépendance d'intégration à payer, pas à nier.

**W2. Typage faible.** Une classe est une chaîne que TS ne voit pas. Correctif : `MotionName` typé depuis les clés ; définitions validées à la compilation (`duration` tokenisé, `keyframes` typés, `observe` en union) ; **erreur, pas silence** : une classe `motion-*` inconnue dans les sources échoue au build, avec le même scanner. Limite : TS ne vérifie pas les chaînes de `class`, seul le scanner le fait.

**W3. Verbosité.** L'usage reste court, mais une définition riche (six keyframes, mouvements corrélés) reste longue. Correctif : `extend` / presets (`'card-reveal': extend('fade-rise', { delay: 120 })`). Tout ce qui dépasse une animation par élément passe en définition D, jamais en classes empilées.

**W4. Présence de sortie.** Un élément retiré du DOM ne peut pas être animé en CSS. Pour les bascules (`data-state`), la classe suffit. Pour le démontage, il faut garder le nœud jusqu'à `animationend`. Correctif : une primitive unique `exitMotion(el)` (promesse), appelée par l'adaptateur au retrait. Une classe ne peut pas le faire : c'est le premier endroit où le framework doit intervenir.

**W5. Impératif.** Seek, reverse, attendre la fin, enchaîner : une classe ne l'exprime pas. Correctif : `motion.play(el, 'card-reveal')` et `motion.of(el)`, typés par les **mêmes** noms. Concession : c'est un second point d'entrée, mais pas un second vocabulaire.

**W6. Conflits de cascade.** Deux classes qui posent `animation` sur un même élément s'écrasent (dernier gagnant). Non détectable statiquement par élément. Correctif : une définition = une `animation` ; la composition se fait en amont (`extend`) ; détection runtime en dev uniquement (lecture de `getComputedStyle().animationName` comparée à l'attendu).

**W7. Layout, View Transitions, layoutId : besoin d'un état « avant ».** Une classe marque l'élément mais ne capture pas sa géométrie avant mutation. Correctif : un hook pré-mutation par framework (une fois, pas par composant) qui appelle `snapshot()`. C'est le second endroit où le framework intervient.

**W8. Sans support natif, la déclaration est jetée.** Une classe `animation-timeline` sur un navigateur ancien ne produit rien, sans erreur. Correctif : variant `supports-[animation-timeline:view()]:` pour la version native, et repli JS conditionné par `CSS.supports` (palier 3).

## Ce que la classe ne couvre pas

Les séquences (D), l'impératif complet (W5) et les deux hooks de framework (W4, W7) sortent du modèle « classe ». Thèse honnête : une seule **grammaire** (noms + définitions), plusieurs points d'entrée, dont un seul est la classe.

## Position sur le sucre framework

Règle proposée : **un sucre framework est une écriture de la même classe ou du même nom, jamais un vocabulaire parallèle.** `udxMotion="card-reveal"` pose la classe ; `<Motion.section animation="card-reveal">` la pose aussi. Le sucre peut apporter le typage des props, le cycle de vie (`exitMotion`, hook pré-mutation) et le SSR. Il ne doit pas apporter une animation différente.

## Questions

- **À P2 (avocat des composants/directives) — Q1.** Pour W4 (démontage) et W7 (pré-mutation), donne le code minimal d'un adaptateur React et d'un adaptateur Angular. Si chacun tient en quelques lignes sans rendu propre, la directive ou le composant n'est que du sucre. Existe-t-il un cas où le minimum exige réellement un composant avec rendu ?
- **À P2 — Q2.** Cite une situation précise où `class="motion-card-reveal"` échoue et `<Motion.section animation="card-reveal">` ou `udxMotion="card-reveal"` réussit, hors typage des props. Pense à l'hydratation Astro (îles isolées), aux slots, au SSR et au changement dynamique de nom.
- **À P3 (architecte-arbitre) — Q3.** Propose un critère testable qui décide si une famille relève des régimes A/B/C ou de D (définition seule). Ma proposition : D si la famille a besoin d'un nœud référencé hors de l'élément porteur, ou d'un état tenu entre deux frames par le code. Acceptes-tu cette frontière, et l'exigence « une seule façon d'écrire » se reformule-t-elle en « un seul vocabulaire, plusieurs points d'entrée » ?
