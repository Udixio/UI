# Spike S2 — Coordination par le DOM entre îles Astro (React + Svelte)

Spike jetable du projet `@udixio/motion`. Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§4.4, §7 S2, §8.0, §8.1 bis Q4/Q5, §8.1 quater I10/I17/I18, faits R16).

## 0. Dispositif

- **Site** : `spikes/s2/site/` (Astro 7.3.2 + `@astrojs/react` 6 / React 19.3 + `@astrojs/svelte` 9 / Svelte 5.57 + `ClientRouter`). Écart au sujet : le worktree part de `main`, où `apps/doc` n'a ni Svelte ni `node_modules` ; le spike est donc un petit site autonome qui réutilise (lien symbolique ignoré par git) les `node_modules` du dépôt principal. Aucune dépendance installée, aucun commit.
- **Serveur** : `astro dev` (build de production : les chunks client se construisent, ce qui confirme deux copies distinctes du module dans les bundles — `motion-a.*.js` et la copie Svelte embarquée dans `SvelteIsland.*.js` —, mais l'étape de prérendu échoue dans ce montage en liens symboliques ; les mesures sont donc faites sur le serveur de dev, non minifié : les temps d'hydratation sont des majorants).
- **Noyau jetable** : `site/src/lib/motion-core.template.js` (runtime global `Symbol.for('udixio.motion@1')`, compteur de références, frame unique lecture/écriture qui s'arrête à file vide, cache de géométrie I10 avec ResizeObserver/MutationObserver, registre `data-motion-shared`, `swap()` en deux rendus VT / FLIP-WAAPI). `gen.mjs` en tire **deux copies physiquement distinctes** (`motion-a.js` dans l'île React, `motion-b.js` dans l'île Svelte).
- **Pages** : `spike-s2-load` (React `client:load` + Svelte `client:load`), `spike-s2` (Svelte `client:visible` dans le viewport), `spike-s2-idle` (`client:idle`), `spike-s2-late` (Svelte `client:visible` sous 1800 px, hydraté au défilement), `spike-s2-b` (cible de navigation).
- **Mesures** : Playwright 1.64 (`q1.mjs`, `q2.mjs`, `q4.mjs`). Chromium 156, Firefox 157. **WebKit : impossible** (« Host system is missing dependencies to run browsers »), non testé. Mesures de géométrie en pixels (`getBoundingClientRect`, ou `getComputedStyle` sur `::view-transition-group(hero)` pour la VT).
- Limites : scénario synthétique (une carte, deux îles), cache `last` lu à chaque frame pendant une animation, throttling CPU 6× seulement en Chromium (CDP).

## Q1 — Registre global partagé entre îles

**Protocole.** Page `spike-s2-load`, chaque île appelle `acquire()` de SA copie du module. Variante témoin `?isolated=1` : clé `Symbol()` locale (pas de partage). Les deux îles abonnent chacune un écrivain de frame 600 ms ; on compte runtimes créés, ticks, boucles rAF vivantes simultanément, appels `requestAnimationFrame`. Puis navigation ClientRouter (démontage des îles) et lecture du compteur de références.

**Résultats (identiques Chromium et Firefox).**

| | partagé (`Symbol.for`) | isolé (témoin) |
|---|---|---|
| runtimes créés | 1 (créé par la 1re île à hydrater — ici Svelte —, réutilisé par React : `created=false`, refs=2) | 2 |
| boucles rAF simultanées (max) | **1** | 2 |
| ticks pendant 600 ms | ~40 (un seul runtime) | ~40 + ~38 |
| appels rAF | ~38 | ~75 |
| boucle à la fin (file vide) | 0 (arrêtée) | 0 |

Le runtime est celui de la copie qui s'est inscrite en premier ; l'autre copie l'utilise (« premier arrivé gagne »). Après navigation ClientRouter : `release` de chaque île démontée (refs 2 → 1 → 0) puis `acquire` des îles de la page B (refs=1) ; le runtime global survit à la navigation (même runtime ré-utilisé, pas de fuite). Coexistence de majeures : par construction (clé `@2` ≠ `@1`), non mesurée.

**Conclusion : GO** sur §8.0 #1/#3 (runtime global unique, frame unique, compteur de références) même avec une copie du module par île.
**Nuances / impact spec.** (1) Le runtime global est figé par la 1re copie : la forme du runtime doit être stable à majeure donnée et chaque copie doit faire de la détection de capacité (`rt.version`/`rt.features`) plutôt que supposer sa propre version ; à inscrire en §8.0. (2) La boucle unique n'est « unique » que grâce au runtime global : sans lui, 2 boucles/2 fois les ticks (témoin).

## Q2 — Élément partagé (`data-motion-shared`) entre îles

**Protocole.** Carte `hero` rouge 120×120 (React) → carte bleue 240×80 (Svelte) via l'état partagé. La carte sortante reste dans le DOM (`data-presence="exiting"`, `inert`, §8.0 #2) jusqu'à la fin. Deux rendus du même `swap()` : (a) VT same-document (nom posé sur la source avant `startViewTransition`, sur l'homologue dans le callback, retiré de la source) ; (b) FLIP JS (avant = cache I10, après = lecture, transform translate+scale, WAAPI 600 ms). Échantillonnage en pausant les animations à 0 %, 50 %, 100 %.

### Q2a/b — Fidélité (Chromium, Firefox identiques)

| | début vs rect source | fin vs rect final | échantillon 50 % |
|---|---|---|---|
| VT | écart 0/0/0/0 px | 0 px | groupe 216×88 (courbe VT par défaut) |
| FLIP | 0 px | 0 px | 180×100 (ease-in-out) |

Les deux sont fidèles aux extrémités. Différence qualitative : la VT fait un fondu enchaîné de deux images (pas de déformation du contenu) ; le FLIP scale le nœud réel (texte étiré pendant le mouvement, contenu réel, interactif). VT supportée par Chromium 156 et Firefox 157.

**Deux pièges VT mesurés.**
1. **Pendant le callback de mise à jour, rAF ne tourne pas** (rendu suspendu). Mon premier essai d'attente de l'homologue via `requestAnimationFrame` a bloqué jusqu'au timeout natif (Chromium 4,0 s → `TimeoutError`, Firefox 10 s). L'attente de l'homologue en VT doit passer par microtâche/`setTimeout`, jamais par rAF/ResizeObserver.
2. **Interdépendance avec l'hydratation** (voir Q3) : la page est figée tant que le callback attend.

### Q2c — Interruptibilité (inversion à 300 ms sur 600 ms)

| rendu | « avant » de la 2e animation | saut visuel |
|---|---|---|
| FLIP, cache géométrique **stable** (layout seul, hors transform) | position layout finale | **77 px** (Chromium 77,4 ; Firefox 76,9) |
| FLIP, cache dernière frame (`lastFrame`) | rect transformé lu à la frame précédente | **0 px** (clic entre deux frames) |
| FLIP, lecture live | rect transformé courant | **0 px** |
| VT (2e `startViewTransition` pendant la 1re) | 1re VT sautée, ancien état = DOM final | **125 px** (Chromium) / **109 px** (Firefox) |

Le clic réel (Playwright, avec test de cible) atteint le bouton pendant une VT dans les deux navigateurs ; la 2e VT part bien, la 1re est ignorée. Le FLIP est interruptible avec reprise depuis la valeur courante (`carry`) ; la VT ne l'est que par saut (`restart` de fait).
→ **Confirme I17** (VT si `restart`, FLIP si `carry`) et **précise I10** : le cache « stable » ne doit pas exclure le transform d'un nœud en vol ; pour un nœud animé il faut le rect visuel (dernière frame de la phase lecture, ou lecture live au moment de l'interruption).

### Q2d — Règle du doublon

Protocole : 4 politiques × {1 homologue + source retenue ; 2 homologues simultanés + source retenue} × {VT, FLIP}, plus témoin VT « tous nommés ». Politiques : `first`/`last` = premier/dernier inscrit **sans** filtrer la présence ; `first-live`/`last-live` = idem en ignorant les nœuds `data-presence="exiting"`.

| cas | VT | FLIP |
|---|---|---|
| aucune règle, 3 nœuds nommés `hero` | **abandon** : `InvalidStateError` (« duplicate view-transition-name », aucune animation), Chromium et Firefox | — |
| source retenue + 1 homologue : `first` / `last` | **instable** : `first` anime, `last` choisit la source (inversé par rapport au FLIP) | `first` choisit **la source elle-même** (aucune animation), `last` anime |
| même cas : `first-live`, `last-live` | animés, identiques dans les 2 rendus | animés, identiques |
| 2 homologues : `first-live` | anime la 1re (`s-card`) | idem |
| 2 homologues : `last-live` | anime la 2e (`s-card2`) | idem |

Constat : « premier » ou « dernier » inscrit *brut* dépend de l'ordre des effets du framework (mon île React a ré-inscrit le nœud sortant et inversé le résultat entre VT et FLIP) : **inutilisable**. Il faut exclure les nœuds sortants. Reste à choisir entre `first-live` et `last-live` ; les deux sont déterministes, sans erreur, identiques en VT/FLIP/Chromium/Firefox.

**Recommandation (nuance).** Prod : **premier nœud vivant** (`first-live` : hors `exiting`, premier inscrit) ; dev : erreur de doublon (journalisée dans le spike, `duplicate-key`). Raisons mesurées : `first-live` se résout dès la 1re arrivée, sans « lot » d'attente (`last-live` impose d'attendre la fin du lot de montages, ~2 frames/macrotâches, et ne peut pas rattraper un 2e homologue hydraté après le début de la transition) ; la règle est insensible à l'ordre des effets pourvu que `exiting` soit exclu. `last-live` ne gagnerait que s'il reste un doublon *périmé non sortant*, ce que le dev signale en erreur de toute façon.

**Conclusion Q2 : GO avec nuance.** FLIP JS = rendu sûr pour le cross-îles ; VT = rendu optionnel conditionné (voir impact).
**Impact spec (I17).** Reformuler : « VT quand la reprise est `restart`, le support présent **et l'homologue disponible de façon synchrone au moment de la mise à jour** (même île/même lot, déjà hydraté) ; FLIP JS sinon, ou si `carry` ». Règle du doublon : exclure `data-presence="exiting"` puis premier inscrit ; erreur en dev. Un nœud sortant n'est jamais un homologue (sinon animation vers soi-même, mesuré).

## Q3 — Hydratation tardive

**Protocole.** On clique la bascule React dès que l'île React est hydratée, île Svelte non hydratée. Mesures : temps d'hydratation de Svelte par rapport au clic, `arrivedAfter` (clic → homologue enregistré + lot), issue selon la fenêtre de rétention `retain` (300 / 1500 / 5000 ms). L'île Svelte rend l'homologue après lecture de l'état global à l'hydratation (rien dans le HTML SSR). Throttling CPU 6× en Chromium sur `client:idle`.

| cas | hydratation Svelte | FLIP (arrivée) | VT |
|---|---|---|---|
| `client:load`, `client:visible` dans le viewport, `client:idle` (sans throttle) | déjà faite avant le clic | **15–30 ms** (2 frames de lot) | animé |
| `client:idle`, CPU 6× (Chromium) | +170 à 240 ms après le clic | **177–219 ms**, animé même avec `retain=300` | **échec** : rendu suspendu, hydratation retardée jusqu'à la fin du callback (521 ms, 1758 ms) → `timeout` |
| `client:visible` hors écran, défilement après 200 ms | +250 ms | animé dès `retain=300` (≈260 ms) | `timeout` |
| idem, défilement après 800 ms | +850 ms | `retain=300` : timeout ; `retain≥1500` : animé (≈865 ms) | `timeout` (hydratation seulement après la fin du callback) |
| idem, défilement après 2500 ms | +2550 ms | timeout jusqu'à `retain=5000` (animé à ≈2560 ms) | `timeout` ; à `retain=5000` Chromium abandonne à 4,07 s (`TimeoutError`), Firefox 5 s sans animation |

Quand la rétention expire (`timeout`), la source disparaît et l'homologue apparaît ensuite sans animation partagée (état final correct, pas de reste dans le DOM). Chromium et Firefox concordent.

**Constats.**
- **VT + hydratation tardive = no-go** : le callback de mise à jour suspend le rendu, donc les `IntersectionObserver`/idle qui déclenchent l'hydratation n'avancent pas ; l'homologue n'arrive qu'à l'expiration. Interdire d'attendre dans le callback VT (fenêtre ≈ 0 : homologue présent ou pas de partage).
- **FLIP : la rétention du nœud sortant est nécessaire** et doit être bornée. Mesuré : cas « raisonnables » (`load`, `visible` en viewport, `idle`) ≤ ~30 ms ; pire cas non utilisateur-dépendant (idle, CPU 6×, serveur de dev non minifié) ≈ 260 ms. Valeur recommandée : **600 ms par défaut** (≈ 2× le pire mesuré), configurable, puis repli sur une sortie/apparition ordinaire. Un `client:visible` hors écran a une latence **non bornée** (dépend du défilement) : ne jamais attendre ; ne pas déclarer de partage vers une île non hydratée.
- Pendant la rétention, la source reste visible en place (`exiting`, `inert`) : pas de trou visuel.

**Conclusion Q3 : GO avec nuance** (FLIP + rétention bornée 600 ms ; no-go pour la VT).
**Impact spec.** Ajouter à §8.0 #2 la fenêtre de rétention d'un partage (option `shared` de `layout`, défaut proposé 600 ms) ; ajouter à I28 (chargement) : l'île porteuse d'un homologue de partage doit utiliser `client:load`/`idle`, pas `client:visible` hors écran, sinon pas d'animation partagée.

## Q4 — Transitions de page avec le ClientRouter d'Astro

**Protocole.** Instrumentation de `document.startViewTransition` (journal, `ready`/`finished` rejetés) et des événements Astro ; sonde CSS à 16 ms (`data-astro-transition`, noms d'animation de `::view-transition-old/new(root)`). Scénarios : A clic de lien + retour arrière (Astro seul) ; B `motion.navigate(() => astroNavigate('/b'), { direction })` (l'enveloppe simple de la spec autour de `navigate()`) ; B2 `navigate()` d'Astro avec attribut de direction posé par motion ; C `motion.navigate(update)` sans route pendant que le ClientRouter est actif ; D `motion.navigate` pendant une navigation Astro en cours.

**Résultats (Chromium et Firefox identiques).**
- **A** : Astro appelle `startViewTransition` **une fois par navigation** (dans `astro:before-swap`, `event.viewTransition` présent), pose `html[data-astro-transition="forward|back"]` et fournit `event.direction` (`forward`/`back`) dès `astro:before-preparation` ; mon CSS basé sur cet attribut s'applique (`slide-out-left`/`slide-in-right`). Retour arrière : `back`.
- **B (enveloppe naïve)** : fonctionne visuellement (page B affichée, animation d'Astro jouée) mais crée **deux VT** : la VT de motion est **sautée à ~35 ms** (`ready` rejeté `AbortError`, sans effet visuel) par l'appel interne d'Astro. Le `finished` de motion se résout. Risque : `AbortError` non géré dans le code appelant, direction posée par motion écrasée au swap.
- **B2** : laisser Astro naviguer seul fonctionne ; l'attribut posé par motion est écrasé/remplacé par celui d'Astro.
- **C** : `motion.navigate(update)` hors route, ClientRouter actif : 1 VT, correcte (`finished` résolu).
- **D** : navigation Astro puis VT motion 60 ms plus tard : l'une saute l'autre, état final correct, pas d'erreur de page.

**Conclusion Q4 : NUANCE.** `motion.navigate(update)` = simple enveloppe de `document.startViewTransition` **cohabite sans casse** mais ne doit **pas** envelopper la navigation d'Astro (double VT, `AbortError`). Pour Astro, s'appuyer sur ses événements : `astro:before-preparation` (direction, type) → `astro:before-swap` (`viewTransition`) → `astro:page-load`, et sur `html[data-astro-transition]`.
**Impact spec (I18, Q5).** `motion.navigate` doit être *router-aware* : le noyau expose `motion.navigate(update, { direction })` pour les routeurs qui n'ouvrent pas eux-mêmes de VT ; l'adaptateur Astro n'appelle pas `startViewTransition` mais mappe `event.direction` (`forward`/`back`) sur la `direction` motion (`start`/`end`) et pose son attribut/variable avant `before-swap`. Tout appel de `navigate` doit attraper `ready`/`finished` rejetés (`AbortError`). `addTransitionType` non évalué (hors périmètre mesuré ici).

## Synthèse des décisions

| Q | Décision |
|---|---|
| 1 Registre global entre îles | **GO** (1 runtime, 1 boucle, refs corrects ; témoin isolé = 2 boucles) ; première copie gagnante, forme du runtime stable par majeure |
| 2 Élément partagé | **FLIP : GO** (0 px, interruptible `carry` 0 px avec cache transformé) ; **VT : GO conditionnel** (fidèle, mais interruption = saut 109–125 px, homologue synchrone seulement) ; doublon : exclure `exiting` puis premier inscrit, erreur en dev |
| 3 Hydratation tardive | **GO** FLIP + rétention bornée (600 ms) ; **NO-GO** VT avec attente d'homologue (rendu suspendu, deadlock d'hydratation, abandon à 4 s/10 s) ; `client:visible` hors écran non bornable |
| 4 Pages / ClientRouter | **NUANCE** : cohabite, mais ne pas envelopper `navigate()` d'Astro ; s'appuyer sur `astro:before-preparation/before-swap` + `data-astro-transition` |
| 4.4 (coordination par le DOM) | **GO** global |

Non couvert : WebKit (libs système manquantes), build de production complet (prérendu en échec dans ce montage), coexistence de majeures (par construction seulement), `addTransitionType`.

Fichiers : `spikes/s2/{gen,lib,q1,q2,q4,show}.mjs`, `spikes/s2/site/` (config Astro, `src/lib/`, `src/components/`, `src/pages/spike-s2*.astro`).
