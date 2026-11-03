# E2 — Conventions à remplacer (inventaire)

Date : 2026-11-03 · Branche : `feat/anime` · Travail : E2 (phase 0, 📚) de
`docs/superpowers/specs/2026-11-03-udixio-motion-design.md` · Entrée de : M3.

Ce rapport liste les passages qui prescrivent un moteur, un type ou une règle
d'animation. Il ne rédige pas les nouvelles règles. La colonne « À changer »
décrit seulement ce qui deviendra faux ou incomplet quand `@udixio/motion`
existera.

Périmètre parcouru :

- `docs/component-behavior.md` et `docs/component-authoring.md` ;
- les `CLAUDE.md` et `AGENTS.md` : **aucun dans le dépôt** (hors `node_modules`) ;
- `.claude/` (`RESUME.md`, `settings*.json`) : aucune mention ;
- `plugins/udixio-ui-governance/` (skills, references, README) et
  `plugins/udixio-ui-usage/` (aucune mention) ;
- les copies installées `~/.claude/plugins/cache/udixio-ui/udixio-ui-governance/`
  (voir §4) ;
- les README de paquets et les specs historiques, en annexe (§5).

---

## 0. Constat principal : deux doctrines contradictoires coexistent déjà

| Source | Moteur prescrit |
|---|---|
| `docs/component-behavior.md` §« Effets visuels pilotés par le DOM » | **Motion** (API JS) par défaut ; anime.js seulement pour le diff de layout |
| `docs/component-authoring.md` §1 | type `Transition` **de Motion** dans le cœur |
| Plugin de gouvernance 0.5.0 (dépôt + cache installé) | **anime.js** pour tout effet animé ; `motion` = « résidu à retirer » |
| Code réel (`packages/core/src`) | 27 fichiers importent `motion`, 14 importent `animejs` |

Le plugin affirme aussi (`references/repository-map.md:36-42`) que `motion` ne
survit que sous forme de résidu : trois imports de type `Transition` dans
`Chip`, `NavigationRail` et `NavigationRailItem`, plus deux imports `animate`
dans les specs Slider. Cette affirmation porte sur les **adaptateurs**. Elle
passe sous silence les 27 fichiers de `core` qui importent `motion` à
l'exécution. E1 doit trancher l'état réel. Pour M3, le point utile est le
suivant : les deux familles de documents seront réécrites ensemble, et aucune
des deux n'est aujourd'hui la référence fiable.

---

## 1. `docs/component-behavior.md`

| Lignes | Citation courte | Ce que ça prescrit | À changer avec `@udixio/motion` |
|---|---|---|---|
| 59-64 | « vivent dans le sous-module `@udixio/core/dom` […] Ce sous-module utilise l'API JavaScript de Motion et retourne une fonction de nettoyage. » | Tout effet impératif ou animé vit dans `@udixio/core/dom` et repose sur Motion JS ; le contrôleur rend une fonction de nettoyage. | Le moteur nommé disparaît. Il faut dire ce que `core/dom` délègue à `@udixio/motion` et ce qui reste à `core/dom` (géométrie, gestes, ARIA). Il faut aussi vérifier que le contrat « retourne une fonction de nettoyage » reste compatible avec le cycle de vie des providers (B3). |
| 65-66 | « React connecte le contrôleur dans `useEffect` ; Angular le connecte dans `afterRenderEffect` » | Branchement du contrôleur par framework. | Svelte (`$effect`) est absent de la liste, une dérive antérieure. Il faudra aussi dire si les adaptateurs `@udixio/motion` (React, Angular, Svelte) remplacent ce branchement manuel pour les animations. |
| 68-69 | « le contrôleur Motion, les durées, le filtrage pointer/clavier et `prefers-reduced-motion` sont uniques et partagés » | Un seul contrôleur Motion partagé, des durées partagées, `prefers-reduced-motion` géré une fois dans le contrôleur. | « Contrôleur Motion » ne désignera plus rien. Les durées deviennent des tokens et `prefers-reduced-motion` devient une politique du modèle ou des providers (`motion-safe:` côté Tailwind, C4). Il faudra dire où vit chaque élément : composant, `core/dom` ou `@udixio/motion`. |
| 73-76 | « il utilise directement le contrat `Transition` de Motion dans ses props communes. Les adaptateurs ne le convertissent jamais en raccourci CSS et le cœur ne fusionne pas une transition fournie avec des valeurs par défaut cachées. » | Le type public `Transition` de Motion fait partie du contrat. Ce type n'est jamais converti en CSS et ne reçoit aucune valeur par défaut cachée. | Le type `Transition` disparaît (C15, D2) au profit d'un type issu de `MotionSpec` (B2). Les deux sous-règles, « pas de conversion en raccourci CSS » et « pas de fusion cachée de valeurs par défaut », sont à réexaminer : le provider CSS natif convertit justement une spec en CSS. |
| 77-78 | « Motion anime le rayon du composant interactif et le `stateLayer` hérite de ce rayon » | Règle de géométrie partagée (une seule valeur animée par frame). | Le principe reste indépendant du moteur, mais le sujet « Motion » doit changer. À relier à la famille layout/forme du §5 de la spec. |
| 80-81 | « Une implémentation `motion/react` et une réécriture Angular équivalente sont interdites pour un même effet » | Interdit la duplication par framework. | Le principe reste, mais l'exemple nomme `motion/react`. La règle doit aussi couvrir Svelte (`svelte/transition`) et les adaptateurs `@udixio/motion`. |
| 83-91 | « Exception : diff de layout avec Anime.js » ; « le diff avant/après de Motion (`animateLayout`) est une fonctionnalité payante de Motion+ » ; « `createAutoLayoutController` » ; liste `createTextFieldLabelController`, `createFabLabelController`, `createSwitchThumbController` | Régime d'exception : anime.js Layout via `createAutoLayoutController` pour les bornes `width: auto`. Énumère les trois contrôleurs concernés. | La section entière perd sa raison d'être : il n'y a plus de « Motion par défaut » dont s'écarter. La famille layout (FLIP) de `@udixio/motion` reprend le cas, et `createAutoLayoutController` est candidat à la migration (M1). La liste nominative des contrôleurs devient fausse dès qu'ils migrent. |
| 94-98 | « Anime.js remesure et réanime tous les descendants sous cette racine, et coupe leur `transition` inline pendant le diff […] doivent passer par un tween Anime.js. » | Piège propre au moteur Layout d'anime.js et contournement par un tween. | Comportement propre au provider anime.js. Selon S2 (anime Layout ou View Transitions), le piège sort des conventions et va dans la doc du provider, ou dans un test de conformance. |
| 100-113 (§5 Matrice de tests) | Sept scénarios, sans mention de mouvement | Aucune règle d'animation ici. | Rien à réécrire. À noter : la matrice obligatoire ne contient aucun scénario reduced-motion ni animation, alors que le plugin en exige (`quality-gates.md:12`). |

## 2. `docs/component-authoring.md`

| Lignes | Citation courte | Ce que ça prescrit | À changer |
|---|---|---|---|
| 33-38 | « Le type `Transition` de l'API JavaScript de Motion est agnostique : il vit dans le cœur lorsqu'une animation est exécutée par `@udixio/core/dom` pour tous les adaptateurs. » | Autorise et place le type Motion `Transition` dans les interfaces du cœur. | À remplacer par le type public issu de `@udixio/motion` (B2, D2). Il faut préciser que ce type vient d'un paquet tiers au cœur, ce qui touche la dépendance `core → @udixio/motion` (D1, C12). |
| 102 | `$effect(() => { const c = createXxxController(...); return () => c.destroy(); });` | Schéma de branchement d'un contrôleur `core/dom` en Svelte. | Indépendant du moteur. Seulement si les adaptateurs `@udixio/motion` introduisent un autre branchement (action ou attachment Svelte) : ajouter le cas animation. |

Aucune autre mention (ni anime.js, ni `prefers-reduced-motion`, ni `anim-*`).

## 3. Plugin `plugins/udixio-ui-governance` (source, version 0.5.0)

### 3.1 References

| Fichier:lignes | Citation courte | Ce que ça prescrit | À changer |
|---|---|---|---|
| `references/repository-map.md:13` | « Shared DOM effects \| `packages/core/src/lib/dom/` \| One imperative implementation, anime.js when animated » | Emplacement canonique des effets et moteur imposé. | Ajouter une ligne pour `@udixio/motion` (paquet, plugin Tailwind, adaptateurs). Retirer « anime.js when animated ». |
| `references/repository-map.md:36-42` | « Shared animated effects are implemented once in `@udixio/core/dom` with **anime.js** […] The `motion` package survives only as residue to retire […] **adding** an animated effect requires moving that effect down into `core/dom`. » | Doctrine anime.js, inventaire du résidu `motion`, règle « tout nouvel effet animé descend dans `core/dom` ». | Paragraphe à réécrire en entier : moteur, inventaire (factuellement incomplet, voir §0) et destination des nouveaux effets (`core/dom` ou `@udixio/motion`). |
| `references/material-3-workflow.md:13` | « motion duration, easing, interruption, and reduced-motion behavior » | Liste les aspects motion à extraire de la spec M3. | Reste valable. Il manque peut-être un renvoi vers les tokens de `@udixio/motion` (durées et easings M3). |
| `references/material-3-workflow.md:26-28` | « a single shared controller in `@udixio/core/dom` when imperative effects are needed — […] animation. Animated effects use anime.js. » | Étape 4 du flux de création : contrôleur `core/dom` + anime.js. | La phrase sur le moteur disparaît. L'étape doit dire quand une animation passe par `@udixio/motion` (classes, attributs, API) et quand elle passe par un contrôleur `core/dom`. |
| `references/material-3-workflow.md:36-37` | « Reject […] duplicated animations, CSS-only reimplementations of shared animated behavior » | Rejette le CSS seul quand un effet partagé existe. | À réexaminer : avec C3 (« natif dès que possible ») et le provider CSS natif, du CSS peut devenir la voie normale. La règle doit plutôt viser une réimplémentation hors `@udixio/motion`. |
| `references/svelte-conventions.md:50-52` | « `$effect` creates `@udixio/core/dom` controllers with `bind:this` element references and destroys them in its cleanup » | Branchement Svelte des contrôleurs. | Indépendant du moteur. À compléter si l'adaptateur Svelte de `@udixio/motion` propose une action ou un attachment. |
| `references/svelte-conventions.md:55-56` | « No `svelte/transition`, `svelte/animate`, or CSS-only reimplementation of an effect that core animates with anime.js. » | Interdit les transitions natives Svelte et le CSS seul. | Le moteur nommé disparaît. Il faut réexaminer l'interdiction de `svelte/transition` au regard de l'adaptateur Svelte de `@udixio/motion` (présence, F-présence du §5). |
| `references/angular-conventions.md:21` | « `afterRenderEffect` connects `@udixio/core/dom` controllers; every controller is destroyed. » | Branchement Angular. | Indépendant du moteur. Il faudra peut-être situer `animate.enter`/`animate.leave` d'Angular (cité en R2) : interdits, ou délégués à `@udixio/motion`. |
| `references/audit-contract.md:54-55` | « Never accept […] a second animation/state engine as a fix. » | Interdit d'introduire un second moteur. | Reste valable sur le fond. À reformuler en « un moteur hors `@udixio/motion` », puisque `@udixio/motion` porte lui-même plusieurs providers. |
| `references/quality-gates.md:12-13` | « Equivalent controlled/uncontrolled, blocked, ARIA, keyboard, pointer, reduced-motion, and cleanup scenarios in every adapter » | Le reduced-motion fait partie des gates. | Reste valable. Ajouter peut-être la conformance navigateur (I1, I2) quand un composant utilise `@udixio/motion`. |
| `references/accessibility-standard.md:16` | « Reduced-motion handling that preserves meaning and completion. » | Exigence a11y indépendante du moteur. | Rien sur le fond. Un renvoi vers la politique reduced-motion de `@udixio/motion` est possible. |
| `references/public-api-standard.md:39` | « remains accurate if internal markup, spacing, animation, or state ownership changes » | Le contrat public ne dépend pas de l'animation interne. | Rien à changer, mais c'est un argument direct pour retirer `Transition` de Motion des interfaces (D2). |

### 3.2 Skills

| Fichier:lignes | Citation courte | Ce que ça prescrit | À changer |
|---|---|---|---|
| `skills/audit-multiframework/SKILL.md:3` | « shared interfaces, styles, behavior, DOM and animation controllers » | Le périmètre de l'audit inclut les contrôleurs d'animation. | Ajouter `@udixio/motion` au périmètre (usage correct du paquet, aucune animation hors paquet). |
| `skills/audit-multiframework/SKILL.md:19-20` | « `@udixio/core/dom` for every imperative behavior […] cross-instance coordination, and animation » | Range l'animation dans `core/dom`. | « and animation » renvoie désormais à `@udixio/motion`. La « coordination inter-instances » recoupe la coordination par le DOM (§4.4 de la spec). |
| `skills/audit-multiframework/SKILL.md:27-30` | « Animated effects use anime.js, chosen because it is plain JavaScript and therefore consumable identically by React, Angular, and Svelte. » | Doctrine anime.js. | La justification, « JS pur consommable par tous les adaptateurs », se transpose à `@udixio/motion`. Le moteur nommé disparaît. |
| `skills/create-material-component/SKILL.md:3` | « DOM and animation effects » | Périmètre de création. | Mentionner `@udixio/motion`. |
| `skills/create-material-component/SKILL.md:15` | « Record anatomy, variants, states, interactions, motion, tokens » | Extraction du motion de la spec M3. | Rien sur le fond. |
| `skills/create-material-component/SKILL.md:24-25` | « shared DOM/animation controller only when required » | Contrôleur d'animation dans le cœur. | Même question que `material-3-workflow.md:26-28`. |
| `skills/sync-angular-component/SKILL.md:31` | « […] animation, accessibility, exports, and tests » (matrice de parité) | Parité d'animation. | Rien sur le fond. |
| `skills/sync-angular-component/SKILL.md:38-40` | « do not port […] `motion/react` concepts into Angular. Shared animated effects live once in `@udixio/core/dom` with anime.js » | Interdit `motion/react` ; anime.js dans `core/dom`. | `motion/react` est retiré du dépôt (M2), donc l'interdiction devient obsolète. Le moteur et l'emplacement changent. |
| `skills/sync-svelte-component/SKILL.md:31` | « […] styles, animation, accessibility » | Parité. | Rien. |
| `skills/sync-svelte-component/SKILL.md:46-47` | « do not port React hooks, `useEffect` ordering, or `motion/react` concepts. Shared animated effects live once in `@udixio/core/dom` with anime.js. » | Même règle côté Svelte. | Même changement que pour Angular. |
| `skills/audit-framework-quality/SKILL.md:38` | « Clean up DOM controllers, subscriptions, observers, and animations. » | Nettoyage des animations. | Indépendant du moteur. À relier au cycle de vie des providers (B3 : cancel, cleanup). |
| `skills/audit-framework-quality/SKILL.md:52` | « No `svelte/transition` or `svelte/animate` duplicating a core anime.js effect. » | Interdit la duplication d'un effet anime.js. | Le moteur nommé disparaît. Même réexamen que `svelte-conventions.md:55-56`. |
| `skills/audit-accessibility/SKILL.md:3` | « contrast, motion, touch targets » | Périmètre a11y. | Rien. |
| `skills/audit-accessibility/SKILL.md:24-25` | « Verify animation, reduced-motion behavior, and state-layer geometry » | Vérification du reduced-motion. | À préciser une fois la politique reduced-motion de `@udixio/motion` définie (où elle s'applique, comment la tester). |
| `skills/audit-parity/SKILL.md:3` et `:43` | « API/state/event/DOM/style/motion/accessibility/test parity » ; « pointer, keyboard, focus, animation, interruption, cleanup, and reduced motion » | Parité motion entre adaptateurs. | Rien sur le fond. L'interruption (§5, famille Interruption) aura un comportement défini par `@udixio/motion`. |
| `skills/audit-public-api/SKILL.md:33` | « truthful if markup, CSS, animation, delivery shape […] changes » | Contrat stable face à l'animation. | Rien. |

### 3.3 README et manifeste

| Fichier:lignes | Citation | À changer |
|---|---|---|
| `README.md:48` | « Validate semantics, ARIA, keyboard/focus, contrast, motion, touch targets, and RTL » | Rien. |
| `README.md:64-65` | « `MULTI-OWNERSHIP-*` […] shared imperative logic that belongs in `@udixio/core/dom` » | Réexaminer si une logique d'animation en hook doit plutôt être signalée vers `@udixio/motion`. |
| `.claude-plugin/plugin.json:3` (`0.5.0`), `.codex-plugin/plugin.json:3` (`0.5.0+codex.…`) | — | M3 implique une montée de version du plugin (`skills/evolve-governance/SKILL.md:40`). |

`plugins/udixio-ui-usage/` : aucune prescription liée au motion, à anime.js ou à `anim-*`. Si `@udixio/motion` devient public, il faudra peut-être un skill ou une reference d'usage côté consommateur (hors E2).

## 4. Copies installées hors dépôt (`~/.claude/plugins/cache/udixio-ui/udixio-ui-governance/`)

- **`0.5.0/`** : la copie active (`installed_plugins.json` → `installPath …/0.5.0`, commit `8447a9e7`). Elle reprend les mêmes passages anime.js que la source (§3). Cette copie est régénérée par réinstallation et ne s'édite pas : M3 met à jour la source, puis la publication et la réinstallation suivent.
- **`0.1.0-codex.20260722135539/`** : ancienne copie, qui prescrit encore **Motion** (« One imperative implementation, Motion JavaScript when animated » dans `references/repository-map.md:13` ; « single shared DOM/Motion controller » dans `references/material-3-workflow.md:26` ; « Require one Motion JavaScript controller » dans `skills/audit-multiframework/SKILL.md:23` ; « Verify Motion/reduced-motion behavior » dans `skills/audit-accessibility/SKILL.md:24`). Ce cache est périmé et sans effet si 0.5.0 est actif, mais un agent Codex qui le chargerait recevrait encore la doctrine Motion. À purger lors de M3, pas à réécrire.

## 5. Annexes : mentions hors conventions (pour mémoire)

À ne pas réécrire en M3, mais à rendre cohérentes :

- `packages/core/README.md:5-6` : « keyboard handling, focus, controlled state, motion — do not depend on React or Angular ». Le texte ne nomme aucun moteur. Il devient inexact si le motion quitte `core` pour `@udixio/motion`.
- `packages/tailwind/README.md:8-9` et `:131-134` : « a small Tailwind plugin of its own for state layers and motion » ; « the state layer and motion utilities the component libraries rely on ». Ces lignes décrivent `anim-*`, qui est traité en E3.
- `packages/ui-react/README.md:119` : « Effects \| `State`, ripple, `AnimateOnScroll`, smooth scroll, scroll-driven animation ». Traité en E3.
- `CHANGELOG.md` de `core`, `ui-react` et `ui-angular` (« shared Motion animation », « cross-framework Motion JavaScript controller ») : historique, à ne pas toucher.
- Specs et plans historiques qui citent Motion ou anime.js : `docs/superpowers/specs/2026-07-15-extract-styles-package-design.md` (1), `2026-07-16-agnostic-core-states-design.md` (3), `2026-09-09-framework-idiomatic-forms-design.md` (11), `docs/superpowers/plans/2026-09-09-framework-idiomatic-forms.md` (33). Archives datées, à ne pas réécrire.
- Mémoire utilisateur (`~/.claude/projects/…/memory/`) : `feedback_ask-animation-library.md` (anime.js voulu, pas Motion), `animejs-layout-transition-muting.md` (`createAutoLayoutController`, fondu en tween JS), `motion-residue-real-scope.md`. Ces fichiers ne relèvent pas de M3, mais ils deviendront partiellement obsolètes après la migration.

## 6. Synthèse pour M3 : sections à réécrire

1. `docs/component-behavior.md` §« Effets visuels pilotés par le DOM » (l. 59-81) et §« Exception : diff de layout avec Anime.js » (l. 83-98) : à réécrire en entier.
2. `docs/component-authoring.md` l. 35-38 : la règle sur le type `Transition`.
3. Plugin de gouvernance : `references/repository-map.md` (l. 13, 36-42), `references/material-3-workflow.md` (l. 26-28, 36-37), `references/svelte-conventions.md` (l. 55-56), `skills/audit-multiframework` (l. 3, 19-20, 27-30), `skills/sync-angular-component` (l. 38-40), `skills/sync-svelte-component` (l. 46-47), `skills/audit-framework-quality` (l. 52), `references/audit-contract.md` (l. 55, reformulation), puis une montée de version du plugin.
4. À compléter sans réécrire : les règles reduced-motion (`quality-gates`, `accessibility-standard`, `audit-accessibility`, matrice §5 de `component-behavior.md`) et le branchement des adaptateurs (Svelte absent de `component-behavior.md:65-66`).
5. Hors M3 mais à aligner : README de `core`, `tailwind` et `ui-react` (voir E3), cache plugin `0.1.0-codex` à purger.
