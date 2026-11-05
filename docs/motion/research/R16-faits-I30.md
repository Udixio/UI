# R16 — Faits à vérifier (I30)

> Travail de vérification de la ligne **I30** de `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` (§8.1 quater) et des faits listés en §8.1 quater.
> Rapport factuel : aucune décision de design n'est prise ici. Les « impacts » sont formulés de façon neutre.
> Consultations du 2026-11-04 (jour de la recherche), complétées le 2026-11-05.

## 0. Méthode, données et limites

| Source | Version / date | Usage |
|---|---|---|
| `@mdn/browser-compat-data` (BCD) | 8.1.8 (2026-11-02), `/tmp/…/scratchpad/r1` | Versions par moteur, `status`, `partial_implementation`, `flags` |
| `web-features` | 3.45.0 | Statuts Baseline (`baseline`, dates `low` / `high`) |
| `browserslist` | 4.29.5 ; `caniuse-lite` 1.0.30001820 | `npx browserslist defaults` (exécuté dans `scratchpad/r1`) |
| `animejs` | npm `latest` = **4.5.0** ; `beta` = 5.0.0-beta.3 | Source publiée (`dist/bundles/anime.esm.js`, `dist/modules/engine/engine.d.ts`) |
| `react` / `react-dom` | npm `react@19.3.0` (`latest` = 19.3.1) | Exports du paquet stable |
| `@angular/core`, `@angular/compiler` | npm `latest` = **22.2.4** | Tags `@publicApi`, présence des API |

**Limites.** Les pages MDN et react.dev consultées par WebFetch ne donnent pas toujours le tableau de compatibilité (contenu tronqué) : pour les versions par moteur, c'est BCD (la source de MDN) qui fait foi. Les pages anime.js `splitText/accessible` et `engine.pauseOnDocumentHidden` ne sont pas documentées dans les pages lues : le comportement est établi à partir du code publié, pas de la doc. Le fait Safari / `requestIdleCallback` repose sur BCD + web-features + une recherche (bug WebKit non ouvert par WebFetch).

**Couverture `defaults`.** Liste résolue le 2026-11-04 : `and_chr 156, and_ff 159, and_qq 14.9, and_uc 15.5, android 156, chrome 156 155 154 153 152 151 150 109, edge 155 154 153 152, firefox 159 158 156 155 153 (ESR), ios_saf 27.0 26.6 26.5 18.5-18.7, kaios 3.0-3.1, kaios 2.5, op_mini all, op_mob 80, opera 135 134, safari 27 26.6, samsung 30 29`.
Les colonnes « non couvert » ci-dessous sont calculées par script à partir de BCD (version minimale = première entrée complète, sans `flag`, sans `partial_implementation`). Les entrées **G0** (`op_mini all`, `kaios`, `and_uc`, `and_qq`, absentes de BCD) sont exclues du décompte et signalées à part.

Note : le `npx browserslist defaults` lancé dans le dépôt donne une autre liste (chrome 151…), car `caniuse-lite` y est résolu différemment. Les chiffres de ce rapport utilisent la liste du scratchpad.

## 1. Tableau récapitulatif

| # | Fait | Chrome / Edge | Firefox | Safari (macOS / iOS) | Baseline (web-features) | Non couvert dans `defaults` (hors G0) | Statut vs spec |
|---|---|---|---|---|---|---|---|
| 1 | `linear()` | 113 / 113 | 112 | 17.2 / 17.2 | **widely** 2026-06-11 (low 2023-12-11) | chrome 109 | Cohérent. Fallback obligatoire (déclaration invalide ignorée) |
| 2 | `sibling-index()` / `sibling-count()` | 138 / 138 | 154 | 26.2 / 26.2 | **newly** 2026-08-18 | chrome 109, firefox 153 (ESR), ios_saf 18.5-18.7, op_mob 80, samsung 29 | Cohérent (F10). Couverture `defaults` incomplète |
| 3 | `view-transition-name: match-element` | 137 / 137 | 144 | 18.4 / 18.4 | **newly** 2025-10-14 (feature `view-transitions`) | chrome 109, op_mob 80, samsung 29 | Cohérent (F8). **Limité au same-document** (non précisé en spec) |
| 4 | Transition de `grid-template-rows` 0fr → 1fr | 107 / 107 | 66 | 16 / 16 | **high** (low 2022-10-27, high 2025-04-27) | aucun (hors G0 et KaiOS) | Cohérent (I12) |
| 5 | `requestIdleCallback` | 47 / 79 | 55 | **absent** (Safari TP derrière préférence) / **absent** iOS | **non Baseline** (`limited`) | Safari 26.6, Safari 27, iOS 18.5–27 | Cohérent (« absent de Safari ») ; à confirmer par spike |
| 6 | `PointerEvent.getCoalescedEvents()` | 58 / 79 | 59 (Firefox Android : **partiel**, retourne toujours `[]`) | 18.2 / 18.2 | MDN : *limited* (page) ; `pointer-events-api` high (base) | and_ff 159 (partiel) | **Contradiction partielle** avec I24 (`exact` au pointeur) : pas de repli sur Firefox Android |
| 7 | React `<ViewTransition>` | stable dans React **19.3.0** (blog 2026-09-09) | — | — | — | — | **Stable** (React 19.3) ; docs sans mention de statut |
| 7b | React `addTransitionType` | exporté par `react@19.3.0` | — | — | — | — | Présent dans le paquet stable ; **page doc sans statut**, exemples épinglés sur un canary |
| 8 | Angular `animate.enter` / `animate.leave` | — | — | — | — | — | **Introduit en Angular 20.2** (`@publicApi 20.2`) |
| 8b | Angular `afterRender` | — | — | — | — | — | **N'existe plus** en 22.2.4 : `afterEveryRender`, `afterNextRender`, `afterRenderEffect` (`@publicApi 20.0`) |
| 8c | Angular zoneless par défaut | — | — | — | — | — | **Oui** depuis Angular v21 (doc) ; `latest` = 22.2.4 |
| 9 | `Intl.Segmenter` | 87 / 87 | 125 | 14.1 / 14.5 | **high** 2024-04-16 (widely 2026-10-16) | aucun (hors G0 et KaiOS) | Pas de contradiction |
| 10a | `hidden="until-found"` | 102 / 102 | 148 (139–147 partiel) | 26.2 **partiel** / 26.2 **partiel** | **non Baseline** | Safari 26.6, Safari 27, iOS 18.5–27 (partiel) | Non cité en spec ; partiel Safari (pas de scroll vers le texte trouvé) |
| 10b | `::details-content` | 131 / 131 | 143 | 18.4 / 18.4 | **low** 2025-09-16 | chrome 109, op_mob 80 | Non cité en spec ; pas de chaînage après le pseudo-élément sur Safari |
| 11a | anime.js `morphTo` | 4.5.0 | | | | | Rééchantillonnage par longueur d'arc, sortie en polyligne |
| 11b | anime.js `splitText` `accessible` | 4.5.0 | | | | | Défaut `true` ; span masqué ajouté + `aria-hidden` sur lignes/mots/caractères |
| 11c | anime.js `engine.pauseOnDocumentHidden` | 4.5.0 | | | | | Défaut `true` ; **global** au moteur (`visibilitychange`) |

## 2. Faits détaillés

### 2.1 `linear()` easing

**Données.** BCD `css.types.easing-function.linear-function` : Chrome 113, Edge 113, Firefox 112, Safari 17.2, iOS 17.2 (sans `flag`). `web-features` `linear-easing` : Baseline *high* depuis 2026-06-11 (low 2023-12-11). `defaults` : seul `chrome 109` manque (plus G0 et KaiOS).

**Sources.**
- MDN : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear (page lue : Baseline « widely available » depuis décembre 2023, syntaxe, « By default, the stops are equidistant. »).
- Spécification CSS Easing 2 (éditeur, 2026-02-23) : https://drafts.csswg.org/css-easing/#linear-easing-function-parsing — règles de position : premier point sans position = 0, dernier = 1, positions décroissantes relevées, points non positionnés répartis uniformément.
- Invalidité : la spec dit (section *Partial implementations*) que si une valeur est invalide, « the entire declaration be ignored ». Donc un `transition` ou `animation` contenant `linear()` est entièrement ignoré dans un navigateur sans support.

**Impact (neutre).** Le fallback doit être une déclaration séparée ou une valeur `cubic-bezier` posée avant. La fidélité dépend du nombre de points (page MDN : « provide many points to approximate any curve »), ce qui relève du build des springs (I25).

### 2.2 `sibling-index()` / `sibling-count()`

**Données.** BCD `css.types.sibling-index` et `sibling-count` : Chrome 138, Edge 138, Firefox 154, Safari 26.2, iOS 26.2. `web-features` `sibling-count` : Baseline *low* 2026-08-18 (*newly*). `defaults` : manquent chrome 109, firefox 153 (ESR), ios_saf 18.5-18.7, op_mob 80, samsung 29.

**Sources.**
- MDN : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index — « returns 1 for the first child »; « starts from 1, not 0 »; Baseline 2026 *newly*, « Since August 2026 ».
- Spécification CSS Values 5 : https://drafts.csswg.org/css-values-5/#funcdef-sibling-index.

**Points de vigilance.** La page MDN ne liste pas les propriétés admises. Les corrections de Safari 27.0 signalées dans R1 (re-résolution dans `@keyframes`, `calc()`, `::part()`) n'ont pas été revérifiées dans les notes Apple lors de cette passe : à confirmer avant tout usage dans `@keyframes`.

**Impact (neutre).** Le délai calculé de F10 (`calc(sibling-index() * …)`) est un ajout progressif : le repli (délai JS ou index inline) est nécessaire pour ≈ 3–4 % de `defaults` (Firefox ESR 153, iOS 18.x, Chrome 109).

### 2.3 `view-transition-name: match-element`

**Données.** BCD `css.properties.view-transition-name.match-element` : Chrome 137, Edge 137, Firefox 144, Safari 18.4, iOS 18.4. `web-features` `view-transitions` : Baseline *low* 2025-10-14. MDN (page `view-transition-name`) : « Baseline 2025, Newly available, since October 2025 ». `defaults` : manquent chrome 109, op_mob 80, samsung 29.

**Sources.**
- MDN : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name — « Because `match-element` assigns automatic `view-transition-name` values based on element identity, it can only be used for same-document view transitions. »
- Spécification CSS View Transitions 2 (éditeur, 2026-08-31) : https://drafts.csswg.org/css-view-transitions-2/#auto-vt-name — §11.2 : `match-element` correspond « based on element identity » (contrairement à `auto`, qui utilise l'`id`). Noms générés, document-scoped ; à l'état *new*, un nom en double fait échouer la capture et la transition est sautée (`InvalidStateError`) ; à l'état *old*, le doublon est retiré avec avertissement.

**Impact (neutre).** Le périmètre est le *same-document* : une reprise entre îles ou documents (Astro, cross-document) n'est pas couverte par `match-element`. La règle d'unicité de I17 (« unique par document ») rejoint la règle de la spec : un doublon fait échouer la capture.

### 2.4 Transition de `grid-template-rows` (0fr → 1fr)

**Données.** BCD `css.properties.grid-template-rows.animation` : Chrome 107, Edge 107, Firefox 66, Safari 16, iOS 16. `web-features` `grid-animation` : Baseline *high* (low 2022-10-27, high 2025-04-27). `defaults` : aucune entrée manquante hors G0 et KaiOS.

**Sources.**
- BCD : https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-rows (source de la donnée).
- Article de référence (non primaire) : Stefan Judis, https://www.stefanjudis.com/blog/how-to-animate-height-with-css-grid — technique, sans version de navigateur. Keith J. Grant, https://keithjgrant.com/posts/2023/04/transitioning-to-height-auto/ — historique de la technique.
- Chrome for Developers : l'URL d'article tentée (`developer.chrome.com/blog/css-grid-animation`) renvoie 404 ; la version 107 vient de BCD, pas d'une note de version.

**Points de vigilance (non vérifiés en spec, observés dans les articles).** Le contenu doit être dans un enfant unique avec `overflow: hidden` et `min-height: 0`. Les éléments focusables restent atteignables à 0fr : un repli `inert` / `visibility` doit être prévu (non précisé par les sources primaires consultées).

**Impact (neutre).** Le preset CSS pur de I12 est couvert par tous les navigateurs de `defaults`, hors G0 et KaiOS. Le repli JS mentionné en I12 ne vise donc que G0.

### 2.5 `requestIdleCallback`

**Données.**
- BCD `api.Window.requestIdleCallback` : Chrome 47, Edge 79, Firefox 55 ; Safari : `version_added: "preview"` avec `flags: [{ name: "requestIdleCallback", type: "preference" }]` (préférence à activer, donc pas de support par défaut) ; iOS Safari : `false`.
- `web-features` `requestidlecallback` : **non Baseline** (`status.baseline: false`), support listé : Chrome 47, Edge 79, Firefox 55 (pas de Safari).

**Sources.**
- MDN : https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback — page lue : la section de compatibilité n'a pas été extraite (contenu tronqué) ; la donnée vient de BCD.
- Explorateur web-features : https://web-platform-dx.github.io/web-features-explorer/features/requestidlecallback
- WebKit : bug 164193 (« Implement requestIdleCallback », ouvert) https://bugs.webkit.org/show_bug.cgi?id=164193 ; bug 285049 (activation en Technology Preview, régression Google signalée en 2026) https://bugs.webkit.org/show_bug.cgi?id=285049. Source de ces liens : résultats de recherche, non ouverts par WebFetch.

**Impact (neutre).** Le constat « absent de Safari » de I30 est **confirmé** pour Safari (macOS et iOS, y compris Safari 27 dans `defaults`). Tout usage doit avoir un repli `setTimeout` : `defaults` comprend iOS 18.5–27 et Safari 26.6/27.

### 2.6 `PointerEvent.getCoalescedEvents()`

**Données.** BCD `api.PointerEvent.getCoalescedEvents` : Chrome 58, Edge 79, Firefox 59, Safari 18.2, iOS 18.2 ; **Firefox Android** : `version_added: "79"`, `partial_implementation: true`, note « The method always returns an empty array, regardless of the user's actions. » `defaults` contient `and_ff 159` : partiel sur Firefox Android.

**Sources.**
- MDN : https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents — la page (lue) donne « Limited availability » ; le tableau et la note Firefox Android ne sont pas dans l'extrait lu, la note vient de BCD.
- W3C Pointer Events (CR) : https://w3c.github.io/pointerevents/#dom-pointerevent-getcoalescedevents — règles :
  - les événements coalescés ont « the same pointerId, pointerType, and isPrimary as the dispatched "parent" pointer event » ;
  - `target` : un user agent **SHOULD** (pas MUST) « set the event's target to match the target of the "parent" pointer event » ;
  - la liste est triée par `timeStamp` croissant et « always contain at least one event » pour `pointermove` / `pointerrawupdate` de confiance.
- Remarque : le texte W3C sur le tri cite `getPredictedEvents` là où il faudrait `getCoalescedEvents` ; à lire comme une coquille probable.

**Impact (neutre).** `pointerId` est garanti par la spec, mais pas la `target` (SHOULD). Une implémentation doit prendre la cible de l'événement parent, non celle de l'événement coalescé. Sur Firefox Android (présent dans `defaults`), la liste est vide : le repli est l'événement parent. **Contradiction partielle avec I24** (vitesse `exact` au pointeur) : l'exactitude ne tient pas sur Firefox Android.

### 2.7 React : `<ViewTransition>` et `addTransitionType`

**Données.**
- Blog React : https://react.dev/blog/2026/09/09/react-19-3 — « Last year, we shared View Transitions and Fragment Refs as new experimental APIs… both of these are now stable in React 19.3! » Pour `<ViewTransition>` : « in 19.3 it's stable and ready to use ». Restriction : « Currently, `<ViewTransition>` only works in the DOM. ». Le blog ne donne pas de statut pour `addTransitionType`.
- npm : `react@19.3.0` (paquet stable, `latest` = 19.3.1) : `exports.ViewTransition` et `exports.addTransitionType` présents dans `cjs/react.production.js` (et `cjs/react.development.js` pour le message « can only be called inside a startTransition() callback »).
- Doc `https://react.dev/reference/react/ViewTransition` : **aucune phrase de statut** ; les exemples sont épinglés sur `19.3.0-canary-f1f7ed2a-20260904` (une doc non mise à jour de ses exemples).
- Doc `https://react.dev/reference/react/addTransitionType` : **aucune phrase de statut** ; la signature est `addTransitionType(type)`, à appeler dans `startTransition`.

**Points de vigilance (tirés de la doc).** Back/forward (`popstate`) sans animation ; React ne gère pas `prefers-reduced-motion` ; `browser()` introduit dans `react-dom` (sans statut indiqué) ; `name` doit être unique parmi les composants montés, sinon erreur.

**Impact (neutre).** La question de M4-07 / Q5 (« statut de `addTransitionType` à vérifier ») a une réponse partielle : présent dans le paquet stable 19.3.0, non qualifié de « stable » dans la documentation. Les exemples de doc restent sur canary.

### 2.8 Angular : `animate.enter` / `animate.leave`, `afterRender`, zoneless

**Données.**
- Paquet `@angular/core@22.2.4` (`types/_debug_node-chunk.d.ts`) : `AnimationCallbackEvent` est marqué `@publicApi 20.2` (« The event type for when animate.enter and animate.leave are used with function callbacks »). `types/testing.d.ts` : option `animationsEnabled` (défaut `false`).
- Paquet `@angular/compiler@22.2.4` : `animate.enter` présent dans le compilateur (`fesm2022/compiler.mjs`).
- Guide : https://angular.dev/guide/animations (la page `/guide/animations/enter-and-leave` redirige vers cette adresse) :
  - syntaxes : chaîne de classes, tableau de chaînes, liaison à un signal (`[animate.leave]="farewell()"`), fonction `(animate.leave)="fn($event)"` ;
  - « `animate.enter` and `animate.leave` are not directives. They are special API supported directly by the Angular compiler. » ;
  - en forme fonction, il faut appeler `animationComplete()`, sinon Angular supprime l'élément après 4 s (`MAX_ANIMATION_TIMEOUT`) ;
  - pas de mélange avec les animations « legacy » dans un même composant ; les `animate.leave` des templates enfants ne retardent pas la suppression du parent.
- `afterRender` : **absent** de `@angular/core@22.2.4`. Exports présents : `afterEveryRender`, `afterNextRender` (`@publicApi 20.0`) et `afterRenderEffect`. Source lue : https://raw.githubusercontent.com/angular/angular/main/packages/core/src/render3/after_render/hooks.ts (`afterEveryRender` et `afterNextRender`, sans enum `AfterRenderPhase` ; phases documentées dans l'ordre `earlyRead`, `write`, `mixedReadWrite`, `read`).
- Zoneless : https://angular.dev/guide/zoneless — « Zoneless is the default in Angular v21+ so you do not need to do anything to enable it. » ; zone.js à retirer pour les applications zoneless. Version de la doc : v22.
- Versions : `npm view @angular/core dist-tags` → `latest` 22.2.4, `next` 22.3.0-next.3.

**Impact (neutre).** `animate.enter/leave` exige Angular ≥ 20.2. Le nom `afterRender` n'existe plus dans 22.2.4 : une référence à `afterRender` dans la spec (Q1 : « avant l'écriture du signal, pas `afterRender` ») doit utiliser `afterEveryRender` / `afterNextRender` / `afterRenderEffect`. Zoneless est le défaut dès Angular 21.

### 2.9 `Intl.Segmenter`

**Données.** BCD `javascript.builtins.Intl.Segmenter` : Chrome 87, Edge 87, Firefox 125, Safari 14.1, iOS 14.5. `web-features` `intl-segmenter` : Baseline *high* 2024-04-16 (widely 2026-10-16). `defaults` : pas de manque hors G0 et KaiOS.

**Sources.**
- BCD : https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter (source de la donnée).
- Spécification ECMA-402 : https://tc39.es/ecma402/#segmenter-objects.

**Impact (neutre).** Le découpage de texte (I27) peut dépendre de `Intl.Segmenter` sans repli sur `defaults`. Sa granularité (`grapheme`, `word`, `sentence`) et la locale doivent être fixées explicitement.

### 2.10 `hidden="until-found"` et `::details-content`

**Données `hidden="until-found"`.** BCD `html.global_attributes.hidden.until-found` : Chrome 102, Edge 102 ; Firefox 148 (les versions 139–147 sont partielles, bug 2006040 : pas de défilement vers le texte trouvé) ; Safari 26.2 **partiel** (bug WebKit 304174, pas de défilement vers le texte trouvé), iOS 26.2 partiel. `web-features` `hidden-until-found` : non Baseline.
- Source : https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden (BCD).
- Spécification HTML : https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute.

**Données `::details-content`.** BCD `css.selectors.details-content` : Chrome 131, Edge 131, Firefox 143, Safari 18.4, iOS 18.4 ; note Safari : « Does not support chaining pseudo-elements after ::details-content » (WebKit 283446). `web-features` `details-content` : Baseline *low* 2025-09-16.
- Source : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content (BCD) ; spécification CSS Pseudo 4 : https://drafts.csswg.org/css-pseudo-4/#details-content-pseudo.

**Impact (neutre).** Ces deux faits ne figurent pas dans les lignes grepées de la spec. Si un panneau replié utilise `hidden="until-found"`, le comportement de recherche dans la page est partiel sur Safari 26.2 et iOS 26.x.

### 2.11 anime.js 4.x (source 4.5.0)

Version : npm `latest` = **4.5.0** (dist-tag), `beta` = 5.0.0-beta.3. Les notes de release GitHub v4.2.1 à v4.5.0 ont été lues (cache local `anime_releases.json`). Source de code lue : tarball npm `animejs@4.5.0` (`dist/bundles/anime.esm.js`, `dist/modules/engine/engine.d.ts`).

**`morphTo`.**
- Doc : https://animejs.com/documentation/svg/morphto — « `precision` … configure the amount of points generated »; « If the precision parameter is set `0`, no point extrapolation takes place. » Valeur par défaut `.33`.
- Code 4.5.0 (`morphTo`, `dist/bundles/anime.esm.js` autour de la ligne 10469) : pour `precision > 0`, les deux chemins sont échantillonnés via `getTotalLength()` / `getPointAtLength()` sur un même paramètre normalisé `t`, avec `maxPoints = max(ceil(L1·p), ceil(L2·p))`. La sortie est une **polyligne** (`M` puis `L`, ou `points` pour polygone/polyligne) : les courbes sont donc remplacées par des segments. Avec `precision = 0`, les attributs `d` / `points` bruts sont utilisés, sans rééchantillonnage.
- Observation de code (non documentée) : `t = i / (maxPoints - 1)` avec `maxPoints = 1` donne `NaN` ; cela survient si `L·p ≤ 1`, donc pour des chemins très courts.
- Historique : la correction de chaînage dans les keyframes et les timelines (lecture de la fin du tween précédent) est dans v4.4.0 (notes GitHub).

**`splitText` option `accessible`.**
- Code 4.5.0 : `accessible` vaut `true` par défaut (`setValue(accessible, true)`). Quand elle est active et que `canSplitLines || !isCached`, un `<span>` est inséré **en premier enfant** de l'élément, avec le style `position:absolute;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);width:1px;height:1px;white-space:nowrap;` et `innerHTML` = le HTML d'origine. Les lignes, mots et caractères reçoivent `aria-hidden`.
- Doc : https://animejs.com/documentation/text/splittext — la page lue ne documente pas l'option (lien vers `textsplitter-settings/accessible`, sous-page non lue). La version de la page est inférée (`Since 4.1.0`, `v4.2.0`).

**`engine.pauseOnDocumentHidden`.**
- Code 4.5.0 : `engine.pauseOnDocumentHidden = true` par défaut ; un écouteur sur `document` `visibilitychange` appelle `engine.pause()` si `doc.hidden`, sinon `engine.resume()`. Les types publient `pauseOnDocumentHidden: boolean` sur `Engine`, et `engine` est exporté par le module principal.
- Doc : la page de l'engine n'a pas pu être lue (URL `documentation/engine/pauseondocumenthidden` renvoie la page d'accueil). Le fait repose sur le code.
- Portée : la mise en pause concerne le moteur JS d'anime.js (`engine`) ; le code lu ne montre pas d'effet sur les animations WAAPI.

**Impact (neutre).** `morphTo` produit une polyligne ; le ressort ou le morphing de F17 doit en tenir compte. Le `splitText` par défaut ajoute un nœud et des `aria-hidden` : à prendre en compte dans le DOM produit de I27. `pauseOnDocumentHidden` est global, pas par animation.

## 3. Contradictions et écarts avec la spec

| Ligne spec | Hypothèse | Constat | Gravité |
|---|---|---|---|
| I24 (gestes), `exact` au pointeur | `getCoalescedEvents` donne la vitesse exacte | Retourne `[]` sur Firefox Android (partiel, présent dans `defaults`) ; `target` non garantie | **Contradiction partielle** : repli nécessaire |
| Q1 (détection), « Angular : … pas `afterRender` » | Le nom `afterRender` sert de référence | `afterRender` absent de `@angular/core` 22.2.4 ; API actuelles : `afterEveryRender`, `afterNextRender`, `afterRenderEffect` | **Nom à mettre à jour** |
| I30, « `requestIdleCallback` absent de Safari » | Absent de Safari | **Confirmé**, et absent d'iOS ; Safari TP derrière préférence ; web-features non Baseline | Conforme (à compléter : iOS aussi) |
| F8 / I17, `match-element` « Baseline » | Baseline suffit | Baseline vraie (newly 2025-10-14) ; **same-document seulement** ; noms en double = transition sautée | Conforme, périmètre à expliciter |
| F3 / F3-Angular, `animate.leave` | Disponible | Introduit en **Angular 20.2** ; interdit avec les animations legacy dans le même composant | Version minimale à documenter |
| Q5 / M4-07, statut de `addTransitionType` | À vérifier | Présent dans `react@19.3.0` stable ; **pas de statut dans la doc** ; exemples doc sur canary | Partiellement résolu |
| I12, panneau CSS pur | `grid-template-rows` | Couvert partout dans `defaults` hors G0/KaiOS | Conforme |
| I25, `linear()` des ressorts | Fallback | `linear()` : `chrome 109` manque ; déclaration invalide ignorée entière | Conforme (fallback obligatoire) |
| F10, `sibling-index()` | Baseline newly 2026-08-18 | Conforme ; `defaults` non couvert (≈ 3–4 %) | Conforme |
| I27, découpage de texte | (non précisé) | `Intl.Segmenter` couvert partout dans `defaults` hors G0/KaiOS | Pas de contradiction |
| F17, morphing SVG | `morphTo` rééchantillonne | Confirmé par le code 4.5.0 ; sortie en polyligne ; `precision = 0` sans rééchantillonnage ; `NaN` sur chemins très courts | Précision à documenter |
| I27 (DOM produit du texte) | (non précisé) | `splitText` ajoute par défaut un `span` masqué et des `aria-hidden` | À prendre en compte dans le DOM |
| F21, pause onglet caché | `pauseOnDocumentHidden` | Existe (défaut `true`) mais **global** au moteur | Conforme, portée à préciser |

## 4. Non traité

- **Valeurs officielles M3** (I30, dernier élément) : hors des 11 faits demandés ; non vérifiées ici.
- **anime.js 5.0.0-beta.3** (dist-tag `beta`) : non analysée. Les faits ci-dessus portent sur la 4.5.0 (`latest`).
- **Safari 27.0 (correctifs `sibling-index()` et `d`)** : repris de R1, non recontrôlés dans les notes Apple.
- **Tolérances de conformité** et **budgets** : hors périmètre.

## 5. Sources (liste)

- MDN / BCD 8.1.8 (local) : https://github.com/mdn/browser-compat-data
- web-features 3.45.0 : https://github.com/web-platform-dx/web-features ; explorateur : https://web-platform-dx.github.io/web-features-explorer/
- linear() : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear ; https://drafts.csswg.org/css-easing/#linear-easing-function-parsing
- sibling-index() : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index ; https://drafts.csswg.org/css-values-5/#funcdef-sibling-index
- match-element : https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name ; https://drafts.csswg.org/css-view-transitions-2/#auto-vt-name
- grid-template-rows : https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-rows ; https://www.stefanjudis.com/blog/how-to-animate-height-with-css-grid
- requestIdleCallback : https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback ; https://bugs.webkit.org/show_bug.cgi?id=285049 ; https://bugs.webkit.org/show_bug.cgi?id=164193
- getCoalescedEvents : https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents ; https://w3c.github.io/pointerevents/#dom-pointerevent-getcoalescedevents
- React 19.3 : https://react.dev/blog/2026/09/09/react-19-3 ; https://react.dev/reference/react/ViewTransition ; https://react.dev/reference/react/addTransitionType ; npm `react@19.3.0`
- Angular : https://angular.dev/guide/animations ; https://angular.dev/guide/zoneless ; npm `@angular/core@22.2.4`, `@angular/compiler@22.2.4` ; https://raw.githubusercontent.com/angular/angular/main/packages/core/src/render3/after_render/hooks.ts
- Intl.Segmenter : https://tc39.es/ecma402/#segmenter-objects
- hidden="until-found" et ::details-content : https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute ; https://drafts.csswg.org/css-pseudo-4/#details-content-pseudo
- anime.js : npm `animejs@4.5.0` (tarball) ; https://animejs.com/documentation/svg/morphto ; https://animejs.com/documentation/text/splittext ; notes de release https://github.com/juliangarnier/anime/releases
