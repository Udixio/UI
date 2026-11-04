# P2, tour 1 : position « formes idiomatiques par framework »

## 1. Thèse

L'API publique est celle de chaque framework, adossée à un seul modèle : des **motions nommées**, définies une fois en TypeScript (`defineMotions`), typées, et référencées par nom. Le core ne connaît aucune syntaxe ; chaque adaptateur traduit le cycle de vie de son framework vers le core, et rien d'autre. Tailwind reste prérequis, mais dans son rôle naturel : tokens, variantes d'état et responsive pour le CSS natif, et classes générées depuis les mêmes définitions. Il n'est pas le véhicule du motion riche.

Règle de partage, en une phrase : une famille va dans le **core** si elle est agnostique (séquence, spring, mathématiques de layout) ; dans l'**adaptateur** si le framework possède le cycle de vie qui la porte (montage, démontage, ref, attachement) ; et on **ne réimplémente jamais une primitive native** qui existe (`animate.leave`, `transition:`, `animate:flip`, View Transitions).

## 2. Chaque grande catégorie, par framework

**A. Tokens, transitions d'état, responsive simple.** Tailwind suffit : `duration-*`, `ease-*`, `hover:`, `data-[state=open]:`, `md:`. Aucun adaptateur n'est nécessaire ici ; c'est le cas où la classe est juste et où le typage apporte peu.

**B. Présence (entrée/sortie).**
- React : `<Motion.div presence="card-reveal">` ou `<Presence>`. React n'a pas de sortie native : le wrapper doit posséder l'enfant et retarder son démontage. C'est le seul endroit où l'on réimplémente quelque chose.
- Angular : `animate.enter` / `animate.leave` sont natifs. `udxMotion="card-reveal"` se résout en classes passées à `animate.leave`, ou en fonction JS si la motion l'exige (forme exacte à confirmer dans la doc Angular avant implémentation).
- Svelte : `{#if}` + `out:`. Une motion nommée est un simple pont : `out:motion('card-reveal')` vers une fonction de transition qui renvoie `css` ou `tick`.
- HTML/Astro : pas de démontage. Présence = attribut `data-state` + transition CSS (`display` transitionné via `@starting-style` et `transition-behavior: allow-discrete`). Limite assumée.

**C. Déclenchement à la vue et scroll.**
- Natif d'abord : `animation-timeline: view()` pour le scroll-driven, `@starting-style` pour l'entrée. Zéro JS quand le navigateur le supporte.
- Quand un état JS est nécessaire (« une fois, à l'entrée ») : React `<Motion.section inView="card-reveal">` (hook IntersectionObserver), Angular `udxInView`, Svelte `{@attach inview('card-reveal')}`, HTML un script unique par page sur `[data-udx-motion]`.
- Piège connu : une entrée qui pousse l'élément hors du viewport peut empêcher son propre déclenchement. La spec porte donc `observe: 'self' | 'parent'` ; le choix est explicite, pas caché.

**D. Layout, élément partagé, View Transitions.**
- Svelte : `animate:flip` est le FLIP natif sur `{#each}` keyé ; le core n'intervient pas.
- React : `layoutId="…"` (prop idiomatique), piloté par le contrôleur layout du core (anime.js layout, chargé à la demande).
- Angular : directive `udxLayout` avec clé ; même contrôleur, Angular n'ayant pas de FLIP natif.
- Partage entre composants : `view-transition-name`, exposé en classe arbitraire Tailwind (`[view-transition-name:hero]`). Le routeur natif gère le reste : `withViewTransitions()` (Angular), `onNavigate` (SvelteKit), `<ClientRouter />` avec `transition:name` (Astro). La lib ne les enveloppe pas.

**E. Listes et stagger.** L'index appartient à la boucle du framework, pas à la classe : une classe ne sait pas qu'elle est le 7e élément. React lit `i` dans `.map`, Angular `@for` fournit `$index`, Svelte `{#each items as x, i}`. Chacun passe `--udx-i`, et le core calcule le délai en CSS. Tailwind ne peut porter ça qu'avec une classe par item, c'est-à-dire exactement la verbosité que l'utilisateur redoute.

**F. Séquences, contrôle, valeurs réactives.**
- Les séquences sont des données pures : `defineMotions({ 'hero-intro': timeline([...]) })`, identiques dans les quatre cibles.
- Le contrôle (play, pause, seek) passe par la voie native du framework : ref React, `viewChild` ou injection Angular, `attach` qui retourne un contrôleur en `$state` Svelte, `motion.get(el)` en HTML.
- Les valeurs réactives (curseur, parallaxe) : le core n'expose que `subscribe()` ; chaque adaptateur l'enveloppe dans son réactif (hook, signal, rune). C'est là que chaque framework apporte le plus.

**G. Compteurs, texte, SVG, gestes.** Composants ou directives dédiés (`<Counter to={1200} />`, `udxCount`, `{@attach countUp(1200)}`) qui délèguent au même noyau.

## 3. Stratégie de chargement

L'unité de chargement est la **motion nommée**, ni le composant, ni la classe. C'est la réponse à « un `motion.section` ne charge que sa propre logique » : il ne charge que les familles de *ses* motions.

Un plugin de build (Vite pour React, Svelte et Astro ; le builder d'Angular) lit les `defineMotions` et classe chaque motion :
1. familles natives seules : keyframes et classe `udx-card-reveal` générées, zéro JS ;
2. familles JS : chunk `motion-anime-<hash>` importé dynamiquement au premier déclenchement (in-view, interaction), jamais au montage ;
3. l'adaptateur ne fournit que le pont : un `import()` dans l'attachement, la directive ou le hook.

Un `motion.section` avec une motion CSS ne charge aucun JS. Un `layoutId` ne charge le contrôleur layout que dans les composants qui l'utilisent. En Astro, chaque île importe le même chunk, et le navigateur le déduplique. Pour un seul observateur par page malgré des îles sans contexte, le registre est un singleton `globalThis[Symbol.for('udx.motion')]`.

## 4. Faiblesses reconnues et correctifs

1. **Îles Astro sans contexte.** Pas de Provider partagé. Correctif : le contrat entre îles et page est l'attribut `data-udx-motion` et le registre global ci-dessus, pas un contexte.
2. **HTML pur, stringly typed.** Une faute de frappe dans `data-udx-motion` n'apparaît qu'à l'exécution. Correctif : le build valide chaque nom contre le registre et échoue ; types générés pour l'autocomplétion.
3. **Variantes Tailwind sur du JS.** `hover:` ne peut pas piloter un spring. Correctif : Tailwind choisit le *nom* actif (via `data-state` ou une variable CSS), et le core observe par `MutationObserver`. Coût assumé : un observateur par motion conditionnelle. Le responsive JS passe par `matchMedia`, pas par CSS.
4. **Divergence entre frameworks.** Trois surfaces d'API. Correctif : une matrice famille × framework tenue à jour, et une suite de conformité qui compare la spec compilée produite par chaque adaptateur pour les mêmes motions nommées. On teste la spec, pas le DOM.
5. **Triple maintenance.** Correctif : une règle de taille (un adaptateur ne contient que la colle de cycle de vie, quelques dizaines de lignes par primitive) et la délégation aux primitives natives, qui réduit le nombre de familles réellement à maintenir par adaptateur (Angular et Svelte en délèguent plusieurs).
6. **Verbosité des définitions TS.** Une motion riche reste plus longue qu'une ligne de classe. Correctif : presets typés (`reveal`, `fade`, `slide`) qui se développent en `MotionSpec` ; on accepte un coût d'écriture pour gagner le typage et les erreurs visibles.

## 5. Mes questions

**À P1 (avocat des classes Tailwind)**
1. Écris la classe Tailwind exacte qui porte un stagger sur 12 items et un `layoutId` entre deux composants. Comment l'index `i` et l'identité de l'élément arrivent-ils dans la classe ?
2. Tailwind ne génère que les classes littérales présentes dans les sources. Si `motion-${name}` est construit dynamiquement, qui crée la classe, et qui décide du chargement du chunk JS sans scanner le runtime ?
3. Un `md:` ou `data-[state=open]:` doit déclencher une animation JS (spring, FLIP). Quelle est la source de vérité, le CSS ou l'état ? Décris le chemin de données complet et son coût runtime.

**À P3 (architecte-arbitre)**
1. Quand une primitive native existe (`animate.leave`, `transition:`, `animate:flip`, `ClientRouter`), l'adaptateur la délègue-t-il ou l'enveloppe-t-il pour la parité ? Propose la règle unique qui tranche tous les cas.
2. Le chargement exige-t-il une analyse statique des `defineMotions` au build, ou accepte-t-on un chargement purement runtime ? Quel est le coût de maintenance du plugin pour trois outils de build différents ?
3. Si Svelte couvre la présence en natif et React non, la prop `presence` doit-elle exister partout (implémentée en React) ou la divergence est-elle documentée ? Où fixes-tu la limite de divergence acceptable ?
