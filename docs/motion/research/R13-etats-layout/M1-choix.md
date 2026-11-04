# M1 — Choix de conception : états, layout, partagé, présence, pages (moteur et rendu)

Statut de chaque choix : proposé. Couverture : Q1 = L01 à L03 ; Q2 = L04 et L05 ; Q3 = L06 ; Q4 = L07 ; Q5 = L08 ; Q6 = L09 et L10.

### M1-L01 — Transaction de layout : géométrie lue avant mutation, une passe de lecture
- Énoncé : tout changement de layout passe par `motion.layout(portée, mutation)` ; la portée est lue en une seule passe de lecture (First), la mutation s'exécute synchrone, une seule passe de lecture (Last), puis les inversions (`transform`) sont écrites dans la frame unique (§8.0, M1-04).
- Familles : F7, F8, F10
- Nature : instance (la portée) ; le registre de géométrie reste global
- Avantages : une seule forçage de layout au lieu d'un par élément ; First est pris avant la mutation par construction ; même primitive pour HTML, Astro et les trois frameworks
- Limites : seuls les changements passés par la transaction sont capturés ; la mutation doit être synchrone ; un changement asynchrone (donnée reçue, redimensionnement) n'est pas couvert sans L02
- Conflits : M1-04 (frame unique) ; alternatives L02 (point de capture propre au framework) et L04
- Cohérence : réutilise le verbe `layout` (R12), la frame unique (§8.0 M1-04) et le handle commun. Nouveauté : `motion.layout(portée, mutation)` est la forme TS de `data-motion="layout"` pour les mutations impératives (HTML pur, Astro). Justifié car une mutation de DOM n'a pas d'attribut à lire ; les adaptateurs l'exposent sous la même surface (§8.0 bis #3)

### M1-L02 — Point de capture pré-mutation par environnement, du plus fiable au repli
- Énoncé : First est pris au point le plus proche de la mutation : Svelte `$effect.pre` (exécuté avant la mise à jour du DOM du composant) ; Angular `afterRender` en phase `EarlyRead` (à vérifier) ; React, sans point pré-mutation hors classe : capture dans le gestionnaire d'événement déclencheur, avant `setState`, ou store alimenté par le dernier `useLayoutEffect` ; HTML pur : L01 ; le store sert de repli.
- Familles : F7, F8, F3
- Nature : les deux (point de capture = instance ; store = global)
- Avantages : chaque adaptateur utilise ce que son framework offre, sans contexte partagé (C6) ; Svelte et Angular capturent réellement avant la mutation ; React reste sur des hooks
- Limites : le store est faux si la page a bougé entre deux commits (scroll, fontes, ancêtre animé) ; capturer dans l'événement ignore les changements qui n'en viennent pas ; trois chemins à tester séparément
- Conflits : aucun connu ; dépend de L01 (repli)
- Cohérence : même surface dans chaque environnement (§8.0 bis #3), aucune option nouvelle. Exception assumée : la mécanique diverge (Svelte et Angular capturent avant, React au déclencheur) ; l'auteur ne voit que `layout`, la divergence reste interne à l'adaptateur

### M1-L03 — Changements purement CSS : rien n'est surveillé, un miroir délégué pour le layout
- Énoncé : le moteur ne surveille jamais `:hover`, `:focus-visible` ou `:has()` ; ce qui est interpolable (`rotate`, `scale`, couleurs, `interpolate-size`) reste en `transition` CSS natif ; un changement de layout déclenché par un état CSS (`hover:justify-end`) passe par un miroir : un écouteur délégué à la racine (`pointerover`, `focusin`) pose `data-hover` ou `data-focus` sur la cible, puis L01 s'applique.
- Familles : F2, F7
- Nature : global (un écouteur par racine, pas par élément)
- Avantages : zéro JS pour les propriétés interpolables ; `:hover` devient observable sans polling ni MutationObserver ; les variants Tailwind (`data-[hover]:`) restent utilisables
- Limites : `justify-content` ne s'interpole pas, donc `hover:justify-end` ne s'anime pas sans miroir ; deux sources de vérité (`hover:` CSS et `data-hover` JS) ; les pointer events diffèrent du `:hover` sur tactile
- Conflits : M5-S04 et §4.3 (l'état vit dans les classes) : le miroir est un état écrit par JS, à trancher
- Cohérence : exception explicite à la règle HTML / Tailwind (§8.0 bis : Tailwind règle les états, l'attribut ne nomme que l'animation). `data-hover` et `data-focus` sont écrits par le moteur, pas par l'auteur ; ils reprennent la convention de `data-presence` (L10). Nouveauté justifiée : seul moyen de rendre `:hover` observable sans polling ; à valider avec M5 avant d'en faire une convention

### M1-L04 — `layout` élargi aux valeurs rendues : un changement d'état est une transition de valeur
- Énoncé : un changement d'état qui n'est pas géométrique (rotation, échelle, couleur, propriété enregistrée) relève du verbe `layout`, et la cible choisit la mécanique : géométrie → FLIP (L01) ; `transform` et `opacity` → WAAPI, ou ressort JS avec reprise (L05) ; le reste → `transition` CSS natif si aucune vitesse n'est exigée. Le moteur retenu est publié par cible dans le manifeste.
- Familles : F2, F7, F13
- Nature : instance
- Avantages : pas de huitième verbe, les sept verbes de R12 tiennent ; une seule primitive « avant, après, reprise » ; l'auteur écrit `layout` chaque fois que le DOM change d'état
- Limites : le nom `layout` devient impropre pour une couleur (risque C5 : un agent l'emploie partout) ; la sémantique de `carry` varie selon la cible ; à documenter dans le manifeste et dans `llms.txt`
- Conflits : M5-V01 (sept verbes), M1-V01 (classe de moteur par verbe) ; alternatives : un `state` en huitième verbe, ou `defineValue` sans verbe (moins lisible)
- Cohérence : réutilise `layout` (verbe), les options `carry` / `restart` et le défaut par verbe (§8.0 bis #4, R12 M1-V03). Exception à la convention « un verbe = une forme de mouvement » : `layout` couvre maintenant des cibles non géométriques. Justifié par le nombre fixe de verbes ; la table cible → mécanique est publiée dans le manifeste pour que cette exception reste lisible

### M1-L05 — Reprise par vitesse : vitesse exacte d'un ressort analytique, estimée sinon
- Énoncé : un ressort est transmis au moteur par ses paramètres (raideur, amortissement, masse), jamais seulement en `linear()` ; à l'interruption, la vitesse est calculée à partir de la solution analytique à l'instant courant (`velocity.source: exact`) et transmise au ressort JS ; une courbe `linear()` importée ou une WAAPI sans paramètres donne `estimated` (différence finie sur l'échantillonnage) ou `unavailable`.
- Familles : F1, F13, F18
- Nature : instance
- Avantages : pas de saut de vitesse en `carry` pour les ressorts, puisque WAAPI n'expose pas la vitesse ; le `linear()` reste le chemin natif quand rien n'interrompt ; le handle (M5-S08) reçoit une valeur honnête
- Limites : la solution analytique existe pour un ressort linéaire à un degré de liberté, pas pour une courbe de designer ; la bascule natif → JS change de moteur en cours de mouvement ; la vitesse mesurée est celle du `transform` seul, pas celle perçue si le transform est composé
- Conflits : M1-V02 et M1-V03 (`carry` force le JS) ; M5-S08 ; R12 M5-V02 (défauts par verbe)
- Cohérence : réutilise `carry`, `velocity.source` (exact / estimated / unavailable, §8.0 bis #4) et le ressort par token (R12 M1-V05) sans champ nouveau. Convention imposée aux tokens : un ressort garde ses paramètres physiques, ce qui était déjà requis par M1-V05 ; aucune exception

### M1-L06 — Panneau monté : hauteur `auto` par `grid-template-rows` 0fr → 1fr, jamais de `display:none` pendant l'animation
- Énoncé : un panneau reste dans le DOM et se referme par transition de `grid-template-rows` (0fr → 1fr) sur un parent `display:grid`, sans JS ; `interpolate-size` (Chromium) n'est qu'une amélioration ; le repli JS mesure `scrollHeight` et anime `height` en px ; `display:none` n'est jamais posé pendant une animation, car il annule les `CSSAnimation` et Firefox ne transitionne pas vers lui (R1 §3.3, R4 §1.1) ; la fermeture finale passe par `inert` et `hidden="until-found"` (à vérifier par moteur).
- Familles : F2, F3, F7, F20
- Nature : global pour le CSS (une règle), instance pour le repli JS
- Avantages : hauteur `auto` sans JS dans les moteurs de `defaults` (à vérifier contre R1) ; le panneau reste monté, donc `inert` et l'arbre d'accessibilité restent cohérents ; une seule règle pour accordéon, disclosure et collapse
- Limites : la hauteur est animée en layout, coût par frame acceptable pour un panneau mais pas pour une liste ; le contenu fermé reste dans l'arbre sans `inert` ou `hidden` ; `hidden="until-found"` n'est pas vérifié partout
- Conflits : L10 (fin de présence) ; M5-S04 (états `data-state`)
- Cohérence : exception explicite : ce panneau n'a pas de verbe ni d'attribut `data-motion`, il est du CSS pur (classes ou variants Tailwind, C3). Réutilise `data-state` (M5-S04), `inert` (§8.0 M4-03) et la règle « jamais de `display:none` pendant une animation » commune avec L10. Le repli JS suit le défaut `restart` ; à confirmer par M5 pour l'accordéon

### M1-L07 — Élément partagé : identité par attribut, nœud sortant gardé vivant jusqu'à `finished`
- Énoncé : `data-motion-layout-id="<id>"` désigne l'identité ; le nœud sortant reste dans le DOM, en `inert`, jusqu'à `finished` (L10) ; l'entrant part de la géométrie du sortant (FLIP croisé) ; le registre est global par document, l'unicité est requise par portée de page ; sans homologue, l'entrant suit `appear` sans FLIP.
- Familles : F8, F3, F9
- Nature : les deux (identité globale, animation d'instance)
- Avantages : marche entre composants et entre îles Astro, puisque le DOM est le seul contexte (C6) ; pas de snapshot image, donc la géométrie reste interruptible ; un seul mécanisme pour élément partagé et layout simple
- Limites : deux nœuds vivants pendant la transition ; un `id` dupliqué est une erreur silencieuse si le runtime ne la signale pas (C5) ; dépend d'un choix de présence
- Conflits : L01, L10 ; alternative native : `view-transition-name` avec `match-element` (même document, une transition à la fois, snapshot image)
- Cohérence : réutilise la grammaire `data-motion-<option>` (ici `data-motion-layout-id`), l'identité registre global (§8.0 M5-07) et la forme `layoutId` des adaptateurs (§8.0 bis #3). Exception : l'attribut porte une valeur libre (un id), alors que §8.0 bis réserve `data-motion` à une référence. Justifié : une identité n'est pas une animation ; à faire valider, sinon il faut un registre de noms

### M1-L08 — Transitions de page : View Transitions encapsulées par le runtime, repli sans sortie JS
- Énoncé : une navigation same-document passe par `motion.navigate(mise à jour)` qui appelle `document.startViewTransition` si disponible et exécute la mise à jour dans son callback ; les noms viennent des `data-motion-layout-id` (L07) ; cross-document : natif seul (`@view-transition { navigation: auto }`), aucune sortie en JS, car la page se décharge ; sans VT, une entrée `appear` au chargement et pas de sortie.
- Familles : F9, F8, F12
- Nature : global (un runtime par page, une transition active à la fois)
- Avantages : une seule mécanique pour Astro ClientRouter, SvelteKit, les routeurs Angular et React ; aucun coût par frame pendant la transition ; pas de sortie JS cross-document à faire tenir avant le déchargement
- Limites : une transition document-scopée chasse la précédente (`skipTransition`) ; snapshots en image : pas de reprise par vitesse ni de `seek` (L05 inapplicable) ; Firefox sans cross-document (R1 §3.6) ; la mise à jour doit être synchrone dans le callback
- Conflits : L05 ; R12 M3-V03 (`scrollTo` action, non verbe)
- Cohérence : réutilise la décision « action, pas verbe » (R12 M3-V03) et la forme de L01 (`motion.navigate` comme `motion.layout`). Nouveautés justifiées : une navigation n'a pas d'élément porteur ; `@view-transition { navigation: auto }` est une règle CSS que le plugin Tailwind doit générer (C14), donc hors grammaire `data-motion`

### M1-L09 — Liste : la sortie quitte le flux à sa dernière géométrie
- Énoncé : un élément en sortie passe en `position: absolute` à sa position mesurée (L01), ce qui retire immédiatement sa place du flux ; les frères se réorganisent en FLIP pendant la sortie ; le délai d'entrée suit l'indice visible, sans compter les sortants (`sibling-index()` compte les nœuds du DOM, donc les sortants aussi, et ne peut pas les exclure).
- Familles : F10, F3
- Nature : instance (la liste)
- Avantages : les frères ne sautent pas pendant une sortie ; l'ordre d'entrée est celui que l'utilisateur voit ; sorties et entrées en parallèle, sans file d'attente
- Limites : `position: absolute` peut casser largeur, marges ou grille du sortant ; le délai est calculé en JS, donc hors CSS pur ; la liste doit connaître ses sortants
- Conflits : R12 M5-V05 et M5-V02 (stagger en token, défauts par verbe) ; alternative : sortie dans le flux (les frères sautent)
- Cohérence : réutilise `disappear`, `layout` (réordonnancement, F10), le token `stagger` (R12 M5-V05). Exception au défaut de `disappear` : dans une liste, la sortie quitte le flux (pas ailleurs). Exception au `stagger` : l'indice compté exclut les sortants, alors que `sibling-index()` les compte. Les deux écarts sont à inscrire dans le manifeste

### M1-L10 — Fin de présence : `finished` des WAAPI du sous-arbre, `data-presence` écrit par le moteur
- Énoncé : la sortie se termine quand `finished` est résolu pour toutes les animations du sous-arbre (`el.getAnimations({ subtree: true })`), jamais sur `transitionend` ou `animationend`, qui ne partent pas si rien ne change ; un garde-fou temporel borne l'attente ; le moteur pose `data-presence="entering|present|exiting"` avant la première frame ; un `display:none` qui annule une animation la fait passer en `cancelled` (résolue, jamais rejetée, §8.0 M5-08) ; en mouvement réduit, la sortie est un fondu ou `instant` (R12 M1-V04) sans attente visible.
- Familles : F3, F20, F21
- Nature : instance (le sous-arbre) ; le garde-fou est global
- Avantages : un parent qui se démonte attend ses enfants sans présence propre ; `data-presence` est stylable par variants (`data-[presence=exiting]:`) et lisible par un agent ; fonctionne sans framework
- Limites : `getAnimations` force un recalcul de style, coût ponctuel à la sortie ; `data-presence` écrit par JS entre en tension avec §4.3 (l'état vit dans les classes) ; le garde-fou masque une animation bloquée au lieu de la signaler
- Conflits : R12 M1-V04 (rendu réduit) ; M4-03 (présence par framework, à confronter) ; L02, L07
- Cohérence : réutilise `disappear`, le rendu réduit par verbe (R12 M1-V04), le handle `finished` / `cancelled` (§8.0 M5-08) et `inert` (§8.0 M4-03). Exception à §4.3 et à §8.0 bis : `data-presence` est écrit par le moteur, que l'auteur ne peut pas poser à la main. Justifié car la présence est un état de cycle de vie qu'une classe ne peut pas exprimer ; même statut que `data-hover` (L03). Le garde-fou temporel est un réglage global, à publier dans le manifeste
