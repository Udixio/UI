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
- La **définition intégrale** du wrapper (les 24 familles du §5), avec une
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
| C16 | **anime.js est le seul moteur JS utilisé.** Les providers se limitent au natif (CSS, WAAPI) et à anime.js ; l'abstraction provider sert à pouvoir remplacer anime.js un jour, pas à en supporter plusieurs. |
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
Providers       css-native │ waapi │ animejs   (seul moteur JS ; remplaçable, pas multiple)
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
| F3 | Présence : entrée / sortie, montage / démontage, `display:none` | `@starting-style`, `allow-discrete` (Firefox : pas de transition vers `display:none`) | hooks de sortie par framework, anime Layout `enterFrom`/`leaveTo` | Motion `AnimatePresence`, Svelte `in:/out:`, Angular `animate.leave` |
| F4 | Déclenchement à la vue (une fois / répété, seuils, direction) | `animation-trigger` (Chrome 146+) | IntersectionObserver, anime `onScroll` | GSAP ScrollTrigger, Motion `inView` |
| F5 | Lié au scroll (progression, plages, axe, conteneur nommé) | `animation-timeline: view()/scroll()` (Baseline newly depuis Firefox 159, 2026-10-27 ; ~3,9 % de `defaults` sans support) | pilotage `currentTime` (cf. 4.7), anime `onScroll` sync | GSAP scrub, Motion `scroll()` |
| F6 | Scroll piloté (scrollTo, smooth scroll) | `scroll-behavior`, `scrollIntoView` | anime ; existant `smooth-scroll.effect.tsx`, `custom-scroll` | GSAP ScrollTo/ScrollSmoother, Lenis |
| F7 | Layout (taille, position, `auto`, `justify-*`, réordonnancement) | `interpolate-size`, `element.startViewTransition()` (Chromium seulement) | anime Layout (FLIP) | GSAP Flip, Motion `layout` / `animateLayout` vanilla (`data-layout`, `data-layout-id`, ≥ 14.1) |
| F8 | Élément partagé (`layoutId`) entre composants et îles | View Transitions + `match-element` (Baseline) | anime Layout id | Motion `layoutId` |
| F9 | View Transitions de page / route (dont Astro) | View Transitions same-document / cross-document | — | Motion `AnimateView` |
| F10 | Listes : stagger, ajout / suppression, réordonnancement | `sibling-index()` (Baseline newly depuis 2026-08-18) | délai calculé, anime `stagger` (grille, jitter) | Motion `Reorder`, Svelte `animate:flip` |
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
| F24 | Boucles et animations continues (progression indéterminée, curseur clignotant, pulsation) | `animation-iteration-count: infinite` | anime `loop` | toutes |
| F23 | Outillage agents IA : types stricts, détection des classes inconnues, exposition via `packages/mcp`, doc pour agents | — | — | Motion AI Kit / agent skill |

Supports navigateur mis à jour d'après `docs/motion/research/R1-native-support.md`
(2026-11-03), qui fait foi pour le détail par version et la couverture `defaults`.
F24 ajoutée après E1 (boucles internes non couvertes par F1–F23).

## 5 bis. Résultats de la phase 0 (synthèse)

Rapports complets dans `docs/motion/research/`. Faits saillants qui orientent
la phase 1 (aucune décision prise) :

- **R1** : scroll-driven et `sibling-index()` sont Baseline ; `@starting-style`,
  `linear()`, View Transitions same-document ne sont bloqués que par Chrome 109 ;
  Chromium seul : `animation-trigger`, `interpolate-size`, `Element.startViewTransition`.
  Piège : le raccourci `animation` réinitialise `animation-timeline` dans Chrome
  seulement — l'ordre des déclarations générées compte.
- **R2** : aucune syntaxe à base de classes ne couvre stagger + scroll lié +
  layout ; seuls Motion vanilla et Astro coordonnent l'élément partagé par le
  DOM. Erreurs d'agents IA documentées (imports `framer-motion`, anime v3,
  config Tailwind v3, confusion tw-animate / tailwindcss-animate, classes
  inventées). Tableau de 15 concepts × 11 libs = entrée de B1.
- **R3** : algorithme de progression `view()`/`scroll()` implémentable ; les
  transforms sont ignorés par la spec (pas de `getBoundingClientRect` brut),
  sticky demande un traitement dédié ; 7 cas où piloter `currentTime` diverge du
  natif ; `animation-trigger` vit dans Animation Triggers 1 (nom de l'API JS
  incertain).
- **R4** : piloter une `CSSAnimation` est faisable mais l'instance est recréée
  quand `animation-name` change ou en `display:none` ; une déclaration non
  supportée est jetée au parsing → le JS ne peut lire que des copies en
  variables (argument pour 4.2) ; polyfill flackr écarté de fait (non maintenu,
  remplace `window.Animation`, incompatible `@layer`/`@media` de Tailwind v4) ;
  anime `timeline.sync()` peut piloter une animation native ; détecter un
  `hover:` sans polling reste fragile. 23 tests proposés pour S1.
- **R5** : anime.js, Motion, Lenis en MIT ; GSAP sous licence propriétaire
  (résiliable, révisable, lie chaque utilisateur final). D3 clos : anime.js seul (C16).
  Udixio est en Apache-2.0 à la racine, mais `@udixio/mcp` déclare MIT et
  plusieurs paquets n'ont pas de champ `license` (hors périmètre, à signaler).
- **E1** : aucun import runtime de `motion/react` dans les paquets publiés
  (4 fichiers d'`apps/doc` seulement) ; 12 contrôleurs core sur Motion vanilla,
  7 sur anime.js ; `Transition` de Motion public dans 5 interfaces + constantes
  + 3 props React-only ; easings anime (`'outCubic'`) aussi dans l'API publique ;
  durées en s et ms mélangées ; aucun token motion M3 ; 17 copies de la
  détection reduced-motion ; anime.js inliné dans `dist` de core.
- **E2** : deux doctrines déjà contradictoires (docs du dépôt : Motion par
  défaut ; plugin de gouvernance 0.5.0 : anime.js partout) ; 8 references/skills
  à réécrire en M3 ; cache de plugin périmé `0.1.0-codex` à purger.
- **E3** : `anim-*` n'est utilisé que par `/animations` ; pas de mécanisme de
  redirection existant ; la copie de doc dans `@udixio/mcp` ne purge jamais
  (M4 doit la nettoyer) ; suppression du plugin `animation` = breaking change
  de `@udixio/tailwind` (D2).

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
| D3 | ⚖️ ✅ | **Décidé : anime.js est le seul moteur JS.** Le système de providers existe (natif CSS/WAAPI + anime.js) pour la remplaçabilité, mais aucun autre moteur (GSAP, Motion…) n'est prévu. | Décision §10 |
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
F15 → F24 → F19 → F21 → F6 → F16 → F17 → F14 → F18. F22 et F23 avancent en
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

> **Ordre de lecture.** La référence normative est **§8.2 à §8.6**. Les
> sections §8.0 à §8.1 quinquies sont l'historique des décisions qui y ont
> conduit ; en cas d'écart, §8.2–§8.6 font foi.

### 8.0 Fondations du moteur — **validées par l'utilisateur (R10, 2026-11-04)**

Issues du registre de choix R10 (`docs/motion/research/R10-choix/`, 5 experts
motion, 50 choix proposés, 38 après fusion, top 10 puis notation 1–10).

| Rang | Choix | Décision |
|---|---|---|
| 1 | M5-07 (9,0) | **Runtime global unique par page**, partagé entre îles : `globalThis[Symbol.for('udixio.motion@1')]`, réutilisé par chaque île, inscription/désinscription par compteur de références, majeures différentes coexistantes. |
| 2 | M4-03 (8,2) | **Présence** : une sortie garde le nœud (`inert`, `aria-hidden`) jusqu'à `finished`, puis le retire ; `animate.leave` (Angular) et `out:` (Svelte) utilisés quand ils suffisent ; hook dédié en React. |
| 3 | M1-04 (8,2) | **Une seule frame rAF**, phases lecture puis écriture déclarées par abonné ; la boucle s'arrête quand la file est vide. |
| 4 | M5-08 (8,0) | **Handle unique** (`play/pause/reverse/seek/cancel/finished`) quel que soit le moteur ; `finished` ne rejette jamais (`finished`/`cancelled`) ; reprise depuis valeur et vitesse courantes. |
| 5 | M1-01 (7,2) | **Moteur choisi par animation, natif d'abord** : WAAPI si cibles compositables et aucune contrainte JS, sinon anime.js chargé à la demande ; backend exposé et tracé en dev. |

Tensions à résoudre dans la suite : (a) reprise par vitesse (4) vs WAAPI qui
n'expose pas la vitesse (5) ; (b) la boucle unique (3) doit être enregistrée
dans le runtime global (1) pour rester unique entre îles. Ce choix remplace
la règle R8 « jamais de global ».

### 8.0 bis Surface d'écriture — **validée par l'utilisateur (R11, 2026-11-04)**

Issue du registre R11 (`docs/motion/research/R11-surface/`), avec les
amendements de l'utilisateur (marqués ✎).

| # | Choix | Décision |
|---|---|---|
| 1 | M5-S10 (8,4) | **Garde-fous à quatre niveaux, manifeste unique** (verbes, options, définitions, noms réservés) : types TS générés, build (parseur d'attributs + lint), runtime dev (erreur citant le manifeste), tests (couverture des 24 familles) ; manifeste `llms.txt`/JSON pour doc et agents. ✎ Ordre de mise en œuvre : types + runtime dev d'abord, parseur de templates ensuite. |
| 2 | M5-S09 (8,2) | **Boucles et suivis = abonnés nommés** du runtime global sur la frame unique ; pause hors vue et réduction appliquées sans code par composant ; `udixio.motion.inspect()`. ✎ Une boucle purement CSS n'a pas d'abonnement par frame : le runtime la connaît seulement pour la pause (`animation-play-state`) et la visibilité. |
| 3 | M5-S07 (8,2) | **Même surface dans chaque environnement** : `data-motion` (HTML/Astro), `useMotion(spec)` (React), directive `udxMotion` (Angular), `{@attach motion(spec)}` (Svelte), `motion(el, spec)` (noyau) ; composants Udixio sur la surface publique. |
| 4 | M5-S08 (8,0) | **Reprise déclarée `carry` / `restart`** ; `carry` force le JS là où WAAPI n'a pas la vitesse ; le handle expose `velocity.source: exact / estimated / unavailable`. ✎ **Défaut par verbe** dans le manifeste (ex. `restart` pour une apparition, `carry` pour un drag ou un changement d'état) ; on ne l'écrit que pour le changer. |
| 5 | M4-S04 (8,0) | **Définitions nommées en TS** : `defineMotion(name, …)`, `defineValue(name, …)`, référencées par nom partout ; valeurs lues sans re-rendu (signal Angular, store Svelte, `useSyncExternalStore` React). ✎ **Udixio livre des définitions prêtes à l'emploi** (fondées sur les tokens M3) pour que les cas simples n'exigent aucun `defineMotion`. |

✎ **Règle HTML / Tailwind (choix M5-S01 7,0 et M5-S04 6,8, adoptés par
l'utilisateur)** : l'attribut **nomme** l'animation (`data-motion="card-enter"`,
référence uniquement, jamais de valeur libre) ; Tailwind **règle les tokens et
les états** avec ses variants (`md:[--motion-distance:2rem]`, `data-[open]:…`),
sans jamais inscrire un élément. Raison : `[data-motion]` est bon marché à
interroger, observer (`attributeFilter`) et analyser, contrairement à des
classes mêlées aux utilitaires Tailwind.

Reste ouvert : **les verbes** (R12), layout / partagé / présence (R13),
texte / SVG / gestes (R14).

### 8.1 Vocabulaire — **validé (R12, validation globale 2026-11-04)**

Issu du registre R12 (`docs/motion/research/R12-vocabulaire/`). Consensus plus
faible qu'en R10/R11 (meilleure moyenne 7,2). L'utilisateur validera
l'ensemble une fois toutes les familles couvertes.

| # | Choix | Proposition |
|---|---|---|
| 1 | M5-V04 (7,2) | Grammaire HTML : `data-motion="<nom>"` (preset ou définition, référence seule) ; une option = un attribut `data-motion-<option>` ; pas de chaîne composite ; attribut inconnu = erreur de build. |
| 2 | M5-V01 (7,0) | Sept verbes : `appear`, `disappear`, `emphasize`, `reveal` (à la vue), `scrub` (lié au défilement), `loop`, `layout` (y compris élément partagé). Valeurs continues via `defineValue`. |
| 3 | M5-V07 (7,0) | Noms réservés refusés au build (`enter`, `exit`, `in`, `out`, `transition`, `animate`, `initial`, `view-transition-*`, `AnimatePresence`…) ; tokens `--udx-motion-*`, jamais `--animate-*`. |
| 4 | M5-V05 (6,8) | Dix presets livrés nommés par effet ; direction = option, jamais dans le nom. |
| 5 | M5-V02 (6,8) | Défaut de reprise et de rendu réduit par verbe, dans le manifeste. |
| 6 | M3-V03 (6,8) | `scrollTo(cible, { duration, easing })` est une action, pas un verbe. |

Égalité à trois pour les places 4–6 (même moyenne, médiane et nombre de top 10) : les trois sont conservés car non contradictoires.

Corrections proposées par Claude (à valider avec l'ensemble) :
- directions : `start` / `end` (horizontal, compatible RTL) et `up` / `down` (vertical), désignant le **sens du mouvement** ;
- rendu réduit de `disappear` : fondu (et non instantané) ;
- presets `spin` et `pulse` renommés (ex. `rotate`, `breathe`) pour éviter la confusion avec `animate-spin` / `animate-pulse` de Tailwind ;
- `stagger` en token (`tight` / `normal` / `loose`), jamais en millisecondes.

Trous identifiés, traités en R13 : détection du changement pour `layout`
(mesure avant mutation, React ; limite `:hover` CSS) ; transition d'état non
géométrique avec ressort / reprise (pas de verbe) ; panneau qui reste monté
(accordéon, hauteur `auto`) ; transitions de page (View Transitions) ;
identité de l'élément partagé. Traités en R14 : séquences / chorégraphie,
gestes, texte, SVG, responsive, usage interne.

Suite du processus (demande de l'utilisateur, 2026-11-04) : la recherche
continue sans validation intermédiaire jusqu'à couverture complète des 24
familles (R13, R14), puis **R15 — cohérence transversale** : audit que toutes
les familles partagent verbes, grammaire, options, défauts, handle, présence
et règles d'accessibilité ; validation globale par l'utilisateur ensuite.
Chaque choix R13+ porte une ligne « Cohérence ».
### 8.1 bis États, layout, partagé, présence, pages — **validé (R13, validation globale 2026-11-04)**

Registre R13 (`docs/motion/research/R13-etats-layout/`, agents neufs, ligne
« Cohérence » par choix ; top 10 et notation fusionnés en un passage).

Top 5 :

| # | Choix | Proposition |
|---|---|---|
| 1 | M3-L02 (8,4) | Valeur « avant » du FLIP = dernière géométrie stable lue en phase lecture de la frame précédente, par racine suivie ; invalidée par ResizeObserver (breakpoints, container queries) et MutationObserver ; sert aussi aux sorties et au réordonnancement. |
| 2 | M5-L09 (8,0) | Table verbe × option générée par le manifeste (ex. `interrupt` pour `emphasize`/`layout`/`reveal`, `shared` pour `layout`, `stagger` pour `appear`/`disappear`/`loop`) : erreur de type, de build et dev identiques dans les 5 formes. |
| 3 | M5-L07 (7,8) | Sortie d'un sous-arbre : seule la racine retirée porte `disappear` ; enfants en cascade via `data-motion-stagger` sur la racine. |
| 4 | M5-L02 (7,6) | Lint : `layout` combiné à `hover:` / `focus:` / `group-hover:` = erreur de build qui renvoie vers `emphasize` ; seul un changement d'état écrit déclenche `layout`. |
| 5 | M1-L05 (7,4) | Ressort transmis par ses paramètres physiques (jamais seulement `linear()`) ; vitesse exacte calculée analytiquement à l'interruption, sinon `estimated` / `unavailable`. |

Réponse retenue par question (meilleure note, même hors top 5) :

| Question | Réponse | Note | Solidité |
|---|---|---|---|
| Q1 détection et mesure | M3-L02 + M3-L01 (déclencheur = attribut `data-*`, jamais la classe) + M3-L05 (réordonnancement reconnu par identité de nœud) + M1-L01 (point pré-mutation par environnement ; faits M4 : React `getSnapshotBeforeUpdate` d'un wrapper classe, Svelte `$effect.pre`, Angular : avant l'écriture du signal, pas `afterRender`) | 8,4 / 7,0 / 7,2 / 6,6 | solide |
| Q2 transition d'état non géométrique | M5-L03 : `emphasize` avec `trigger="state"` et `interrupt="carry"` | 5,6 | **faible — à résoudre en R15** (`emphasize` mêle accentuation et état ; M1-L04 « `layout` pour les valeurs » rejeté à 2,2) |
| Q3 panneau qui reste monté | M5-L04 : le preset `collapse` passe en `layout` | 5,2 | **faible — à résoudre en R15** (concurrent : CSS pur `grid-template-rows` 0fr→1fr de M1-L06) |
| Q4 élément partagé | M5-L05 : `defineShared('nom')` + `data-motion-shared="nom"` (lint du nom), unicité par document | 7,4 | solide |
| Q5 transitions de page | M4-L07 : pas de verbe, preset `route` + `navigate(run, { direction })` du runtime, branché par routeur ; M4-L08 pour Astro et le cross-document | 7,2 / 6,4 | moyen (statut de `addTransitionType` à vérifier) |
| Q6 présence | M5-L07 (racine) + M5-L08 (`data-presence` écrit par le runtime seul) | 7,8 / 5,8 | moyen (`leaving` vs `exiting`, nom de l'attribut à trancher) |

Rejetés nettement : M1-L04 (`layout` pour des valeurs non géométriques, 2,2),
M2-L06 (FLIP JS unique pour l'élément partagé, contraire au natif d'abord, 3,2).

### 8.1 ter Familles restantes — **validé (R14, validation globale 2026-11-04)**

Registre R14 (`docs/motion/research/R14-reste/`, agents neufs). 21 choix
conservés, tous complémentaires ; aucune question sans réponse. Top 5 global :
M3-R03 (8,6), M2-R03 (8,2), M5-R03 (8,2), M3-R04 (8,2), puis M3-R01, M2-R01 et
M1-R10 à égalité (8,0).

Réponse par question (attribution par question **principale** du choix) :

| Question | Réponse(s) | Note | Contenu |
|---|---|---|---|
| Q1 séquences | M1-R01 + M2-R06 | 7,2 / 7,6 | Séquence définie en TS, compilée une fois, pilotée par le handle unique ; cascade par rang visuel mesuré, délai de départ plafonné à 400 ms (§8.2.6), sans plafond sur la dernière fin. |
| Q2 gestes | M2-R01 + M2-R02 + M2-R03 + M2-R04 | 8,0 / 7,0 / 8,2 / 7,0 | Geste = source de valeurs, sans verbe ; relâchement en ressort initialisé par la vitesse, exposée au handle ; **alternative clavier et à un seul pointeur obligatoire et typée** (WCAG 2.5.7 et 2.1.1) ; drag-to-reorder = `layout` sur la liste, échange au franchissement du milieu. |
| Q3 texte | M1-R04 | 7,4 | Découpage préparé, source accessible conservée, reflow contrôlé (méthode d'accessibilité encore disputée : `sr-only` vs `aria-label`). |
| Q4 SVG | M1-R05 | 7,2 | Tracé et trajectoire en natif, morphing en JS (`morphTo` rééchantillonne). |
| Q5 valeurs, compteurs | M3-R01 + M4-R06 | 8,0 / 7,4 | Valeur réactive écrite dans le DOM, jamais re-rendue ; compteur : valeur finale rendue par le serveur, animée après hydratation. |
| Q6 responsive, scopes | M3-R06 + M3-R05 | 7,6 / 7,4 | Paliers nommés, reconstruction au seul changement de palier ; scope = racine + registre, nettoyage par élagage. |
| Q7 usage interne | M1-R10 + M4-R02 | 8,0 / 6,4 | Les contrôleurs internes passent par le chemin public ; prop `motion` unique, durées en tokens, fin du type `Transition` de Motion (breaking change, D2). |
| Q8 tokens | M1-R06 (+ M3-R07 faible, 5,0) | 7,8 | Une source de paramètres physiques (ressorts M3 Expressive, **valeurs officielles à relever avant S1**), émise en CSS, TS et Tailwind (`--udx-motion-*`). |
| Q9 perf, chargement | M3-R04 + M3-R03 + M3-R08 | 8,2 / 8,6 / 6,8 | Chargement par verbe, préchargement en trois temps, un moteur par page ; abonnements bornés (visible, document visible, une observation par racine) ; coût par propriété. |
| Q10 outillage IA | M5-R03 + M5-R04 | 8,2 / 6,6 | Manifeste machine (`llms.txt` + JSON) produit au build ; outils MCP `@udixio/mcp` (recette et validation motion). |

Contradictions R14 ouvertes, transmises à R15 : `reorder` verbe ou geste ;
rang de cascade (DOM / visuel) ; attribut enfant (`part` / `step`) ;
découpage et accessibilité du texte ; valeurs sur la racine ou sur les
cibles ; source de vitesse des gestes ; syntaxe des décalages (`at` vs
tokens) ; `--udx-motion-scale` vs fondu de `disappear` ; alias `--duration-*`
vs échelle Tailwind ; flèches vs espace au clavier.

### 8.1 quater Résolutions de cohérence — **validé (R15, validation globale 2026-11-04), prévaut sur §8.1 à §8.1 ter**

Audit `docs/motion/research/R15-coherence/01-audit.md` (matrice 24 familles ×
10 conventions, 30 incohérences) ; vote de 5 experts neufs (`votes/`). Une
résolution R15 **remplace** la formulation antérieure qu'elle contredit.
« Arbitrage Claude » = pas de majorité, décision proposée par Claude à partir
du terrain commun des votes.

| # | Sujet | Résolution | Vote |
|---|---|---|---|
| I01 | Direction | **Sens du mouvement** : `start` / `end` (horizontal, RTL), `up` / `down` (vertical) ; `left` / `right` retirés ; `direction` réécrite. | 4/5 |
| I02 | Défauts de reprise | **Arbitrage Claude** : deux valeurs seulement (`carry`, `restart`) ; table complète au manifeste : `carry` pour `appear`, `disappear`, `layout`, `scrub`, gestes ; `restart` pour `emphasize`, `reveal`, `loop`, transitions de page. **Correction de §8.0 bis #4** : `carry` sans ressort reste natif (nouvelle animation WAAPI depuis la valeur calculée) ; le JS n'est requis que pour reprendre un ressort avec sa vitesse. | B 2, A 1, C 1, D 1 — présence en `carry` 4/5 |
| I03 | Verbe dans `data-motion` | **Référence seule** : le verbe est porté par le preset ou la définition, jamais écrit en HTML. | 4/5 |
| I04 | Présence | `data-presence="entering | present | exiting"`, écrit par le runtime seul (lint). | 4/5 |
| I05 | Rendu réduit de `disappear` | **Fondu**, non multiplié par `--udx-motion-scale` (exception documentée). | 5/5 |
| I06 | Transition d'état non géométrique (Q2) | **Arbitrage Claude** (terrain commun : `emphasize` reste un accent en `restart`, pas de défaut conditionnel) : un changement d'état continu (chevron, couleur) est une **transition CSS** avec tokens et variants (`data-[state=open]:rotate-180`), qui reprend déjà sans saut ; si un ressort avec vitesse est requis, **`defineValue`**. Aucun verbe ajouté. Q2 n'est plus faible. | C 2, A 2, B 1 |
| I07 | Espace de noms CSS | `--udx-motion-*` uniquement ; aucun alias `--duration-*`, `--ease-*`, `--animate-*`. | 4/5 |
| I08 | `loop` | `restart`, rendu réduit figé, `pause` obligatoire (`control | essential`). | 3/5 |
| I09 | Frontière des verbes | Sept verbes ; `shared` est une option de `layout`. | 4/5 |
| I10 | Mesure « avant » | Cache de géométrie stable (M3-L02) pour les quatre environnements. | 3/5 |
| I11 | Registre d'attributs | Liste fermée et versionnée ; doublons fusionnés (`part`/`step` → `step`, `layout-id` → `shared`, `scope`/`keep`/`group`) ; la prop `motion` des composants utilise **exactement** les clés `data-motion-<option>`. | 3/5 (D convergents) |
| I12 | Panneau monté (Q3) | **CSS pur** `grid-template-rows` 0fr → 1fr, preset sans verbe, repli JS. Q3 n'est plus faible. | 4/5 |
| I13 | Presets | `spin` → `rotate`, `pulse` → `breathe` réservé à `loop` ; `blink` borné à 3 flashs/s (WCAG 2.3.1) ou retiré. | 5/5 |
| I14 | `stagger` | Tokens `tight | normal | loose`. | 5/5 |
| I15 | Chorégraphie | **Arbitrage Claude** (majorité par sous-question) : attribut enfant `data-motion-step` (3/5) ; décalage `at` qui accepte une étiquette ou `+=token`, jamais un temps nu ni `'<'` (3/5). | B 2, A 2, C 1 |
| I16 | Rang de cascade | Rang visuel mesuré. | 5/5 |
| I17 | Élément partagé | Identité `defineShared` + `data-motion-shared`, unique par document (doublon = erreur dev). **Rendu, arbitrage Claude** (votes partagés, règle §8.0 #5 natif d'abord) : View Transitions (`view-transition-name`) quand la reprise est `restart` et le support présent ; FLIP JS si `carry` ou sans support. Règle du doublon en production (premier ou dernier inscrit) : à trancher en spike. | D 3 (identité unanime) |
| I18 | Transitions de page | `motion.navigate(update)` du noyau ; chaque routeur passe par lui ; ajouter `direction` à la signature. | 3/5 |
| I19 | Sorties de liste | Option déclarée, défaut **en place**. | 3/5 |
| I20 | États d'auteur | `data-state` pour tout état d'auteur (convention Radix / shadcn) ; le moteur n'écrit jamais `data-hover` / `data-focus`. | 4/5 |
| I21 | Handle | Six méthodes inchangées ; canal d'événements séparé `motion.on(el, 'release')`. | 5/5 |
| I22 | Fonctions de définition | Une par type : `defineMotion`, `defineValue`, `defineSequence`, `defineGesture`, `defineShared`, `defineTokens`. | 4/5 |
| I23 | Options partagées | Un sens par nom ; domaines publiés au manifeste ; noms anglais. | 5/5 |
| I24 | Gestes | `reorder` = primitive de `defineGesture` + `layout`, sans verbe ; vitesse `exact` au pointeur, `estimated` ailleurs ; champ clavier `alternative` obligatoire (Espace et flèches). | 5/5 |
| I25 | Ressorts | Token `spring.<rôle>.<vitesse>` (noms M3 Expressive), paramètres physiques conservés, `linear()` dérivé au build. **Valeurs officielles M3 à relever avant S1.** | 4/5 |
| I26 | Valeurs réactives | `defineValue` avec `source`, `axis`, `range` ; variables écrites sur les **cibles abonnées**, jamais sur la racine ; compteur en `<data value>`. | 3/5 (D convergents) |
| I27 | Texte | Découpage client après hydratation, copie `sr-only` + morceaux `aria-hidden`, brouillage hors v1. | 4/5 |
| I28 | Chargement | Préchargement par intersection ou intention ; verbes du premier rendu chargés avec l'île (pas d'idle sans cible). | 3/5 |
| I29 | Scope | `revert()` pour le registre, `inspect()` pour le diagnostic. | 4/5 |
| I30 | Faits à vérifier | Vérification par spike avant les choix dépendants : `linear()`, `sibling-index()`, `match-element`, `grid-template-rows`, `requestIdleCallback` (absent de Safari), `getCoalescedEvents`, valeurs M3. | 4/5 |

#### Faits vérifiés (R16, `docs/motion/research/R16-faits-I30.md`)

Confirmés : `linear()` (Baseline widely, seul Chrome 109 manque → repli),
`grid-template-rows` 0fr→1fr (couvert partout, valide I12), `Intl.Segmenter`
(couvert), `match-element` (same-document seulement), `requestIdleCallback`
absent de Safari **et d'iOS** (repli `setTimeout`), React 19.3 `<ViewTransition>`
stable, Angular `animate.enter/leave` depuis 20.2 et zoneless par défaut
depuis v21, anime.js 4.5 `morphTo` rééchantillonne, `splitText` accessible par
défaut, `pauseOnDocumentHidden` global au moteur. `sibling-index()` manque dans
Chrome 109, Firefox ESR 153, iOS 18.5–18.7 → repli JS du rang requis (I16).

Corrections à appliquer :
- **I24** : vitesse `exact` au pointeur fausse sur Firefox Android
  (`getCoalescedEvents()` renvoie toujours `[]`) → `estimated` en repli.
- **Q1 / §8.1 bis** : `afterRender` n'existe plus en Angular 22 ; API actuelle
  `afterEveryRender`, `afterNextRender`, `afterRenderEffect`.

Valeurs M3 Expressive relevées sur la doc officielle (R17,
`docs/motion/research/R17-m3-motion-tokens.md`) : ressorts
`md.sys.motion.spring.<vitesse>.<type>` (schéma global `expressive` /
`standard`, valeurs identiques Android et Web). Expressive : spatial fast
0,6 / 800, default 0,8 / 380, slow 0,8 / 200 ; effects fast 1 / 3800,
default 1 / 1600, slow 1 / 800 (damping ratio / stiffness). Conversion
officielle web en cubic-bezier + durée (350 / 500 / 650 ms spatial,
150 / 200 / 300 ms effects), réservée aux animations sans interruption ni
geste. **Ajustement I25** : nom de token dans l'ordre officiel
`spring.<vitesse>.<type>` ; le schéma est un réglage global de `defineTokens`,
pas une option par animation ; la conversion officielle sert de courbe de
repli au palier natif.

### 8.1 quinquies Résultats des spikes S1 et S2 (2026-11-05)

Rapports : `docs/motion/research/S1-spike-rapport.md`,
`docs/motion/research/S2-spike-rapport.md`. Mesures sur Chromium 156 et
Firefox 157 (sans scroll-driven natif : version antérieure à 159) ; WebKit non
mesuré (bibliothèques système manquantes).

| Point | Verdict | Conséquence pour la spec |
|---|---|---|
| §4.2 contrat de variables CSS | **GO** | Variables `@property` déclarées au niveau du document (pas dans une shadow root) ; lectures groupées en phase lecture (~0,5 µs/lecture ; entrelacer écritures et lectures est pathologique). |
| §4.7 pilotage de `CSSAnimation` (fallback scroll-driven) | **GO, 9 conditions** | Écart 0 avec le natif sur 41 positions. Ne pas utiliser `getBoundingClientRect` pour la progression ; garder la poignée de l'animation (une `fill:none` sort de `getAnimations()`) ; re-pauser une instance recréée (changement d'`animation-name`) avant rendu via `MutationObserver` ; `cancel()` définitif ; toujours une durée de repli ; ne jamais écrire le raccourci `animation:` après `animation-timeline`. |
| I02 reprise `carry` native | **GO nuancé** | Position reprise exactement (0 px) par une nouvelle WAAPI ; la vitesse ne l'est pas : seul un ressort la conserve. Confirme la frontière : `carry` sans ressort = natif, ressort avec vitesse = JS. |
| I25 ressorts en `linear()` | **GO** | Un `linear()` dérivé de la solution analytique (21–26 stops, ~300 octets) tient à 0,2 % ; la conversion officielle cubic-bezier + durée s'écarte de 6 à 10 % → **le `linear()` dérivé est le repli natif par défaut**, la conversion officielle un repli de dernier recours. anime.js : `damping = 2ζ√stiffness`. |
| §4.4 / M5-07 runtime global entre îles | **GO** | Deux copies du module partagent un runtime et une seule boucle rAF ; compteur de références correct au démontage ClientRouter. La première copie inscrite impose sa forme : **forme du runtime stable au sein d'une majeure**. |
| I10 cache de géométrie | **Précisé** | Le cache doit inclure le **transform courant** ; un cache « layout seul » saute de 77 px à l'interruption. |
| I17 élément partagé | **FLIP GO, VT GO conditionnel** | Confirme VT si `restart`, FLIP si `carry`. **Règle du doublon : exclure `data-presence="exiting"`, prendre le premier inscrit vivant (`first-live`), erreur en dev.** Deux noms VT identiques font avorter la transition. Pendant le callback d'une VT, rAF ne tourne pas : ne jamais l'attendre. |
| Hydratation tardive (îles) | **FLIP GO, VT NO-GO** | Rétention du nœud sortant : **600 ms par défaut**, puis repli sur `disappear` / `appear` ordinaires ; ne jamais attendre une île `client:visible` hors écran. Entre îles à hydratation différée, l'élément partagé passe par **FLIP**, jamais par VT. |
| I18 transitions de page avec Astro | **Nuance** | Envelopper le `navigate()` d'Astro produit deux VT (la première avorte). **Adaptateur Astro** fondé sur ses événements (`astro:before-preparation`, `astro:before-swap`, `event.direction`) et rejets de `ready` / `finished` attrapés ; `motion.navigate` reste valable hors routeur. |

Non couvert, à faire : WebKit / Safari, build de production, coexistence de
deux majeures, `addTransitionType`, retard de frame du fallback en défilement
réel, détection sans polling.

### 8.2 Modèle `MotionSpec` — **rédigé (consolidation de §8.0 à §8.1 quinquies)**

Rédigé par Claude le 2026-11-05 à partir des décisions validées ; les points
nouveaux, non tranchés par R10–R15, sont marqués ⚑ et restent à valider.
Le contrat implémenté en phase 2 (`packages/motion/src/contract.ts`) en est un
**sous-ensemble de vérification** ; les écarts à combler sont listés en §8.3.4.

#### 8.2.1 Principe

Une animation est **une donnée sérialisable, définie une fois en TS et
référencée par son nom** (§8.0 bis #5). Le modèle reprend celui de Web
Animations (keyframes + timing + timeline) et l'étend avec ce qui lui manque :
ressort, déclencheur, reprise, rendu réduit, présence, identité partagée.
Le **verbe** porte la sémantique et les défauts ; il n'est jamais écrit en HTML
(I03) mais dans la définition ou le preset.

#### 8.2.2 Fonctions de définition (I22)

| Fonction | Rôle | Référencée par |
|---|---|---|
| `defineTokens({ scheme })` | Schéma M3 global (`expressive` par défaut / `standard`), ressorts officiels (R17) — **implémentée** | réglage produit, pas d'option par animation |
| `defineMotion(name, spec: MotionSpec)` | Animation déclarative (les 7 verbes) | `data-motion="name"`, `useMotion(name)`, `udxMotion="name"`, `motion(name)` |
| `defineValue(name, spec: ValueSpec)` | Valeur continue (curseur, parallaxe, compteur, état continu avec ressort) | `data-motion-value="name"` sur les cibles abonnées |
| `defineSequence(name, spec: SequenceSpec)` | Chorégraphie d'étapes nommées | `data-motion="name"` sur la racine, `data-motion-step` sur les enfants |
| `defineGesture(name, spec: GestureSpec)` | Drag, lancer, swipe, réordonnancement | `data-motion-gesture="name"` ⚑ |
| `defineShared(name)` | Identité d'élément partagé, clé typée | `data-motion-shared="name"` |

Les presets livrés par Udixio (§8.1 #4 corrigé par I13) sont des
`defineMotion` publics : `fade`, `slide`, `scale`, `collapse` (CSS pur, I12),
`press`, `shake`, `rotate`, `breathe`, `shimmer`, `blink` (borné, I13).

#### 8.2.3 `MotionSpec`

```ts
type Verb = 'appear' | 'disappear' | 'emphasize' | 'reveal' | 'scrub' | 'loop' | 'layout';

interface MotionSpec {
  verb: Verb;
  /** États visuels ; un seul état = départ depuis la valeur calculée courante. */
  keyframes: VisualFrame[];
  /** Ressort M3 (défaut selon le verbe) ou courbe + durée en tokens. */
  timing?: SpringRef | CurveTiming;
  repeat?: 'once' | 'always';               // reveal
  direction?: 'start' | 'end' | 'up' | 'down'; // sens du mouvement (I01)
  distance?: DistanceToken;
  stagger?: 'tight' | 'normal' | 'loose';   // I14
  origin?: 'first' | 'last' | 'center';     // ex-`from` du stagger (I23)
  range?: ScrollRange;                      // scrub
  axis?: 'block' | 'inline';                // scrub, reveal
  interrupt?: 'carry' | 'restart';          // défaut par verbe (I02)
  reduced?: ReducedRender;                  // défaut par verbe
  pause?: 'control' | 'essential';          // loop, obligatoire (I08, WCAG 2.2.2)
  reason?: string;                          // obligatoire si pause = 'essential'
  shared?: SharedKey;                       // layout uniquement (I09)
  exit?: 'in-place' | 'out-of-flow';        // disappear dans une liste, défaut in-place (I19)
}

type SpringRef = `spring.${'fast' | 'default' | 'slow'}.${'spatial' | 'effects'}`; // I25 ordre officiel
type CurveTiming = { duration: DurationToken; easing: EasingToken };
type ReducedRender = 'fade' | 'instant' | 'static' | 'neutral' | 'frozen';
```

`VisualFrame` (implémenté : `opacity`, `x`, `y`, `scale`, `rotate`) s'étend par
famille avec des champs **fermés et listés au manifeste** : `scaleX`,
`scaleY`, `color`, `backgroundColor`, `clipPath`, `blur` ⚑. Aucune propriété
CSS libre : une propriété hors liste passe par `defineValue` ou par
l'échappatoire du provider (§4.6, non portable).

Toutes les valeurs numériques vivent dans la définition TS ou dans les tokens,
jamais dans un attribut HTML (§8.1 #1, I03).

**Le déclencheur n'est pas une option** (amendement du 2026-11-14) : il est
fixé par le verbe (§8.2.4). `appear` joue au montage, `reveal` à l'entrée dans
la vue : il n'existe donc qu'une façon d'écrire chacun. `emphasize` joue sur un
changement d'état observable ou par `handle.play()`.

#### 8.2.4 Table des défauts par verbe (I02, I05, I08, §8.1 #5)

| Verbe | Familles | Déclencheur (fixé par le verbe) | Reprise | Rendu réduit | Ressort par défaut |
|---|---|---|---|---|---|
| `appear` | F3, F10 | `load` (montage) | `carry` | `fade` (non multiplié par `--udx-motion-scale`) | `spring.default.spatial` + `effects` pour l'opacité |
| `disappear` | F3, F10 | démontage | `carry` | `fade` (non multiplié par `--udx-motion-scale`) | idem |
| `emphasize` | F2 (accent), F18 (press) | `state` | `restart` | `static` | `spring.fast.spatial` |
| `reveal` | F4 | `view` | `restart` | `instant` | `spring.default.spatial` |
| `scrub` | F5 | défilement | `carry` (position) | `neutral` (position neutre) | aucun : progression liée au défilement |
| `loop` | F24 | `load` | `restart` | `frozen` (+ `pause` obligatoire) | courbe linéaire en token |
| `layout` | F7, F8, F10 | changement observable de l'élément marqué ou de sa racine de layout : **classe**, attribut `data-*`, enfants ; signalé par l'adaptateur en React, Angular et Svelte | `carry` | `instant` | `spring.default.spatial` |
| transitions de page (pas un verbe) | F9 | navigation | `restart` | `instant` | `spring.slow.spatial` ⚑ |
| gestes (pas un verbe) | F18 | pointeur / clavier | `carry` | sans animation de relâchement | `spring.default.spatial` pour le retour vers une cible ; `fast` ou `slow` explicite par composant ⚑ |

Changements d'état continus (chevron, couleur) : **transition CSS** avec tokens
et variants ; `defineValue` à ressort si la vitesse doit être conservée (I06).
Panneau qui reste monté : preset `collapse` en CSS pur (I12).

#### 8.2.5 Autres specs

```ts
interface ValueSpec {           // I26
  source: 'pointer' | 'scroll' | 'state' | 'time';
  axis?: 'x' | 'y' | 'block' | 'inline';
  range?: [number, number];      // bornes de la valeur produite
  spring?: SpringRef;            // lissage avec reprise de vitesse
  format?: 'integer' | 'decimal' | 'percent' | 'currency'; // compteurs ⚑
}
interface SequenceSpec {        // I15, M1-R01
  steps: Record<string, Omit<MotionSpec, 'verb'> & { verb?: Verb; at?: `${string}` | `+=${StaggerToken}` }>;
}
interface GestureSpec {         // I24, M2-R01..R04
  kind: 'drag' | 'swipe' | 'reorder';
  axis?: 'x' | 'y' | 'both';
  bounds?: 'parent' | 'none';
  release?: SpringRef;           // ressort initialisé par la vitesse
  alternative: KeyboardAlternative; // obligatoire et typé (WCAG 2.1.1, 2.5.7)
}
```

`at` accepte une **étiquette d'étape** ou `+=<token>`, jamais un temps nu ni
`'<'` (I15). Vitesse d'un geste : `exact` quand les événements coalescés sont
disponibles, `estimated` sinon (Firefox Android, R16).

#### 8.2.6 Tokens et variables CSS (I07, I25, R17, S1)

- Un seul espace `--udx-motion-*` ; aucun alias `--duration-*`, `--ease-*`,
  `--animate-*` ; variables `@property` déclarées au niveau du document (S1).
- Ressorts : paramètres physiques officiels (R17) ; courbe native par défaut
  = **`linear()` dérivé de la solution analytique** (21–26 stops, erreur
  ≤ 0,2 %, S1) ; la conversion officielle cubic-bezier + durée n'est qu'un
  repli de dernier recours (Chrome 109 sans `linear()`).
- `--udx-motion-scale` (multiplicateur de distance et de durée, 0 en
  réduction) ; exception : le fondu de `disappear` n'est jamais multiplié (I05).
- Choix opérationnels provisoires, de faible confiance et à calibrer
  visuellement (R18) : `--udx-motion-distance-{sm,md,lg}` = 8 / 24 / 64 px ;
  stagger `tight` 20 ms, `normal` 50 ms, `loose` 100 ms.
- Le token global `--udx-motion-stagger-max` vaut initialement 400 ms à titre
  provisoire. Pour chaque rang visuel normalisé depuis zéro, le délai de départ
  relatif est `min(rang * pas, --udx-motion-stagger-max)` (M2-R06), hors délai initial. Les derniers
  éléments atteignant le plafond démarrent ensemble. Ce plafond ne borne pas
  la dernière fin, qui inclut aussi la durée de l'animation.

### 8.3 Contrat provider — **rédigé (consolidation)**

#### 8.3.1 Interface

```ts
type MotionBackend = 'css' | 'waapi' | 'animejs';
type Capability =
  | 'compositor'      // opacity, transform, filter, clip-path
  | 'spring-velocity' // reprise exacte de la vitesse
  | 'scroll-timeline' | 'view-transition' | 'layout-flip'
  | 'discrete'        // display, content-visibility
  | 'text-split' | 'svg-morph' | 'gesture';

interface MotionProvider {
  readonly backend: MotionBackend;
  readonly capabilities: ReadonlySet<Capability>;
  animate(request: MotionRequest): MotionHandle;
  activeCount(): number;
}

interface MotionHandle {               // §8.0 #4, I21 : surface fermée
  readonly backend: MotionBackend;
  readonly duration: number;
  readonly finished: Promise<'finished' | 'cancelled'>; // ne rejette jamais
  readonly velocity: { value: number; source: 'exact' | 'estimated' | 'unavailable' };
  play(): void; pause(): void; reverse(): void; seek(timeMs: number): void; cancel(): void;
}
```

Les événements (relâchement de geste, étape de séquence) passent par un canal
séparé `motion.on(el, 'release' | 'step', cb)` (I21), pas par le handle.

#### 8.3.2 Choix du backend (§8.0 #5, I02, S1)

1. Animation déclarée par classes ou preset CSS, sans contrôle impératif →
   **`css`** (aucun JS de lecture hors abonnement de pause/visibilité).
2. Sinon, propriétés toutes `compositor` et (`restart` ou `carry` sans ressort)
   → **`waapi`** : `carry` relance une nouvelle animation depuis la valeur
   calculée (position exacte, S1).
3. Sinon (`carry` avec ressort, propriétés non composées, texte, morphing,
   gestes) → **`animejs`**, chargé à la demande (I28).

Le backend retenu est exposé (`handle.backend`) et tracé par
`udixio.motion.inspect()` en dev.

#### 8.3.3 Runtime global (§8.0 #1–#3, S2)

`globalThis[Symbol.for('udixio.motion@1')]` : forme **stable au sein d'une
majeure** (S2 : la première copie inscrite impose la sienne) :

```ts
interface MotionRuntime {
  readonly version: string;
  retain(): void; release(): void;               // compteur de références
  frame: { read(cb: () => void): void; write(cb: () => void): void }; // une seule rAF
  shared: SharedRegistry;   // first-live, exclut data-presence="exiting", rétention 600 ms
  subscribe(name: string, sub: FrameSubscriber): () => void; // loop, follow
  policy: { reduced: boolean }; // prefers-reduced-motion + data-motion-policy sur <html>
  inspect(): RuntimeReport;
}
```

Cache de géométrie (I10, S2) : rect + **transform courant**, lu en phase
lecture, invalidé par `ResizeObserver` et `MutationObserver`.

#### 8.3.4 Écarts avec le contrat implémenté (phase 2)

| Implémenté | Cible | Travail |
|---|---|---|
| `MotionBackend = 'waapi' \| 'animejs'` | ajout de `'css'` | provider `css` (pilotage de `CSSAnimation`, §8.1 quinquies) |
| pas de `capabilities` | `ReadonlySet<Capability>` | déclarer par provider |
| pas de `velocity` sur le handle | `velocity: { value, source }` | `animejs` : exact ; `waapi` : estimated / unavailable |
| `MotionTiming = { duration, easing }` | `SpringRef \| CurveTiming` résolus en `linear()` dérivé | générateur `linear()` + résolution des tokens |
| `RUNTIME_KEY` seul | `MotionRuntime` complet | runtime global, frame unique, registre partagé |
| manifeste : `trigger` en option différée | déclencheur fixé par le verbe | retirer `trigger` des options du manifeste |

#### 8.3.5 État après l'étape 1a (2026-11-14)

Écarts de §8.3.4 comblés : backend `css`, `capabilities`, `velocity`, timing par tokens,
`trigger` retiré du manifeste, `MotionRuntime` exporté (clé encore
provisoire, à figer en `udixio.motion@1` avant publication).

Surface d'écriture livrée dans `@udixio/motion` (verbes `appear`,
`disappear`, `emphasize` ; backend WAAPI) :

| Élément | Rôle |
|---|---|
| `defineMotion(name, spec)`, `resolveMotion`, `onMotionDefined`, `definedMotions`, `validateMotionSpec` | registre des définitions, partagé par page ; un abonné qui lève n'interrompt pas la définition |
| `@udixio/motion/presets` | `fade`, `slide`, `scale` (appear), `press` (emphasize) — valeurs provisoires |
| `playMotion(target, spec, { direction, carry, runtime })`, `applyFrame`, `releaseFrame` | lecture d'une définition : sens, reprise, rendu réduit, repli sur l'état de destination |
| `motion(element, source, { present, settled })` → `MotionBinding` ; `getMotion(element)` | liaison par élément : présence (`data-presence`, `inert`), rejeu, nettoyage |
| `connectMotion({ root, development })` | syntaxe HTML `data-motion="<nom>"` : un `MutationObserver` par racine |
| `@udixio/motion/policy` | politique de mouvement réduit (remplace l'entrée `internal-policy`) |

Règles fixées pendant l'étape 1a (choix de Claude, sur délégation) :

- **Fondu réduit jamais multiplié par `--udx-motion-scale`**, pour `appear`
  comme pour `disappear` : la feuille met l'échelle à 0 sous `reduce`, ce qui
  aurait transformé le fondu réduit de `appear` en saut instantané.
- **Reprise `carry`** : seuls les champs de la frame de destination sont figés
  en ligne ; les autres propriétés restent à la feuille de style.
- **Présence par `hidden`** : l'attribut reste celui de l'auteur. Pendant une
  sortie, le scanner maintient l'élément affiché par un `display` en ligne
  (`!important`) et le retire à la fin. Il ne réécrit jamais `hidden` : un
  framework qui ré-affiche pendant la sortie retire un attribut, ce qui doit
  rester observable.
- **Élément absent** : il reçoit toujours sa frame de sortie, porte
  `data-presence="exiting"` et `inert` (trois états seulement, I04).
- **`destroy()`** rend l'élément à sa feuille de style : `data-presence`,
  `inert` et les propriétés en ligne écrites par la définition sont retirés.
- **`--udx-motion: none`** (F19) est lu par `playMotion` : l'état de
  destination est appliqué sans animation, quelle que soit la surface
  (HTML, `motion()`, adaptateurs). La propriété n'est pas enregistrée, donc
  elle s'hérite.
- **Nœud déplacé** dans le DOM : il garde sa liaison et ne rejoue pas son
  entrée. Avec le routeur client d'Astro, le scanner est déconnecté avant
  l'échange de page et reconnecté après : le contenu livré avec la page est
  considéré en place.
- **Runtime et mode développement** : `getMotionRuntime()` sans argument
  adopte le runtime existant ; seule une valeur explicite contradictoire lève.
- **Badge** : premier composant sur `@udixio/motion`
  (`BadgeProps.motion: { timing }` remplace `transition`, `udxBadgeMotion`
  remplace `udxBadgeTransition`) ; `badge.ts` n'importe plus anime.js.

Points ouverts relevés pendant l'étape 1a :

- **Valeurs en ligne au repos** : à la fin d'une animation, le provider WAAPI
  laisse les valeurs de destination en ligne (`opacity: 1; scale: 1`), ce qui
  prime sur une classe posée sur le même élément (`hover:scale-105`). À
  trancher avec les états (étape 2 ou 8) : libérer au repos ou documenter.
- **Poids** : l'entrée principale pèse 12,7 kB gzip sans anime.js (validation
  du manifeste à l'exécution, tables de ressorts, contrôles défensifs).
  Budget fixé à la mesure + 10 % ; réduction à traiter à l'étape 8.
- **Calibrage** : à la sortie, l'opacité finit bien avant le déplacement
  (ressort `effects` plus rapide que `spatial`) ; le mouvement de sortie se
  voit peu. À régler au calibrage visuel (étape 8).
- **Saut de mise en page** : masquer par `hidden` retire l'élément du flux à
  la fin de la sortie ; le contenu voisin saute. C'est le rôle de `layout`
  (étape 2).

#### 8.3.6 État après l'étape 1b (2026-11-15)

Adaptateurs livrés, enveloppes minces autour de la liaison du noyau (aucune
logique d'animation, seulement `setPresent`, `play`, `destroy`) :

| Framework | Écriture | Sortie au démontage |
|---|---|---|
| React (`@udixio/ui-react`) | `const m = useMotion('slide', { present: open })` puis `m.mounted && <div ref={m.ref}>` ; renvoie aussi `play`, `getBinding` | `mounted` reste vrai jusqu'à la fin de la sortie |
| Angular (`@udixio/ui-angular`) | `<div udxMotion="slide">` dans un `@if` ; entrées `udxMotionPresent`, `udxMotionState`, `udxMotionSettled` ; `exportAs: 'udxMotion'` | écouteur d'hôte `(animate.leave)`, retrait à `animationComplete()` |
| Svelte (`@udixio/ui-svelte`) | `{@attach motion('slide', () => ({ present, state, settled }))}` | `transition:presence`, qui retient le nœud pour la durée de la sortie |

Noyau : `motionWhenDefined(target, source, options)` lie tout de suite, ou dès
que le nom est défini (ordre d'hydratation des îles) ; `MotionBinding.verb`.

Règles fixées pendant l'étape 1b :

- **Entrée au chargement (décision de l'utilisateur, 2026-11-15)** : le contenu
  présent au chargement de la page ne s'anime pas ; seuls les éléments insérés
  ou ré-affichés ensuite jouent leur entrée. Une option explicite par élément
  pourra être ajoutée plus tard ; elle demandera une règle de masquage avant
  le premier affichage.
- **Entrée côté framework** : un élément monté par le framework côté client
  joue son entrée. React détecte le contenu hydraté (`useSyncExternalStore`)
  et le considère en place. Angular et Svelte n'exposent aucune API publique
  pour cela : option explicite `udxMotionSettled` / `settled: true`.
- **Emphase** : même option dans les trois adaptateurs (`state` /
  `udxMotionState`) ; elle rejoue au changement de valeur, jamais au montage.
- **Changement de source** sur un même élément : nouvelle liaison, sans rejouer
  l'entrée.
- **Angular** : la directive est détruite avant l'appel de `leave` (même
  tick) ; la liaison n'est donc libérée qu'après la sortie, ou une macrotâche
  après la destruction s'il n'y a pas de sortie.
- **Nom pas encore défini** : aucun adaptateur ne lève ; l'élément reste
  visible et se lie à l'arrivée de la définition, sans rejouer l'entrée.

Points ouverts relevés pendant l'étape 1b :

- **Hydratation en Angular et Svelte** : sans détection automatique, un
  contenu rendu par le serveur rejoue son entrée à l'hydratation. À traiter
  avec l'adaptateur Astro (S2) ou par un marquage côté serveur.
- **Changements avant la définition** : un changement de `present` ou de
  `state` fait pendant qu'un nom n'est pas encore défini est perdu à la liaison
  (nœuds gardés seulement). Piste : `DeferredMotion.setPresent`.
- **Tests Angular** : jsdom n'a pas `getAnimations`, donc Angular n'y appelle
  pas `animate.leave` ; le chemin réel est couvert par le test navigateur de
  la démo, la logique de la directive par des appels directs.
- **Cohérence entre frameworks au premier rendu client** : une île rendue
  uniquement côté client joue ses entrées au montage dans les trois
  frameworks ; une île hydratée ne les joue pas en React seulement.

#### 8.3.7 État après l'étape 2a (2026-11-15)

Verbe `layout` livré : un élément lié à une définition `layout` rejoint en
mouvement sa nouvelle place et sa nouvelle taille quand la mise en page change
dans sa portée. Écriture : `defineMotion('nom', { verb: 'layout' })` (pas de
keyframes ; options `timing`, `interrupt`, `reduced`), preset `reflow`,
`data-motion="reflow"`, `useMotion('reflow')`, `udxMotion="reflow"`,
`{@attach motion('reflow')}`.

| Élément | Rôle |
|---|---|
| `flip.ts` (`flipFrames`, `toLayoutBox`, `toVisualBox`, `sameBox`, `parseOwnTransform`) | calcul pur du FLIP : boîtes centre + taille, transform propre de l'élément |
| `layout.ts` (`trackLayout`, `layoutScopeOf`) | portée de layout : cache de géométrie, `MutationObserver`, `ResizeObserver`, écoute du défilement |
| `playFrames` | lecture de frames brutes par le provider, sans rien laisser en ligne (`commit: false`) |
| champs `scaleX`, `scaleY` ; `MotionRequest.commit` | portés par le provider WAAPI ; refusés explicitement par `animejs` et `css` |
| `isPresenceVerb` | seuls `appear` et `disappear` ont une présence |

Règles fixées pendant l'étape 2a (choix de Claude, sur délégation) :

- **FLIP sur cache de géométrie, pas `createLayout` d'anime.js.** Un
  changement constaté après coup (classe basculée par l'auteur ou par un
  framework) ne peut pas être rendu interruptible avec le cycle
  enregistrer / animer d'anime.js (constat déjà écrit dans
  `core/dom/auto-layout.ts`). Le FLIP passe par le contrat provider, sur
  WAAPI : compositeur, reprise exacte en position. anime.js garde son rôle
  pour la reprise avec vitesse (à brancher derrière `playFrames`).
- **Portée** : l'ancêtre `data-motion-scope` le plus proche, sinon le parent.
  Un `MutationObserver` par portée (`childList`, sous-arbre, attributs ; les
  écritures de la bibliothèque — `style`, `data-presence`, `inert` — sont
  ignorées). Aucun signal propre aux frameworks : l'observateur voit leurs
  changements de DOM.
- **Position « avant »** : boîte visuelle au repos en cache ; pour un élément
  en vol avec `carry`, boîte de layout en cache composée avec le transform
  animé courant. **Position « après »** : mesurée une fois le mouvement
  annulé. Les boîtes sont relatives à l'ancêtre suivi le plus proche, sinon
  à la racine de la portée.
- **Un mouvement n'est interrompu que si sa destination change.** Une
  mutation sans effet sur un élément en vol (classe de survol, `data-state`
  voisin) le laisse voler.
- **Changement sans mutation** (redimensionnement, défilement interne) : le
  cache est rafraîchi tout de suite, rien ne s'anime.
- **Rien en ligne** : à la fin ou à l'annulation, l'élément est rendu à sa
  feuille de style ; les transforms de l'auteur (`translate`, `scale` en
  classe) sont conservés pendant et après le mouvement.
- **Mouvement réduit et `--udx-motion: none`** : la nouvelle mise en page
  s'applique sans animation.
- Budget de l'entrée principale : 14,5 kB gzip mesurés, limite 16 kB.

Limites connues, à traiter :

- **Contenu étiré pendant un changement de taille** : la taille est jouée en
  mise à l'échelle non uniforme, donc le texte et les rayons de bordure se
  déforment le temps du mouvement. Visible sur la démo ; premier point à
  corriger (contre-échelle du contenu, ou taille réelle animée).
- **Élément suivi imbriqué** dans un élément suivi qui change de taille : non
  corrigé du facteur d'échelle du parent.
- **Ancrage de défilement** (Firefox, WebKit) : dans une portée défilée, le
  navigateur peut décaler le contenu quand des éléments suivis bougent ;
  `overflow-anchor: none` sur le conteneur l'évite.
- **Changement du transform de repos de l'élément lui-même pendant un vol** :
  vu seulement à l'arrivée.
- **Redimensionnement et changement dans la même tâche** : le cache n'est pas
  encore rafraîchi (l'observateur de taille n'a pas parlé).
- `transform-origin` doit rester au centre ; un changement de style en ligne
  n'est pas observé (`binding.play()` force la comparaison).

#### 8.3.8 État après l'étape 2b — qualité et performance du layout (2026-11-15)

Décision de l'utilisateur (2026-11-15) : garder le moteur de layout maison,
viser un rendu « fluide et optimisé », expérimenter si nécessaire.

Mesures (`packages/motion/bench/layout-run.mjs`, Chromium sans affichage,
processeur ralenti 4 fois, médiane de 3) :

| Mesure | Notre moteur | anime.js `createLayout` |
|---|---|---|
| Calcul d'un changement, 200 éléments | 41–43 ms (136–143 ms avant optimisation) | 84–89 ms |
| Calcul d'un changement, 50 éléments | 12–13 ms (34 ms avant) | 26–30 ms |
| Images en régime établi (p95) | 16,7–16,8 ms | 16,7–16,8 ms |
| Mutation sans effet, 200 éléments suivis | 0,8–0,9 ms (2,5 ms avant) | 0,01 ms (n'observe rien) |

Ajouts au moteur (tout reste joué par le provider WAAPI sur `translate` et
`scale`, sans rien laisser en ligne) :

| Élément | Rôle |
|---|---|
| `spring.ts` (`springOffset`, `springVelocity`, `springSettleTime`), `springParams` | ressort amorti analytique, concordant à 0,5 % avec les easings `linear()` des tokens |
| `MotionHandle.currentTime` | temps écoulé d'une animation (les trois providers) |
| vols échantillonnés | une interruption `carry` repart avec la vitesse courante : keyframes à instants uniformes, easing `linear` ; un vol au repos garde la forme à 2 keyframes |
| `project.ts` (`projectBox`, `projectText`, `sampleContent`, `liveContentBoxes`) | projection du contenu : transform propre qui annule l'étirement du parent et place le nœud où la mise en page réelle l'aurait mis |
| cache du contenu | arbre des éléments d'un élément suivi (profondeur 3, 24 nœuds), mesuré au repos |

Règles fixées pendant l'étape 2b (choix de Claude, sur délégation) :

- **Vitesse conservée nativement**, sans anime.js : la vitesse courante est
  lue sur le ressort analytique du vol interrompu (écart mesuré 0,3 à 0,6 %
  avec le ressort continu). Un vol en courbe (`CurveTiming`) ou
  `interrupt: 'restart'` repart sans vitesse.
- **Contenu d'un élément qui change de taille** : un nœud **boîte** suit sa
  position et sa taille interpolées ; un nœud **texte** (texte direct) garde
  sa taille finale, seul son bord de départ est interpolé — ses lettres ne
  sont jamais étirées. La progression du contenu est prise par axe sur la
  taille réelle du parent : parent et contenu partagent les mêmes instants
  d'échantillonnage, quel que soit l'easing supporté.
- **Unité locale** : les translations d'un nœud sont divisées par l'échelle
  déjà appliquée à son parent (rect / taille de layout).
- **Interruption** : le contenu repart de ses boîtes visuelles courantes.
- **Enfant suivi dans un parent suivi qui change de taille** : animé comme
  contenu du parent pour ce vol (sans vitesse conservée).
- **Performance** : lectures groupées avant les écritures ; route de timing
  et paramètres de ressort résolus une fois ; un élément au repos ne coûte
  qu'une lecture de rect par mutation ; le travail de contenu et
  d'imbrication est sauté pour les portées plates.
- Budgets : entrée principale 18,3 kB gzip (limite 20,2 kB), provider WAAPI
  0,82 kB (limite 0,9 kB).

Limites connues après 2b :

- **Texte posé directement dans l'élément suivi** (sans élément enveloppe) :
  étiré pendant un changement de taille. L'envelopper dans un élément.
- **Texte qui change de retour à la ligne** : il prend sa mise en forme
  finale dès le début du vol (propre à toute animation par transform).
- **Rayons de bordure** de l'élément qui change de taille : légèrement
  elliptiques pendant le vol.
- **Poids** : le layout est chargé avec l'entrée principale (+5,6 kB). À
  charger à la demande, par verbe (étape 8).
- Coût par vol : un appel `element.animate()` par élément déplacé
  (incompressible avec une animation par élément).
- Restent de 2a : ancrage de défilement dans une portée défilée,
  `transform-origin` au centre, style en ligne non observé.

#### 8.3.9 État après l'étape 2c — listes (2026-11-15)

Une liste s'anime de bout en bout : `<li data-motion="cascade reflow">` entre
en cascade, sort, et ses voisins lui font ou lui reprennent la place.

| Élément | Rôle |
|---|---|
| plusieurs animations par élément | une liaison par nature — présence (`appear`, `disappear`), emphase, layout ; `data-motion="a b"`, `getMotion(el, kind?)`, `getMotions(el)`, `binding.kind`, `kindOf` ; adaptateurs : `useMotion(['cascade', 'reflow'])`, `udxMotion="cascade reflow"`, `motion(['cascade', 'reflow'])` |
| `stagger`, `origin` (`appear`, `disappear`) | cascade par rang visuel (haut puis gauche), délai `min(rang × pas, plafond)` lu sur `--udx-motion-stagger-*` ; groupe = même définition, même portée, même sens (entrée ou sortie), même tâche ; preset `cascade` |
| `deferredHandle`, `staggered`, `visualRanks` | handle d'une animation pas encore créée ; lot vidé au microtask (lectures puis écritures) |
| `exit: 'in-place' \| 'out-of-flow'` | sortie en place (défaut) ou hors flux ; `pinOutOfFlow`, `flushLayoutAround` |
| coins arrondis | `border-radius` animé à l'inverse de l'étirement (rayons en px), par `MotionRequest.styles` (WAAPI) |
| `src/layout/*.ts` | moteur de layout découpé en modules (types, mesure, vol, plan, flush, portée) |

Règles fixées pendant l'étape 2c (choix de Claude, sur délégation) :

- **Une liaison par nature** sur un élément ; deux noms de même nature dans
  `data-motion` : le premier gagne, erreur en développement. La spec était
  muette sur le cumul ; il est nécessaire aux listes.
- **Le layout ignore un élément qui entre ou sort** (`data-presence` autre
  que `present`) : sa présence a la main sur `translate` / `scale` ; il est
  remesuré, sans animation, quand il redevient présent.
- **`hidden` sur un élément qui a une présence** n'est pas un changement de
  layout : c'est la présence qui annonce l'entrée ou la sortie réelle du flux
  (`flushLayoutAround`). Sans cela, deux observateurs voyaient la même
  mutation dans un ordre qui dépend du navigateur.
- **Sortie hors flux** : l'élément est épinglé (`position: absolute` à sa
  place) au début de la sortie, ses styles en ligne d'origine sont restaurés
  au retour ou à la destruction ; le parent doit être positionné.
- **Définitions écrites à la volée** : deux specs de même structure partagent
  le même objet canonique, donc la même cascade.
- **État final écrit par le provider** : le provider WAAPI n'appelle plus
  `commitStyles()` ; il écrit la frame d'arrivée lui-même (sens lu sur
  `playbackRate`). Sous WebKit, `commitStyles()` après un délai figeait
  parfois la valeur de départ (élément invisible ou décalé).
- **Comparaison avec les autres moteurs** (doc officielle de Motion, source
  d'anime.js 4.5.0) : Motion anime par mise à l'échelle comme nous (enfants à
  marquer `layout`, texte en `layout="position"`, rayon corrigé seulement s'il
  est posé par `style`) ; anime.js anime la largeur et la hauteur réelles
  (aucune déformation, mise en page recalculée à chaque image).
- Budgets : entrée principale 20,6 kB gzip (limite 22,7 kB), provider WAAPI
  1,0 kB (limite 1,1 kB).

Points ouverts après 2c :

- **Poids de l'entrée principale** : 20,6 kB gzip (12,7 à l'étape 1a). À
  traiter avant la suite : charger le moteur de layout et ses aides seulement
  quand une définition `layout` est utilisée, et sortir la validation du
  manifeste du chemin de production.
- Un élément à présence masqué par `hidden` hors de `connectMotion` ne
  déplace pas ses voisins avant la prochaine mutation de la portée.
- La cascade et le cache des specs brutes sont propres à chaque copie du
  paquet (pas partagés entre îles qui embarquent chacune la leur).
- Petites fonctions dupliquées dans les trois adaptateurs (normalisation de
  la liste de sources).

#### 8.3.10 Passe sur le poids (2026-11-16)

| Mesure (gzip, minifié) | Avant | Après |
|---|---|---|
| Entrée principale `@udixio/motion` | 20,6 kB | 14,6 kB |
| Moteur de layout `@udixio/motion/layout`, chargé à la demande | inclus | 11,1 kB (avec ses morceaux partagés) |
| `@udixio/motion/presets` | 2,9 kB | 1,9 kB |

- **Moteur de layout à la demande** : `layout.ts`, `layout/*`, `flip.ts`,
  `project.ts`, `spring.ts` forment l'entrée publique `@udixio/motion/layout`.
  L'entrée principale la charge par import dynamique à la première liaison de
  layout ; `loadLayoutEngine()` la précharge, `layoutEngine()` la rend quand
  elle est chargée. Une liaison de layout existe dès `motion()` mais ne suit
  qu'une fois le moteur chargé : un changement fait avant n'est pas animé. Un
  chargement en échec est retenté au prochain appel, sans erreur non gérée.
- **Validation en développement seulement** : `validateMotionSpec` ne contrôle
  la définition contre le manifeste que si
  `process.env.NODE_ENV !== 'production'` ; la forme canonique est toujours
  produite. Les bundlers éliminent le validateur en production. Une page sans
  bundler ni `process` global lèverait au premier `defineMotion` : accepté,
  l'écosystème impose un bundler (Tailwind).
- Aucune régression mesurée au banc d'essai (calcul d'un changement à 200
  éléments : 46,4 → 46,5 ms).
- Reste dans l'entrée principale : liaison et présence, scanner HTML,
  cascade, épinglage hors flux, tokens et données de ressorts, routage du
  timing avec ses contrôles défensifs. Pistes suivantes si besoin : alléger
  ces contrôles, sortir la cascade.

#### 8.3.11 État après l'étape 2d — élément partagé (2026-11-16)

Deux éléments qui portent la même clé sont une seule chose pour l'œil :
quand l'un arrive (inséré ou ré-affiché) alors que l'autre est parti, il part
de la dernière position et de la dernière taille de l'autre et rejoint la
sienne. Mesuré sur les trois navigateurs : le départ coïncide exactement avec
le rectangle de l'ancien porteur, l'arrivée avec la place naturelle, dans les
deux sens.

| Élément | Rôle |
|---|---|
| clé `shared` | option du verbe `layout` (I09) : dans la définition, `motion(el, source, { shared })`, `data-motion-shared="<clé>"`, `useMotion(…, { shared })`, `udxMotionShared`, options de l'attachment Svelte ; la valeur par élément l'emporte ; `defineShared('hero')` pour une clé typée |
| mémoire de page | registre partagé du runtime (`remember`, `forget`, `recall`) : dernière boîte de chaque clé, valable 600 ms après le départ du porteur (`SHARED_WINDOW`) ; clé du runtime passée en `preview.7` |
| arrivée | dans le moteur de layout : un élément à clé sans boîte en cache demande la mémoire et vole depuis la boîte rendue (FLIP) |

Règles fixées pendant l'étape 2d (choix de Claude, sur délégation) :

- **FLIP seulement** (rendu sûr d'après S2) : pas de View Transitions, pas de
  rétention du nœud sortant (seule sa boîte est retenue).
- **Un seul porteur vivant par clé** (I17, `first-live`) : un second élément
  visible de même clé ne se transforme pas ; erreur en développement, une
  fois par clé.
- **Pas de projection du contenu pendant une transformation** : les deux
  porteurs n'ont pas le même contenu, il suit la boîte ; les coins arrondis
  restent corrigés (rayon de l'élément qui arrive).
- **Les mémoires expirent seules** (minuteur de 650 ms lancé au départ du
  porteur, annulé si la clé est reprise) ; elles ne sont pas vidées à la
  libération du runtime, sinon l'élément qui remplace le dernier lié
  arriverait sans mémoire.
- **Une clé HTML invalide** est signalée en développement et ignorée : elle
  n'arrête jamais le balayage de la page.

Limites :

- Le rayon des coins est celui de l'élément qui arrive pendant tout le vol
  (pas d'interpolation entre les deux porteurs) ; pas de fondu enchaîné.
- Un porteur masqué par un style en ligne, ou retiré sans détruire sa
  liaison, n'est jamais « oublié » : sa mémoire reste jusqu'à ce que la clé
  soit reprise, et un remplaçant arrivant plus tard se transforme quand même.
- Une île hydratée plus de 600 ms après le départ de l'autre porteur ne se
  transforme pas.

### 8.4 Détails par famille — **rédigé (consolidation)**

| # | Famille | Écriture | Chemin natif | Repli / moteur JS | Sources |
|---|---|---|---|---|---|
| F1 | Tokens | `defineTokens`, `--udx-motion-*` | CSS `@property` | — | R17, I07, I25 |
| F2 | Transitions d'état | CSS + tokens + `data-[state]:` ; `emphasize` pour les accents | `transition` | `defineValue` à ressort | I06, I20 |
| F3 | Présence | `appear` / `disappear` ; `data-presence` écrit par le runtime | `@starting-style`, `allow-discrete` ; `animate.leave`, `out:` | WAAPI ; nœud retenu jusqu'à `finished` | §8.0 #2, I04, M5-L07 |
| F4 | À la vue | `reveal` (`repeat`, `axis`) | `animation-trigger` (Chromium) | IntersectionObserver partagé + sentinelle sans transform | M3-03, R1 |
| F5 | Lié au scroll | `scrub` (`range`, `axis`) | `animation-timeline: view()/scroll()` | **rendu statique (position neutre) par défaut** ; pilotage `CSSAnimation.currentTime` en module optionnel nommé (S1, 9 conditions) | R3, R4, S1, M3-06 |
| F6 | Scroll piloté | action `scrollTo(cible, { timing })` | `scroll-behavior` | anime.js | M3-V03 |
| F7 | Layout | `layout` sur changement observable (classe, `data-*`, enfants) | `interpolate-size`, VT scopée | FLIP (cache I10) | M3-L02, I10 |
| F8 | Élément partagé | `layout` + `shared` (`defineShared`) | VT si `restart` et support | FLIP si `carry`, hydratation tardive, ou sans support | I17, S2 |
| F9 | Pages | adaptateur par routeur ; Astro via ses événements | View Transitions | rendu instantané | I18, S2 |
| F10 | Listes | `stagger`, `origin`, `exit` | `sibling-index()` si ordre DOM = ordre visuel | rang visuel mesuré en JS si ordre différent ou support absent | I14, I16, I19, R16 |
| F11 | Chorégraphie | `defineSequence`, `data-motion-step`, `at` | — | timeline anime.js pilotée par le handle | I15, M1-R01 |
| F12 | Contrôle | handle à surface fermée + `motion.on` | WAAPI | anime.js | §8.0 #4, I21 |
| F13 | Interruption | `interrupt`, `velocity.source` | WAAPI (position) | ressort anime.js (vitesse) | I02, S1 |
| F14 | Valeurs réactives | `defineValue` + `data-motion-value` | variables CSS sur les cibles abonnées | ressort de lissage | I26 |
| F15 | Compteurs | `defineValue` (`format`) sur `<data value>` | valeur finale en SSR | anime.js | I26, M4-R06 |
| F16 | Texte | `split` (lettres / mots / lignes) | — | découpage après hydratation, `sr-only` + `aria-hidden` ; brouillage hors v1 | I27 |
| F17 | SVG | tracé, trajectoire, morphing | `stroke-dashoffset`, `offset-path` | `morphTo` d'anime.js | M1-R05, R16 |
| F18 | Gestes | `defineGesture` (`alternative` obligatoire) | — | Draggable anime.js + vitesse au handle | I24, R16 |
| F19 | Responsive / scopes | paliers nommés, `revert()` / `inspect()` ; conditionnel par variant Tailwind via `md:[--udx-motion:none \| <nom>]` lu au déclenchement (candidat, à éprouver à l'étape 1) | media / container queries | reconstruction au changement de palier | M3-R06, I29 |
| F20 | Accessibilité | `reduced` par verbe, `pause`, `alternative` | `prefers-reduced-motion`, `motion-safe:` | politique unique sur `<html>` | §8.2.4, I05, I08 |
| F21 | Performance | chargement par verbe | — | préchargement par intersection / intention | I28, M3-R03 |
| F22 | Usage interne | prop `motion` = clés `data-motion-<option>` | — | — | M1-R10, I11 |
| F23 | Outillage IA | manifeste `llms.txt` + JSON, MCP ; types et erreurs dev d'abord, analyse des templates au build en dernier | — | — | M5-R03, M5-R04 |
| F24 | Boucles | `loop` (`pause` obligatoire) | CSS `animation`, `animation-play-state` | abonné de la frame unique (JS) | I08, §8.0 bis #2 |

#### Points ⚑ — statut (2026-11-05)

**Validés par l'utilisateur** : 1, 2, 3, 4 (transitions de page en
`spring.slow.spatial`, conforme à la doc M3 « slow = plein écran »), 6, et la
règle SSR M3-02 (§9).

**Choix opérationnels provisoires, de faible confiance et à calibrer
visuellement** sur des démos (R18) : `spring.default.spatial` pour le retour
d'un geste vers une cible, avec `fast` ou `slow` explicite par composant ;
distances 8 / 24 / 64 px et stagger 20 / 50 / 100 ms. M3 ne définit ni
distance ni stagger ; ces valeurs ne sont pas validées perceptivement.

Liste d'origine :

1. Attribut `data-motion-gesture` pour référencer un `defineGesture`.
2. Champs supplémentaires de `VisualFrame` : `scaleX`, `scaleY`, `color`,
   `backgroundColor`, `clipPath`, `blur`.
3. `format` des compteurs : `integer`, `decimal`, `percent`, `currency`.
4. Ressort par défaut des transitions de page (`spring.slow.spatial`) et des
   gestes (`spring.default.spatial` pour le retour vers une cible, provisoire).
5. Valeurs des tokens de distance (8 / 24 / 64 px) et de stagger
   (20 / 50 / 100 ms, départs plafonnés à 400 ms, provisoires).
6. Nom du backend natif CSS : `'css'`.


### 8.5 Décisions du 2026-11-14 (revue d'ensemble)

Décidées par l'utilisateur :

- **Aucune publication partielle** : `@udixio/motion` n'est publié que lorsque
  toutes les familles sont livrées, layout compris.
- **anime.js reste le moteur JS** (C16 confirmé), même si son rôle est encore
  réduit dans le code actuel : il porte le layout, les gestes, le texte, le
  SVG et les ressorts avec vitesse.

Tranchées par Claude, sur délégation de l'utilisateur (« pour le reste je te
fais confiance ») :

- Doublon `appear` / `reveal` supprimé : le déclencheur est fixé par le verbe
  (§8.2.3).
- `layout` réagit aussi aux changements de classe, pas seulement à `data-*`
  (§8.2.4) ; coût borné car seuls les éléments marqués et leur racine sont
  observés.
- Repli du scroll lié : rendu statique par défaut, pilotage JS optionnel (§8.4 F5).
- Conditionnel par breakpoint : `md:[--udx-motion:…]` comme candidat, à
  éprouver sur un cas réel (§8.4 F19).
- Vérification au build des templates reportée en dernier (§8.4 F23).

### 8.6 Ordre de réalisation jusqu'à la publication

| Étape | Contenu | Familles |
|---|---|---|
| 1 | Surface d'écriture de bout en bout : `defineMotion`, `motion(el)`, `data-motion`, adaptateurs React / Angular / Svelte, présence ; verbes `appear`, `disappear`, `emphasize` ; un composant réel et une démo dans la doc | F2, F3, F12, F13 |
| 2 | **Layout** et élément partagé, listes (le plus risqué, traité tôt) | F7, F8, F10 |
| 3 | `reveal`, `scrub`, `loop` | F4, F5, F24 |
| 4 | Valeurs, compteurs, séquences | F14, F15, F11 |
| 5 | Gestes, transitions de page | F18, F9 |
| 6 | Texte, SVG, `scrollTo` | F16, F17, F6 |
| 7 | Fin de la migration des composants Udixio ; retrait de `motion` et de `anim-*` | F22 |
| 8 | Calibrage visuel, doc complète, manifeste et outillage IA, audit d'accessibilité, performance, navigateurs anciens | F1, F19, F20, F21, F23 |
| 9 | Publication | — |

Chaque étape migre au passage les composants Udixio qui utilisent ses
familles, et se termine par une vérification groupée (pas de tests à chaque
modification).

Avancement : **étape 1a livrée le 2026-11-14** (cœur de la surface
d'écriture, `data-motion`, Badge, démo `/motion/demo` — détail en §8.3.5).
**Étape 1b livrée le 2026-11-15** (adaptateurs React, Angular, Svelte et
présence par framework — détail en §8.3.6). L'étape 1 est terminée.

L'étape 2 est découpée en trois : **2a livrée le 2026-11-15** (verbe
`layout`, détail en §8.3.7) ; **2b livrée le 2026-11-15** (qualité et
performance du layout : vitesse conservée, contenu non déformé, détail en
§8.3.8) ; **2c livrée le 2026-11-15** (listes : plusieurs animations par
élément, cascade, sorties, coins arrondis, détail en §8.3.9) ; reste 2d =
élément partagé. La passe sur le poids est faite (§8.3.10). **2d livrée le
2026-11-16** (élément partagé en FLIP, détail en §8.3.11) : **l'étape 2 est
terminée**. La suivante est l'étape 3 (`reveal`, `scrub`, `loop`).

## 9. Questions ouvertes connues

> **État au 2026-11-05** : F3 → §8.0 #2 et M5-L07 ; F4/F5 → deux verbes
> `reveal` / `scrub` ; F7 → racine de layout bornée et cache I10 ; F8/F9 → I17,
> I18 et S2 ; F13 → I02 et S1 ; F15 → `defineValue` + `<data value>` ; F20 →
> rendu réduit par verbe (§8.2.4) ; noms inconnus → garde-fous à quatre niveaux
> (§8.0 bis #1) ; scroll-driven interne → M4. **SSR** : règle M3-02 (R10, G12)
> retenue ⚑ — le contenu est rendu visible côté serveur et n'est masqué pour
> une entrée qu'après inscription effective auprès du runtime ; sans JS, rien
> n'est invisible. Le tableau ci-dessous est conservé pour l'historique.

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

D2 (en partie orientée par C15).

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
- **Taille du chantier** : 24 familles. La roadmap publique rend l'avancement
  visible et évite que des familles soient oubliées.

## 12. Journal

| Date | Travail | Changement |
|---|---|---|
| 2026-11-03 | — | Création du document à l'issue du brainstorming initial. |
| 2026-11-16 | Étape 2d | Élément partagé : clé `shared` (définition, option, `data-motion-shared`, adaptateurs), mémoire de page de 600 ms dans le runtime (`preview.7`), transformation FLIP à l'arrivée ; démo « Shared element ». Étape 2 terminée. Règles et limites en §8.3.11. Vérification : motion 1 335 tests (trois navigateurs), core 433, React 410, Svelte 302, Angular 372, doc 21 tests navigateur sur le site construit, deux passages. |
| 2026-11-16 | Passe sur le poids | Entrée principale 20,6 → 14,6 kB gzip : moteur de layout en entrée séparée chargée à la demande (`@udixio/motion/layout`, `loadLayoutEngine`), validation des définitions en développement seulement. Détail en §8.3.10. Vérification : motion 1 280 tests (trois navigateurs), core 433, React 408, Svelte 300, Angular 370, doc 18 tests navigateur sur le site construit, trois passages. |
| 2026-11-15 | Étape 2c | Listes : une liaison par nature sur un élément (`data-motion="cascade reflow"`), cascade par rang visuel, sorties en place ou hors flux, coins arrondis corrigés, moteur de layout découpé en modules. Défaut WebKit corrigé (état final écrit par le provider, plus de `commitStyles`). Règles et points ouverts en §8.3.9. Vérification groupée : motion 1 267 tests (Chromium, Firefox, WebKit), core 433, React 408, Svelte 300, Angular 370, doc 18 tests navigateur sur le site construit. |
| 2026-11-15 | Étape 2b | Qualité et performance du layout : banc d'essai contre anime.js, calcul d'un changement divisé par 3 (41–43 ms à 200 éléments contre 84–89 ms pour anime.js), vitesse conservée à l'interruption, contenu non déformé par projection, enfants suivis imbriqués. Règles et limites en §8.3.8. Vérification groupée : motion 1 081 tests (Chromium, Firefox, WebKit), core 433, React 403, Svelte 295, Angular 367, doc 15 tests navigateur sur le site construit. |
| 2026-11-15 | Étape 2a | Verbe `layout` livré (FLIP sur cache de géométrie, portée `data-motion-scope`, preset `reflow`, champs `scaleX` / `scaleY`, `commit: false`) ; démo « Layout ». Règles et limites en §8.3.7. Vérification groupée : motion 931 tests (Chromium, Firefox, WebKit), core 433, React 403, Svelte 295, Angular 367, doc 15 tests navigateur sur le site construit. |
| 2026-11-15 | Étape 1b | Adaptateurs livrés : `useMotion` (React), `udxMotion` (Angular), `motion` + `presence` (Svelte) ; `motionWhenDefined` dans le noyau ; démo par framework. Décision : pas d'animation au chargement par défaut. Règles et points ouverts en §8.3.6. Vérification groupée : motion 816 tests (Chromium, Firefox, WebKit), core 433, React 402, Svelte 293, Angular 365, doc 12 tests navigateur sur le site construit. |
| 2026-11-14 | Étape 1a | Surface d'écriture livrée : `defineMotion`, presets, `playMotion`, `motion()`, `connectMotion`, entrée `policy` ; Badge migré ; démo `/motion/demo`. Règles et points ouverts en §8.3.5. Vérification groupée : motion 798 tests (Chromium, Firefox, WebKit), core 433, React 387, Svelte 280, Angular vert. |
| 2026-11-14 | Revue d'ensemble | Pas de publication partielle ; anime.js confirmé ; doublon `appear` / `reveal` levé ; `layout` sur changement de classe ; repli statique du scroll lié ; ordre de réalisation §8.6. |
| 2026-11-05 | Validation ⚑ | Points 1, 2, 3, 4 (pages), 6 et SSR validés ; ressort des gestes et tokens de distance / stagger provisoires, à calibrer visuellement. |
| 2026-11-05 | §8.2–§8.4 | Modèle `MotionSpec`, contrat provider, runtime global et détail des 24 familles rédigés (consolidation) ; 6 points ⚑ à valider. |
| 2026-11-05 | S1, S2 | Spikes : contrat de variables, fallback scroll-driven, runtime entre îles GO ; règles précisées (cache avec transform, doublon `first-live`, rétention 600 ms, adaptateur Astro, `linear()` dérivé en repli). |
| 2026-11-05 | R16, R17 | Faits I30 vérifiés (2 corrections : vitesse au pointeur sur Firefox Android, API Angular 22) ; valeurs M3 Expressive relevées sur la doc officielle. |
| 2026-11-04 | Validation globale | L'utilisateur valide §8.1 à §8.1 quater, arbitrages Claude compris ; prochaine étape : vérifications I30 et spikes S1/S2. |
| 2026-11-04 | R15 | Audit de cohérence : 30 résolutions (§8.1 quater), 27 à la majorité, 3 + rendu partagé arbitrés par Claude. Recherche complète, en attente de validation globale. |
| 2026-11-04 | R14 | Familles restantes proposées (§8.1 ter), toutes les questions couvertes ; contradictions transmises à R15. |
| 2026-11-04 | R13 | États/layout/partagé/présence/pages proposés (§8.1 bis) ; Q2 et Q3 faibles, renvoyées à R15. |
| 2026-11-04 | R12 | Vocabulaire proposé (§8.1), non validé ; l'utilisateur demande de tout couvrir avant une validation globale. |
| 2026-11-04 | R11 | Surface d'écriture validée avec amendements (§8.0 bis) ; attribut pour le nom, Tailwind pour tokens et états. |
| 2026-11-04 | R10 | Fondations du moteur validées (§8.0) ; débats R8/R9 conservés comme entrées. |
| 2026-11-03 | D3 | anime.js seul moteur JS ; GSAP/Motion jamais envisagés comme providers (C16). |
| 2026-11-03 | Phase 0 (R1–R5, E1–E3) | Rapports dans `docs/motion/research/` ; synthèse §5 bis ; supports F3/F5/F7/F10 corrigés ; ajout F24 (boucles). |
| 2026-11-03 | Livraison | Branche longue `feat/anime`, fusion finale (C15). |
| 2026-11-03 | Tailwind | Tailwind requis, écosystème d'abord (C14). |
| 2026-11-03 | D1, navigateurs | Paquet `@udixio/motion` ; browserslist `defaults` + double niveau de tests (C12, C13). |
| 2026-11-03 | Relecture à froid | Phase 2 dépend aussi de D1, S1, S2 ; politique CI, tolérances et budgets initiaux fixés (choix Claude). |
