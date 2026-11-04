# M3 — Choix R14 : runtime, observateurs, valeurs, performance

Angle : runtime global, observateurs, valeurs réactives, scopes, budgets, chargement.
Faits vérifiés : animejs 4.5.0 installé (`engine.pauseOnDocumentHidden` et `engine.useDefaultMainLoop` par moteur ; option `mediaQueries` ; `createAnimatable`). `getCoalescedEvents` : support Safari 18.2+ selon une source secondaire, et les événements coalescés n'ont ni `pointerId` ni `target` ([MDN](https://developer.mozilla.org/docs/Web/API/PointerEvent/getCoalescedEvents), non Baseline). `requestIdleCallback` absent de Safari ([caniuse](https://caniuse.com/mdn-api_window_requestidlecallback)).

### M3-R01 — Valeur réactive écrite dans le DOM, jamais re-rendue
- Énoncé : une `defineValue` écrit sa valeur à chaque frame directement dans le DOM : variable CSS `--udx-<nom>` sur les cibles abonnées (lue par `translate-x-[var(--udx-pointer-x)]`) ou `textContent` pour un nombre. La forme lit le store de son framework (signal Angular, store Svelte, `useSyncExternalStore` React) seulement pour un état discret (franchissement de seuil), jamais par frame. Cible : `data-motion-value="pointer-x"` (référence seule) ; TS `defineValue('pointer-x', { source: 'pointer', axis: 'x', range: [-1, 1] })`.
- Questions : Q5 ; Familles : F14, F5 (parallaxe en repli)
- Nature : les deux (définition nommée globale ; écriture par abonné)
- Avantages : zéro re-rendu par frame dans les 5 formes ; même chemin d'écriture pour curseur, parallaxe et compteur ; `transform` reste au compositeur
- Limites : une variable posée sur la racine invalide le style de tous les descendants, donc écrire sur les cibles seules ; un seuil franchi déclenche un re-rendu, à réserver aux états rares
- Conflits : aucun connu ; complète M5-S04 (valeurs lues sans re-rendu)
- Cohérence : grammaire `data-motion-<option>` et nom par référence conservés ; nouveauté `data-motion-value`, justifiée car une valeur continue n'est pas un verbe ; même handle

### M3-R02 — Compteur : valeur finale dans le HTML, texte écrit par le runtime
- Énoncé : `defineValue` numérique avec `format` (`Intl.NumberFormat`, locale du document). Le HTML rend la valeur finale (lisible sans JS, correcte pour lecteurs et référencement). Le runtime remplace le texte pendant la phase écriture, au premier passage à la vue, une fois par défaut. Réduction du mouvement : valeur finale immédiate. Pas d'`aria-live` : le lecteur lit la valeur au repos.
- Questions : Q5 ; Familles : F15, F4
- Nature : instance
- Avantages : pas de re-rendu ; une seule écriture de texte par frame ; accessible sans JS
- Limites : CSS ne sait pas afficher un nombre interpolé (sauf astuce à chiffres superposés, non retenue) ; avant le démarrage la valeur finale est visible puis repart de zéro, à traiter par un état initial posé au premier passage (à mesurer en S1) ; formatage borné à une fois par frame
- Conflits : aucun connu ; dépend de M3-R03
- Cohérence : `once` et rendu réduit identiques à `reveal` ; durée en millisecondes comme les tokens (corrige l'écart s/ms relevé en E1 §2.4)

### M3-R03 — Abonnement borné : visible, document visible, une observation par racine
- Énoncé : tout abonné (valeur, boucle F24, suivi, chorégraphie) n'est actif que si sa racine est visible (un seul `IntersectionObserver` par page) et si le document l'est. La frame unique s'arrête quand plus aucun abonné n'est actif. Le runtime pilote `engine.pauseOnDocumentHidden` et `useDefaultMainLoop` d'anime au lieu de leurs valeurs par défaut. Une chorégraphie n'observe que sa racine ; ses enfants se décalent par index (`--udx-motion-index`, écrit par le runtime). `inspect()` (M5-S09) donne pour chaque abonné sa raison de pause (hors vue, onglet caché, réduit, racine démontée).
- Questions : Q9 ; Q1 (chorégraphie) ; Q10 (diagnostic) ; Familles : F4, F21, F24, F11
- Nature : global
- Avantages : un observateur au lieu de N ; onglet caché : zéro frame ; boucle hors vue : coût nul ; la raison de pause est lisible par un agent
- Limites : une entrée qui pousse l'élément hors écran peut empêcher son propre déclenchement (fait établi) ; au retour de visibilité un suivi se resynchronise par saut, sans rattrapage
- Conflits : aucun connu ; cohérent avec M1-04 (frame unique) et M5-S09 (boucles abonnées)
- Cohérence : même règle pour toutes les familles ; exception déclarée : `reveal` avec `once` se désabonne après le premier passage

### M3-R04 — Chargement par verbe, préchargement en trois temps, un moteur par page
- Énoncé : le cœur (scanner `data-motion`, frame, observateurs, handle) est chargé d'office. Chaque verbe est un module à import dynamique. anime.js n'est chargé que par un verbe qui en a besoin, mis en cache dans `globalThis[Symbol.for('udixio.motion@1')]`. Préchargement : natif, rien ; `appear`, `reveal`, `emphasize` en idle après le premier rendu (`requestIdleCallback` avec repli `setTimeout`) ; `scrub` et `layout` quand la cible approche de la vue (observateur, marge à mesurer). Le manifeste déclare `preload` par verbe ; le build émet `modulepreload` pour les seuls verbes présents.
- Questions : Q9 ; Q7 (dédoublonnage) ; Familles : F21, F1, F7
- Nature : global
- Avantages : une copie d'anime par page (une copie = un moteur = une boucle) ; page sans effet JS : aucun octet moteur ; verbe absent : aucun octet
- Limites : HTML pur sans build : pas de `modulepreload`, repli idle seul ; délai maximal de l'idle à fixer en I3 ; anime (≈13 kB `animate`, ≈21 kB `layout`, min+gz selon R10) n'entre jamais dans le bundle d'un verbe natif
- Conflits : aucun connu ; précise M1-01 et I3
- Cohérence : même `preload` pour tous les verbes ; nouveauté : cache par majeure (coexistence de majeures, cf. M5-07) ; `layout` partage le module anime déjà chargé

### M3-R05 — Scope : racine, registre, nettoyage par élagage
- Énoncé : un scope est une racine DOM (élément ou île) qui possède son registre : observateurs, écouteurs, animations WAAPI, instances anime. `scope.revert()` libère tout. Le runtime élague les scopes déconnectés (`isConnected` faux) à la frame suivante ; les adaptateurs appellent `revert()` explicitement (cleanup React, `DestroyRef` Angular, teardown d'attachment Svelte). Aucun `MutationObserver` sur le document : `scrollDriven.ts` et `AnimateOnScroll.ts` en posent un sur tout le document (E1 §1, F21).
- Questions : Q6 ; Familles : F19, F21
- Nature : instance (registre) + global (élagage)
- Avantages : pas de fuite dans les îles Astro ; coût nul tant que rien ne part ; un seul point de nettoyage
- Limites : élagage paresseux : une racine retirée puis rattachée dans la frame n'est pas nettoyée (voulu) ; un scope retiré pendant que l'onglet est caché n'est élagué qu'au retour
- Conflits : aucun connu ; dépend de M5-07 (un scope vide décrémente le compteur de références)
- Cohérence : même `revert()` que `createScope` d'anime ; nouveauté : le registre couvre aussi WAAPI et observateurs, que le scope d'anime ne suit pas (à vérifier en S1)

### M3-R06 — Responsive : paliers nommés, reconstruction au seul changement de palier
- Énoncé : une variante par breakpoint est d'abord une valeur de token (Tailwind `md:[--udx-motion-distance:2rem]`), résolue en CSS sans JS. Quand une définition change de structure (durée, verbe), le runtime écoute des paliers nommés lus dans le thème (`--breakpoint-*`) : `matchMedia` pour la page, `ResizeObserver` sur la racine du scope pour un conteneur. Il reconstruit au changement de palier seulement, jamais à chaque pixel. L'option `mediaQueries` d'anime 4.5 est la forme JS équivalente.
- Questions : Q6 ; Familles : F19, F20
- Nature : instance (scope) + global (`matchMedia` partagé)
- Avantages : pas de reconstruction pendant un redimensionnement ; paliers identiques à ceux de Tailwind ; container queries sans media query
- Limites : une valeur lue une fois pour un keyframe WAAPI reste figée jusqu'à reconstruction (à tester en S1) ; la reconstruction perd la position courante sauf reprise `carry`
- Conflits : aucun connu ; dépend de M3-R05 (nettoyage à la reconstruction)
- Cohérence : paliers partagés avec Tailwind ; exception déclarée : palier de conteneur (`ResizeObserver`), hors Tailwind, justifiée par F19

### M3-R07 — Réduction du mouvement : un jeton CSS, lu une fois par racine
- Énoncé : la réduction est un jeton unique `--udx-motion-scale` (1 par défaut, 0 sous `@media (prefers-reduced-motion: reduce)`, émis par le plugin). Les durées s'écrivent `calc(var(--udx-motion-scale) * <durée>)`. Le runtime lit ce jeton une fois par racine (`getComputedStyle`) et le réécoute par `matchMedia(...).addEventListener('change')`. Les 17 copies de `systemPrefersReducedMotion` disparaissent. Le rendu réduit par verbe (fondu pour `disappear`, valeur finale pour un compteur) reste dans le manifeste.
- Questions : Q8 ; Q7 ; Familles : F20, F1, F21
- Nature : global
- Avantages : une source pour CSS et JS ; les transitions non gardées (E1, F20) prennent le jeton ; aucun appel par composant
- Limites : une transition qui n'utilise pas le jeton reste active, donc la règle ne vaut que pour les tokens ; `SmoothScroll` (Lenis) doit lire le jeton aussi, il n'a aucune garde aujourd'hui
- Conflits : aucun connu ; complète M5-V02
- Cohérence : même jeton pour toutes les familles ; nouveauté : jeton CSS unique, justifiée par la lecture unique côté runtime

### M3-R08 — Coût par propriété : boucles et suivis au compositeur
- Énoncé : une boucle (F24) ou une valeur suivie (F14) n'anime que `transform`, `opacity` et les variables qui les alimentent. Le tracé SVG (F17) reste natif : `pathLength="1"` + `stroke-dasharray: 1` + `stroke-dashoffset` en transition ponctuelle. `width`, `top`, `clip-path`, `d`, `font-*` sont permis en passage unique seulement. Le lint de build (M5-S10) refuse une propriété de paint dans une boucle sans `allow-paint` ; le runtime avertit en dev au-delà d'un seuil de mises à jour de style par frame (seuil à mesurer en I3), avec le renvoi vers la recette.
- Questions : Q4 ; Q2 ; Q3 ; Q9 ; Q10 ; Familles : F17, F14, F24
- Nature : global (lint + avertissement dev)
- Avantages : budget visible et testable ; SVG tracé sans JS ; le message d'erreur renvoie à la recette (Q10)
- Limites : `allow-paint` est une échappatoire ; le spinner circulaire (`loop` sur `stroke-dashoffset`) en a besoin, cas à documenter ; seuil provisoire
- Conflits : aucun connu ; complète M5-L02 (lint)
- Cohérence : même lint pour toutes les familles ; exception déclarée : spinner circulaire (F17 + F24) via `allow-paint`

### M3-R09 — Gestes : vitesse échantillonnée sur les pointeurs coalescés
- Énoncé : pour F18, le runtime calcule la vitesse du geste sur une fenêtre glissante de 100 ms à partir des `pointermove` (`getCoalescedEvents()` quand il existe, l'événement seul sinon), lue en phase lecture, puis transmise au handle avec `velocity.source` (`exact` si mesurée, `estimated` sinon). Capture du pointeur pour tout geste ; `touch-action` tiré du manifeste (`pan-y` pour un réordonnancement vertical).
- Questions : Q2 ; Familles : F18, F13
- Nature : instance (un geste) + global (boucle)
- Avantages : vitesse mesurée côté pointeur, indépendante du moteur ; un écouteur par racine
- Limites : `getCoalescedEvents` : Safari 18.2+ selon une source secondaire, et les événements coalescés n'ont ni `pointerId` ni `target` (filtrer par l'événement parent) ; l'alternative clavier est une action du handle, pas une variante du geste (WCAG 2.2, critère 2.5.7)
- Conflits : aucun connu ; complète M1-L05 (vitesse analytique du ressort) : deux sources, un même `velocity.source`
- Cohérence : même `velocity.source` que M5-S08 ; nouveauté : échantillonnage pointeur, justifiée par F18 ; exception déclarée : clavier = action

### M3-R10 — Texte : découpage après les polices, lignes recalculées au seul changement de largeur
- Énoncé : les découpages en lettres et mots sont faits une fois, après `document.fonts.ready`, et seulement quand l'élément approche de la vue (observateur). Les lignes dépendent de la largeur : recalcul sur `ResizeObserver` de l'hôte, et seulement si la largeur change le nombre de lignes. Les sous-nœuds portent `aria-hidden="true"` ; le texte source est lu une fois (`sr-only`). SSR : le HTML rend le texte entier, le découpage est une amélioration progressive.
- Questions : Q3 ; Familles : F16
- Nature : instance
- Avantages : pas de découpage faux après chargement de police ; recalcul borné ; pas de DOM coûteux hors vue
- Limites : `fonts.ready` ne couvre pas une police chargée après coup (`fonts.onloadingdone`) ; mesurer les lignes force un reflow, à faire en phase lecture ; au-delà d'un nombre de mots, découpage par lettre refusé (coût DOM), seuil à fixer
- Conflits : aucun connu ; même règle de visibilité que M3-R03
- Cohérence : même règle de visibilité et de phase d'écriture que M3-R03 ; exception déclarée : le découpage est ponctuel, sans abonné
