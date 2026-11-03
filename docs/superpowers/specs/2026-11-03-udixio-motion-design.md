# Udixio Motion — design évolutif (spec-roadmap)

Date : 2026-11-03 · Branche : `feat/anime` · Statut : **vivant**

Ce document n'est pas une spec figée qui se traduit directement en plan
d'implémentation. Un wrapper d'animation multi-framework ne peut pas être
décrit correctement en amont : une partie du design ne peut émerger que de
recherches, de spikes et de discussions. Le document fixe donc :

1. l'intention, les objectifs et les contraintes **déjà décidés** ;
2. l'architecture de principe ;
3. le **catalogue complet** de ce que le wrapper devra couvrir ;
4. un **graphe de travaux typés** (brainstorming, recherche, décision, spike,
   implémentation) qui précisent le design au fur et à mesure.

Chaque travail terminé met ce document à jour (section concernée + journal en
fin de document). Seuls les travaux de type 🛠️ passent par
`superpowers:writing-plans`.

---

## 1. Intention

Udixio UI (React, Angular, Svelte) a besoin d'une couche d'animation commune.
Aujourd'hui, le motion est quasi absent des sites construits avec Udixio, non
par manque d'envie mais par friction :

- **anime.js** : JavaScript verbeux, pénible à relire ; un agent IA y produit
  facilement du code qui marche mais que personne ne peut maintenir ;
- **Motion (ex-Framer Motion)** : ergonomie excellente (`layoutId`,
  `AnimatePresence`…) mais limitée à React ; la version vanilla est restreinte
  et une partie est payante (Motion+) ;
- **les utilitaires `anim-*` actuels** (`packages/tailwind/src/plugins-tailwind/animation.ts`
  + `packages/ui-react/src/lib/effects/AnimateOnScroll.ts`) : difficiles à mettre
  en place, fallback cassé (voir §9), vivent dans `ui-react`.

**Réussite** : ajouter du motion à un site Udixio devient aussi banal
qu'ajouter une classe de couleur. On l'écrit vite, on le relit d'un coup d'œil,
un agent IA l'écrit correctement du premier coup, et l'animation est fidèle
d'un navigateur à l'autre en s'appuyant sur le natif dès que possible.

## 2. Objectifs, non-objectifs, anti-objectifs

### Objectifs

- Un **modèle d'animation agnostique** (`MotionSpec`) indépendant de tout
  moteur, calqué sur le modèle Web Animations du W3C (keyframes + timing +
  timeline) et étendu (spring, stagger, séquence, layout, présence, triggers).
- Des **providers** interchangeables qui réalisent ce modèle : CSS natif, WAAPI,
  anime.js ; un autre moteur doit pouvoir être ajouté ou substitué sans casser
  les animations existantes.
- Des **syntaxes** multiples sur ce même modèle : classes Tailwind (référence),
  attributs HTML, API TypeScript, adaptateurs React / Angular / Svelte.
- La **définition intégrale** du wrapper (les 23 familles du §5), avec une
  roadmap publique ; rien n'est laissé de côté, tout n'est pas livré en même
  temps.
- **Test-first** : une suite de conformance exécutée dans de vrais navigateurs
  (Chromium, Firefox, WebKit) précède les providers ; des mesures de
  performance avec budgets et points de comparaison.
- **Migration interne** : les contrôleurs de composants Udixio utilisent la
  nouvelle couche ; la dépendance `motion` disparaît.

### Non-objectifs (pour l'instant)

- Animation 3D / canvas / scènes Three.js (noté dans la roadmap « plus tard »).
- Physique 2D (gravité, collisions), intégrations Pixi / Easel.
- Composants prêts à l'emploi (carousel, ticker, curseur custom) : ce sont des
  composants Udixio qui *utiliseront* le wrapper, pas le wrapper.
- Outils de debug visuels type GSDevTools (idée pour plus tard).
- Fonctionnalités propres à un seul framework (`AnimateSuspense`,
  `AnimateActivity` de Motion) dans le modèle ; elles relèveraient d'un
  adaptateur.
- Rétro-compatibilité avec `anim-*` : **déprécié, on repart de zéro**.

### Anti-objectifs (échec même si « ça marche »)

- Un wrapper qui recopie l'API d'anime.js propriété par propriété.
- Du CSS-in-JS comme syntaxe principale.
- Une coordination qui dépend d'un contexte React / Angular / Svelte (casse dans
  les îles Astro et en HTML pur).
- Un fallback JS qui « ressemble » au natif sans le reproduire fidèlement.
- Un vocabulaire avec plusieurs façons d'écrire la même chose, ou des erreurs
  silencieuses (une classe inconnue qui n'anime rien sans le dire).
- Un modèle si générique qu'il devient un langage d'animation à part entière.

## 3. Contraintes décidées (par l'utilisateur)

| # | Contrainte |
|---|---|
| C1 | Multi-framework comme chaque composant de la lib : core agnostique + adaptateurs. |
| C2 | anime.js est le moteur JS de référence (cf. mémoire « Demander la lib d'animation ») ; il doit être **remplaçable**. |
| C3 | Compatible natif dès que possible (CSS récents, View Transitions…) ; JS seulement en fallback ou là où le natif n'existe pas. S'appuyer sur les standards établis, tendre la main aux innovations natives côté performance. |
| C4 | **Tailwind-friendly** : pas de CSS-in-JS ; les variants (`hover:`, `data-[…]:`, `md:`, `group-*:`, `motion-safe:`…) doivent pouvoir conditionner une animation. Si un cas est mieux servi par le style en JS, c'est acceptable et documenté. |
| C5 | Intuitif pour **n'importe quel agent IA**. |
| C6 | Compatible Astro et autres architectures en îles : pas de dépendance à un contexte de framework. |
| C7 | `anim-*` est déprécié ; refonte complète. |
| C8 | Tests écrits avant les providers, avec Playwright ; performance mesurée. |
| C9 | La doc `/animations` est remplacée par une section Motion complète, avec roadmap publique. |
| C10 | Animation de valeurs (compteurs, `animate(value)`) dans le périmètre ; Three.js / canvas hors v1. |
| C12 | Le module vit dans un **paquet autonome `@udixio/motion`** (D1), sans dépendance à React ; core et les adaptateurs en dépendent. |
| C13 | **Navigateurs supportés = requête browserslist `defaults`.** Tests à chaque PR : 3 moteurs Playwright récents, chaque provider forcé. Nightly et avant release : pour chaque moteur, la version la plus ancienne satisfaisant `defaults` (Chrome via Chrome for Testing ; Firefox ESR et Safari réels via un service cloud, offre open source à vérifier). Le même `browserslist` sert au build. |
| C14 | **Tailwind est un prérequis** de `@udixio/motion`, comme pour `@udixio/ui-*` et `@udixio/theme`. Pas de feuille CSS statique autonome : keyframes, variables et syntaxe en attributs sont générés par le plugin Tailwind. Priorité à l'écosystème Udixio plutôt qu'à l'autonomie ou l'externalisation du paquet. « HTML pur » (C6) s'entend donc : HTML dans un projet Tailwind + Udixio. |
| C15 | **Tout le chantier vit sur `feat/anime`**, fusionné d'un bloc à la fin. Pas de publication intermédiaire ni de coexistence publique avec `anim-*`. *Déduction Claude, à confirmer en D2* : `anim-*` et le type `Transition` de Motion disparaissent dans la même release que l'arrivée de `@udixio/motion`. La branche doit être rebasée régulièrement sur `develop` pour limiter la divergence. |
| C11 | « Jamais de logique internal-only » : tout ce que les composants Udixio utilisent est exporté (mémoire `feedback_no-internal-only-logic`). |

## 4. Architecture de principe

Ces principes sont issus de la discussion. Ceux marqués *(choix Claude)* sont
des propositions à confirmer lors des brainstormings indiqués.

### 4.1 Trois couches

```
Syntaxes        classes Tailwind │ attributs HTML │ API TS │ adaptateurs React / Angular / Svelte
                          ↘              ↓            ↓              ↙
Modèle (core)   MotionSpec : keyframes · timing (durée, délai, easing, spring, stagger)
                · timeline (temps, scroll, view) · trigger (mount, in-view, state, presence)
                · layout · séquence
                                         ↓
Providers       css-native │ waapi │ animejs │ (futur moteur)
                choisis par capacité navigateur + capacité requise par la spec
```

### 4.2 Le contrat de variables CSS (Tailwind ↔ providers) *(choix Claude, à valider en B1/S1)*

Les classes posent des **variables CSS** (`--motion-*` ou préfixe à décider),
jamais du style inline. Le provider CSS natif les consomme directement ; le
provider JS les lit via `getComputedStyle`. Conséquence : tous les variants
Tailwind fonctionnent sans code supplémentaire, puisque le moteur ne lit que le
style calculé.

### 4.3 L'état vit dans les classes, le moteur anime le changement

Tendance convergente du natif et des frameworks (`@starting-style`, Angular
`animate.enter`, Vue `<Transition>`, View Transitions) : on décrit des **états**
en CSS ; le moteur orchestre les passages. Exemple : animer
`justify-start` → `data-[open]:justify-end` = une classe qui marque l'élément
pour l'animation de layout (FLIP) ; le moteur mesure avant/après.

**Limite connue** : une animation de **layout** exige un changement observable
dans le DOM (classe, attribut, contenu). Un `hover:justify-end` purement CSS
n'est pas détectable. Les propriétés transitionnables en CSS (opacité,
transform, couleurs, taille via `interpolate-size` là où c'est supporté)
fonctionnent en `hover:` sans JS.

### 4.4 Coordination par le DOM

`layoutId`, groupes, stagger et présence se coordonnent via le DOM
(attributs, registre global indexé par identifiant), pas via un contexte de
framework. Les adaptateurs de framework sont du sucre sur la syntaxe en
attributs/classes, qui fonctionne seule en HTML pur et entre îles Astro.

### 4.5 Providers par capacités

Chaque provider déclare ses **capacités** (ex. `scroll-timeline`,
`layout-flip`, `spring`, `velocity-handoff`, `discrete-properties`). Chaque
spec déclare les capacités requises. La sélection se fait à l'exécution :
natif d'abord, JS sinon. Un provider doit pouvoir être **forcé** (tests,
debug, préférence utilisateur).

### 4.6 Échappatoire

Pour ce que le modèle ne couvre pas, un canal propre au provider donne accès
au moteur (ex. instance anime.js). Ce qui passe par ce canal **n'est pas
portable** ; la doc le dit explicitement.

### 4.7 Fidélité par construction *(choix Claude, à valider en S1)*

Quand un fallback JS reproduit un effet CSS, il **pilote les animations CSS
existantes** plutôt que de réécrire leurs keyframes : par exemple
`el.getAnimations()` + pause + `currentTime = progression × durée` pour le
scroll-driven. Une seule source de vérité (les keyframes), aucune
réinterprétation.

## 5. Catalogue complet des familles

Le wrapper définit **toutes** ces familles. L'ordre de livraison est au §7
(phase 3). Statuts : `à concevoir` → `conçu` → `testé` → `livré`.

| # | Famille | Natif pressenti | Fallback / moteur JS | Référence externe |
|---|---|---|---|---|
| F1 | Tokens : durées, easings, springs M3, easings personnalisés | `linear()` (springs pré-calculés), `cubic-bezier`, `steps` | anime `spring`, `irregular` | GSAP CustomEase, Motion easing functions |
| F2 | Transitions d'état (hover, focus, `data-state`, propriétés discrètes) | `transition`, `allow-discrete`, `interpolate-size` | anime / WAAPI pour tailles `auto` hors Chromium | Motion `whileHover`/`whilePress` |
| F3 | Présence : entrée / sortie, montage / démontage, `display:none` | `@starting-style`, `allow-discrete` | hooks de sortie par framework, anime Layout `enterFrom`/`leaveTo` | Motion `AnimatePresence`, Svelte `in:/out:`, Angular `animate.leave` |
| F4 | Déclenchement à la vue (une fois / répété, seuils, direction) | `animation-trigger` (Chrome 146+) | IntersectionObserver, anime `onScroll` | GSAP ScrollTrigger, Motion `inView` |
| F5 | Lié au scroll (progression, plages, axe, conteneur nommé) | `animation-timeline: view()/scroll()` (Chrome, Safari 26 ; Firefox derrière flag) | pilotage `currentTime` (cf. 4.7), anime `onScroll` sync | GSAP scrub, Motion `scroll()` |
| F6 | Scroll piloté (scrollTo, smooth scroll) | `scroll-behavior`, `scrollIntoView` | anime ; existant `smooth-scroll.effect.tsx`, `custom-scroll` | GSAP ScrollTo/ScrollSmoother, Lenis |
| F7 | Layout (taille, position, `auto`, `justify-*`, réordonnancement) | `interpolate-size`, `element.startViewTransition()` (Chrome 147+) | anime Layout (FLIP) | GSAP Flip, Motion `layout` |
| F8 | Élément partagé (`layoutId`) entre composants et îles | View Transitions + `match-element` (Baseline) | anime Layout id | Motion `layoutId` |
| F9 | View Transitions de page / route (dont Astro) | View Transitions same-document / cross-document | — | Motion `AnimateView` |
| F10 | Listes : stagger, ajout / suppression, réordonnancement | `sibling-index()` (Chromium) | délai calculé, anime `stagger` (grille, jitter) | Motion `Reorder`, Svelte `animate:flip` |
| F11 | Chorégraphie : séquences, décalages relatifs, propagation parent → enfants | — | anime Timeline | GSAP Timeline, Motion variants / sequences |
| F12 | Contrôle : play / pause / reverse / seek, promesses de fin, événements | WAAPI | anime | toutes |
| F13 | Interruption et physique (reprise avec vitesse) | — | anime spring, Draggable | Motion (natif sur springs), GSAP Inertia |
| F14 | Valeurs réactives (curseur, parallaxe, vitesse, mapping) | — | anime Animatable, `mapRange` | Motion motionValue/useTransform, GSAP `quickTo` |
| F15 | Animation de valeurs (compteurs, `animate(value)`) | `@property` + transition (entiers) | anime (objets JS) | Motion `AnimateNumber` (payant) |
| F16 | Texte : découpage, brouillage, remplacement | — | anime `splitText`, `scrambleText` | GSAP SplitText, Motion+ |
| F17 | SVG : tracé, morphing, trajectoire | `offset-path`, `d` en CSS (partiel) | anime `createDrawable`, `morphTo`, `createMotionPath` | GSAP DrawSVG/MorphSVG/MotionPath, Motion `pathLength` |
| F18 | Gestes : drag, lancer, inertie, swipe, drag-to-reorder | — | anime Draggable | GSAP Draggable/Inertia/Observer, Motion drag |
| F19 | Responsive et scopes (par breakpoint, nettoyage groupé) | variants Tailwind, media queries | anime Scope `mediaQueries` | GSAP `matchMedia`/`context` |
| F20 | Accessibilité : politique reduced-motion par famille | `prefers-reduced-motion`, `motion-safe:` | — | Motion `MotionConfig` |
| F21 | Performance du moteur (pause onglet caché, page invisible, budgets) | — | anime `pauseOnDocumentHidden` | Motion `usePageInView` |
| F22 | Usage interne : migration des contrôleurs Udixio | — | — | — |
| F23 | Outillage agents IA : types stricts, détection des classes inconnues, exposition via `packages/mcp`, doc pour agents | — | — | Motion AI Kit / agent skill |

Les supports navigateur ci-dessus datent de la discussion du 2026-11-03 et
**doivent** être revérifiés par R1 avant toute décision qui en dépend.

## 6. Types de travaux

Chaque travail du §7 a un identifiant, un type, des entrées, une sortie
(fichier ou décision consignée ici) et un critère de fin.

| Type | Qui | Forme |
|---|---|---|
| 🧠 Brainstorming | humain + Claude | `superpowers:brainstorming` ciblé ; met à jour ce document |
| 🔎 Recherche | sous-agent | rapport sourcé dans `docs/motion/research/<id>-<sujet>.md` ; aucune décision prise par le sous-agent |
| 📚 Existant | Claude (ou sous-agent Explore) | inventaire du code / de la doc existants, consigné dans `docs/motion/research/` |
| ⚖️ Décision | humain | question fermée, préparée avec options et recommandation ; réponse consignée au §10 |
| 🧪 Spike | Claude | prototype jetable sur une branche dédiée ; enseignements consignés ici, code non conservé |
| 🛠️ Implémentation | Claude | `superpowers:writing-plans` puis exécution ; test-first |

## 7. Graphe des travaux

### Phase 0 — Connaissance (parallélisable)

| ID | Type | Sujet | Sortie / critère de fin |
|---|---|---|---|
| R1 | 🔎 | Matrice de support natif à jour (MDN, caniuse, Interop 2026, notes de version) pour chaque fonctionnalité native du §5 | Tableau : fonctionnalité × Chrome / Firefox / Safari, version, flag, statut Baseline, sources |
| R2 | 🔎 | Syntaxes existantes et réception : Motion (React / vanilla / Vue), GSAP, anime.js, tw-animate-css, tailwindcss-motion, Svelte transitions, Vue `<Transition>`, Angular `animate.enter/leave`, AOS, View Transitions d'Astro. Pour chacune : forme, forces, critiques de la communauté, erreurs typiques des agents IA | Rapport comparatif + liste des noms que les agents « connaissent » |
| R3 | 🔎 | Sémantique exacte des plages de `view()` / `scroll()` (entry, exit, cover, contain, pourcentages, longueurs) et de `animation-trigger` | Algorithme de calcul de progression implémentable, avec cas limites |
| R4 | 🔎 | Fidélité des fallbacks : pilotage de `CSSAnimation` via `currentTime`, `getComputedStyle` de variables sous variants, coût de lecture | Faisabilité + pièges navigateur |
| R5 | 🔎 | Licences et coûts des moteurs candidats (anime.js, GSAP, Motion) pour une lib distribuée | Tableau licence / restrictions / risques |
| E1 | 📚 | Inventaire interne : contrôleurs `@udixio/core/dom` sur Motion (~12) et anime.js (~7), type `Transition` de Motion dans les interfaces publiques, `motion` dans les `package.json`, `anim-*`, `ui-react/src/lib/effects/*`, `smooth-scroll`, `custom-scroll`, `fab-motion.ts` | Tableau : fichier, effet, famille §5, moteur, API publique impactée |
| E2 | 📚 | Conventions à remplacer : `docs/component-behavior.md` (« Motion par défaut, anime.js en exception »), `docs/component-authoring.md`, skills de gouvernance qui mentionnent Motion | Liste des sections à réécrire |
| E3 | 📚 | Doc actuelle : `apps/doc/src/pages/animations.astro`, layout qui appelle `initAnimateOnScroll`, copie dans `packages/mcp/src/bundled/doc-src` | Liste de ce qui disparaît / migre |

### Phase 1 — Le modèle (dépend de R1, R2, E1)

| ID | Type | Sujet | Sortie / critère de fin |
|---|---|---|---|
| B1 | 🧠 | **Vocabulaire** : préfixe (`motion-*` ? autre), alignement sur tw-animate / Motion, nommage des classes, des attributs et de l'API TS, règle « une seule façon d'écrire » | Lexique validé, consigné en §8.1 |
| B2 | 🧠 | **Modèle `MotionSpec`** : types TS du modèle de données (keyframes, timing, timeline, trigger, état, layout, séquence), extensions au modèle WAAPI | Types TS de référence (pseudo-code) en §8.2 |
| B3 | 🧠 | **Contrat provider** : interface, capacités, sélection, forçage, échappatoire, cycle de vie (création, update, cancel, cleanup), SSR | Interface de référence en §8.3 |
| D1 | ⚖️ ✅ | **Décidé : paquet `@udixio/motion`** (C12). Emplacement : sous-module `@udixio/core/motion` ou paquet `@udixio/motion` ; place du plugin Tailwind (`@udixio/tailwind`). Fait constaté : `@udixio/core` a `react` en peerDependency et `motion` + `animejs` en dépendances dures ; un sous-module de `core` hériterait de la peer React (tension avec C6). **Bloque la phase 2.** | Décision §10 |
| D2 | ⚖️ | Politique de breaking change : remplacement du type `Transition` de Motion dans les interfaces publiques, suppression de `anim-*` (immédiate ou après une version dépréciée) | Décision §10 |
| D3 | ⚖️ | GSAP comme provider futur possible malgré sa licence propriétaire (entrée R5) | Décision §10 |
| S1 | 🧪 | Contrat variables CSS + variants Tailwind lus par un provider JS ; pilotage `currentTime` d'une animation CSS scroll-driven en fallback ; mesure de fidélité native vs fallback | Go / no-go sur 4.2 et 4.7 |
| S2 | 🧪 | Coordination par le DOM : `layoutId` entre deux îles Astro (React + Svelte), View Transitions vs anime Layout, détection du changement (MutationObserver vs appel explicite) | Go / no-go sur 4.4, choix du mécanisme de détection |

### Phase 2 — Infrastructure de vérification (dépend de B2, B3, **D1, S1, S2**)

D1 conditionne la config Vitest, les cibles Nx, les points d'entrée et les
budgets ; S1 et S2 valident les mécanismes (lecture du style calculé,
forçage du provider, coordination DOM) sur lesquels repose le harness. En cas
de no-go d'un spike, un 🧠 brainstorming dédié choisit l'architecture de repli
avant la phase 2 ; un repli qui violerait un anti-objectif (§2) est une
décision ⚖️ de l'utilisateur.

| ID | Type | Sujet | Sortie / critère de fin |
|---|---|---|---|
| I1 | 🛠️ | Vitest en mode navigateur (Playwright : Chromium, Firefox, WebKit) pour le module motion. *Choix Claude* : les 3 navigateurs tournent en PR uniquement quand le module motion est affecté (`nx affected`), en nightly sinon | Un test trivial passe sur les 3 moteurs en CI |
| I2 | 🛠️ | Harness de conformance : format de scénario déclaratif, échantillonnage du style calculé à des points de progression, tolérances, forçage du provider, exécution du même scénario sur chaque provider. *Choix Claude, tolérances provisoires affinées par S1* : opacité ± 0,02, longueurs ± 1 px, échelle ± 0,01, angles ± 0,5°, couleurs ΔE < 1 | Un scénario F2 passe sur css-native et animejs |
| I3 | 🛠️ | Harness de performance : budgets `size-limit` par provider et par syntaxe (bloquants ; *choix Claude* : valeur initiale = mesure de la première version + 10 %), pages de benchmark 100 / 1000 éléments, Long Animation Frames, traces Chromium avec CPU ralenti, tests de fuite montage/démontage, points de comparaison Motion / GSAP / CSS pur | Rapport généré en CI ; budgets de poids bloquants, seuils de perf indicatifs |

### Phase 3 — Familles (boucle répétée par famille)

Pour chaque famille du §5, dans l'ordre ci-dessous :

1. 🧠 **mini-brainstorming** si la famille a des questions ouvertes (§9) ;
2. 🛠️ **scénarios de conformance** écrits en premier (I2) ;
3. 🛠️ **providers** (natif puis fallback) jusqu'au vert sur les 3 navigateurs ;
4. 🛠️ **syntaxes** : Tailwind, attributs, API TS, puis adaptateurs ;
5. 🛠️ **page de doc** + statut mis à jour dans la roadmap publique.

Ordre proposé *(choix Claude : dépendances + besoins internes d'abord)* :
F1 → F20 → F2 → F3 → F4 → F5 → F7 → F8 → F9 → F10 → F11 → F12 → F13 →
F15 → F19 → F21 → F6 → F16 → F17 → F14 → F18. F22 et F23 avancent en
continu (chaque famille livrée migre ses usages internes et enrichit
l'outillage IA).

### Phase 4 — Migration et nettoyage

| ID | Type | Sujet |
|---|---|---|
| M1 | 🛠️ | Migration des contrôleurs internes famille par famille (entrée E1) |
| M2 | 🛠️ | Suppression de la dépendance `motion` de `core`, `ui-react`, `ui-angular` |
| M3 | 🛠️ | Réécriture des conventions (entrée E2) et des skills de gouvernance concernés |
| M4 | 🛠️ | Suppression de `anim-*` et des effets `ui-react/src/lib/effects/AnimateOnScroll.ts` / `scrollDriven.ts` selon D2 |

### Phase 5 — Documentation (en continu, structure posée dès la phase 1)

Section **Motion** remplaçant `/animations` :

- Vue d'ensemble (modèle, providers, quelle syntaxe quand)
- Roadmap publique : statut par famille, provider utilisé par navigateur
- Tokens · Transitions d'état · Présence · Déclencheurs à la vue · Scroll-driven
  · Scroll piloté · Layout · Éléments partagés · View Transitions · Listes ·
  Chorégraphie · Contrôle · Interruption · Valeurs réactives · Compteurs ·
  Texte · SVG · Gestes · Responsive
- API impérative, providers, échappatoire, écrire un provider
- Accessibilité (reduced motion)
- Référence des utilitaires Tailwind
- Guide pour agents IA (règles, erreurs fréquentes)

## 8. Design détaillé (rempli par les travaux)

### 8.1 Vocabulaire — *à remplir par B1*
### 8.2 Modèle `MotionSpec` — *à remplir par B2*
### 8.3 Contrat provider — *à remplir par B3*
### 8.4 Détails par famille — *une sous-section par famille, remplie en phase 3*

## 9. Questions ouvertes connues

| Famille / sujet | Question |
|---|---|
| F3 Présence | Comment retenir un élément démonté le temps de sa sortie, de façon idiomatique dans chaque framework, sans contexte partagé (C6) ? |
| F4 / F5 | Faut-il un seul système de déclencheurs pour « à la vue » et « lié au scroll », ou deux concepts distincts dans le vocabulaire ? |
| F7 | Comment éviter qu'une racine de layout large coupe les `transition` CSS de ses descendants (piège connu d'anime.js Layout) ? |
| F8 / F9 | Quand utiliser View Transitions et quand le FLIP JS (interruptibilité, concurrence, scope) ? |
| F13 | Peut-on garantir la reprise avec vitesse quand le provider natif est actif ? |
| F15 | `@property` couvre-t-il assez de cas (formatage, décimales) pour un provider natif des compteurs ? |
| F20 | Politique par défaut : couper, remplacer par un fondu, ou laisser l'auteur choisir par famille ? |
| Tous | Comment signaler à l'exécution et à la compilation une classe ou une option inconnue (C5) ? |
| Tous | SSR / hydratation : quel état initial rendre côté serveur pour éviter le flash ? |
| Interne | Le fallback scroll-driven actuel (`ui-react/src/lib/effects/scrollDriven.ts`) vise `.udx-view.animate-in` et `--tw-enter-*`, des conventions qui ne correspondent plus aux classes `anim-*` générées : il n'agit sur aucun élément. À traiter par M4, pas à corriger isolément. |

## 10. Décisions

### Décidées par l'utilisateur

- Contraintes C1 à C11 (§3).
- Le design est évolutif : brainstormings, recherches par sous-agent, aide
  humaine et docs existantes alimentent ce document ; seules les tâches 🛠️
  passent en plan d'implémentation.
- Définir l'intégralité du wrapper avec une roadmap, plutôt qu'une v1 réduite
  à une famille.

### Choix de Claude (à contester)

- Calquer le modèle sur Web Animations (§4).
- Contrat de variables CSS entre Tailwind et les providers (4.2).
- Fidélité par pilotage des animations CSS existantes (4.7).
- Coordination par le DOM (4.4).
- Ordre des familles en phase 3.
- Vitest en mode navigateur pour la conformance, `@playwright/test` pour la
  performance.
- Rapports de recherche dans `docs/motion/research/`.

### En attente (⚖️)

D2 (en partie orientée par C15), D3.

## 11. Risques

- **Refaire Motion en entier** : son moteur de layout représente des années de
  travail. Le modèle reste étroit au départ et ne s'élargit que sur besoin.
- **Abstraction qui fuit** : sans suite de conformance, l'interchangeabilité
  des providers n'est qu'une intention.
- **Mesures de perf bruitées en CI** : seuls les budgets de poids sont
  bloquants.
- **Support natif mouvant** : la matrice R1 doit être revérifiée à chaque
  famille ; la sélection par capacités se fait à l'exécution, jamais par
  détection de navigateur.
- **Taille du chantier** : 23 familles. La roadmap publique rend l'avancement
  visible et évite que des familles soient oubliées.

## 12. Journal

| Date | Travail | Changement |
|---|---|---|
| 2026-11-03 | — | Création du document à l'issue du brainstorming initial. |
| 2026-11-03 | Livraison | Branche longue `feat/anime`, fusion finale (C15). |
| 2026-11-03 | Tailwind | Tailwind requis, écosystème d'abord (C14). |
| 2026-11-03 | D1, navigateurs | Paquet `@udixio/motion` ; browserslist `defaults` + double niveau de tests (C12, C13). |
| 2026-11-03 | Relecture à froid | Phase 2 dépend aussi de D1, S1, S2 ; politique CI, tolérances et budgets initiaux fixés (choix Claude). |
