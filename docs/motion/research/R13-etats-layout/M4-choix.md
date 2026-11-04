# M4 — Choix d'état, layout, partagé, présence, pages (intégration frameworks)

Expert M4 (frameworks, îles, SSR). Les faits non vérifiés sont marqués « (à vérifier) ». Les renvois « §8.x » visent le spec.

### M4-L01 — Géométrie mémorisée après chaque commit, lue avant la mutation suivante
- Énoncé : le runtime garde la dernière géométrie stable de chaque élément `data-motion="layout"` (relevée après le commit précédent, tenue à jour par `ResizeObserver` et au défilement) et s'en sert comme « avant » dès qu'un changement observable est détecté. Points de capture : React = cleanup du `useLayoutEffect` du commit précédent ; Svelte = `$effect.pre`, qui tourne avant la mise à jour DOM du composant ; Angular = lecture dans le gestionnaire d'événement avant l'écriture du signal, puis `afterRenderEffect` pour mémoriser « après » ; HTML = lecture dans le gestionnaire d'entrée avant `setAttribute`.
- Familles : F7, F8, F13
- Nature : instance
- Avantages : une seule règle (« avant = dernière géométrie stable ») dans les quatre environnements ; aucune lecture forcée dans le corps du rendu React ; réutilise la mesure par `ResizeObserver` déjà nécessaire aux tailles
- Limites : `getSnapshotBeforeUpdate` n'existe que pour les classes React, donc le cache est une approximation assumée ; un changement CSS (voisin, police, conteneur) qui bouge l'élément sans passer par le runtime rend le cache périmé ; en React concurrent, un commit abandonné peut laisser un cache faux (à tester)
- Conflits : aucun connu
- Cohérence : réutilise `data-motion="layout"` (§8.1 #2) ; nouveauté : cache de géométrie par élément, justifiée par l'absence de point pré-mutation universel dans les frameworks.

### M4-L02 — Détection : seul un changement observable déclenche `layout` ; `:hover` et pseudo-classes restent CSS
- Énoncé : `layout` ne s'exécute que sur un attribut ou une classe observés (React : état rendu ; Angular : binding ; Svelte : état lu ; HTML : `MutationObserver` avec `attributeFilter`, donc après mutation, avec la géométrie de M4-L01). Les changements purement CSS (`:hover`, `:focus-visible`, `:has()`, requêtes de conteneur) ne sont pas du layout : le lint de build signale une utilité géométrique (`justify-*`, `order-*`, tailles) sous un variant de pseudo-classe pour un élément en `layout`, et l'auteur pose alors un `data-*` écrit par `pointerenter` / `focusin`.
- Familles : F2, F7
- Nature : les deux (détection par instance ; règle de lint global)
- Avantages : pas de polling ; le moteur n'invente aucun changement ; l'erreur apparaît au build, conforme à C5
- Limites : `MutationObserver` arrive après la mutation (d'où M4-L01) ; le miroir `pointerenter` ne couvre pas le tactile sans `pointerdown` ; un lint sur classes Tailwind reste heuristique
- Conflits : aucun connu
- Cohérence : reprend la grammaire `data-*` et les garde-fous du manifeste (§8.0 bis #1) ; nouveauté : aucune option, seulement une règle de build.

### M4-L03 — Changement d'état non géométrique : `emphasize` piloté par `trigger="state"`, `easing` = jeton ressort
- Énoncé : rotation, couleur, échelle ou propriété personnalisée qui change avec un état s'écrit `data-motion="emphasize"` avec `data-motion-trigger="state"` ; l'état est un attribut `data-state` ou `data-[open]`, écrit par le framework. Le ressort est un jeton `easing="spring-<nom>"` (springs M3, F1). La reprise est `carry` par défaut (§8.0 bis #4) : si la cible n'est pas compositable ou si WAAPI n'expose pas la vitesse, le JS prend le relais. Les propriétés interpolables passent par `@property`.
- Familles : F1, F2, F13, F14
- Nature : instance
- Avantages : aucun verbe ajouté, les 7 verbes sont conservés ; même grammaire qu'un `hover:` Tailwind ; le ressort reste un jeton, pas une valeur libre
- Limites : une couleur non déclarée en `@property` ne s'interpole pas en CSS ; `carry` force le fallback JS sur ces cas ; le préfixe `spring-` doit être réservé
- Conflits : M4-L02 (la valeur d'état doit être observable)
- Cohérence : réutilise `emphasize`, `trigger`, `easing` et le défaut `carry` (§8.0 bis #4) ; nouveauté : la valeur `trigger="state"`, seule introduite, justifiée car l'état n'est ni la vue ni le montage.

### M4-L04 — Panneau monté : `layout` pour la hauteur, `hidden` et `display` différés par présence
- Énoncé : un accordéon ou une disclosure reste dans le DOM. Son ouverture et sa fermeture sont `data-motion="layout"` avec `data-motion-presence="keep"` (option nouvelle : le nœud ne sort jamais du DOM). Hauteur `auto` : `interpolate-size` ou `calc-size()` là où ils existent (Chromium seul selon R1), sinon mesure JS de `scrollHeight` avant ouverture. À la fermeture, `inert` et `aria-hidden` sont posés tout de suite ; `hidden` n'est appliqué qu'à `finished` (§8.0 #2). `<details>` natif reste le premier choix quand le markup le permet.
- Familles : F2, F3, F7
- Nature : instance
- Avantages : une seule règle pour accordéon et disclosure ; l'accessibilité suit la fermeture immédiatement ; aucun `display:none` pendant l'animation
- Limites : `hidden="until-found"` et `::details-content` ne sont pas couverts par R1 (à vérifier) ; la mesure JS de hauteur se refait à chaque ouverture ; une longue liste d'accordéons doit être mesurée par lot
- Conflits : aucun connu
- Cohérence : réutilise `layout` et la règle de présence (§8.0 #2) ; nouveauté : `presence="keep"`, justifiée comme seul cas où le nœud ne sort jamais du DOM.

### M4-L05 — Élément partagé : identité par `data-motion-shared`, unique par document à la capture
- Énoncé : `data-motion="layout"` plus `data-motion-shared="<nom>"`. Le nom est une référence, jamais une valeur libre. L'identité s'enregistre dans le registre global (§8.0 #1) à l'attachement et se retire au démontage. Deux éléments de même nom dans une même capture : erreur de dev, transition annulée, aucun choix arbitraire. En même document, le runtime s'appuie sur `view-transition-name: match-element` quand il est disponible, sinon fait la correspondance seul via le registre.
- Familles : F8, F9
- Nature : les deux (registre global ; identité par instance)
- Avantages : même nom écrit en HTML, React, Angular, Svelte et Astro ; une seule règle d'unicité ; compatible avec les noms de vue natifs
- Limites : `match-element` n'est pas dans `defaults` sans exception (R1) ; le registre suppose une copie unique du runtime (§8.0 #1) ; le nom doit rester stable quand le composant est remonté
- Conflits : aucun connu
- Cohérence : réutilise la grammaire `data-motion` + `data-motion-<option>` et le verbe `layout` (§8.1 #2) ; nouveauté : option `shared`, justifiée car `layout` seul ne désigne pas de cible d'identité.

### M4-L06 — Contrepartie absente ou tardive : fenêtre de rétention, puis repli sur `appear` / `disappear`
- Énoncé : un élément partagé qui part sans homologue est retenu dans le registre une frame, ou jusqu'à `astro:page-load` pour les îles `client:load` et `client:idle`, afin qu'un homologue monté plus tard le retrouve. Passé ce délai, le départ est une `disappear` normale et l'arrivée une `appear` au défaut du verbe. Les îles `client:visible` n'ont aucune garantie : leur arrivée joue `appear`.
- Familles : F3, F8, F9, F22
- Nature : global (registre et fenêtre) + instance (départ et arrivée)
- Avantages : pas d'élément fantôme ; comportement prévisible pour les îles hydratées à des moments différents ; le même délai sert à la présence de M4-L09
- Limites : une frame n'est pas une garantie d'hydratation ; `client:visible` reste non couvert ; un départ retenu gonfle le DOM le temps de la fenêtre
- Conflits : M4-L09 (même délai de rétention, à unifier)
- Cohérence : réutilise `appear` / `disappear` et le défaut par verbe (§8.1 #5) ; nouveauté : fenêtre de contrepartie, justifiée par l'hydratation partielle, qu'aucune convention existante ne couvre.

### M4-L07 — Transitions de route : `navigate(run, { direction })` du runtime, branché par routeur
- Énoncé : une transition de page n'a pas de verbe propre : c'est le preset `route` appliqué à la racine de la vue. Le runtime expose `navigate(run, { direction })`, qui appelle `document.startViewTransition` si disponible (sinon exécute `run` sans effet), pose les types via `addTransitionType` quand il existe, et mappe `direction` (`start` / `end`, §8.1). Branchements : React = `startTransition` + `<ViewTransition>` (React 19.3 annoncé stable ; `addTransitionType` à vérifier) et l'option `viewTransition` de `<Link>` de React Router (à vérifier selon la version) ; Angular = `withViewTransitions()` dans `provideRouter` ; SvelteKit = `onNavigate` qui retourne la promesse de `startViewTransition` ; Astro = `<ClientRouter />` (M4-L08).
- Familles : F9, F12, F22
- Nature : global (runtime) + instance (routeur)
- Avantages : une seule API pour quatre intégrations ; `direction` est une option existante ; repli propre sans View Transitions
- Limites : same-document seulement ici (cross-document en M4-L08) ; `run` doit résoudre quand la nouvelle route est montée, sinon la capture est fausse ; les points d'extension varient selon les routeurs (à vérifier)
- Conflits : M4-L08 (même navigation, deux chemins selon la nature du document)
- Cohérence : réutilise `direction`, le handle dont `finished` ne rejette jamais (§8.0 #4) et `appear` / `disappear` ; nouveauté : preset `route` sans verbe nouveau, justifié car la navigation n'est pas un changement d'état de composant.

### M4-L08 — Astro et MPA : `<ClientRouter />` pour le même document, `@view-transition` pour le document multiple
- Énoncé : avec `<ClientRouter />`, le runtime s'abonne à `astro:before-swap` (annule les handles des éléments qui partent, §8.0 #4) et à `astro:after-swap` (réinscrit les identités des îles arrivantes). Sans `ClientRouter` (navigation native), la transition est native : `@view-transition { navigation: auto }` posée par le plugin Tailwind, avec `pageswap` / `pagereveal` pour les noms. Udixio n'écrit que `data-motion-shared` ; `transition:name` d'Astro reste un usage natif documenté comme non portable. `transition:persist` garde une île vivante, son handle compris.
- Familles : F8, F9, F21, F22
- Nature : les deux
- Avantages : deux chemins natifs sans JS là où ils existent (C3) ; `transition:persist` assure la continuité des îles sans contexte partagé (C6)
- Limites : `<ClientRouter />` remplace le routage natif et rejoue les scripts ; cross-document absent de Firefox (3,19 % de `defaults`, R1) ; noms d'événements Astro à vérifier selon la version 5.x
- Conflits : M4-L07 (deux chemins de navigation), M4-L06 (fenêtre jusqu'à `astro:page-load`)
- Cohérence : réutilise `layout`, `data-motion-shared` et les handles ; nouveauté : aucune option, seulement deux chemins natifs ; un usage natif est une exception à la grammaire, à signaler.

### M4-L09 — Présence en liste : sortie sur place, entrées au nouvel index, sortie portée par l'ancêtre le plus haut
- Énoncé : un élément sortant garde sa position d'origine jusqu'à `finished` ; les entrants prennent l'index courant. Le défaut est sorties puis entrées, réglé par le jeton `stagger`. Si un ancêtre quitte le DOM, il porte la présence : les descendants ne jouent pas leur propre sortie (Svelte 5 : transitions locales par défaut, `|global` pour l'inverse, à vérifier ; Angular : à vérifier) et leur handle se termine avec le statut `inherited`. React ne peut pas faire jouer une sortie d'enfant après démontage du parent : la retenue se fait au parent.
- Familles : F3, F10, F11
- Nature : instance (retenue) + global (ordre de liste via le runtime)
- Avantages : une règle unique (« la sortie la plus haute décide ») ; pas de fantôme dans une liste réordonnée ; une liste de 200 éléments n'est pas bloquée par le `stagger` (tronqué)
- Limites : React garde des enfants hors de la source de vérité, avec leurs clés ; l'ordre par index casse si le parent réordonne pendant la sortie
- Conflits : M4-L06 (délai partagé), M4-L10 (durée de retenue en rendu réduit)
- Cohérence : réutilise `stagger` (jeton), `appear` / `disappear` et le handle avec statut ; nouveauté : statut `inherited`, justifié car la sortie d'un enfant n'a pas de `finished` propre.

### M4-L10 — `data-presence` comme état lisible, rendu réduit en fondu, SSR sans état de sortie
- Énoncé : le runtime pose `data-presence="entering|present|exiting"`, lisible en CSS et en variant Tailwind (`data-[presence=exiting]:`). Le HTML serveur est toujours `present` (règle de rendu serveur, R10 M4-04) ; rien n'est retenu à l'hydratation. Avec `prefers-reduced-motion`, `disappear` devient un fondu de courte durée (§8.1 #5 corrigé) et la retenue dure exactement ce fondu ; sans fondu possible, retrait immédiat.
- Familles : F3, F4, F20
- Nature : instance
- Avantages : état de présence visible dans l'inspection (`udixio.motion.inspect()`, §8.0 bis #2) ; rendu réduit cohérent avec le défaut par verbe ; aucun flash à l'hydratation
- Limites : chaque changement de `data-presence` est observé par `MutationObserver`, coût à mesurer ; le fondu réduit reste une animation, à arbitrer avec F20 ; le SSR ne rend jamais d'état de sortie
- Conflits : M4-L09 (durée de retenue en rendu réduit)
- Cohérence : réutilise `data-motion` et la règle de rendu réduit (§8.1 #5) ; nouveauté : attribut `data-presence` écrit par le runtime, exception à la grammaire `data-motion-<option>` (configuration, pas état), à justifier au greffier.
