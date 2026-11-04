# M4 — Choix : usage interne, texte, SSR, valeurs réactives, gestes, SVG (R14)

Expert M4 (frameworks, îles, SSR). Faits vérifiés dans le dépôt : anime.js 4.5.0 (`splitText` avec `accessible`, `morphTo`), Angular 21.2.18, React 19.1, Svelte 5.57. Les autres faits sont marqués « (à vérifier) ». Non couverts par M4 : Q10 (outillage IA) ; Q8 seulement via M4-R02.

### M4-R01 — Usage interne : composants sur la surface publique, sans chemin privé
- Énoncé : chaque composant Udixio (FAB, tabs, snackbar, text-field, switch, carousel, side-sheet, progress) appelle `motion(el, spec)` avec une définition nommée livrée par Udixio et exportée (`@udixio/motion/presets`) ; aucun import `internal`, aucune option cachée ; un lint interdit tout chemin hors `exports`.
- Questions : Q7 ; Familles : F22, F3, F7, F12
- Nature : instance
- Avantages : les composants sont le premier utilisateur de la surface ; les tests moquent la frontière `motion()` (données de spec) au lieu de `animejs` ou `motion` (20 specs concernées selon E1) ; la doc montre le même code que l'utilisateur.
- Limites : chaque `udx-*` devient une API publique à maintenir ; 19 fichiers runtime à migrer par famille ; un besoin propre à un seul composant force parfois une option publique.
- Conflits : aucun connu
- Cohérence : mêmes presets et même surface que l'utilisateur (§8.0 bis #3, §8.1 #3) ; nouveauté : aucune, c'est C11 (« jamais de logique internal-only ») appliqué aux adaptateurs.

### M4-R02 — Prop `motion` unique, durées en tokens, fin du type `Transition`
- Énoncé : les `transition: Transition` des 5 interfaces core, `transitionDuration` (secondes), `Chip.transition` et `transition` de NavigationRail / NavigationRailItem deviennent une seule prop `motion` : un nom de spec (`'udx-snackbar-enter'`) ou un objet `{ duration?, easing?, interrupt? }` dont les valeurs sont des tokens (`'short2'`, `'spring-expressive'`) ; les nombres ne vivent que dans `defineMotion`.
- Questions : Q7, Q8 ; Familles : F1, F2, F7, F13
- Nature : instance
- Avantages : une prop, une unité ; parité React / Angular / Svelte (la prop nav rail n'existe qu'en React) ; supprime la dépendance dure à `motion` dans les `.d.ts` de core.
- Limites : rupture de toutes les liaisons (Ng `shapeTransition` devient `motion`) ; `apps/doc` n'est pas typée : balayage grep obligatoire (mémoire doc-examples) ; pas d'alias `transition` (rétro-compat exclue).
- Conflits : aucun connu ; complète §8.0 bis #4 (reprise) et M5-V02 (défauts par verbe)
- Cohérence : clés identiques aux attributs `data-motion-duration`, `data-motion-easing`, `data-motion-interrupt` ; nouveauté : `motion` au lieu de `transition`, pour éviter la collision avec la propriété CSS.

### M4-R03 — Texte : lettres et mots rendus par le framework, lignes en attributs
- Énoncé : `data-motion-split="chars|words|lines"` ; en HTML le build pré-découpe, en JSX / template Angular / markup Svelte le composant rend les spans, donc le SSR les voit ; les lignes ne sont qu'un attribut `data-motion-line` posé après mesure (polices chargées via `document.fonts.ready`, re-mesure au ResizeObserver) ; accessibilité : copie `sr-only` du texte complet, morceaux en `aria-hidden`.
- Questions : Q3 ; Familles : F16, F10
- Nature : instance
- Avantages : SSR et sans JS montrent le texte entier ; React garde le contrôle de ses enfants ; aucun nœud intrus pour les lignes, contrairement à `splitText` d'anime.js qui insère une copie et des wrappers de lignes (vérifié dans `dist/modules/text/split.js`).
- Limites : la copie `sr-only` double le texte dans le DOM ; les lignes changent avec la police et la largeur, donc reflow à re-mesurer ; un découpage en lettres multiplie les nœuds sur les longs textes.
- Conflits : aucun connu
- Cohérence : même `data-motion` + `data-motion-<option>` ; nouveauté : `data-motion-split`, justifiée car le découpage est une structure et non un réglage (à valider).

### M4-R04 — Brouillage : texte écrit hors rendu, jamais annoncé image par image
- Énoncé : les caractères intermédiaires du brouillage sont écrits dans `textContent` par le runtime, dans la phase écriture de la frame unique (M1-04), jamais par un état React, un signal ou un store ; le conteneur garde une largeur figée (`min-width` en `ch`) ; intermédiaires en `aria-hidden`, texte final dans la copie `sr-only` de M4-R03, aucune région `aria-live`.
- Questions : Q3 ; Familles : F16, F20
- Nature : instance
- Avantages : zéro re-rendu pendant l'animation ; un lecteur d'écran ne lit pas vingt états par seconde ; le texte final est posé à `finished` et s'affiche d'emblée en rendu réduit (F20).
- Limites : `textContent` efface une sélection en cours ; une traduction automatique peut être perturbée pendant le brouillage ; aucun composant actuel ne respecte déjà `prefers-reduced-motion` sur ce point.
- Conflits : aucun connu ; dépend de M4-R03 (copie `sr-only`)
- Cohérence : règle « réduit = état final » reprise de F20 et de `reducedMotion` ; nouveauté : écriture hors rendu, justifiée par le coût d'un changement de framework à 60 Hz.

### M4-R05 — Valeurs réactives : canal CSS pour le continu, store pour le discret
- Énoncé : une `defineValue` continue (curseur, parallaxe, progression) est écrite par le runtime en variable `--udx-<nom>` sur la racine de portée, dans la phase écriture, et lue par `style` ou par classes arbitraires ; une valeur discrète (seuil, état) passe par un store : `useSyncExternalStore` (React), signal mis à jour au plus une fois par quantum (Angular), `$state` dans un `.svelte.ts` (Svelte), rien en HTML pur.
- Questions : Q5 ; Familles : F14, F15, F5
- Nature : les deux (variable par instance, store global)
- Avantages : le continu ne déclenche aucun rendu de framework ; même nom de valeur dans les cinq formes ; la parallaxe peut être purement CSS, sans JS.
- Limites : une variable posée sur la racine invalide le style de tous les descendants (portée la plus petite possible) ; `useSyncExternalStore` exige un snapshot stable, donc quantification obligatoire ; une lecture JS donne la dernière frame, pas l'instant du rendu.
- Conflits : aucun connu ; lié à M4-R06 pour le discret
- Cohérence : `defineValue` (§8.0 bis #5) partout ; nouveauté : deux canaux, justifiés par le coût de rendu d'un framework.

### M4-R06 — Compteurs : valeur finale rendue par le serveur, animée après hydratation
- Énoncé : `<data value="1234">1 234</data>` (ou `defineValue('stat', { to: 1234, format: 'fr-FR' })`) : le serveur rend la valeur finale formatée ; le runtime n'anime qu'après hydratation, si le compteur est visible (`reveal`), depuis `from` ; React ne l'écrit qu'après `useEffect`, pour que l'hydratation ne diverge pas ; locale explicite des deux côtés.
- Questions : Q5 ; Familles : F15, F4, F20
- Nature : instance
- Avantages : crawlers, sans JS, impression et lecteurs d'écran lisent le bon chiffre ; `<data>` porte la valeur machine à la fin ; `Intl.NumberFormat` donne le même texte au serveur et au client.
- Limites : un compteur qui démarre à 0 avant hydratation saute (évité au serveur) ; une locale différente entre serveur et client casse l'hydratation ; le compteur animé ne doit pas être en `aria-live`.
- Conflits : aucun connu ; dépend de M4-R05
- Cohérence : même `reveal` et même rendu réduit (valeur finale) que F4 et F20 ; nouveauté : `<data>` comme source SSR, justifiée par sa sémantique de valeur machine.

### M4-R07 — Chorégraphie : rang d'enfant lu dans le DOM au moment de jouer
- Énoncé : une séquence est une définition TS nommée (`defineSequence('menu-open', [...])`, étapes relatives `after` / `with`), jouée par un handle unique ; le délai de chaque enfant vient de son rang parmi les frères dans le DOM (`data-motion-stagger` sur le parent), jamais de l'index passé par le framework.
- Questions : Q1 ; Familles : F11, F10, F12
- Nature : les deux (rang lu dans le DOM global, séquence par instance)
- Avantages : même ordre en React (Suspense, réordonnancement), Angular (`@for` avec `track`), Svelte (`{#each}` keyé) et HTML ; un enfant rendu dans une autre île reste ordonné.
- Limites : le rang DOM diverge du rang visuel (`order`, `row-reverse`) et de l'ordre de lecture (a11y) ; enfant ajouté pendant la séquence : règle à fixer ; parent dans un portail : rang à vérifier (à vérifier).
- Conflits : aucun connu ; complète M5-L07 (sortie en cascade)
- Cohérence : même `data-motion-stagger` que la sortie et même handle (§8.0 #4) ; nouveauté : rang DOM comme source, justifiée par la divergence des ordres de montage entre frameworks.

### M4-R08 — Gestes : source de valeur, relâchement en `carry`, alternative sans glisser
- Énoncé : un geste est une `defineValue` de source `pointer`, et non un verbe : `pointerdown` + `setPointerCapture`, vitesse sur les ~100 dernières ms ; au relâchement un ressort reprend cette vitesse (`interrupt="carry"`, `velocity.source: exact`) ; `touch-action` imposé par le geste (`pan-y` pour un swipe horizontal) ; `data-motion-gesture="reorder"` exige des boutons monter / descendre, sinon erreur de build (WCAG 2.5.7 : alternative sans glisser ; 2.1.1 : clavier, géré par le composant).
- Questions : Q2 ; Familles : F18, F13, F7
- Nature : instance
- Avantages : aucun re-rendu pendant le glissement ; vitesse exacte au relâchement (JS, pas WAAPI) ; l'alternative au pointeur est vérifiée au build.
- Limites : une vitesse sur 100 ms est bruitée (à mesurer à 120 Hz) ; `touch-action` est un choix d'auteur ; le runtime ne gère pas les flèches du clavier.
- Conflits : aucun connu ; utilise §8.0 bis #4 (`carry`)
- Cohérence : aucun verbe ajouté (le geste alimente `layout` ou `scrub`), même `carry` par défaut ; nouveauté : `data-motion-gesture`, justifiée car un glissement n'est pas une animation.

### M4-R09 — SVG : natif d'abord, le runtime possède `d` et `stroke-dashoffset`
- Énoncé : tracé = `pathLength="1"` (attribut SVG standard, rendu par le serveur) + `stroke-dasharray: 1` animé en CSS ; trajectoire = `offset-path` CSS ; morphing (`d`) = `morphTo` d'anime.js (présent en 4.5.0) ; une fois monté, le runtime possède `d` et `stroke-dashoffset` : le framework ne les rend plus à chaque cycle.
- Questions : Q4 ; Familles : F17, F2
- Nature : instance
- Avantages : tracé sans JS et sans saut au SSR ; seul le morphing charge anime.js ; corrige E1 : `pathLength` n'est pas propre à Motion, c'est un attribut SVG standard.
- Limites : `stroke-dashoffset` n'est pas compositable (thread principal) ; un `d` rendu par React ou Svelte écrase le morphing au rendu suivant (à vérifier) ; `morphTo` exige des chemins au même nombre de points.
- Conflits : aucun connu
- Cohérence : mêmes verbes (`appear`, `emphasize`) sans option nouvelle ; nouveauté : règle de propriété possédée par le runtime, justifiée par M4-R05.

### M4-R10 — Import sans effet de bord, portée idempotente, StrictMode
- Énoncé : importer `@udixio/motion` ne touche ni `window`, ni `document`, ni `matchMedia` (Astro, Angular SSR, SvelteKit) ; anime.js est chargé par `import()` verbe par verbe, seulement si un provider JS est requis ; `motion(el, spec)` est idempotent par élément (WeakMap du runtime global) et son cleanup est renvoyé par `useEffect` (React, StrictMode monte deux fois), `DestroyRef` (Angular), le retour de `{@attach}` (Svelte).
- Questions : Q9, Q6 ; Familles : F21, F19
- Nature : les deux (chargement global, portée par instance)
- Avantages : une île `client:visible` n'embarque anime.js qu'à son hydratation ; StrictMode ne double pas l'animation ; une portée se nettoie d'un bloc (F19).
- Limites : l'`import()` retarde le premier frame (précharger à `pointerenter` ou `client:idle`, à mesurer) ; une `key` React qui change crée une nouvelle portée ; le bundle de core inline anime.js (E1), il faut l'externaliser.
- Conflits : aucun connu ; complète M5-S07 et le runtime global (§8.0 #1)
- Cohérence : même `motion()` et même cleanup dans les cinq formes ; nouveauté : aucune option, règle de chargement et de nettoyage.
