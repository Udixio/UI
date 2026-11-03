# R4 — Fidélité des fallbacks : pilotage de `CSSAnimation`, variables CSS, coût de lecture

> Travail R4 du §7 de la spec `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`.
> Alimente le spike **S1** (go / no-go sur §4.2 « contrat de variables CSS » et
> §4.7 « fidélité par construction »). **Ce document ne prend aucune décision.**
>
> Rédigé le 2026-11-03, par recherche documentaire : specs CSSWG, MDN, bugs
> WebKit/Gecko/Chromium, WPT, sources des bibliothèques. Aucun test n'a été
> lancé dans un navigateur. Tout ce qui est classé « incertain » doit être
> vérifié par S1.
>
> Légende : ✅ sûr (spec + implémentation documentée) · ⚠️ incertain, à tester
> en S1 · 🐞 piège propre à un navigateur.

---

## 1. Piloter une `CSSAnimation` existante

### 1.1 Ce qui est sûr

- ✅ **Accès.** `el.getAnimations()` renvoie les `CSSAnimation` (et les
  `CSSTransition`) de l'élément. `CSSAnimation.animationName` permet de les
  filtrer. Ces API sont Baseline « widely available » depuis juillet 2020
  (environ Chrome 84, Firefox 75, Safari 13.1). Avec `{ subtree: true }`,
  l'appel inclut les pseudo-éléments et les descendants.
- ✅ **`getAnimations()` force un recalcul de style.** Une classe tout juste
  ajoutée ne crée sa `CSSAnimation` qu'au moment de la résolution du style.
  L'appel vide donc d'abord les changements de style en attente. Il a le même
  coût de recalcul synchrone que `getComputedStyle` (voir §3).
- ✅ **`pause()` / `play()` sont « collants »** (CSS Animations 2, §2) : après un
  `play()` ou un `pause()` réussi, *« any subsequent change to the
  animation-play-state will no longer cause the CSSAnimation to be played or
  paused »*. Réponse à « qui gagne ? » : **le JS gagne, définitivement, pour
  cette instance**. Un `hover:[animation-play-state:paused]` n'a plus
  d'effet une fois que le fallback a appelé `pause()`. `reverse()` et une
  écriture de `startTime` ne posent cette surcharge que s'ils font entrer
  l'animation dans l'état `paused` ou l'en font sortir.
- ✅ **`effect.updateTiming()` surcharge propriété par propriété.** Après
  `updateTiming({ duration })`, les changements ultérieurs de
  `animation-duration` sont ignorés, mais ceux de `animation-delay`
  continuent de s'appliquer. Après `effect.setKeyframes()`, les changements
  de la règle `@keyframes` et de `animation-timing-function` sont ignorés.
  Remplacer `effect` par `null` ou par un autre effet fige toutes les
  propriétés `animation-*` sauf `animation-name`, `animation-play-state` et
  `animation-timeline`.
- ✅ **`currentTime` et `playbackRate` ne figurent pas dans la liste des
  surcharges** de la spec. Écrire `currentTime` ne coupe donc pas le lien avec
  le CSS. En revanche, sur une animation **en cours de lecture**, écrire
  `currentTime` ne fait que la déplacer : elle continue d'avancer. Pour
  scrubber, il faut d'abord `pause()`, ce qui pose la surcharge collante
  ci-dessus.
- ✅ **Changer `animation-name` détruit l'instance.** Les `CSSAnimation`
  sont appariées par **nom** (pour les noms en double, l'ordre dans la liste
  sert de critère). Si un nom disparaît de la liste, l'animation est
  annulée et dissociée de son élément propriétaire. Si un nom apparaît, une
  **nouvelle** instance est créée et démarre en lecture, sans la pause posée
  par le JS. Un élément qui passe en `display: none` (lui-même ou un ancêtre)
  annule aussi ses animations. Elles sont recréées à neuf quand il réapparaît.
  Conséquence : un contrôleur qui garde une référence vers une `CSSAnimation`
  doit pouvoir la ré-acquérir. Ces cas arrivent par exemple avec
  `md:animate-x`, `data-[open]:animate-y` ou un démontage par `hidden`.
- ✅ **Changer une autre propriété `animation-*`, y compris par une variable
  CSS, met à jour l'instance en place** (*« cause the corresponding
  CSSAnimation object … to be updated »*), sauf pour les propriétés déjà
  surchargées par l'API. Si `animation-duration: var(--motion-duration)` change
  sous un variant, la durée de l'instance change aussi, à condition que le
  fallback n'ait pas appelé `updateTiming({ duration })`.
- ✅ **Événements.** Les `animationstart`, `animationiteration`,
  `animationend` et `animationcancel` sont dérivés des **changements de phase**
  de l'effet entre deux frames (CSS Animations 2, §5.1), **même quand
  l'animation est en pause et déplacée par `currentTime`**. Le test WPT
  `css/css-animations/event-dispatch.tentative.html` (« Active -> Active
  (backwards) ») le vérifie : pause, puis seek, puis
  `animationstart` / `animationiteration` / `animationend`. **Conséquence pour
  le scroll-driven** : à chaque passage d'un bord de la plage, le scrub émet
  `animationend`, et `animationstart` en revenant. Tout code qui utilise
  `animationend` comme signal « c'est fini, je nettoie » se déclenche donc
  plusieurs fois.
- ✅ **Le promise `finished` ne se résout pas sur une animation en pause.** Dans
  l'algorithme `playState` de Web Animations, `paused` a priorité sur
  `finished`. Une animation en pause amenée à `currentTime = durée` reste
  `paused`, et `finished` ne se résout pas. Un `cancel()` rejette le
  promise en attente avec une `AbortError`, d'où un risque de *unhandled
  rejection* si personne ne l'attrape. Après une sortie de l'état `finished`,
  `finished` désigne un **nouveau** promise.
- ✅ `animationcancel` n'est Baseline que depuis **février 2026**
  (« newly available », MDN). Les versions plus anciennes de la requête
  `defaults` (C13) ne l'ont pas toutes. On ne peut donc pas compter dessus
  seul pour détecter qu'une instance a été remplacée.

### 1.2 Spécifique au scroll-driven (cœur de §4.7)

- ✅ **Les propriétés inconnues sont perdues au parsing.** Dans un navigateur
  sans scroll-driven (Firefox stable, Safari < 26), `animation-timeline:
  view()` et `animation-range: entry 0% cover 50%` sont des déclarations
  invalides. Le parser CSS les jette, et ni `getComputedStyle` ni le CSSOM ne
  peuvent les relire. **Le fallback JS ne peut donc pas découvrir la timeline
  ni la plage à partir des propriétés natives.** Il lui faut une copie lisible :
  une propriété personnalisée (dont la valeur est conservée telle quelle, en
  tokens), un attribut, ou une relecture du texte de la feuille comme le fait
  le polyfill (§4). C'est un argument factuel pour §4.2, pas une décision.
- ✅ **Durée nulle en fallback.** Pour le scroll-driven, on écrit souvent
  `animation: x linear both` sans durée, ou `animation-duration: auto`. Dans
  un navigateur sans support, `auto` est invalide et la durée vaut `0s`.
  L'animation existe, mais elle a un intervalle actif de longueur zéro, et
  scrubber `currentTime` de 0 à 0 ne produit rien. Le polyfill flackr
  contourne ce cas en **réécrivant le texte de la feuille** pour injecter
  `1s` (source : `scroll-timeline-css-parser.js`, commentaire « `auto` also is
  valid duration. Older browsers can't always handle it properly »). Deux
  pistes à évaluer : une durée de repli émise par le plugin Tailwind, ou
  `updateTiming({ duration })`, collant mais acceptable.
- ✅ **Unités différentes en natif.** Quand le navigateur supporte
  nativement le scroll-driven, `CSSAnimation.timeline` est une
  `ScrollTimeline` / `ViewTimeline`. `currentTime` y est alors un
  `CSSNumericValue` en **pourcentage** (`CSS.percent(…)`), pas un nombre de
  millisecondes, et la durée de l'effet vaut `"auto"`. Le code qui lit
  `getTiming().duration` doit traiter les deux cas.
- 🐞 **Ordre des déclarations dans Chromium et Safari.** Le raccourci
  `animation` **réinitialise** `animation-timeline` (sous-propriété
  « reset-only »). `animation-timeline` doit donc venir après `animation`
  dans la cascade. Les utilitaires Tailwind générés doivent respecter cet
  ordre, y compris entre plusieurs classes.

### 1.3 Incertain (à tester en S1)

- ⚠️ **Retour au contrôle CSS.** Après un `pause()` collant, aucune API ne
  « dé-surcharge ». Il faut vérifier si `cancel()` sur une `CSSAnimation`
  laisse le CSS en recréer une, et à quel moment : immédiatement, au
  prochain changement de `animation-name`, ou jamais tant que le nom reste
  le même. La spec n'est pas explicite, et le comportement peut différer
  entre moteurs.
- ⚠️ **Variable qui change sous un variant pendant que l'animation est en
  pause.** Il faut vérifier que la nouvelle durée ou le nouveau délai
  s'appliquent sans réinitialiser `currentTime`, et sans relancer
  l'animation alors que `pause()` est collant.
- ⚠️ **Combinaison avec un `animation-play-state` CSS.** Que se passe-t-il
  si `animation-play-state: paused` est posé par une classe avant que le JS
  n'appelle `pause()`, puis retiré ?
- 🐞⚠️ **WebKit et propriétés accélérées en pause.** Le bug WebKit 199529
  (2019, statut non confirmé) décrit une animation en pause, limitée aux
  propriétés accélérées (`transform`), qui affiche la mauvaise frame quand
  `currentTime` tombe dans le délai ou dans l'`endDelay`. Le bug 205804 décrit
  un `pause()` WebKit qui s'applique de façon asynchrone. À reproduire sur
  Safari réel ; la WebKit de Playwright ne suffit pas.
- ⚠️ **Phase de démarrage.** Juste après sa création, une `CSSAnimation` est
  en *pending play task* : son `startTime` n'est pas résolu tant que `ready`
  ne s'est pas résolu. Il faut vérifier que `pause()` suivi de `currentTime =`
  au même tick ne produit pas une frame visible à t = 0 (flash) dans les
  trois moteurs.
- ⚠️ **Le seek d'une animation compositée.** Une animation de
  `transform`/`opacity` en pause, déplacée à chaque frame depuis le thread
  principal, doit être recommitée vers le compositeur. Coût et saccades à
  mesurer, surtout avec un CPU ralenti.

---

## 2. Variables CSS dans `@keyframes`

### 2.1 Ce qui est sûr

- ✅ `var()` est autorisé dans les valeurs de `@keyframes` et se résout **dans
  le contexte de l'élément animé**. Le WPT
  `css/css-animations/animation-css-variable-in-keyframe-adjusted.html`
  vérifie qu'un changement de variable **pendant** l'animation, sur
  l'élément ou sur son parent, met à jour la valeur calculée.
- ✅ **Propriété non enregistrée = interpolation discrète.** Animer une
  propriété personnalisée non enregistrée (`--x` dans les keyframes) la fait
  basculer à 50 %. Une propriété enregistrée par `@property` avec une
  `syntax` typée (`<length>`, `<number>`, `<color>`, …) s'interpole.
  Utiliser une variable non enregistrée **à l'intérieur** d'une propriété
  standard (`transform: translateY(var(--y))`) s'interpole normalement, parce
  que l'interpolation porte sur `transform` après substitution.
- ✅ **Héritage.** Les propriétés non enregistrées héritent toujours. Une
  `--motion-duration` posée sur un parent animé est donc lue aussi sur un
  enfant qui n'a rien demandé. `@property { inherits: false }` coupe cet
  héritage. Tailwind v4 enregistre lui-même ses `--tw-*` avec
  `inherits: false` pour cette raison. Ce point concerne aussi §3 : la
  valeur lue pourrait venir d'un ancêtre.
- ✅ **Forme de la valeur calculée.**
  - Non enregistrée : la valeur calculée est la séquence de tokens après
    substitution des `var()`. `calc()` n'est pas évalué et les unités ne sont
    pas normalisées : le JS doit parser `300ms`, `.3s` et `calc(…)`.
  - Enregistrée : la valeur est normalisée (`<time>` en secondes, `<length>`
    en `px` absolus, couleurs résolues) et facile à parser.

### 2.2 Historique de bugs par moteur (et ce qui reste ouvert)

- 🐞 **WebKit** : jusqu'à fin 2022, les keyframes n'étaient pas invalidées
  quand une variable changeait. Bug 248145, corrigé par 256893@main
  (novembre 2022). Le bug 201736 « CSS variables in keyframes don't work »
  a été fermé comme doublon de celui-ci. Le bug 248145 utilise
  `element.animate()` : sa couverture des règles `@keyframes` CSS n'est pas
  confirmée. Bug 250448 : une `@property` contenant `var()` n'était pas mise
  à jour quand la propriété référencée était animée (corrigé par
  258786@main). Bug 276121 : `var()` dans `perspective-origin` à l'intérieur de
  `@keyframes` était mal parsé (corrigé par 310650@main, récent). **La version
  de Safari qui embarque chacun de ces correctifs n'a pas été identifiée.**
  Avec une cible `defaults`, qui inclut d'anciens Safari, il faut tester.
- 🐞 **Gecko** : bug 1763376, les propriétés personnalisées *introduites*
  dans `@keyframes` n'avaient pas d'effet ; corrigé depuis selon le fil.
  Bug **2060164**, ouvert il y a quelques jours (Firefox 153, non confirmé) :
  animer une couleur `@property` entre deux `var()` provoque un **saut à 50 %**
  au lieu d'une interpolation. Si on retire les `var()` des keyframes, le
  problème disparaît. Ce cas recoupe exactement le motif « keyframes génériques
  paramétrées par `--motion-*` ».
- 🐞 **Divergence de fond** (CSSWG #411, 2021) : historiquement, Firefox
  substituait `var()` **avant** l'interpolation, et Chrome **après**. Les
  règles de portée des variables entre l'élément et les keyframes
  différaient aussi.

### 2.3 Incertain (à tester en S1)

- ⚠️ Mise à jour **en cours d'animation**, et **en pause avec seek**, d'une
  `var()` utilisée dans des keyframes CSS, dans les trois moteurs, aux
  versions les plus anciennes de `defaults`. Les résultats WPT par navigateur
  n'ont pas pu être relevés (l'API wpt.fyi ne renvoyait que l'exécution
  Edge, qui passe 2/2). À consulter à la main sur wpt.fyi.
- ⚠️ Effet de `var()` dans les keyframes sur la **composition** (Chromium
  peut refuser de compositer des keyframes non résolues statiquement). Impact
  sur la fluidité du scrub.
- ⚠️ Keyframes génériques paramétrées par variables (`from { translate:
  var(--motion-from-x) }`) : interpolation correcte quand la variable vaut
  une valeur d'un autre type (`0` contre `10px`, `none`), y compris avec le bug
  Gecko 2060164.

---

## 3. Lire les variables via `getComputedStyle`

### 3.1 Ce qui est sûr

- ✅ `getComputedStyle(el).getPropertyValue('--motion-x')` force un
  **recalcul de style** synchrone si le style est marqué « sale ». Ce n'est
  pas un recalcul de **layout** : une propriété personnalisée ne dépend pas du
  layout. La liste de référence de Paul Irish, « What forces layout/reflow »,
  range `getComputedStyle` dans la catégorie « force style recalc », et y
  ajoute le layout seulement pour certaines propriétés dépendant du layout
  (`width`, etc., ou les éléments en shadow tree). Un ancien patch WebKit
  (commit 52bdb212) a limité le recalcul aux cas où l'élément ou ses ancêtres
  sont sales, et a borné le layout aux propriétés qui en dépendent. Il cite
  un gain de « plusieurs pour cent » sur les benchmarks de chargement.
- ✅ **Le motif de thrashing est classique** : lire après avoir écrit (classe,
  style) dans le même tick force un recalcul à chaque lecture. Mitigation
  standard : grouper toutes les lectures, puis toutes les écritures
  (FastDOM, ou une phase « read » dans un `requestAnimationFrame`).
  L'objet `CSSStyleDeclaration` renvoyé est **vivant** : on peut le garder par
  élément, mais chaque `getPropertyValue` reste une lecture synchrone.
- ✅ **Aucune mesure publiée récente** ne chiffre le coût d'une lecture de
  propriété personnalisée sur les trois moteurs. Chromium dispose de tests de
  perf dédiés aux variables (commit 81b40ad9, « [css-variables] Adding 2 new
  perf tests ») qui séparent la propagation d'une déclaration et le recalcul
  forcé. Ils peuvent servir de modèle pour S1. **Les chiffres sont à produire
  par S1.**
- ✅ **Détection d'un changement sans polling : options documentées**
  - **Transitions sur une propriété enregistrée** : technique de
    `@bramus/style-observer`. On pose une `transition` très courte avec
    `transition-behavior: allow-discrete` sur la propriété suivie, puis on
    écoute les événements de transition. Le changement est notifié quel que
    soit le déclencheur : `:hover`, media query, attribut d'un ancêtre,
    container query. Support annoncé : Chrome 117, Firefox 129, Safari 18.
    L'auteur précise que **toutes ces versions ont des bugs sur les
    propriétés personnalisées** :
    - 🐞 Chrome n'émettait pas d'événement de transition pour les propriétés
      non enregistrées (crbug 360159391, corrigé en Chrome 148 selon la mise
      à jour de l'article). Contournement : `@property`.
    - 🐞 Safari < 18 entrait dans une **boucle de transition** pour les
      propriétés non enregistrées ou de type chaîne.
    - 🐞 Firefox réagit mal aux propriétés enregistrées avec une `syntax`
      interpolable.
    - Seul contournement valable sur les trois moteurs : `syntax:
      "<custom-ident>"`. Ce type ne peut pas commencer par un chiffre, il ne
      convient donc pas à une durée numérique brute.
    - Limites : la propriété suivie ne peut plus porter sa propre transition,
      et toute réécriture de `transition` par l'auteur casse l'observateur.
      C'est un conflit direct avec les utilitaires `transition-*` de Tailwind
      sur le même élément.
  - **`MutationObserver` sur `class` / `data-*`** : bon marché, mais il ne
    voit ni `:hover`, ni `:focus`, ni les media queries (`md:`), ni les
    container queries. Il ne voit pas non plus les changements d'un ancêtre
    (`group-hover:`, `group-data-[…]:`) sauf avec `subtree`, ce qui coûte
    plus cher.
  - **`matchMedia(...).addEventListener('change')`** : couvre `md:`, `motion-reduce:`
    et `dark:` (si piloté par media), mais ne couvre que ces cas.
  - **Événements d'entrée** (`pointerenter`/`leave`, `focusin`/`out`) :
    reproduisent `hover:`/`focus:` en JS. Ce sont des doublons du CSS, donc
    une source de divergence.
  - **`ResizeObserver`** : ne détecte que des changements de taille. Il ne
    convient pas aux variables, sauf par l'astuce d'une variable qui pilote
    une taille (un hack).
  - **`animationstart` / `transitionrun`** sur l'élément : quand un variant
    change le **nom** d'animation, l'`animationstart` de la nouvelle instance
    sert de signal naturel, sans observateur.

### 3.2 Incertain (à tester en S1)

- ⚠️ Coût réel d'une lecture de N variables sur 100 / 1000 éléments, avec un
  style sale et avec un style propre, sur les trois moteurs. Comparer une
  lecture par élément, une lecture groupée en phase rAF, et un cache
  invalidé par événement.
- ⚠️ Chromium peut-il recalculer **seulement le sous-arbre** de l'élément
  interrogé, ou bien tout le document, quand une autre partie de la page est
  sale ?
- ⚠️ Fiabilité de la technique « transition sur `@property` » aux versions
  les plus anciennes de `defaults`, et cohabitation avec les `transition-*`
  Tailwind sur le même élément.
- ⚠️ `@property` dans le shadow DOM : une règle `@property` déclarée dans une
  shadow root est ignorée, problème connu de Tailwind v4. Impact sur Angular
  avec `ViewEncapsulation.ShadowDom` et sur les web components.
- ⚠️ Normalisation des espaces dans la valeur calculée d'une propriété non
  enregistrée (`" 300ms"` contre `"300ms"`) : historiquement différente entre
  les moteurs.

---

## 4. Fallbacks scroll-driven existants

### 4.1 Polyfill officiel `flackr/scroll-timeline`

- ✅ **État** : dépôt non archivé, mais **dernier push le 2024-08-26**,
  85 issues ouvertes. Paquet npm `scroll-timeline-polyfill` en 1.1.0, publié
  le 2024-05-15. L'*Intent to Ship* de Chromium le qualifiait déjà de
  « slightly out of date ». Licence Apache-2.0.
- ✅ **Taille** : `dist/scroll-timeline.js` 1.1.0 pèse ~61 Ko minifié et
  **~16,7 Ko gzip** (mesure faite ici avec `gzip -9`).
- ✅ **Fonctionnement** (lecture des sources) :
  - Il **remplace globalement** `window.Animation` (par `ProxyAnimation`),
    `Element.prototype.animate` et `getAnimations`. Il installe aussi
    `ScrollTimeline` et `ViewTimeline` si `window.ViewTimeline` est absent.
    Risque de conflit avec anime.js et Motion, qui manipulent les mêmes
    objets.
  - Pour le CSS, il **relit le texte des feuilles** : contenu des `<style>`,
    et `fetch` des `<link>` de **même origine** uniquement. Il le
    **transpile**, puis réécrit le `<style>` ou remplace le `href` par une URL
    blob. Il ne surveille que les **ajouts** de nœuds `<style>`/`<link>`
    (`MutationObserver`), pas les modifications de contenu (HMR Vite, CSS-in-JS
    qui mute une feuille existante, feuilles construites/`adoptedStyleSheets`).
  - Pour associer une animation à sa timeline, il parcourt les règles
    collectées, de la dernière à la première, et prend la première dont
    `target.matches(selector)` réussit. Les sources portent des `TODO`
    explicites : **pas de prise en compte de la spécificité** et **pas de
    gestion des at-rules imbriquées** (le `catch` est vide). Les variants
    Tailwind v4 qui produisent du `@media`, du `@supports`, du `@layer` ou du
    nesting CSS sont donc à risque. C'est le cas de `md:` et `data-[…]:`, et
    tout l'output Tailwind v4 est en `@layer`.
  - Il injecte une durée `1s` dans les raccourcis sans durée (voir §1.2) et
    retire `auto`. Il réécrit les offsets des keyframes pour les plages de
    `view()`, avec un `TODO` : plus de 100 keyframes non supportées.
  - Une issue (#159) signale qu'il lève une exception dans les navigateurs
    sans `getAnimations()`.
- ⚠️ À vérifier en S1 : son comportement sur une feuille Tailwind v4 réelle,
  et si `animation-timeline: var(--…)` est reconnu (probablement non : le
  parser cherche des tokens littéraux).

### 4.2 Motion `scroll()`

- ✅ Moteur hybride : il utilise `ScrollTimeline` natif quand le navigateur
  le supporte **et** que l'animation est accélérable, et du JS sinon.
  `scroll()` pèse 3,8 Ko selon la doc.
- ✅ Il accepte un callback `progress` (0 → 1) ou une animation créée par
  `animate()` de Motion. La doc ne mentionne **pas** les `Animation` natives
  ni les `CSSAnimation`.
- ✅ Les offsets ont leur propre syntaxe (`["start end", "end start"]`, px,
  `vh`, …), distincte des plages `view()` (`entry`, `cover`, …). Cela demande
  une traduction, donc une source de divergence (cf. R3).
- ✅ Limites documentées : la position du sujet est calculée **sans les
  transforms** (layout uniquement). `trackContentSize` est désactivé par
  défaut : un changement de taille du contenu n'est pris en compte qu'au
  scroll suivant. Pour l'épinglage, la doc recommande `position: sticky`.
- ⚠️ Un callback `progress => anim.currentTime = …` sur une `CSSAnimation`
  paraît faisable. À tester.

### 4.3 GSAP ScrollTrigger

- ✅ Entièrement JS : il **ne s'appuie pas** sur les scroll timelines natives.
  Il calcule `start`/`end` une seule fois (à la création et au resize, avec un
  debounce de 200 ms, car « CPU-intensive »), et met à jour au rAF suivant
  un `scroll`. `normalizeScroll` déplace le défilement sur le thread JS.
- ✅ Il pilote ses propres tweens et timelines. Rien n'est documenté pour les
  animations CSS/WAAPI, mais un tween sur la propriété `currentTime` d'un
  objet `Animation` est techniquement possible (GSAP tweene n'importe quel
  objet). Licence : voir R5.
- ✅ Les positions sont statiques entre deux `refresh()`. Un changement de
  layout sans resize les rend fausses.

### 4.4 Comparaison fidélité / perf (synthèse factuelle)

| Approche | Source de vérité des keyframes | Thread | Plages `view()` | Variants Tailwind | Poids |
|---|---|---|---|---|---|
| Natif (`animation-timeline`) | CSS | compositeur (Chromium, pour les propriétés accélérables) | exactes | oui | 0 |
| Polyfill flackr | CSS, retranspilé | principal (`scroll` + rAF) | réimplémentées | à risque (at-rules, spécificité) | ~16,7 Ko gz |
| Motion `scroll()` | keyframes Motion | natif si possible, sinon principal | syntaxe offsets propre | non (pas de CSS) | 3,8 Ko + `animate` |
| GSAP ScrollTrigger | timeline GSAP | principal | `start`/`end` propres | non | voir R5 |
| Pilotage `CSSAnimation` (§4.7) | CSS | principal pour le seek, rendu compositable | à calculer (R3) | oui, si la plage est lisible (§1.2) | à mesurer |

Point commun à tous les fallbacks JS : le scroll threadé fait que la
position affichée peut précéder d'une frame le `scroll` reçu par le JS
(*scroll-linked effect jank*). L'événement `scroll` est traité dans l'étape
« update the rendering », avant rAF, ce qui limite l'écart sans l'annuler.
**L'écart réel est à mesurer en S1.**

---

## 5. anime.js v4 (4.5.0 installé dans le dépôt)

Lecture de `node_modules/.pnpm/animejs@4.5.0/.../dist/modules`.

- ✅ **`waapi.animate(targets, params)`** (« 3KB versus 10KB ») crée **ses
  propres** animations via `Element.animate()` et les enveloppe dans une
  `WAAPIAnimation`. Il **n'adopte pas** d'`Animation` existante : rien dans
  la doc ni dans les sources ne prend un objet `Animation` en entrée.
- ✅ **`timeline.sync(anim, position)`** accepte explicitement une
  **`Animation` native** (« or even a native WAAPI Animation », et dans les
  types `Tickable | WAAPIAnimation | globalThis.Animation`). Une
  `CSSAnimation` hérite d'`Animation`, donc le type l'accepte. Implémentation
  (`timeline.js`, `sync()`) :
  1. `synced.pause()` → pose la **surcharge collante** du §1.1.
  2. `duration = +synced.effect.getTiming().duration` → 🐞 vaut **`NaN`** si la
     durée est `"auto"` (scroll-driven natif) et **`0`** si le CSS n'a pas de
     durée en fallback (§1.2).
  3. `this.add(synced, { currentTime: [0, duration], ease: 'linear' })` :
     anime.js **tweene la propriété `currentTime`** de l'objet natif.
  4. 🐞 `if (synced.persist !== undefined) synced.persist = true` : sur une
     `Animation` native, `persist` est une **méthode**. Cette affectation crée
     une propriété propre `true` qui masque la méthode, et un appel ultérieur
     à `anim.persist()` lève une `TypeError`. Ce code vise la `WAAPIAnimation`
     d'anime.js (où `persist` est un booléen). Inoffensif tant que personne
     n'appelle `persist()`.
- ✅ **`onScroll()` / `ScrollObserver.link(linked)`** attend un `Tickable` ou
  une `WAAPIAnimation`. Il appelle `linked.seek()` et lit `linked.duration`,
  `linked.progress`, `linked.currentTime` et `linked.targets`. Une `Animation`
  native **n'a pas `seek()`** : elle ne peut pas être liée directement. Le
  chemin possible consiste à l'envelopper dans une timeline : `const tl =
  createTimeline({ autoplay: onScroll({ sync: true }) }).sync(cssAnim)`.
  Au `refresh`, l'observer fait `linked.seek(0, true)`, mesure, puis
  restaure (lignes ~708-802). Il réécrit donc `currentTime` et force un layout
  à chaque refresh.
- ✅ **Modes de sync de `onScroll`** (source) :
  - méthodes (`'play pause'`, 4 méthodes pour un comportement
    bidirectionnel) ;
  - `true` ou `'linear'` (seek direct) ;
  - nombre (lissage par interpolation, qui **retarde** volontairement
    l'animation sur le scroll : fidélité moindre par rapport au natif) ;
  - easing (`'inOutQuad'`…).
- ✅ Les seuils `onScroll` (`enter`/`leave`, `'start end'`…) ont leur propre
  sémantique, distincte des plages `view()`. Une traduction R3 est
  nécessaire.
- ✅ **Conflit de cascade** à connaître : le moteur JS d'anime.js
  (`animate()`, hors WAAPI) écrit des **styles inline**. L'origine
  « animations » de la cascade passe **avant** les déclarations auteur
  normales, y compris le style inline. Une `CSSAnimation` active ou en
  `fill` masque donc les écritures inline d'anime.js sur les mêmes
  propriétés.
- ⚠️ À tester : le comportement réel de `tl.sync(cssAnimation)` dans les trois
  moteurs, quand la `CSSAnimation` est remplacée (changement
  d'`animation-name`). La timeline garde une référence morte.

---

## 6. Tests proposés pour le spike S1

Aucun code n'est écrit ici. Chaque test doit tourner sur les 3 moteurs
Playwright récents. Ceux marqués **(ancien)** doivent aussi passer sur la
version la plus ancienne de `defaults` (C13) et sur un Safari réel.

**A. Pilotage d'une `CSSAnimation`**
1. Créer une animation par classe, puis `getAnimations()`, `pause()`, et
   `currentTime = p × d` pour p ∈ {0, 0,25, 0,5, 1}. Comparer le style calculé
   à des keyframes de référence, sur `opacity`, `transform` et `color`.
   **(ancien)**
2. `pause()` puis `currentTime` dans le même tick, juste après l'ajout de la
   classe : vérifier qu'aucune frame n'apparaît à t = 0 (capture par rAF).
3. Après `pause()`, basculer `animation-play-state` par une classe
   (`hover:`) : confirmer que le JS gagne. Puis `cancel()` : le CSS
   recrée-t-il l'instance, et quand ?
4. Changer `animation-name` via un variant (`data-[x]:`, `md:` en
   redimensionnant) : confirmer qu'une nouvelle instance est créée en
   lecture, et mesurer le délai avant de pouvoir la ré-acquérir. Tester la
   présence de `animationcancel` sur la version la plus ancienne.
   **(ancien)**
5. Changer `--motion-duration` (qui alimente `animation-duration`) pendant
   la pause : la durée change-t-elle, et `currentTime` est-il conservé ? Le
   même test après `updateTiming({ duration })` doit montrer que le
   changement est ignoré.
6. Scrub aller-retour à travers les bords : compter les `animationstart`
   et `animationend`, et vérifier que `finished` reste en attente.
7. WebKit 199529 : animation de `transform` avec délai, en pause, avec un
   seek dans le délai. Vérifier la frame affichée par capture d'écran, pas
   seulement par le style calculé. **(Safari réel)**

**B. Variables dans les keyframes**
8. Keyframes génériques `translate: var(--motion-from-x) → 0` : modifier la
   variable pendant la lecture, et pendant une pause avec seek. La valeur
   suit-elle ? **(ancien)**
9. Reproduire Gecko 2060164 : couleur `@property` entre deux `var()`.
   Vérifier qu'il n'y a pas de saut à 50 %.
10. Comparer `--x` enregistrée et non enregistrée animée dans des
    keyframes : vérifier l'interpolation (attendue) et le basculement
    discret (attendu).
11. Vérifier dans les DevTools Chromium que les keyframes avec `var()` sont
    toujours compositées (Layers / « Animations »), et mesurer la fluidité
    du scrub.

**C. Lecture des variables**
12. Lire 1, 5 et 10 variables sur 100 et 1000 éléments, avec un style sale
    (classe changée juste avant) et propre. Mesurer le temps par lecture
    (`performance.now`), les traces Chromium (« Recalculate Style ») et les
    Long Animation Frames. Comparer les lectures entrelacées, les lectures
    groupées, et un cache. **(ancien)**
13. Héritage : vérifier qu'une `--motion-*` posée sur un parent est lue sur un
    enfant non animé, puis que `inherits: false` coupe l'héritage.
14. Forme des valeurs : `300ms`, `.3s`, `calc(100ms*3)`, espaces. Comparer
    la valeur brute (non enregistrée) et la valeur normalisée (enregistrée)
    dans les trois moteurs.
15. Détection sans polling : comparer la technique « transition sur
    `@property` `<custom-ident>` », un `MutationObserver`, et `matchMedia` sur
    `hover:`, `group-hover:`, `md:`, `data-[…]:` et un ancêtre
    `data-[…]:`. Relever, pour chaque déclencheur, s'il est détecté et le délai
    en frames. Tester aussi la cohabitation avec un `transition-colors`
    Tailwind sur le même élément. **(ancien)**
16. `@property` dans une shadow root (Angular `ShadowDom`) : la propriété
    reste-t-elle typée ?

**D. Scroll-driven : natif contre fallback**
17. Même page, même classe Tailwind `view()` + plage : natif (Chrome,
    Safari 26) contre fallback forcé (pilotage `currentTime`). Échantillonner
    le style calculé à 20 positions de scroll et calculer l'écart maximal par
    propriété, par rapport aux tolérances provisoires d'I2.
18. Retard visuel du fallback : mesurer en frames l'écart entre
    `scrollTop` et la valeur affichée, pendant un défilement programmé puis
    un défilement tactile émulé, avec un CPU ralenti ×4.
19. Navigateur sans support : vérifier que `animation-timeline` et
    `animation-range` sont illisibles via `getComputedStyle`, puis que leur
    copie en propriété personnalisée est lisible. Vérifier la durée effective
    (0 ?) sans durée de repli.
20. Ordre de cascade : `animation` posé après `animation-timeline` par deux
    classes Tailwind, pour confirmer que la timeline est réinitialisée.
21. Polyfill flackr sur la feuille Tailwind v4 réelle du dépôt : variants
    `md:` et `data-[…]:`, `@layer`, `var()` dans `animation-timeline`.
    Relever ce qui marche, le poids et les conflits avec anime.js.
22. anime.js : `createTimeline({ autoplay: onScroll({ sync: true }) })
    .sync(cssAnim)`. Comparer avec la référence native (comme le test 17),
    avec durée CSS absente, `auto` et explicite. Vérifier le masquage de
    `persist` et le comportement après remplacement de l'instance.
23. Motion `scroll(progress => cssAnim.currentTime = …)` : même mesure que
    le test 17, pour comparaison.

---

## 7. Sources

- CSS Animations Level 2 (CSSWG draft), §2, §2.1, §3.2, §5.1, §6.1 — https://drafts.csswg.org/css-animations-2/
- MDN `CSSAnimation` — https://developer.mozilla.org/en-US/docs/Web/API/CSSAnimation
- MDN `Animation.finished` — https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished
- MDN `animationcancel` (Baseline 2026) — https://developer.mozilla.org/en-US/docs/Web/API/Element/animationcancel_event
- WPT `event-dispatch.tentative.html` — https://github.com/web-platform-tests/wpt/blob/master/css/css-animations/event-dispatch.tentative.html
- WPT `animation-css-variable-in-keyframe-adjusted.html` — https://searchfox.org/firefox-main/source/testing/web-platform/tests/css/css-animations/animation-css-variable-in-keyframe-adjusted.html
- WebKit 248145 (keyframes non invalidées sur changement de variable) — https://bugs.webkit.org/show_bug.cgi?id=248145
- WebKit 201736 — https://bugs.webkit.org/show_bug.cgi?id=201736
- WebKit 250448 — https://bugs.webkit.org/show_bug.cgi?id=250448
- WebKit 276121 — https://bugs.webkit.org/show_bug.cgi?id=276121
- WebKit 199529 (seek en pause, propriétés accélérées) — https://bugs.webkit.org/show_bug.cgi?id=199529
- WebKit 205804 (pause asynchrone) — https://bugs.webkit.org/show_bug.cgi?id=205804
- WebKit commit 52bdb212 (coût de `getComputedStyle`) — https://webkit.googlesource.com/WebKit/+/52bdb21267e0695a831f15ce397c50e33099edea
- Gecko 1763376 — https://bugzilla.mozilla.org/show_bug.cgi?id=1763376
- Gecko 2060164 — https://bugzilla.mozilla.org/show_bug.cgi?id=2060164
- CSSWG #411 (substitution avant / après interpolation) — https://lists.w3.org/Archives/Public/public-css-archive/2021Jul/0553.html
- Chromium, perf tests des variables — https://chromium.googlesource.com/chromium/src/+/81b40ad9dda5a82d0c8e7889f59138b295070a59%5E%21/
- Paul Irish, « What forces layout/reflow » — https://gist.github.com/paulirish/5d52fb081b3570c81e3a
- Bramus, `@bramus/style-observer` — https://github.com/bramus/style-observer et https://www.bram.us/2024/08/31/introducing-bramus-style-observer-a-mutationobserver-for-css/
- flackr/scroll-timeline (dépôt, sources `src/init-polyfill.js`, `src/scroll-timeline-css.js`, `src/scroll-timeline-css-parser.js`) — https://github.com/flackr/scroll-timeline ; API GitHub (pushed_at, issues) ; npm `scroll-timeline-polyfill` 1.1.0 ; unpkg pour la taille
- Chromium Intent to Ship scroll-driven animations — https://groups.google.com/a/chromium.org/g/blink-dev/c/RDKAi9JPHwY/m/5MWvzGPjAgAJ
- État Firefox (flag en stable en juin 2026, source secondaire unique, à recouper par R1) — https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026
- Motion `scroll()` — https://motion.dev/docs/scroll
- GSAP ScrollTrigger — https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- anime.js : https://animejs.com/documentation/web-animation-api , https://animejs.com/documentation/timeline/timeline-methods/sync ; sources 4.5.0 du dépôt : `dist/modules/timeline/timeline.js` (`sync`), `dist/modules/events/scroll.js` (`link`, modes de sync, refresh)
