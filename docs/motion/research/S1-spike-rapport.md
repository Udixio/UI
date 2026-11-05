# Rapport S1 — spike jetable `@udixio/motion`

Code et sorties brutes : `spikes/s1/` (`q1.*`, `q1b.cjs`, `q2*.{html,cjs}`, `q3.*`, `spring.js`, `*.out.json`).
Lancement : `node spikes/s1/<script>.cjs` (Playwright 1.64 pris dans `node_modules/.pnpm`, anime.js 4.5.0 servi localement).

## Environnement

| Moteur | Version | Statut |
|---|---|---|
| Chromium | 156.0.8078.4 | OK. `animation-timeline: view()`, `animation-range`, `animation-duration: auto`, `linear()` supportés |
| Firefox | 157.0 | OK. **Pas de scroll-driven** (`CSS.supports('animation-timeline','view()')` = false, `duration: auto` = false, `animation-range` = false) ; `linear()` supporté |
| WebKit | 2370 | **Échec au lancement** (`browserType.launch` vide, libs système manquantes). Aucune mesure WebKit/Safari : tout ce qui concerne Safari reste non vérifié (dont WebKit 199529, test 7 de R4) |

Conséquence : « natif » = Chromium uniquement. Le fallback est mesuré sur Chromium (forcé) et Firefox (naturel), et comparé à la référence native Chromium. Les temps Firefox sont à granularité 1 ms (timer réduit), donc les coûts Firefox sont indicatifs.

---

## Q1 — Contrat de variables CSS (§4.2) : **GO, avec 3 conditions**

### Protocole
`q1.html` : CSS écrit à la main équivalent à des classes Tailwind (`.udx-fast`, `.data-open\:slow[data-state=open]`, `.group[data-state=open] .group-data-open\:far`, `@media (min-width:768px) {.md\:long}`, `@media (prefers-reduced-motion)`, `:hover`), posant `--udx-motion-duration|easing|distance`. Lecture par `getComputedStyle(el).getPropertyValue(...)` depuis le JS. Variantes enregistrées par `@property` (`<time>`) et non enregistrées. Coût : N ∈ {100, 1000} éléments × 1/5/10 variables, médiane de 7 répétitions, style propre / sale (classe changée sur le conteneur avant) / lectures entrelacées avec écriture par élément / groupées puis écritures / cache `Map`. Cas pathologique en plus (`q1b.cjs`) : écriture qui invalide tout (classe sur le conteneur) entre deux lectures.

### Résultats de justesse (identiques Chromium et Firefox 157)
- Classe de base : `200ms`, easing `cubic-bezier(.2,0,0,1)` lus tels quels.
- Variant `data-state` : `closed` -> `200ms`, `open` -> `500ms`, retour `closed` -> `200ms`. Lecture correcte immédiatement après la mutation de l'attribut (le `getComputedStyle` force le recalcul).
- Variant d'ancêtre (`group-data-open`) : vide quand fermé, `64px` ouvert.
- Media query `md:` : viewport 600 -> `200ms`, 900 -> `900ms` après `setViewportSize` (lecture à la demande, aucun polling nécessaire). `prefers-reduced-motion: reduce` émulé -> `0ms`. `:hover` (souris réelle) -> `600ms`.
- Héritage : variable posée sur le parent lue sur enfant et petit-enfant non animés (`200ms`). `@property ... inherits:false` coupe l'héritage (enfant = `0s`, parent `0.7s`). Une variable **non enregistrée hérite toujours**.
- **Forme des valeurs** (non enregistrée / enregistrée `<time>`) : `calc(100ms*3)` -> brut `"calc(100ms*3)"` (non parsable) / normalisé `"0.3s"` ; `.3s` -> brut `".3s"` / `"0.3s"` ; `   250ms   ` -> brut `"250ms"` (espaces rognés) / `"0.25s"`. Un parseur naïf `^[\d.]+(ms|s)$` échoue sur `calc()` en brut et réussit en enregistré, dans les deux moteurs.
- **Shadow root** : une `@property` déclarée *dans* la shadow root ne type pas (valeur lue `".3s"`, non normalisée), alors qu'une `@property` déclarée au niveau du document type bien les variables posées dans une shadow root (`"0.4s"`). Même comportement Chromium et Firefox.

### Coût de lecture (ms pour le lot complet, médiane ; Chromium / Firefox)
| N × variables | propre | sale | entrelacé (écriture par élément) | groupé |
|---|---|---|---|---|
| 100 × 1 | 0,1 / 0 | 0,2 / 0 | 0,3 / 1 | 0,3 / 0 |
| 100 × 10 | 0,6 / 1 | 0,5 / 1 | 0,6 / 1 | 0,7 / 1 |
| 1000 × 1 | 1,1 / 3 | 1,1 / 3 | 2,7 / 10 | 2,4 / 12 |
| 1000 × 5 | 3,2 / 15 | 3,6 / 13 | 5,2 / 28 | 5,5 / 15 |
| 1000 × 10 | 5,1 / 25 | 5,4 / 30 | 6,2 / 45 | 6,2 / 39 |

Un cache `Map` fait 0,2 à 0,6 ms (Chromium) pour 1000 × 10 (mais ne lit rien : il mesure seulement le coût de contournement). Soit ~0,5 µs par lecture en Chromium, ~2,5 µs en Firefox.

**Cas pathologique** (`q1b.cjs`, une écriture qui invalide tous les éléments entre chaque lecture, 1 variable) : 100 éléments 15,6 ms, 300 → 136 ms, **1000 → 1445 ms** en Chromium (Firefox : 17 / 86 / 715 ms). Quadratique, mais uniquement quand l'écriture entrelacée invalide le style de *tous* les éléments lus. Les écritures par élément (cas courant) restent dans la zone du tableau ci-dessus.

### Limites du protocole
Éléments simples (une variable posée par classe, peu de règles) : le partage de style rend la lecture « sale » presque aussi bon marché que la « propre ». Les traces Chromium (Recalculate Style) et LoAF n'ont pas été relevées. Détection sans polling (test 15 de R4), `transition` sur `@property` et `MutationObserver` : **non faite**.

### Conclusion Q1 : GO
Le moteur JS peut ne lire que le style calculé : les variants `data-state`, d'ancêtre, media et `:hover` fonctionnent sans code. Conditions :
1. **Enregistrer les `--udx-motion-*` lus par JS via `@property` au niveau du document** (jamais dans la shadow root) : seule façon d'obtenir une valeur normalisée (`calc()` résolu, `s`) et un `inherits:false` effectif.
2. **Regrouper lectures puis écritures** ; ne jamais lire entre des écritures qui invalident un ancêtre commun (quadratique mesuré : 1,4 s pour 1000 éléments).
3. Lire à la demande (au déclenchement), pas en boucle de frame.

Impact spec : §4.2 à compléter (« variables enregistrées `@property`, déclarées au niveau document ») ; confirmer le préfixe `--udx-motion-*` (I07) ; ajouter au contrat provider (§8.3) la règle « lectures groupées ».

---

## Q2 — Fidélité du pilotage de `CSSAnimation` (§4.7) : **GO, avec conditions précises**

### Protocole
`q2.html` : 3 sujets dans un document de 2700 px de défilement max (viewport 1000×700), même config pour les deux modes.
- t1 : `entry 0% -> cover 40%`, `linear`, `fill both` ; t2 : `contain 0% -> contain 100%`, `ease-in-out`, `fill both` ; t3 : dernier élément de la page, `entry 0% -> entry 100%`, `linear`, **`fill none`**, plage finissant exactement au défilement maximal.
- Keyframes `udx-reveal` : `opacity 0 -> 1`, `translateY(60px) scale(.9) -> none`.
- **Natif** : `animation-duration:auto; animation-timeline:view(); animation-range`. **Fallback** : même keyframes, `animation-duration:1000ms` sans timeline ; JS met la `CSSAnimation` en pause et règle `currentTime = p × durée` à chaque événement `scroll`, avec `p` calculé par l'algorithme R3 §4 (axe y, sans inset ni sticky : `cover`, `contain`, `entry`, résolution `nom + pourcentage`).
- 41 positions de défilement uniformes (0 à 2700), 3 relectures de 2 rAF après chaque `scrollTo` ; relevé `opacity`, `transform` (scale, translateY) du style calculé. Écart = max |natif - fallback| par propriété.
- Variantes du fallback : (a) **v1 « correcte »** (poignée mise en cache, progression non bornée -> `currentTime=-1` / `D+1` pour laisser le `fill` décider, fin inclusive au bord de timeline par `D-0,001 ms`, `P` par `offsetTop`) ; (b) `P` par `getBoundingClientRect` ; (c) **naïve** (`getAnimations()` à chaque tick, `p` borné dans [0,1]).
- `q2b.*` : cas divergents (changement d'`animation-name`, durée, play-state, `cancel()`, événements, durée absente, natif avec durée explicite/délai, cascade).

### Résultats de fidélité (écart max sur 41 positions × 3 sujets)
| Variante | Chromium (vs natif Chromium) | Firefox 157 (vs natif Chromium) |
|---|---|---|
| v1 (offsetTop, handle en cache, non borné) | **0** (opacity, scale, translateY, sur t1, t2, t3) | **0** |
| `P` par `getBoundingClientRect` | opacity 0,19-0,24 ; translateY 11,7-14,2 px | non mesuré |
| naïve (borné, `getAnimations` à chaque tick) | t1 opacity 0,028 / ty 1,67 px (une position, y=540, reproductible, cause non élucidée) ; t2 0,086 / 5,1 px ; **t3 opacity 1,0 / ty 60 px (erreur totale)** | idem Chromium |

Les valeurs natives et fallback coïncident donc à la précision d'affichage *au repos* (échantillon pris 6 frames après le défilement), y compris easing par keyframe (t2), `fill none` aux deux bords (t3) et bord de timeline inclusif. Le pilotage de `currentTime` est donc fidèle ; les divergences viennent de l'algorithme de progression et de la gestion du handle, pas du principe.

Pièges chiffrés :
- **`getBoundingClientRect` donne un `P` faux** quand le sujet porte lui-même le `transform` animé (la translation de 60 px décale le rect) : jusqu'à 14 px / 0,24 d'opacité. Il faut une position non transformée (somme des `offsetTop`) — conforme à R3 §4.
- **`fill: none` + `currentTime` borné** : l'élément est faux aux deux bords (t3 : 0 au lieu de 1 avant la plage ; en natif, avant la plage = valeur de base). Et à `currentTime = D`, l'animation passe « finie, sans fill » et **disparaît de `getAnimations()`** (observé : `null`, Chromium et Firefox) : le pilote ne peut plus la rattraper s'il ne garde pas la poignée.
- Natif `fill:none` au défilement max : dernière image conservée (fin inclusive), reproduite par `currentTime = D - 0,001`.

### Cas qui divergent ou qui cassent (`q2b`)
| Cas | Chromium 156 | Firefox 157 |
|---|---|---|
| **Changement d'`animation-name`** par variant (`data-state`) | Nouvelle instance ; ancienne `idle` ; événements `animationcancel` + `animationstart`. Nouvelle instance en lecture à t=0 au premier rAF si personne ne réagit. Un `MutationObserver` ré-acquiert et met en pause **dans la même micro-tâche** : les 3 frames suivantes montrent la bonne valeur (0,4), **aucune frame à t=0** | Idem (ordre des événements inversé : start puis cancel) |
| **`--udx-motion-duration` changé pendant la pause** | `animation-duration` calculé = `2s` mais **`getComputedTiming().duration` reste 1000** (changement ignoré) ; `currentTime` conservé | Durée effective passe à 2000 ; `currentTime` conservé |
| `updateTiming({duration})` | Prend la main (3000) ; un changement de variable ensuite est ignoré | Idem |
| `animation-play-state` basculé par une classe (paused puis running) après `pause()` | Le JS gagne : reste `paused`, `currentTime` conservé, même objet | Idem |
| **`cancel()`** | Plus aucune animation (`getAnimations()` vide), **le CSS ne la recrée pas** même après 2 rAF ; il faut un changement d'`animation-name` (via `none`) pour la recréer | Idem |
| Scrub aller-retour à travers les bords (9 seeks) | `animationend`/`animationstart` émis à chaque changement de phase (3 paires) ; **`finished` reste en attente** | Idem |
| `duration: auto` sans durée de repli (moteur sans support) | n/a | `animation-duration` calculé `0s`, animation `finished` immédiatement, `fill both` -> **image finale (opacity 1) dès le premier rendu**, aucun effet visible, aucune valeur intermédiaire possible |
| `animation-timeline` lisible ? | Oui (`"view()"`) ; `animation-range` calculé `"normal"` malgré la valeur posée (ne pas s'y fier pour le lire) | Propriété absente de `getComputedStyle` ; **copie dans une variable personnalisée lisible** (`"view()"`) |
| Natif, **durée explicite** `1s` + timeline | Traitée comme `auto` (mêmes valeurs que `auto`) | n/a |
| Natif, **délai** `1s 0.5s` + timeline | **Le délai n'est pas ignoré** : proportionnel (délai = 1/3 de la plage, durée = 2/3 ; opacités 0, 0, 0,333, 0,75, 1 aux y = 200…560). Avec `auto 0.5s`, délai ignoré (comme R3) | n/a |
| Cascade : `animation` (raccourci) posé **après** `animation-timeline` par deux classes | Timeline réinitialisée : `DocumentTimeline`, durée 0, opacity 1 partout | n/a |

### Non mesuré
Retard visuel du fallback en défilement réel / CPU ralenti (test 18), flicker à t=0 en capture d'écran, polyfill flackr (21), `anime.js onScroll().sync` (22), Motion (23), WebKit/Safari, version `defaults` ancienne.

### Conclusion Q2 : GO
Piloter la `CSSAnimation` existante donne une fidélité exacte au repos (écart 0 en opacity, scale, translateY, 41 positions, Chromium et Firefox), une seule source de vérité de keyframes, easings par keyframe inclus. Conditions à inscrire dans le contrat du fallback :
1. **Poignée mise en cache** ; ne pas dépendre de `getAnimations()` (un `fill:none` terminé en disparaît).
2. **Mapping non borné** (avant -> `currentTime` négatif, après -> `> D`) pour laisser le `fill` trancher, `D - epsilon` quand la plage finit au bord de timeline.
3. `P` mesuré **sans transform** (`offsetTop`, pas `getBoundingClientRect`).
4. **Lire `D` (`getComputedTiming().duration`) à chaque tick** ; ne jamais le supposer (Chromium ignore le changement de variable durant la pause, Firefox le suit).
5. **Ré-acquisition par `MutationObserver`** sur les attributs/classes pour les changements d'`animation-name` ; `cancel()` est définitif.
6. Durée de repli explicite **non nulle** requise (`0s` -> image finale immédiate).
7. Écouteurs `animationstart/end` : spurious pendant le scrub (documenter).
8. Le natif interprète les délais en secondes comme proportions : si une spec porte un délai, le fallback doit reproduire `délai/(délai+durée)`.
9. Un variant qui pose `animation` après `animation-timeline` annule la timeline : ordre de cascade à garantir dans les presets.

Impact spec : §4.7 confirmé avec ces 9 conditions ; R3 §3.3 corrigé (délai non ignoré en Chromium pour une durée explicite) ; I2 (tolérances provisoires) : on peut viser **0** au repos, la tolérance ne concerne que le retard de frame (non mesuré).

---

## Q3 — Reprise `carry` native (correction I02) : **GO nuancé**

### Protocole (`q3.html`, `q3waapi` / `q3live` / `q3anime`)
1. WAAPI : `translateX(0 -> 300px)`, 600 ms, `cubic-bezier(.42,1.67,.21,.9)` (fast spatial officiel), mise en pause à 200 ms, lecture de la valeur calculée `V` (comparée à la valeur analytique de la courbe), vitesse par différences finies à ±1 ms ; puis `cancel()` et nouvelle animation `V -> 150`. Contrôle : valeur après `cancel()` sans relance.
2. WAAPI en direct : `0 -> 300 px`, 1000 ms linéaire, bascule à t ≈ 400 ms dans un rAF (lecture de `V`, `cancel()`, `animate(V -> 0)` dans la même tâche) ; enregistrement des valeurs à chaque frame.
3. Ressort anime.js 4.5 (`spring({stiffness:800, damping:33,941})`, soit ζ = 0,6 ; `animate` sur objet, `seek`) interrompu à 100 ms, relancé vers 150 depuis la valeur courante, avec `velocity` (normalisée = v / distance) et sans.

### Résultats (identiques Chromium et Firefox)
| Mesure | Valeur |
|---|---|
| Valeur calculée lue vs courbe analytique | écart **-0,0003 px** (V = 322,27 px à 200 ms) |
| Contrôle : `cancel()` sans relance | valeur retombe à 0 (saut de 322 px) |
| **Saut de position au raccord** (première valeur de la nouvelle animation - V) | **0 px** |
| Direct (linéaire, 5 px/frame, dt 16,6 ms) : deltas par frame autour du raccord | Chromium : 4,98 · 4,97 · 5,05 · **-2,00** · -2,00 · -2,01 ; Firefox : 5,12 · 4,85 · 5,13 · **-1,95** · -2,07 : aucune frame manquante ni doublée, position continue |
| Vitesse juste avant (ease cubic-bezier fast spatial, 200 ms) | +389 px/s |
| Vitesse initiale de la nouvelle animation (même easing, cible 150) | **-1142 px/s** (inversion, pente initiale de la courbe) ; avec `cubic-bezier(.2,0,0,1)` : -4 px/s |
| anime.js ressort : valeur à 100 ms vs analytique | écart 0 px (V = 303,33 px, vitesse 1496,5 px/s) |
| anime.js reprise **sans** vitesse (v0 mesurée à t=2 ms) | -236 px/s (accélération du ressort seule) |
| anime.js reprise **avec** `velocity` | **+1160 px/s** à t=2 ms (vitesse transmise 1497 - 245 (raideur) - 101 (amortissement) ≈ 1151 attendu) |
| `linear()` régénéré avec vitesse initiale (analytique) | vitesse initiale 1411 px/s mesurée sur 1 ms (la fonction accepte `v0`, cf. `spring()` de `spring.js`) |
| Durée de règlement du ressort repris avec vitesse | 680 ms (660 sans) |

### Conclusion Q3 : GO pour la correction I02, avec une nuance de formulation
- **Position** : la reprise native depuis la valeur calculée est exacte (0 px de saut, lecture à 3e-4 px de la courbe théorique), dans les deux moteurs, y compris en direct dans la même tâche : aucun saut visible.
- **Vitesse** : elle n'est **pas** transmise. Une relance WAAPI repart avec la pente initiale de son easing (de +389 à -1142 px/s dans l'exemple) : discontinuité de vitesse, perceptible surtout pour les ressorts / gestes. C'est exactement la frontière posée par I02 : `carry` sans ressort reste natif (position continue) ; la **vitesse n'est reprise que par un ressort** (anime.js `velocity`, ou `linear()` régénéré avec `v0`).
- Formulation à retenir dans la spec : « `carry` natif = continuité de position, pas de vitesse ; `carry` avec vitesse requiert le ressort JS ».

Impact spec : I02 / §8.0 bis #4 confirmé. Ajouter la table : natif = position, ressort = position + vitesse ; la vitesse d'entrée d'anime.js est normalisée par la distance (`v / (cible - départ)`).

---

## Q4 — Ressort M3 en `linear()` : **GO**

### Protocole (`spring.js`, `q3.html` fonction `q4`)
Pour chacun des 6 tokens Expressive de R17 (ζ / raideur : fast spatial 0,6/800, default 0,8/380, slow 0,8/200, effects 1/3800, 1/1600, 1/800) :
- Référence = solution analytique d'un ressort masse 1 (`x(t) = 1 - e^{-ζωt}(cos ωd t + ((ζω - v0)/ωd) sin ωd t)`, ω = √k).
- **anime.js** : `spring({stiffness: k, damping: 2ζ√k})`, courbe `ease(t/T)` avec `T = settlingDuration`.
- **Conversion officielle** : `cubic-bezier` + durée de R17, valeur 1 après la durée.
- **`linear()`** : échantillonnage 1 ms, simplification Ramer-Douglas-Peucker (tolérance 0,002 et 0,0005, positions explicites) ou stops équidistants (24, 48) ; durée = temps de stabilisation à 0,1 %.
- Erreur = max |courbe - analytique| sur une grille de 1 ms. Vérification navigateur : `getComputedTiming().progress` d'une animation avec le `linear()` généré, comparé à une interpolation par morceaux locale (101 points).

### Résultats (identiques Chromium et Firefox)
| Token | Stabilisation 1 % / 0,1 % (ms) | Dépassement | anime.js : durée / écart vs analytique | Officiel : durée / **erreur max** | `linear()` RDP 0,002 : stops / octets / erreur |
|---|---|---|---|---|---|
| fast spatial | 222 / 360 | 9,5 % | 660 ms / ≤ 1e-5 | 350 ms / **0,102** (à 21 ms) | 26 / 361 / 0,0020 |
| default spatial | 326 / 435 | 1,5 % | 660 ms / 5e-5 | 500 ms / 0,070 | 21 / 289 / 0,0016 |
| slow spatial | 450 / 600 | 1,5 % | 840 ms / 1,2e-4 | 650 ms / 0,084 | 21 / 277 / 0,0016 |
| fast effects | 108 / 150 | 0 | 380 ms / ≤ 1e-5 | 150 ms / 0,074 | 21 / 264 / 0,0017 |
| default effects | 166 / 231 | 0 | 460 ms / ≤ 1e-5 | 200 ms / 0,059 | 21 / 288 / 0,0017 |
| slow effects | 235 / 327 | 0 | 560 ms / ≤ 1e-5 | 300 ms / 0,063 | 21 / 286 / 0,0016 |

Autres granularités de `linear()` (fast spatial) : RDP 0,0005 -> 58 stops, 819 octets, erreur 0,00096 ; équidistant 24 stops -> erreur 0,018 ; 48 stops -> 0,0051. À 0,0016-0,0020 d'erreur, la RDP à positions explicites est ~2,5 fois plus compacte que l'équidistant à erreur égale (48 stops : 0,005).

Exemple (fast spatial, tolérance 0,002, 360 ms) : `linear(0, 0.0061 1.11%, 0.0292 2.5%, 0.0665 3.89%, 0.1259 5.56%, 0.1847 6.94%, 0.2492 8.33%, 0.5274 13.89%, 0.6462 16.39%, 0.7535 18.89%, 0.8462 21.39%, 0.923 23.89%, 0.9839 26.39%, 1.0296 28.89%, 1.0645 31.67%, 1.0802 33.61%, 1.0898 35.56%, 1.0942 37.5%, 1.0942 39.72%, 1.0805 44.72%, 1.0191 58.61%, 1.0065 62.78%, 0.998 66.94%, 0.9925 71.94%, 0.991 77.78%, 1)`.

Navigateurs : le `linear()` à dépassement (valeurs > 1) est rendu fidèlement : écart entre `getComputedTiming().progress` et l'interpolation attendue ≤ 2,4e-4 (RDP) et 5e-5 (équidistant), `cubic-bezier` hors [0,1] écart 0, sur Chromium et Firefox. WebKit non testé.

### Constats
- **anime.js reproduit le ressort exact** (écart ≤ 1,2e-4) en prenant `damping = 2ζ√stiffness`. Mais sa **durée est ~300 ms plus longue** que la stabilisation utile (fast spatial 660 ms contre 360 ms à 0,1 %, effects 380 ms contre 150 ms) : seuil de repos 0,0005 + queue de repos de 200 ms intégrée.
- **La conversion officielle cubic-bezier + durée est une approximation grossière du ressort** : erreur max 6 à 10 % de la distance, atteinte très tôt (9-40 ms, la courbe monte plus vite que le ressort). La durée officielle tombe à peu près sur la stabilisation à 0,1 % (350 contre 360 ms pour fast spatial) mais pas pour les spatials lents (650 contre 600 ms).
- Le `linear()` dérivé tient à **0,2 % d'erreur** avec 21 à 26 stops (~300 octets) : 30 à 50 fois plus précis que la courbe officielle pour le même ordre de poids, nativement sur le compositeur.

### Conclusion Q4 : GO
Dériver un `linear()` au build à partir des paramètres physiques (I25) est faisable, précis (0,2 %, ajustable) et compact. Il remplace avantageusement la conversion cubic-bezier officielle comme palier natif ; celle-ci reste utilisable comme repli pour Chrome 109 (sans `linear()`). Le `linear()` ne peut pas porter de vitesse initiale dynamique sans régénération à l'exécution (possible, formule `v0` validée, mais coût de génération non mesuré).

Impact spec : I25 / R17 : durée du `linear()` = temps de stabilisation à 0,1 % (valeur à stocker dans le token, p. ex. 360 ms pour fast spatial) ; ne pas reprendre `settlingDuration` d'anime.js pour dimensionner la durée côté natif ; préciser que `damping` d'anime.js = `2 × ratio × √raideur`.

---

## Synthèse go / no-go

| # | Question | Verdict |
|---|---|---|
| 1 | Contrat de variables CSS lu par `getComputedStyle` (§4.2) | **GO** (variables `@property` au niveau document, lectures groupées) |
| 2 | Pilotage de `CSSAnimation` pour le scroll-driven (§4.7) | **GO** avec 9 conditions (écart 0 au repos ; piège `fill:none`, `getAnimations`, `getBoundingClientRect`) |
| 3 | `carry` natif (I02) | **GO nuancé** : position exacte, vitesse non reprise sans ressort |
| 4 | Ressort M3 en `linear()` | **GO** (erreur 0,2 %, 21-26 stops ; cubic-bezier officiel : 6-10 % d'erreur) |

Non couvert : WebKit/Safari (lancement impossible), retard de frame réel du fallback (test 18), détection sans polling (test 15), polyfill, anime.js `onScroll().sync`, navigateurs anciens.
