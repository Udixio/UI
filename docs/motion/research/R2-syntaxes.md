# R2 — Syntaxes d'animation existantes et leur réception

Date : 2026-11-03 · Type : 🔎 Recherche · Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §7 (R2)

> Ce rapport décrit et compare. Il ne recommande **aucun** vocabulaire et ne
> tranche **aucune** question de design (cela relève de B1). Les
> « implications » sont formulées au regard des contraintes C4 (Tailwind-friendly),
> C5 (intuitif pour agents IA) et C6 (îles Astro / HTML pur), sans choix.
>
> Convention : « **[non vérifié]** » signale une affirmation issue d'une seule
> source secondaire ou de connaissances non recoupées pendant cette étude.
> Versions npm relevées le 2026-11-03 : `motion` 14.9.0, `gsap` 3.15.0,
> `animejs` 4.5.0, `tw-animate-css` 1.4.0, `tailwindcss-motion` 1.1.1,
> `tailwindcss-animate` 1.0.7 (dernière publication 2023-08-28), `aos` 2.3.4
> (2018-10-03 ; `next` = 3.0.0-beta.6).

---

## 0. Grille de lecture

Pour chaque syntaxe : (1) forme concrète, (2) modèle mental, (3) forces,
(4) critiques récurrentes (sourcées), (5) îles / HTML pur, (6) variants
Tailwind. Les exemples couvrent, quand la syntaxe le permet : **A** fade + slide
à l'entrée, **B** stagger d'une liste, **C** animation au scroll, **D** layout /
élément partagé.

Trois familles de modèles mentaux reviennent dans tout le rapport :

| Famille | Idée | Exemples |
|---|---|---|
| **Cible déclarée** (from / to sur l'élément) | L'élément porte ses états `initial`/`animate`/`exit` ; le moteur interpole | Motion (React/Vue), Svelte `in:/out:` |
| **Classes d'état** (le framework pose/retire des classes au bon moment) | L'auteur écrit du CSS ; le framework orchestre l'entrée/sortie | Vue `<Transition>`, Angular `animate.enter/leave`, Alpine `x-transition`, tw-animate `data-[state]` |
| **Impératif** (appel de fonction sur des cibles) | Le code JS décrit tweens, timelines, déclencheurs | GSAP, anime.js, Motion vanilla |

---

## 1. Motion (ex-Framer Motion)

### 1.1 Motion pour React (`motion/react`)

**(1) Forme**

```tsx
import { motion, AnimatePresence, stagger } from "motion/react"

// A — entrée + sortie
<AnimatePresence>
  {open && (
    <motion.div key="panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", bounce: 0.2 }} />
  )}
</AnimatePresence>

// B — stagger via variants (doc actuelle : delayChildren: stagger())
const list = { hidden: {}, show: { transition: { delayChildren: stagger(0.1) } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
<motion.ul variants={list} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i.id} variants={item} />)}
</motion.ul>

// C — à la vue
<motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />

// D — layout et élément partagé
<motion.div layout />
{selected && <motion.div layoutId="underline" />}
```

**(2) Modèle mental** : l'élément déclare des *états cibles* (objets de styles
ou noms de *variants*) ; Motion anime vers l'état courant à chaque rendu. La
présence (`AnimatePresence`) retarde le démontage React le temps de `exit`. Le
layout est FLIP automatique ; `layoutId` relie deux éléments distincts.

**(3) Forces** : vocabulaire très court et mémorisable (`initial / animate /
exit / whileHover / whileInView / layout / layoutId`) ; springs et
interruption avec reprise de vitesse ; moteur de layout réputé ; l'auteur
(Matt Perry) le résume ainsi : les animations de layout de Motion sont
interruptibles, les View Transitions non
([Do you still need Framer Motion?](https://motion.dev/magazine/do-you-still-need-framer-motion)).

**(4) Critiques récurrentes**

- **Poids** : la doc officielle reconnaît que le composant `motion` complet ne
  descend pas sous ~34 kB à cause de l'API déclarative non tree-shakable ;
  `LazyMotion` + `m` ramène à < 5 kB initial au prix d'une seconde API
  ([Reduce bundle size](https://www.framer.com/motion/guide-reduce-bundle-size/),
  [LazyMotion](https://www.framer.com/docs/lazy-motion/) ; issues
  [#254](https://github.com/motiondivision/motion/issues/254),
  [#861](https://github.com/motiondivision/motion/issues/861),
  [#2533](https://github.com/motiondivision/motion/issues/2533)).
- **`AnimatePresence` piégeux** : la condition doit être *dans*
  `AnimatePresence`, les enfants directs doivent avoir une `key` stable, les
  sorties d'enfants profonds exigent `propagate`
  ([doc AnimatePresence, « Exit animations aren't working »](https://motion.dev/docs/react-animate-presence)).
  L'issue [#493 « AnimatePresence exit not working for me »](https://github.com/motiondivision/motion/issues/493)
  est la plus commentée du sujet ; voir aussi
  [#2692 (portals)](https://github.com/motiondivision/motion/issues/2692),
  [#790 (petits-enfants)](https://github.com/motiondivision/motion/issues/790),
  [#2838 (stagger en sortie)](https://github.com/motiondivision/motion/issues/2838).
- **`layoutId` et scroll / changement de route** :
  [#1580](https://github.com/motiondivision/motion/issues/1580) (position fausse après scroll),
  [#2006](https://github.com/motiondivision/motion/issues/2006) (Next.js + scroll),
  [#2148](https://github.com/motiondivision/motion/issues/2148) (scroll-snap).
  La skill officielle rappelle que `layoutId` doit être unique par instance
  (`useId()`) sinon toutes les instances partagent l'indicateur
  ([ai-kit, best-practices/react.md](https://github.com/motiondivision/ai-kit)).
- **Limité à React** à l'origine : sur HN, « Im not really interested in react
  only solutions » ([HN 36442582](https://news.ycombinator.com/item?id=36442582)) ;
  drag en layout responsive jugé « finicky » ([HN 36443400](https://news.ycombinator.com/item?id=36443400)).
- **Renommage** `framer-motion` → `motion` (fin 2024,
  [annonce](https://motion.dev/magazine/framer-motion-is-now-independent-introducing-motion)) :
  migration = changer l'import vers `motion/react`
  ([upgrade guide](https://motion.dev/docs/react-upgrade-guide)) ; source majeure
  d'erreurs d'agents (§16).
- **Paywall partiel (Motion+)** : `AnimateNumber`, `splitText`, `ScrambleText`,
  `Ticker`, `Typewriter`, `Carousel`, `Cursor`, `curtains`, `AnimateActivity`,
  `AnimateSuspense`… sont payants (relevé dans
  [llms-full.txt](https://motion.dev/llms-full.txt)). Pas de critique HN
  structurée trouvée sur ce point ; un fil Reddit « Is it time to stop using
  motion.dev » (avr. 2025) porte surtout sur la performance **[non vérifié,
  page inaccessible]**.
- **Incohérence de doc** observée : la référence des props documente
  `whileTap`, un exemple Base UI utilise `whilePress` (même
  [llms-full.txt](https://motion.dev/llms-full.txt)) ; `staggerChildren`
  n'apparaît plus dans la doc actuelle, remplacé dans les exemples par
  `delayChildren: stagger()` ([stagger](https://motion.dev/docs/stagger)) —
  la doc ne dit pas explicitement qu'il est déprécié.

**(5) Îles / HTML pur** : la coordination (`AnimatePresence`, `LayoutGroup`,
`MotionConfig`, variants parent → enfant) passe par le **contexte React**. Un
`layoutId` ne relie pas deux îles React distinctes (arbres React séparés)
**[déduction, non testé]**. Aucune syntaxe HTML.

**(6) Tailwind** : les valeurs sont des objets JS ; les variants Tailwind
(`md:`, `hover:`, `data-[…]:`) ne conditionnent pas un `initial/animate`.
Motion documente la cohabitation
([Animating with Tailwind CSS](https://motion.dev/docs/react-tailwind)) et met
en garde contre les `transition` CSS sur les mêmes propriétés (principe
partagé par GSAP, §3).

### 1.2 Motion vanilla (`motion`)

**(1) Forme**

```js
import { animate, stagger, inView, scroll, animateLayout, animateView } from "motion"

animate(".card", { opacity: [0, 1], y: [16, 0] }, { duration: 0.4 })     // A
animate("li", { opacity: 1 }, { delay: stagger(0.1) })                    // B
inView(".card", (el) => {                                                 // C (déclenché)
  const a = animate(el, { opacity: 1 }); return () => a.stop()
}, { amount: "some", margin: "0px 0px -10% 0px" })
scroll(animate(".bar", { scaleX: [0, 1] }))                               // C (lié)
animateLayout(() => { box.style.justifyContent = "flex-end" })            // D (≥ 14.1)
```

```html
<!-- D : layout et élément partagé pilotés par attributs -->
<div id="toggle-handle" data-layout></div>
<div data-layout-id="underline" class="underline"></div>
```

**(2) Modèle mental** : fonctions impératives sur sélecteurs ; `inView`
renvoie une fonction de nettoyage ; `animateLayout(update)` mesure avant /
après la mutation et anime les éléments marqués `data-layout`, appariés par
`data-layout-id` ([Layout animations (JS)](https://motion.dev/docs/layout-animations) ;
[inView](https://motion.dev/docs/inview)). `animateView` enveloppe l'API View
Transition avec springs et gestion d'interruption ([View animations](https://motion.dev/docs/animate-view)).

**(3) Forces** : même vocabulaire de valeurs que React ; WAAPI quand possible ;
`animateLayout` amène `layout`/`layoutId` en HTML via **attributs data-***
(convergence notable avec C6).

**(4) Critiques** : la doc elle-même note qu'il n'existe « pas encore »
d'équivalent vanilla d'`AnimatePresence` (pas de crossfade retour)
([même page](https://motion.dev/docs/layout-animations)). Le ressenti « la vanilla
est restreinte » de la spec §1 rejoint ce point ; `splitText`/`scrambleText`
sont payants. Historique : Motion One était présenté comme impératif
« classic JS library » par son auteur ([HN 28619200](https://news.ycombinator.com/item?id=28619200)).

**(5) Îles / HTML pur** : fonctionne sans framework ; coordination par
sélecteurs et attributs. **(6) Tailwind** : aucun lien natif ; les valeurs
restent en JS.

### 1.3 Motion pour Vue (`motion-v`)

**(1) Forme** (copie quasi exacte de l'API React)

```vue
<script setup>import { motion, AnimatePresence } from "motion-v"</script>
<AnimatePresence>
  <motion.div v-if="open" :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0 }" />
</AnimatePresence>
<motion.div :while-in-view="{ opacity: 1 }" />   <!-- C -->
<motion.div layout-id="underline" />           <!-- D -->
```

([Get started with Motion for Vue](https://motion.dev/docs/vue),
[annonce](https://motion.dev/magazine/introducing-motion-for-vue)). Mêmes
forces / limites que React ; `AnimateNumber` & co. payants via
`motion-plus-vue`. La casse exacte des props Vue (`whileInView` vs
`while-in-view`) dépend du template **[non vérifié]**.

---

## 2. GSAP (+ `useGSAP`)

**(1) Forme**

```js
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Flip } from "gsap/Flip"
gsap.registerPlugin(ScrollTrigger, Flip)

gsap.from(".card", { autoAlpha: 0, y: 16, duration: 0.4 })                 // A
gsap.from("li", { autoAlpha: 0, y: 8, stagger: 0.1 })                       // B
gsap.from(".card", { autoAlpha: 0, y: 40,                                   // C
  scrollTrigger: { trigger: ".card", start: "top 80%", toggleActions: "play none none reverse" } })
gsap.to(".bar", { scaleX: 1, scrollTrigger: { scrub: true } })              // C (lié)
const state = Flip.getState(".item"); container.classList.toggle("grid")    // D
Flip.from(state, { duration: 0.5, absolute: true })
```

```tsx
// React
useGSAP(() => { gsap.from(".item", { y: 20, stagger: 0.05 }) }, { scope: containerRef })
```

**(2) Modèle mental** : tweens `to/from/fromTo` et **timelines** avec
positionnement relatif (`"<"`, `"-=0.2"`) ; plugins pour scroll, layout (Flip),
texte, SVG, gestes ; `gsap.context()` / `useGSAP` pour le nettoyage.

**(3) Forces** : chorégraphie (timelines) considérée comme la référence ;
20 ans d'optimisation ; communauté et forums massifs (« 200 000 posts »
selon [Common GSAP mistakes](https://gsap.com/resources/mistakes)) ; tous les
plugins gratuits depuis le rachat par Webflow
([Webflow, 2025](https://webflow.com/updates/gsap-becomes-free)).

**(4) Critiques**

- **Licence** : gratuite mais propriétaire, clause interdisant l'usage dans un
  produit concurrent de Webflow ; « Basically freeware with express
  prohibitions on competing with Webflow » ([HN 43869862](https://news.ycombinator.com/item?id=43869862)),
  « land grab » ([HN 43870750](https://news.ycombinator.com/item?id=43870750)),
  « GSAP is not open-source → they can pull the rag on you anytime »
  ([HN 43872017](https://news.ycombinator.com/item?id=43872017)) ; flou juridique
  dénoncé par Pinegrow ([forum](https://forum.pinegrow.com/t/gsap-has-been-acquired-by-webflow/9906)).
  Détails dans R5.
- **Pièges documentés par l'éditeur lui-même** : logique de `from()` avec
  `immediateRender`, transforms partiellement posés hors GSAP, recréation
  d'animations, **CSS transitions et GSAP sur les mêmes propriétés**, import
  incorrect, syntaxe ancienne ([Common GSAP mistakes](https://gsap.com/resources/mistakes)) ;
  ScrollTrigger : oublier `refresh()` après chargement de contenu, valeurs
  start/end non fonctionnelles au resize, casse au retour de navigation
  ([ScrollTrigger tips & mistakes](https://gsap.com/resources/st-mistakes)).
- **Poids** : « GSAP is quite a large library, along with its plugins »
  ([HN 36443422](https://news.ycombinator.com/item?id=36443422)).

**(5) Îles / HTML pur** : fonctionne en HTML pur (sélecteurs globaux) ; la
coordination est dans le code JS, pas dans un contexte de framework. Pas de
syntaxe HTML native (des surcouches tierces / Webflow Interactions existent).

**(6) Tailwind** : aucune intégration ; responsive via `gsap.matchMedia()` en
JS, donc en parallèle et non via les variants.

---

## 3. anime.js v4

**(1) Forme**

```js
import { animate, stagger, createTimeline, onScroll, createLayout } from "animejs"

animate(".card", { opacity: [0, 1], y: [16, 0], duration: 400, ease: "outQuad" })   // A
animate("li", { opacity: [0, 1], delay: stagger(80) })                               // B
animate(".card", { opacity: [0, 1],                                                  // C
  autoplay: onScroll({ enter: "bottom top", leave: "top bottom", sync: true }) })
const layout = createLayout(".grid", { enterFrom: { opacity: 0 }, leaveTo: { opacity: 0 } }) // D
layout.record(); grid.classList.toggle("dense"); layout.animate()
```

([onScroll](https://animejs.com/documentation/events/onscroll),
[thresholds](https://animejs.com/documentation/events/onscroll/scrollobserver-thresholds),
[Layout](https://animejs.com/documentation/layout/usage/enter-layout-animation),
[leaveTo](https://animejs.com/documentation/layout/states-parameters/leaveTo)).

**(2) Modèle mental** : impératif, très proche de GSAP (tween = cibles +
paramètres ; timelines ; scopes) ; Layout = `record()` → mutation →
`animate()`, sortie détectée par `display:none`/`visibility:hidden`.

**(3) Forces** : licence MIT ; modulaire (imports nommés) ; couverture large
(springs, stagger grille, Draggable, splitText, SVG, scroll) ; doc saluée
(« one of the best documentation pages », [HN 36442427](https://news.ycombinator.com/item?id=36442427)).

**(4) Critiques**

- **Rupture v3 → v4** (avr. 2025) : `anime({targets})` → `animate(targets, …)`,
  `anime.timeline()` → `createTimeline()`, `easing: 'easeOutQuad'` →
  `ease: 'outQuad'`, `.finished` → `.then()`, `begin()` → `onBegin()`
  ([notes 4.0.0](https://newreleases.io/project/npm/animejs/release/4.0.0)) ;
  puis dépréciations en 4.2 (`createSpring()` → `spring()`, `text.split()` →
  `splitText()`, `interpolate()` → `lerp()`)
  ([notes 4.2.0](https://newreleases.io/project/npm/animejs/release/4.2.0)).
- **Convergence vers GSAP** : « anime has been adding more functionality and
  changing its syntax to be more like GSAP's » ([HN 43872103](https://news.ycombinator.com/item?id=43872103)).
- **Verbeux / difficile à relire en volume** : ressenti exprimé dans la spec §1 ;
  pas de source communautaire spécifique trouvée.
- **Layout** : les états `enterFrom`/`leaveTo` n'acceptent pas les raccourcis
  `x`/`y` (chaîne `transform` complète requise) (doc Layout, ci-dessus). Piège
  interne connu : une racine Layout large coupe les `transition` CSS des
  descendants (mémoire projet « Anime.js Layout coupe les transitions CSS »).

**(5) Îles / HTML pur** : oui (sélecteurs, aucun contexte). Pas de syntaxe HTML.
**(6) Tailwind** : aucune ; `Scope({ mediaQueries })` pour le responsive en JS.

---

## 4. tw-animate-css (shadcn/ui, Tailwind v4)

**(1) Forme** (auteur : Wombosvideo, MIT ; `@import "tw-animate-css";`)

```html
<!-- A -->
<div class="animate-in fade-in slide-in-from-bottom-4 duration-300"></div>
<!-- Présence pilotée par attribut (pattern shadcn / Radix) -->
<div class="data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
            data-[side=bottom]:slide-in-from-top-2"></div>
<!-- B : pas de stagger natif → delay-* manuels -->
<li class="animate-in fade-in delay-75"></li><li class="animate-in fade-in delay-150"></li>
```

([README](https://github.com/Wombosvideo/tw-animate-css)). C et D : non couverts.

**(2) Modèle mental** : `animate-in` / `animate-out` posent une animation
`enter`/`exit` générique ; les utilitaires `fade-*`, `zoom-*`, `spin-*`,
`slide-in-from-*`/`slide-out-to-*` règlent des **variables CSS** lues par ces
keyframes (composition par variables). L'état est porté par la classe ou par
`data-[state]` posé par le composant headless.

**(3) Forces** : pur CSS, compatible v4 CSS-first, tree-shaké par Tailwind ;
reprend les noms de `tailwindcss-animate` (familiers aux agents) ; installé par
défaut par shadcn depuis le 2025-03-19
([shadcn — Tailwind v4](https://v2.shadcn.com/docs/tailwind-v4) ;
[shadcn-svelte](https://shadcn-svelte.com/docs/migration/tailwind-v4)).

**(4) Critiques / problèmes ouverts**

- L'auteur lui-même : « might not be a 100% compatible drop-in replacement » ;
  une v2.0.0 avec breaking changes est annoncée ([README](https://github.com/Wombosvideo/tw-animate-css)).
- Valeurs incohérentes de `slide-<dir>-*` ([#49](https://github.com/Wombosvideo/tw-animate-css/issues/49)),
  calcul erroné de `slide-in-from-left` avec un ratio ([#44](https://github.com/Wombosvideo/tw-animate-css/issues/44)),
  préfixe de variables non appliqué ([#48](https://github.com/Wombosvideo/tw-animate-css/issues/48)).
- Utilitaires partagés transition/animation : demande de séparer
  `animation-delay` et `transition-delay` ([#50](https://github.com/Wombosvideo/tw-animate-css/issues/50)).
- Fragilité de build vis-à-vis de Tailwind : dépendance à `--spacing()`
  ([#58](https://github.com/Wombosvideo/tw-animate-css/issues/58)), build avec
  Tailwind CLI ≥ 4.2 sans `@theme`/`@utility` ([#79](https://github.com/Wombosvideo/tw-animate-css/issues/79)),
  régression mobile avec shadcn ([#59](https://github.com/Wombosvideo/tw-animate-css/issues/59)).
- Pas de stagger, pas de scroll, pas de layout ; la sortie (`animate-out`)
  suppose qu'un tiers retarde le démontage (Radix `forceMount`/Presence).

**(5) Îles / HTML pur** : CSS pur, aucune dépendance runtime ; l'entrée
fonctionne seule ; la **sortie** dépend d'un composant qui garde l'élément le
temps de l'animation.

**(6) Tailwind** : natif — toutes les classes acceptent les variants
(`data-[state=open]:`, `md:`, `motion-safe:`…). C'est le cas d'usage
dominant chez shadcn.

## 5. tailwindcss-animate (historique)

**(1) Forme** (auteur : Jamie Kyle / `jamiebuilds`, plugin JS Tailwind v3)

```html
<div class="animate-in fade-in zoom-in duration-300"></div>
<div class="animate-out slide-out-to-top slide-out-to-left"></div>
<div class="animate-in fade-in-50 slide-in-from-bottom-48 fill-mode-forwards repeat-1"></div>
```

([README](https://github.com/jamiebuilds/tailwindcss-animate)). Utilitaires :
`animate-in/out`, `fade|spin|zoom-in|out[-amount]`,
`slide-in-from-{dir}[-amount]`, `slide-out-to-{dir}[-amount]`,
`direction-*`, `fill-mode-*`, `repeat-*`, `running/paused`.

**(2) Modèle mental** : identique à tw-animate (qui en dérive). **(3) Forces** :
a fixé le vocabulaire `animate-in fade-in slide-in-from-*` repris par shadcn,
Radix-based kits, et donc par une très large base de code.
**(4) Critiques** : plus publié depuis 2023-08-28 (npm), plugin JS
incompatible avec l'approche CSS-first v4 ; déprécié par shadcn au profit de
tw-animate-css ([shadcn v4](https://v3.shadcn.com/docs/tailwind-v4)) ; les
guides d'erreur v4 citent l'ancien import comme cause typique d'animations
mortes ([openreplay](https://blog.openreplay.com/tailwind-css-animation-plugins/)).
**(5)/(6)** : comme tw-animate (CSS généré + variants).

---

## 6. tailwindcss-motion (RomboHQ)

Nom exact du paquet : **`tailwindcss-motion`**, publié par **RomboHQ** (Rombo),
MIT, ~3,3 k étoiles ([GitHub romboHQ/tailwindcss-motion](https://github.com/romboHQ/tailwindcss-motion) ;
[docs](https://docs.rombo.co/tailwind)). Lancé sur HN en 2024-10
([Show HN 41744832](https://news.ycombinator.com/item?id=41744832), accueil
positif, 2 commentaires). Port UnoCSS existant.

**(1) Forme** — schéma `motion-[propriété]-[in|out|loop]-[valeur]`

```html
<!-- A -->
<div class="motion-opacity-in-0 motion-translate-y-in-100 motion-duration-500"></div>
<div class="motion-preset-fade"></div>
<!-- B : pas de stagger → délais manuels -->
<li class="motion-preset-slide-up motion-delay-0"></li>
<li class="motion-preset-slide-up motion-delay-100"></li>
<!-- C : plugin compagnon tailwindcss-intersect + Observer JS -->
<div class="intersect-once intersect:motion-preset-slide-up"></div>
<!-- Modificateurs par propriété, easing, boucle -->
<div class="motion-rotate-in-180 motion-delay-500/rotate motion-ease-spring-bouncy"></div>
<div class="motion-translate-y-loop-25/reset motion-loop-twice"></div>
```

([Base animations](https://docs.rombo.co/tailwind/base-animations),
[Modifiers](https://docs.rombo.co/tailwind/modifiers),
[Scroll animations](https://docs.rombo.co/tailwind/scroll-animations)).

**(2) Modèle mental** : chaque propriété a sa propre animation `in`/`out`/`loop`
composée via variables ; presets = combinaisons nommées ; modificateurs
globaux ou ciblés par propriété (`/rotate`).

**(3) Forces** : expressivité « inline » sans keyframes à écrire ; springs et
easings nommés ; reduced-motion par défaut : translate/scale coupés,
opacité/couleur/flou conservés ([intro](https://docs.rombo.co/tailwind)) ;
outil visuel (Animator Builder / extension Chrome) qui exporte aussi en
Framer Motion.

**(4) Critiques / issues** : support v4 tardif et partiel
([#40](https://github.com/romboHQ/tailwindcss-motion/issues/40),
[#47 typewriter cassé en v4](https://github.com/romboHQ/tailwindcss-motion/issues/47),
[#51 CDN v4](https://github.com/romboHQ/tailwindcss-motion/issues/51),
[#63 reset `--color-*`](https://github.com/romboHQ/tailwindcss-motion/issues/63),
[#72 range semver `>=3.0.0 || insiders`](https://github.com/romboHQ/tailwindcss-motion/issues/72)) ;
conflit avec les classes `translate-*` natives sur l'autre axe
([#35](https://github.com/romboHQ/tailwindcss-motion/issues/35)) ; demande de
compatibilité avec la présence Radix/Ark ([#37](https://github.com/romboHQ/tailwindcss-motion/issues/37)) ;
`tailwindcss-intersect` ne marche pas en v4 ([#42](https://github.com/romboHQ/tailwindcss-motion/issues/42)) ;
la doc mélange `motion-timing-*` et `motion-ease-*` sur la même page
(deux façons d'écrire l'easing) ([Modifiers](https://docs.rombo.co/tailwind/modifiers)).
Pas de scroll-driven natif (« doesn't support scroll animations natively »).
Chaînes de classes longues (« class soup ») : critique attendue mais non
sourcée spécifiquement **[non vérifié]**.

**(5) Îles / HTML pur** : CSS pur pour l'entrée ; le scroll exige
`Observer.start()` (doc montrée en React). **(6) Tailwind** : natif (variants
utilisables, `intersect:` est lui-même un variant).

---

## 7. Tailwind v4 natif

**(1) Forme**

```css
@theme {
  --animate-fade-up: fade-up 0.4s ease-out both;
  @keyframes fade-up { from { opacity: 0; translate: 0 1rem; } }
}
```

```html
<div class="motion-safe:animate-fade-up"></div>                     <!-- A (montage) -->
<div popover class="opacity-100 transition-discrete starting:open:opacity-0 transition"></div> <!-- présence native -->
<div class="animate-[wiggle_1s_ease-in-out_infinite]"></div>        <!-- valeur arbitraire -->
<div class="animate-(--my-animation)"></div>                         <!-- variable CSS -->
```

([Animation](https://tailwindcss.com/docs/animation),
[starting / motion-safe / open](https://tailwindcss.com/docs/hover-focus-and-other-states)).
Utilitaires livrés : seulement `animate-spin|ping|pulse|bounce|none`.
B, C, D : rien en cœur (stagger, `animation-timeline`, `view-transition-name`
passent par valeurs arbitraires `[…]`).

**(2) Modèle mental** : une animation = un token `--animate-*` + keyframes ;
transitions d'état = utilitaires `transition` + variants ; `starting:` =
`@starting-style` pour l'entrée depuis `display:none` / l'insertion.

**(3) Forces** : zéro dépendance, variants universels, `motion-safe` /
`motion-reduce` standard.

**(4) Critiques** : catalogue minimal (aucun `fade-in` en cœur, d'où la
prolifération de plugins : [tailwind-animations (midudev)](https://github.com/midudev/tailwind-animations),
tw-animate, tailwindcss-motion) ; la migration v3 → v4 casse les agents (§16) ;
`@starting-style` a des subtilités de spécificité/ordre selon Matt Perry
([article](https://motion.dev/magazine/do-you-still-need-framer-motion)).

**(5) Îles / HTML pur** : parfait (CSS). **(6) Tailwind** : par définition.

---

## 8. Svelte (`transition:`, `in:/out:`, `animate:flip`)

**(1) Forme**

```svelte
<script>
  import { fade, fly, crossfade } from "svelte/transition"
  import { flip } from "svelte/animate"
  const [send, receive] = crossfade({ duration: 300 })
</script>

{#if open}<div transition:fly={{ y: 16, duration: 300 }}>…</div>{/if}       <!-- A -->
{#if open}<div in:fly={{ y: 16 }} out:fade>…</div>{/if}
{#each items as item, i (item.id)}                                            <!-- B + réordonnancement -->
  <li in:fade={{ delay: i * 50 }} animate:flip={{ duration: 200 }}>{item.name}</li>
{/each}
<!-- D : élément partagé -->
<div in:receive={{ key: id }} out:send={{ key: id }}></div>
<div transition:fade|global>…</div>                                           <!-- portée globale -->
```

**(2) Modèle mental** : directive sur l'élément d'un bloc `{#if}`/`{#each}` ;
la transition est une **fonction** qui renvoie `{ css(t, u) }` ou
`{ tick }` ; Svelte génère des keyframes CSS à la volée. `animate:` ne
concerne que le **réordonnancement** d'un each à clé.

**(3) Forces** : syntaxe très compacte, sortie gérée nativement (pas de
wrapper type `AnimatePresence`) ; `crossfade` fournit un élément partagé.

**(4) Critiques**

- Contraintes `animate:` : uniquement enfant immédiat d'un each **à clé**, et
  « Animations do not run when an element is added or removed »
  ([docs animate](https://svelte.dev/docs/svelte/animate)).
- Portée locale vs globale : débat de longue date ; défaut passé à `local` en
  Svelte 4 car les transitions gênaient la navigation
  ([PR #8632](https://github.com/sveltejs/svelte/pull/8632), [#6812](https://github.com/sveltejs/svelte/issues/6812)) ;
  régression de transition de page signalée en Svelte 5
  ([#11615](https://github.com/sveltejs/svelte/issues/11615)) ; demande
  d'avertissements quand un composant n'est pas détruit à cause d'une
  transition.
- **CSP** : styles inline / `<style>` injecté → `style-src 'unsafe-inline'`
  ou hash requis ([#6662](https://github.com/sveltejs/svelte/issues/6662),
  [#4801](https://github.com/sveltejs/svelte/issues/4801)).
- Pas de stagger natif (délai calculé à la main), pas de scroll ni de layout
  hors `flip`.

**(5) Îles / HTML pur** : fonctionne dans une île Svelte ; `crossfade` est une
paire `send/receive` créée en JS et partagée par import — pas entre une île
Svelte et une île React. **(6) Tailwind** : paramètres en objets JS ; les
variants n'ont pas de prise ; seules les classes d'état statiques restent
possibles.

---

## 9. Vue `<Transition>` / `<TransitionGroup>`

**(1) Forme**

```vue
<Transition name="fade-up">                    <!-- A -->
  <div v-if="open">…</div>
</Transition>
<style>
.fade-up-enter-active, .fade-up-leave-active { transition: all .3s ease }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(16px) }
</style>

<!-- Avec classes Tailwind -->
<Transition enter-active-class="transition duration-300" enter-from-class="opacity-0 translate-y-4"
            leave-active-class="transition duration-200" leave-to-class="opacity-0">
  <div v-if="open" />
</Transition>

<!-- B : stagger via hooks JS + data-index (pattern de la doc) -->
<TransitionGroup tag="ul" :css="false" @enter="onEnter">
  <li v-for="(item, i) in items" :key="item.id" :data-index="i" />
</TransitionGroup>
```

([Transition](https://vuejs.org/guide/built-ins/transition),
[TransitionGroup](https://vuejs.org/guide/built-ins/transition-group)).

**(2) Modèle mental** : six classes d'état
(`*-enter-from/active/to`, `*-leave-from/active/to`) posées/retirées par
Vue ; fin détectée par `transitionend`/`animationend` ; hooks JS
(`@enter(el, done)`) pour les moteurs tiers. `TransitionGroup` ajoute
`*-move` (FLIP du réordonnancement).

**(3) Forces** : l'état reste en CSS ; props `*-class` → **compatible
Tailwind** (pattern popularisé par Tailwind UI / Headless UI) ; sortie native.

**(4) Critiques** : un seul élément racine dans le slot (et un seul root pour un
composant enfant) ([doc](https://vuejs.org/guide/built-ins/transition)) ;
renommage Vue 2 → 3 (`v-enter` → `v-enter-from`) qui a perturbé la migration
([doc v2](https://vuejs.org/v2/guide/transitions.html)) ; stagger possible
uniquement via hooks JS ; pas d'élément partagé intégré. Pas de critique
communautaire forte trouvée sur la syntaxe elle-même.

**(5) Îles** : interne à l'île Vue. **(6) Tailwind** : oui via `*-class`
(les variants comme `md:` fonctionnent dans ces chaînes puisque ce sont des
classes).

---

## 10. Angular `animate.enter` / `animate.leave` (v20.2+)

**(1) Forme**

```html
@if (open()) {
  <div animate.enter="fade-up" animate.leave="fade-out">…</div>
}
<div [animate.enter]="enterClass()"></div>
<div (animate.leave)="onLeave($event)"></div>   <!-- $event.animationComplete() -->
```

```css
.fade-up { animation: fade-up .3s ease-out }
.fade-out { animation: fade-out .2s ease-in forwards }
```

**(2) Modèle mental** : Angular **pose des classes** à l'insertion / avant la
suppression, attend la fin de la plus longue animation/transition, puis retire
les classes (enter) ou l'élément (leave). Forme événement pour déléguer à un
moteur JS (GSAP, anime) avec `animationComplete()` ; délai de garde 4 s
(`MAX_ANIMATION_TIMEOUT`) ([guide Animations](https://angular.dev/guide/animations)).

**(3) Forces** : remplace le DSL `@angular/animations` (déprécié en 20.2,
retrait visé v23) ; gain de bundle ; même philosophie que Vue
([migration](https://angular.dev/guide/animations/migration) ;
[Ninja Squad 20.2](https://blog.ninja-squad.com/2025/08/20/what-is-new-angular-20.2)).

**(4) Critiques / limites documentées** : `animate.leave` dans le template d'un
composant enfant ne s'exécute pas avant la suppression du parent (à poser sur
l'hôte dans le template parent) ; transitions d'entrée exigent
`@starting-style` ; pas de mélange avec l'ancien système dans un même
composant ; TestBed désactive les animations par défaut
([guide](https://angular.dev/guide/animations)). Pas de stagger, scroll ou
layout intégrés. Réception : API jeune, peu de retours communautaires trouvés.

**(5) Îles** : interne à l'île Angular. **(6) Tailwind** : la valeur est une
**chaîne de classes** → des utilitaires Tailwind (et leurs variants) peuvent y
figurer.

---

## 11. AOS (Animate On Scroll)

**(1) Forme**

```html
<div data-aos="fade-up" data-aos-duration="600" data-aos-delay="100"
     data-aos-offset="120" data-aos-easing="ease-out" data-aos-once="true"
     data-aos-anchor-placement="top-bottom"></div>
<script>AOS.init({ once: true })</script>
```

Noms : `fade[-up|-down|-left|-right|-up-right…]`, `flip-*`, `slide-*`,
`zoom-in[-*]`, `zoom-out[-*]` ([README](https://github.com/michalsnik/aos)).

**(2) Modèle mental** : un nom d'effet + attributs de réglage ; une
bibliothèque observe le scroll et ajoute `aos-animate` ; le CSS fait le reste.

**(3) Forces** : le vocabulaire « data-attribute » le plus diffusé (~28 k
étoiles ; ~174 000 téléchargements/semaine selon
[cet article](https://dev.to/mhassansiddiqui/aos-hasnt-had-a-release-since-2018-so-i-built-a-modern-replacement-2ph8)) ;
lisible en HTML pur.

**(4) Critiques** : dernière version stable 2.3.4 du **2018-10-03** (npm), 3.0
resté en bêta ; ~345 issues ouvertes ([GitHub](https://github.com/michalsnik/aos)) ;
alternatives qui gardent ses noms (`reveal-on-scroll`, `data-ros`) ou ciblent la
performance sur pages longues ([Trig.js](https://dev.to/idevgames/the-best-aos-animate-on-scroll-alternative-for-fast-and-smooth-scroll-animations-1haj)).
Uniquement « à la vue » (pas d'état, pas de sortie, pas de layout).

**(5) Îles / HTML pur** : HTML pur oui ; avec un routeur client, nécessité de
`AOS.refresh()` (option `disableMutationObserver`) **[non vérifié en
pratique]**. **(6) Tailwind** : aucune ; les attributs ne peuvent pas être
conditionnés par un variant (`md:` ne s'applique pas à un attribut).

---

## 12. View Transitions dans Astro

**(1) Forme**

```astro
---
import { ClientRouter, fade } from "astro:transitions"
---
<head><ClientRouter /></head>
<img transition:name="hero" />                         <!-- D (élément partagé entre pages) -->
<main transition:animate="slide" />                     <!-- fade (défaut) | initial | slide | none -->
<header transition:animate={fade({ duration: "0.4s" })} />
<video transition:persist />                            <!-- conserver un élément/île -->
```

([View transitions](https://docs.astro.build/en/guides/view-transitions/)).
`<ViewTransitions />` a été renommé `<ClientRouter />` puis **supprimé** en
Astro 6 ([upgrade v6](https://docs.astro.build/en/guides/upgrade-to/v6/)).

**(2) Modèle mental** : directives de compilation qui posent
`view-transition-name` et des animations `old`/`new` ; le ClientRouter
intercepte la navigation (SPA) ou on s'appuie sur la navigation
cross-document native (`@view-transition { navigation: auto }`).

**(3) Forces** : élément partagé **entre pages** sans framework ; fallback
réglable (`animate|swap|none`) ; reduced-motion désactive les animations.

**(4) Critiques** : les scripts ne se ré-exécutent pas → réinitialisation via
`astro:page-load` / `astro:after-swap`, écouteurs redondants, analytics à
re-déclencher ; un auteur a retiré ClientRouter au profit du natif
([joost.blog](https://joost.blog/replacing-astro-clientrouter/)) ; les îles sont
recréées à chaque navigation sauf `transition:persist`
([guide communautaire](https://cdn.jsdelivr.net/npm/@nickbevers/claude-rules@1.4.2/skills/astro-view-transitions/SKILL.md)) ;
« full-page-load semantics can't be faithfully simulated in SPA navigation »
([jotter](https://events-3bg.pages.dev/jotter/astro/scripts)).

**(5) Îles / HTML pur** : conçu pour Astro ; c'est le seul mécanisme de la
liste qui coordonne explicitement **entre îles et entre pages**, via le DOM.
**(6) Tailwind** : `transition:name` est une directive, pas une classe ; côté
Tailwind seul, `[view-transition-name:hero]` en arbitraire.

---

## 13. Autres syntaxes déclaratives rencontrées

| Syntaxe | Forme | Notes / réception |
|---|---|---|
| **Alpine `x-transition`** | `x-transition.opacity.scale.80.duration.300ms` ou `x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 scale-90" x-transition:enter-end="…" x-transition:leave…` | Modèle « classes d'état » (comme Vue) **avec des classes Tailwind** ; popularisé par Tailwind UI ([doc](https://alpinejs.dev/directives/transition)). HTML pur. |
| **AutoAnimate** (`@formkit/auto-animate`) | `const [parent] = useAutoAnimate()` / `autoAnimate(el)` | « une ligne » : ajout/suppression/déplacement des enfants (FLIP) ; ~13 k étoiles, 0.9.0 (2025-09) ([ossinsight](https://ossinsight.io/analyze/formkit/auto-animate)) ; peu configurable. |
| **sal.js** | `data-sal="slide-up" data-sal-delay="300" data-sal-easing="ease-out-back"` | Variante légère d'AOS ; variables `--sal-*` en plus des attributs ([GitHub](https://github.com/mciastek/sal)). |
| **TorusKit** | `data-tor="animate:[[translateX(2rem)], [scale(1.5)] <1s, infinite, alternate>]"` | Mini-langage dans un attribut ([Show HN 44115133](https://news.ycombinator.com/item?id=44115133)) ; peu de réception. |
| **reveal-on-scroll** | `data-ros="fade-up"` | Reprend les noms AOS ; mode scroll-scrubbed natif ([article](https://dev.to/mhassansiddiqui/aos-hasnt-had-a-release-since-2018-so-i-built-a-modern-replacement-2ph8)). |
| **tailwind-animations (midudev)** | `animate-fade-in`, `animate-slide-in-bottom`, `animate-delay-300`, `view-animate-[--x] animate-range-[entry_10%_contain_25%]` | Plugin v4 ~1,5 k étoiles ; **seul** des plugins Tailwind relevés à exposer `animation-timeline`/`animation-range` ([GitHub](https://github.com/midudev/tailwind-animations)). |
| **Motion `data-layout` / `data-layout-id`** | cf. §1.2 | Attributs de layout/élément partagé côté vanilla (motion ≥ 14.1). |
| **Animate.css** (historique) | `animate__animated animate__fadeInUp` | Source historique des noms `fadeInUp`, `zoomIn`… ; cité comme « handy » ([HN 36442495](https://news.ycombinator.com/item?id=36442495)). |

---

## 14. Synthèse comparative

| Syntaxe | Entrée | Sortie | Stagger | Scroll (vue / lié) | Layout / partagé | Sans contexte de framework | Variants Tailwind |
|---|---|---|---|---|---|---|---|
| Motion React | ✅ | ✅ (`AnimatePresence`) | ✅ | ✅ / ✅ | ✅ / ✅ | ❌ (contexte React) | ❌ |
| Motion vanilla | ✅ | ⚠️ (pas d'AnimatePresence) | ✅ | ✅ / ✅ | ✅ / ✅ (`data-layout-id`) | ✅ | ❌ |
| Motion Vue | ✅ | ✅ | ✅ | ✅ / ✅ | ✅ / ✅ | ❌ | ❌ |
| GSAP | ✅ | ⚠️ (manuel) | ✅ | ✅ / ✅ | ✅ (Flip) | ✅ | ❌ |
| anime.js v4 | ✅ | ⚠️ (Layout `leaveTo`) | ✅ | ✅ / ✅ | ✅ (Layout) | ✅ | ❌ |
| tw-animate-css | ✅ | ⚠️ (dépend du composant) | ❌ | ❌ | ❌ | ✅ | ✅ |
| tailwindcss-motion | ✅ | ⚠️ | ❌ (délais) | ⚠️ (plugin + JS) / ❌ | ❌ | ✅ | ✅ |
| Tailwind v4 natif | ✅ (`starting:`) | ⚠️ (`allow-discrete`) | ❌ | ❌ (arbitraire) | ❌ | ✅ | ✅ |
| Svelte | ✅ | ✅ | ⚠️ (délai calculé) | ❌ | ⚠️ (`flip`, `crossfade`) | ❌ (île) | ❌ |
| Vue `<Transition>` | ✅ | ✅ | ⚠️ (hooks JS) | ❌ | ⚠️ (`*-move`) | ❌ (île) | ✅ via `*-class` |
| Angular `animate.*` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ (île) | ✅ (chaîne de classes) |
| AOS / sal | ✅ (à la vue) | ❌ | ⚠️ (délais) | ✅ / ❌ | ❌ | ✅ | ❌ (attributs) |
| Astro VT | ✅ (page) | ✅ (page) | ❌ | ❌ | ✅ (entre pages) | ✅ | ❌ (directive) |

Implications neutres pour C4/C5/C6 :

- Les seules syntaxes nativement conditionnables par variants Tailwind sont
  celles **à base de classes** (tw-animate, tailwindcss-motion, Tailwind natif,
  Vue/Alpine/Angular via chaînes de classes). Aucune ne couvre stagger, scroll
  lié et layout à la fois.
- Les seules syntaxes à **coordination par le DOM** pour le layout / l'élément
  partagé sont Motion vanilla (`data-layout-id`) et Astro (`transition:name`) ;
  les autres passent par le JS ou un contexte de framework.
- Les syntaxes à base d'**attributs** (AOS, sal, TorusKit, `data-layout`) sont
  lisibles en HTML pur mais échappent aux variants Tailwind.

---

## 15. (Section réservée) — aucune recommandation

Conformément au §6 de la spec, ce rapport ne propose pas de vocabulaire. Les
éléments ci-dessus et ci-dessous alimentent B1.

---

## 16. Agents IA : vocabulaires connus et erreurs typiques

### 16.1 Ressources « pour agents » publiées par les projets (vérifié le 2026-11-03)

| Projet | `llms.txt` | Kit / skill officiel | Remarques |
|---|---|---|---|
| Motion | ✅ [`/llms.txt`](https://motion.dev/llms.txt) + [`/llms-full.txt`](https://motion.dev/llms-full.txt) (~830 ko) ; chaque page en `.md` | ✅ [Motion AI Kit](https://github.com/motiondivision/ai-kit) (MIT, `npx motion-ai`, MCP hébergé gratuit ; audits « MotionScore » payants) | Règle Cursor du kit : « **Never import from `framer-motion`** » ; skill React : condition *dans* `AnimatePresence`, `key` stable, `layoutId` unique par instance, `useTransform(value, fn)` listé comme déprécié. La doc parle d'agents qui « fight » pour importer depuis `framer-motion` à cause de données d'entraînement périmées ([AI Kit](https://motion.dev/docs/ai-kit)). |
| GSAP | ✅ [`/llms.txt`](https://gsap.com/llms.txt) (docs en `.md`) | ✅ [greensock/gsap-skills](https://github.com/greensock/gsap-skills) (~17,8 k étoiles) | Insiste sur `registerPlugin`, `useGSAP` + `scope` + cleanup, `ScrollTrigger.refresh()` ; boutons « Use with AI » sur les démos. |
| anime.js | ❌ (`/llms.txt` renvoie la page HTML d'accueil) | ❌ officiel ; skills tiers | Skills tiers : « Never use v3 syntax » + table v3→v4 ([exemple](https://skills.cat/skills/almeidamarcell/claude-code-skills/animejs)). |
| Tailwind CSS | ❌ (404) | ❌ public (un AGENTS.md réservé aux sponsors) | PR [#2388 « add llms.txt »](https://github.com/tailwindlabs/tailwindcss.com/pull/2388) fermée le 2026-01-06 ; Adam Wathan : rendre la doc lisible par LLM réduit le trafic (−40 % depuis 2023) dont dépend le modèle économique, et « 75% of the people on our engineering team lost their jobs » ([commentaire](https://github.com/tailwindlabs/tailwindcss.com/pull/2388#issuecomment-3717222957)). |
| shadcn/ui | ✅ [`/llms.txt`](https://ui.shadcn.com/llms.txt) | — | Diffuse massivement le vocabulaire tw-animate (`data-[state=open]:animate-in …`). |
| Svelte | ✅ [`/llms.txt`](https://svelte.dev/llms.txt) (+ `llms-small.txt`) | — | |
| Angular | ✅ [`/llms.txt`](https://angular.dev/llms.txt) | — | |
| Vue | ✅ [`/llms.txt`](https://vuejs.org/llms.txt) | — | |
| Astro | ❌ (`docs.astro.build/llms.txt` 404 au moment du test) | — | |
| Rombo (tailwindcss-motion) | ❌ (404) | MCP DocSearch Algolia référencé ([lien](https://docsearch.algolia.com/mcp/docs/repo/rombohq/tailwindcss-motion)) | |

### 16.2 Vocabulaires que les LLM « connaissent » le mieux

Pas de mesure quantitative publique trouvée (pas de benchmark « animation »).
Indicateurs indirects, à pondérer :

- **Motion / Framer Motion** : le plus de matériel d'entraînement côté React
  (projet depuis 2019, intégré à d'innombrables tutoriels) ; l'existence même
  d'une règle « never import from framer-motion » atteste que l'ancien nom
  domine dans les modèles.
- **Vocabulaire tailwindcss-animate / tw-animate** (`animate-in fade-in
  slide-in-from-top-2 zoom-in-95 data-[state=open]:…`) : omniprésent via
  shadcn/ui, recopié dans des milliers de projets ; noms identiques entre les
  deux paquets, donc bien connus — mais le paquet à installer diffère selon la
  version de Tailwind.
- **AOS** (`data-aos="fade-up"`) et **Animate.css** (`fadeInUp`) : noms
  anciens, très répandus dans les templates HTML/WordPress.
- **GSAP** : très présent (forums depuis 2008, tutoriels Flash→JS) ; API v3
  stable depuis 2019, donc moins de dérive temporelle.
- **Svelte / Vue / Angular** : les directives Svelte et `<Transition>` Vue sont
  stables depuis plusieurs versions ; Angular `animate.enter` (août 2025) est
  récent, l'ancien DSL `trigger()/state()/transition()` domine probablement les
  données d'entraînement **[déduction]**.
- **tailwindcss-motion** : peu de volume (~20 k téléchargements/semaine
  d'après npm cité par un agrégateur) ; vocabulaire `motion-*` moins ancré.

### 16.3 Erreurs typiques (avec preuves quand elles existent)

| Erreur | Exemple | Preuve / source |
|---|---|---|
| **Ancien paquet Motion** | `import { motion } from "framer-motion"` | Règle officielle du Motion AI Kit ; [AI Kit](https://motion.dev/docs/ai-kit) ; guide de migration ([upgrade](https://motion.dev/docs/react-upgrade-guide)). |
| **Props Motion obsolètes** | `<AnimatePresence exitBeforeEnter>` (→ `mode="wait"`, lève une erreur depuis v10), `<AnimateSharedLayout>` (inutile depuis v5, `layoutId` suffit), `motion.custom()` (retiré en v4 → `motion.create()`), `useTransform(v, fn)` (déprécié) | [Upgrade guide](https://motion.dev/docs/react-upgrade-guide) (sections 10.0, 5.0, 4.0) ; skill react du kit. Fréquence chez les agents **non mesurée**. |
| **Mauvais placement d'`AnimatePresence`** | condition à l'extérieur, `key` = index | Doc « Exit animations aren't working » ; issue #493. |
| **Syntaxe anime.js v3** | `anime({ targets: ".el", easing: "easeOutQuad" })`, `anime.timeline()`, `.finished.then()` | Skills tiers qui l'interdisent explicitement ([skills.cat](https://skills.cat/skills/almeidamarcell/claude-code-skills/animejs)) ; rupture v4 documentée. |
| **Config Tailwind v3 dans un projet v4** | créer `tailwind.config.js`, `npx tailwindcss init -p`, `bg-opacity-*`, `@tailwind base` | [B. Looi, 2025-10-10](https://portfolio-2026-ten-lac.vercel.app/blog/tailwindcss-v4-breaks-coding-ai-agents) ; [thepromptshelf](https://thepromptshelf.dev/blog/tailwind-css-v4-claude-md-ai-coding-agents-2026) ; [ofershap/tailwind-best-practices](https://cdn.jsdelivr.net/gh/ofershap/tailwind-best-practices@main/README.md) ; échec **silencieux** possible. |
| **Confusion tw-animate-css / tailwindcss-animate** | `@plugin "tailwindcss-animate"` ou `require("tailwindcss-animate")` en v4 ; `@plugin "tw-animate-css"` au lieu de `@import` | Migration shadcn ([v4](https://v2.shadcn.com/docs/tailwind-v4)) ; skills tiers « tailwind v4 + shadcn » qui listent l'erreur ([exemple](https://skillsdirectory.com/skills/jezweb-tailwind-v4-shadcn)). Mêmes noms de classes → la classe « a l'air juste » mais ne génère rien si le mauvais paquet est chargé. |
| **Classes inventées / d'un autre plugin** | `animate-fade-in`, `animate-slide-up`, `animate-fade-in-up` dans un projet sans le plugin correspondant | `animate-fade-in` n'existe pas en cœur Tailwind (seuls spin/ping/pulse/bounce) ; il provient de plugins tiers comme [tailwind-animations](https://github.com/midudev/tailwind-animations). Résultat : classe sans effet, sans erreur. |
| **Mélange de vocabulaires** | `fade-in-up` (Animate.css/AOS) + `slide-in-from-bottom` (tw-animate) + `motion-preset-*` | Déduction à partir des recouvrements du §17 **[non vérifié empiriquement]**. |
| **GSAP : plugin non enregistré, pas de cleanup** | ScrollTrigger sans `registerPlugin`, `useEffect` sans `useGSAP`/`context` | Thèmes centraux de [gsap-skills](https://github.com/greensock/gsap-skills) et [Common mistakes](https://gsap.com/resources/mistakes). |
| **CSS `transition` + moteur JS sur la même propriété** | classe `transition-all` + tween JS | Listé par GSAP ; rappel analogue chez Motion. |
| **Angular ancien DSL** | `trigger('fade', [transition(':enter', …)])` + `provideAnimations()` | Déprécié en 20.2 ([migration](https://angular.dev/guide/animations/migration)) ; fréquence chez les agents **non mesurée**. |
| **Astro : composant supprimé** | `<ViewTransitions />` | Supprimé en Astro 6 ([upgrade v6](https://docs.astro.build/en/guides/upgrade-to/v6/)). |

Contexte général (hors animation) :

- Les LLM complètent fréquemment avec des **API dépréciées** quand la
  bibliothèque a évolué ; étude sur 7 LLM et 145 correspondances d'API
  ([Wang et al., arXiv:2406.09834](https://arxiv.org/abs/2406.09834)).
- Les LLM **hallucinent des noms de paquets** (≈ 19,7 % des échantillons d'après
  une note CSA résumant l'étude) ([Spracklen et al., arXiv:2406.10279](https://arxiv.org/abs/2406.10279) ;
  [CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-slopsquatting-ai-supply-chain-20260419/)) —
  pertinent pour la confusion de paquets ci-dessus.

Implications neutres pour C5 :

- Les échecs les plus coûteux observés sont **silencieux** (classe inconnue,
  mauvais paquet chargé, config v3 ignorée), ce que l'anti-objectif §2 de la
  spec vise déjà.
- Les éditeurs qui ont investi (Motion, GSAP) ont convergé vers trois leviers :
  `llms.txt`/Markdown, skill avec règles « never/always », serveur MCP de
  recherche de doc. `packages/mcp` existe déjà dans le dépôt (F23).
- Un vocabulaire **identique** à un vocabulaire répandu bénéficie des
  connaissances existantes mais hérite de ses ambiguïtés (ex. même nom de
  classe, deux paquets, deux comportements).

---

## 17. Noms et concepts convergents

| Concept | Motion | GSAP | anime.js v4 | tw-animate / tailwindcss-animate | tailwindcss-motion | Tailwind natif | Svelte | Vue | Angular | AOS / sal | Astro / natif |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Fondu à l'entrée | `initial={{opacity:0}} animate={{opacity:1}}` | `from({opacity:0})` / `autoAlpha` | `opacity:[0,1]` | `animate-in fade-in[-{n}]` | `motion-opacity-in-0`, `motion-preset-fade` | (aucun ; `@theme --animate-*`) | `in:fade` | `*-enter-from{opacity:0}` | `animate.enter="…"` (classe libre) | `fade` / `data-sal="fade"` | `transition:animate="fade"` |
| Glissement directionnel | `y: 16 → 0` | `y`, `yPercent` | `y` / `translateY` | `slide-in-from-{top\|bottom\|left\|right\|start\|end}[-n]`, `slide-out-to-*` | `motion-translate-y-in-100`, `motion-preset-slide-up` | — | `in:fly={{ y }}` | classes libres | classes libres | `fade-up`, `slide-up` (AOS : *direction de mouvement* ; tw-animate : *origine*) | `slide` |
| Zoom | `scale` | `scale` | `scale` | `zoom-in[-95]`, `zoom-out` | `motion-scale-in-*` | — | `in:scale` | — | — | `zoom-in`, `zoom-out` | — |
| Rotation | `rotate` | `rotation` | `rotate` | `spin-in[-n]` | `motion-rotate-in-*` | `animate-spin` (boucle) | — | — | — | `flip-*` (3D) | — |
| Entrée / sortie (présence) | `initial` / `animate` / `exit` + `AnimatePresence` | — (manuel) | Layout `enterFrom` / `leaveTo` | `animate-in` / `animate-out` | `-in-` / `-out-` | `starting:` | `in:` / `out:` / `transition:` | `enter-*` / `leave-*` | `animate.enter` / `animate.leave` | — | `old` / `new`, `forwards` / `backwards` |
| Décalage (stagger) | `stagger(0.1)` dans `delay` / `delayChildren` (ex-`staggerChildren`) | `stagger: 0.1` (ou objet `{each, from}`) | `stagger(80)` | — (`delay-*`) | — (`motion-delay-*`) | — | `delay: i * n` | hooks JS + `data-index` | — | `data-aos-delay` | `sibling-index()` (CSS, Chromium) |
| Durée | `duration` (s) | `duration` (s) | `duration` (ms) | `duration-{ms}` | `motion-duration-{ms}[/prop]` | `duration-*` (transition) | `duration` (ms) | CSS | CSS | `data-aos-duration` (ms) | `duration` |
| Easing | `ease: "easeOut"`, `type: "spring"` | `ease: "power2.out"` | `ease: "outQuad"`, `spring()` | `ease-*` | `motion-ease-*` / `motion-timing-*` | `ease-*` | `easing: cubicOut` | CSS | CSS | `data-aos-easing` | `easing` |
| Une seule fois à la vue | `viewport={{ once: true }}` | `toggleActions` / `once: true` | `onScroll` (sync modes) | — | `intersect-once` | — | — | — | — | `data-aos-once` | — |
| Seuil de vue | `amount`, `margin` | `start: "top 80%"` | `enter: "bottom top"` | — | — | — | — | — | — | `offset`, `anchor-placement` | `animation-range: entry 10% …` |
| Lié au scroll | `scroll()` / `useScroll` | `scrub` | `sync: true` | — | — | — | — | — | — | — | `animation-timeline: view()/scroll()` |
| Layout auto | `layout` / `data-layout` | `Flip.getState` / `Flip.from` | `createLayout` · `record` / `animate` | — | — | — | `animate:flip` | `*-move` | — | — | `startViewTransition` |
| Élément partagé | `layoutId` / `data-layout-id` | Flip (`data-flip-id`) **[non vérifié]** | Layout (id) | — | — | — | `crossfade` → `send` / `receive` | — | — | — | `transition:name` / `view-transition-name` |
| Groupe / portée | `LayoutGroup`, `MotionConfig` | `gsap.context`, `useGSAP({scope})` | `createScope` | — | — | — | `\|local` / `\|global` | — | — | — | `transition:persist` |
| Réduction de mouvement | `MotionConfig reducedMotion`, `useReducedMotion` | `matchMedia("(prefers-reduced-motion)")` | `Scope` media queries | `motion-safe:` / `motion-reduce:` | auto (translate/scale coupés) | `motion-safe:` / `motion-reduce:` | manuel | manuel | manuel | `disable` | auto (Astro) |

Divergences de nommage notables (faits) :

- **Direction** : `slide-in-from-top` (tw-animate, *origine*) vs `fade-down` /
  `slide-down` (AOS, *sens du mouvement*) vs `slide-up` (sal, Rombo presets) :
  un même mot (« down ») désigne des mouvements opposés selon la lib.
- **Unités** : secondes (Motion, GSAP) vs millisecondes (anime.js, Svelte,
  classes Tailwind, AOS).
- **Easing** : `easeOut` (Motion), `power2.out` (GSAP), `outQuad` (anime v4 ;
  `easeOutQuad` en v3), `ease-out` (CSS/Tailwind).
- **Rotation** : `rotate` partout sauf GSAP (`rotation`) et tw-animate (`spin-*`).
- **Entrée/sortie** : `in/out` (tw-animate, Svelte, Rombo), `enter/leave` (Vue,
  Angular, Alpine, anime Layout), `initial/animate/exit` (Motion),
  `old/new` (View Transitions).
- **Paire « mot + quantité »** : `fade-in-50`, `zoom-in-95`,
  `slide-in-from-top-2` (tw-animate) vs `motion-opacity-in-0`,
  `motion-translate-y-in-100` (Rombo) — la valeur désigne l'état de départ
  dans les deux cas, avec des unités/échelles différentes.

---

## 18. Sources principales

Motion : <https://motion.dev/llms.txt> · <https://motion.dev/llms-full.txt> ·
<https://motion.dev/docs/ai-kit> · <https://github.com/motiondivision/ai-kit> ·
<https://motion.dev/docs/react-upgrade-guide> · <https://motion.dev/docs/react-animate-presence> ·
<https://motion.dev/docs/stagger> · <https://motion.dev/docs/inview> ·
<https://motion.dev/docs/layout-animations> · <https://motion.dev/docs/animate-view> ·
<https://motion.dev/docs/vue> · <https://motion.dev/magazine/do-you-still-need-framer-motion> ·
<https://motion.dev/magazine/framer-motion-is-now-independent-introducing-motion> ·
<https://www.framer.com/motion/guide-reduce-bundle-size/> ·
issues motiondivision/motion #254, #493, #790, #861, #1580, #2006, #2148, #2533, #2692, #2838.

GSAP : <https://gsap.com/llms.txt> · <https://gsap.com/resources/mistakes> ·
<https://gsap.com/resources/st-mistakes> · <https://github.com/greensock/gsap-skills> ·
<https://webflow.com/updates/gsap-becomes-free> · HN <https://news.ycombinator.com/item?id=43868273> ·
<https://forum.pinegrow.com/t/gsap-has-been-acquired-by-webflow/9906>.

anime.js : <https://animejs.com/documentation/events/onscroll> ·
<https://animejs.com/documentation/layout/usage/enter-layout-animation> ·
<https://newreleases.io/project/npm/animejs/release/4.0.0> ·
<https://newreleases.io/project/npm/animejs/release/4.2.0> ·
HN <https://news.ycombinator.com/item?id=36442274>.

Tailwind & plugins : <https://tailwindcss.com/docs/animation> ·
<https://tailwindcss.com/docs/hover-focus-and-other-states> ·
<https://github.com/Wombosvideo/tw-animate-css> (+ issues #44, #48, #49, #50, #58, #59, #61, #79) ·
<https://github.com/jamiebuilds/tailwindcss-animate> ·
<https://github.com/romboHQ/tailwindcss-motion> (+ issues #35, #37, #40, #42, #47, #51, #63, #72) ·
<https://docs.rombo.co/tailwind> · <https://news.ycombinator.com/item?id=41744832> ·
<https://github.com/midudev/tailwind-animations> · <https://v2.shadcn.com/docs/tailwind-v4> ·
<https://github.com/tailwindlabs/tailwindcss.com/pull/2388>.

Frameworks : <https://svelte.dev/docs/svelte/animate> · sveltejs/svelte #4801, #6662, #6812, #8632, #11615 ·
<https://vuejs.org/guide/built-ins/transition> · <https://angular.dev/guide/animations> ·
<https://angular.dev/guide/animations/migration> ·
<https://blog.ninja-squad.com/2025/08/20/what-is-new-angular-20.2> ·
<https://docs.astro.build/en/guides/view-transitions/> ·
<https://docs.astro.build/en/guides/upgrade-to/v6/> · <https://joost.blog/replacing-astro-clientrouter/> ·
<https://alpinejs.dev/directives/transition>.

Attributs data-* : <https://github.com/michalsnik/aos> ·
<https://dev.to/mhassansiddiqui/aos-hasnt-had-a-release-since-2018-so-i-built-a-modern-replacement-2ph8> ·
<https://github.com/mciastek/sal> · <https://news.ycombinator.com/item?id=44115133>.

Agents IA : <https://arxiv.org/abs/2406.09834> · <https://arxiv.org/abs/2406.10279> ·
<https://portfolio-2026-ten-lac.vercel.app/blog/tailwindcss-v4-breaks-coding-ai-agents> ·
<https://skills.cat/skills/almeidamarcell/claude-code-skills/animejs>.
