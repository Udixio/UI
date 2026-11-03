# E3 — Documentation actuelle et utilitaires `anim-*` (inventaire)

Date : 2026-11-03 · Branche : `feat/anime` · Travail : E3 (phase 0, 📚) de
`docs/superpowers/specs/2026-11-03-udixio-motion-design.md` · Entrée de : M4 et
phase 5 (section Motion qui remplace `/animations`, C9).

Légende du sort de chaque élément : **disparaît**, **migre** (le contenu ou le
rôle passe à `@udixio/motion` ou à la section Motion), **redirige** (URL publique),
**régénéré** (artefact produit par un script).

---

## 1. Vue d'ensemble

`anim-*` repose sur trois pièces :

1. **Plugin Tailwind** `packages/tailwind/src/plugins-tailwind/animation.ts` : il génère
   les keyframes, les utilitaires et les variables `--anim-*`.
2. **Runtime JS** `packages/ui-react/src/lib/effects/AnimateOnScroll.ts` (avec
   `scrollDriven.ts`, chargé en import dynamique) : un IntersectionObserver
   passe les animations en `running`, et un fallback scroll-driven prend le
   relais.
3. **Doc** : une seule page, `apps/doc/src/pages/animations.astro`. Elle est
   activée par l'appel global à `initAnimateOnScroll` dans le layout et
   affichée par le composant `ClassNamePreview`.

**Aucun composant** (`core`, `ui-react`, `ui-angular`, `ui-svelte`) ni
**aucun exemple** (`apps/doc/src/examples/**`, MDX `data/**`) n'utilise de
classe `anim-*`. Seule `animations.astro` en utilise ; ailleurs, il n'y a que
des snapshots de tests et un commentaire (vérifié par `git ls-files apps packages | xargs grep`).

---

## 2. `apps/doc/src/pages/animations.astro` (324 lignes)

| Élément | Lignes | Contenu | Sort |
|---|---|---|---|
| Métadonnées | 6-9 | `title="Animations"`, description « Animate on Scroll demo — trigger-based (anim-in/anim-out) and scroll-driven (anim-view) » | **Disparaît.** La section Motion apporte ses propres métadonnées. |
| Hero | 10-26 | Démo `anim-fade anim-slide-from-top anim-duration-700`… et texte « Pick one *or* the other: `anim-in` entrances are not compatible with `anim-view` » | **Disparaît.** L'intention (entrée à l'affichage) **migre** vers la famille « Déclencheurs à la vue ». |
| « Available triggers and effects » | 30-58 | 3 déclencheurs (`in`, `out`, `scroll`) × 3 effets (`fade`, `scale`, `slide`) | **Disparaît.** Le contenu conceptuel **migre** : présence/entrée/sortie, scroll-driven, vocabulaire des effets (B1). |
| « Basic examples (JS — anim-in) » | 62-98 | 7 cartes `ClassNamePreview` | **Disparaît.** |
| « Scroll‑Driven (anim-view) » | 102-114 | `anim-slide-scroll-from-bottom-right anim-scale-scroll … anim-scroll anim-scroll-end-cover-3/4` | **Disparaît.** Le cas **migre** vers la page « Scroll-driven » (plages `view()` : entrée R3). |
| « Durations & easing » | 118-150 | `anim-duration-*`, `anim-ease-*`, `anim-delay-*` | **Migre** vers la page « Tokens » ou « Timing ». |
| « Cascading lists » | 154-186 | Cascade réalisée à la main avec `anim-delay-*` croissants | **Migre** vers « Listes / Chorégraphie » (stagger). |
| « Visual parameters » | 190-223 | `anim-scale-125`, `anim-scale-x-150`, `anim-fade-50`, `anim-slide-8`, `anim-slide-full` | **Disparaît** (paramétrage propre à `anim-*`). |
| « Combinations » | 228-272 | `Card` contenant des `div` `anim-*` | **Disparaît.** |
| « JS entrances » | 275-297 | Explique que l'IntersectionObserver d'`AnimateOnScroll` déclenche les entrées | **Disparaît.** |
| « JS exits (anim-out) » | 300-323 | `anim-fade-out anim-slide-out-from-*`, `anim-scale-out` | **Disparaît.** Le cas **migre** vers « Déclencheurs à la vue » (sortie). |

Dérives constatées, utiles à la phase 5 pour ne pas les reconduire :

- La page parle d'`anim-view` à dix reprises, mais **aucune classe `anim-view` n'est générée** par le plugin. Ce qui existe, ce sont les suffixes `*-scroll`, la valeur `anim-timeline-view` et la classe `anim-scroll`, ajoutée par le runtime. Le commentaire du plugin (`animation.ts:153`, « `{prefix}-view*` ») entretient la confusion.
- Le fallback `scrollDriven.ts:158-163` cible `.udx-view*` / `[data-udx-view]`, et non `anim-*` : c'est probablement une partie du « fallback cassé » (§9 de la spec).
- Avec `prefers-reduced-motion: reduce`, `initAnimateOnScroll` ne fait rien (`AnimateOnScroll.ts:230-232`). Les animations JS restent alors sur `animation-play-state: paused` (valeur par défaut de `--anim-in-state`, `animation.ts:114-118`) avec `fill-mode: both` : l'élément reste figé sur sa première keyframe. Ce point est à confirmer en E1 ou R4 ; il touche directement la politique reduced-motion de la nouvelle doc.
- `isJsObserverCandidate` et `isScrollDrivenCandidate` (`AnimateOnScroll.ts:33-47`) codent le préfixe `'anim-'` en dur et ignorent l'option `prefix`.

## 3. `apps/doc/src/layouts/layout.astro`

| Lignes | Contenu | Sort |
|---|---|---|
| 76-79 | `<script>import { initAnimateOnScroll as animateOnScroll } from '@udixio/ui-react'; animateOnScroll({ once: false });</script>` | **Disparaît.** Le script tourne sur **toutes** les pages de la doc : un IntersectionObserver, un listener `scroll` et un MutationObserver sont installés partout, alors que seule `/animations` contient des classes `anim-*`. Si `@udixio/motion` exige une initialisation globale (runtime des déclencheurs, fallback), **le même emplacement est le point d'insertion naturel**. C'est aussi le seul endroit où la doc importe un effet `ui-react` dans un `<script>` Astro, donc en dehors de toute île : c'est un cas test pour C6. |

## 4. `apps/doc/src/components/ClassNamePreview.tsx` (27 lignes)

- Composant React : une `Card variant="filled"` qui reçoit `className` et affiche sous son contenu la liste des classes, une par jeton.
- Utilisé **uniquement** par `animations.astro` (et sa copie MCP).
- Sort : **disparaît avec la page**, sauf si la section Motion le réutilise pour montrer des classes Tailwind de motion. Le composant est générique et indépendant de `anim-*`, donc réutilisable tel quel. Remarque : un composant React, ou n'importe quelle île, n'est pas nécessaire pour afficher des classes ; un composant `.astro` suffirait. À décider en phase 5.

## 5. Navigation et liens vers `/animations`

| Fichier:lignes | Contenu | Sort |
|---|---|---|
| `apps/doc/src/components/Navigation.tsx:11`, `:17` | imports `iAnimation`, `iAnimationFilled` (`@udixio/icons-rounded-400`) | **Migre** : icône de l'entrée Motion. On peut la garder ou la changer. |
| `apps/doc/src/components/Navigation.tsx:231-237` | `RAIL_INDEX` (sans entrée animations) + `pathname === '/animations' ? 1 : …` | **Migre** : la comparaison exacte devient un test de préfixe (section à plusieurs pages, par ex. `pathname.startsWith('/motion')`). La section aura sans doute besoin d'un flyout dans `RAIL_INDEX` / `flyouts`, comme `get-started`, `components` et `theme`, au lieu d'un lien direct sans aperçu (`onMouseEnter={endPreview}`). |
| `apps/doc/src/components/Navigation.tsx:303-311` | `<NavigationRailItem href={'/animations'} …>animations</NavigationRailItem>` (libellé en minuscules, contrairement aux autres) | **Migre** : nouvelle URL et nouveau libellé. |
| `apps/doc/src/data/pages/get-started/introduction.mdx:41` | `\| [Animations](/animations) \| Motion primitives and scroll-triggered effects \|` | **Migre** : le lien pointe vers la section Motion. La description est à réécrire. |
| Sitemap | `@astrojs/sitemap` (`astro.config.ts:13`, `:120`, `site: 'https://ui.udixio.fr/'`) inclut automatiquement `/animations/` | **Régénéré** : l'URL sort d'elle-même du sitemap quand la page disparaît. |
| Miroir markdown | `[...url].md.ts` ne couvre que la collection `pages` (`src/data/pages/**`). `animations.astro` est hors collection, donc **pas de `/animations.md`** aujourd'hui. | Rien à rediriger côté `.md`. Si la section Motion vit dans `src/data/pages/`, elle obtiendra son miroir `.md` automatiquement, ce qui sert C5 (agents IA). |

Aucune autre référence à `/animations` dans `apps/doc` (fichiers suivis), dans les README de paquets ni dans les plugins.

### URL publique `/animations` → redirection

- URL canonique actuelle : `https://ui.udixio.fr/animations/` (balise canonical de la page générée).
- **Il n'existe aujourd'hui aucun mécanisme de redirection** : `apps/doc/vercel.json` ne contient qu'un bloc `headers` (pour `/`), et `astro.config.ts` n'a pas de clé `redirects`.
- À prévoir (neutre) : une redirection permanente de `/animations` (et `/animations/`) vers la page d'accueil de la section Motion, soit par `redirects` dans `astro.config.ts`, soit par `redirects` dans `vercel.json`. La cible dépend de l'URL de la section (B1 ou phase 5). Les ancres de l'ancienne page ne correspondent à rien de stable et n'ont pas besoin d'être conservées.

## 6. Copie MCP `packages/mcp/src/bundled/doc-src`

**Génération : par script, jamais à la main.**

- `packages/mcp/package.json` → `"build": "tsx scripts/snapshot.ts && vite build && cp -r src/bundled dist/bundled"`.
- `packages/mcp/scripts/snapshot.ts`, `snapshotDocs()` : copie récursivement tous les `.md`, `.mdx` et `.astro` de `apps/doc/src` vers **`src/bundled/doc-src`** et **`dist/bundled/doc-src`**. `snapshotComponents()` indexe les exports en majuscule de `packages/ui-react/src` dans `components-index.json`.
- `/packages/mcp/src/bundled/` est **gitignoré** (`.gitignore:54`) : aucun fichier suivi (`git ls-files` → 0).
- Le serveur MCP lit cette copie (`src/lib/loaders/docs.ts:31-35`, `searchDocs`, `getDocByPath`) et l'expose aux agents sous forme de fichiers `.astro` bruts (`text/x-astro`).

Copies actuelles, identiques à la source (`diff` vide) :

| Copie | Sort |
|---|---|
| `packages/mcp/src/bundled/doc-src/pages/animations.astro` | **Régénéré**, mais **à supprimer explicitement** (voir piège ci-dessous) |
| `packages/mcp/src/bundled/doc-src/layouts/layout.astro` (contient l'appel `initAnimateOnScroll`) | **Régénéré** (écrasé) |
| `packages/mcp/dist/bundled/doc-src/pages/animations.astro` | **Régénéré** / supprimé par `clean` (`rimraf dist`) |
| `packages/mcp/src/bundled/components-index.json:161-162` (`AnimateOnScrollInit` → `lib/effects/AnimateOnScroll.ts`) | **Régénéré** : l'entrée disparaît quand l'export est retiré de `ui-react` |

**Piège : la copie ne supprime jamais rien.** `snapshotDocs` ajoute ou écrase, mais n'élague pas, et `clean` ne vide que `dist`. Preuve : `src/bundled/doc-src/pages/search.astro` existe encore alors que `apps/doc/src/pages/search.astro` a disparu. Après la suppression d'`animations.astro`, la copie `src/bundled` survivra, puis sera recopiée dans `dist/bundled` par `cp -r` et **publiée dans le paquet npm** `@udixio/mcp`. Les agents continueraient alors à trouver la doc `anim-*` par `searchDocs`. M4 doit soit purger `src/bundled/doc-src` avant le snapshot, soit corriger `snapshot.ts` pour vider la cible d'abord (modification du script hors E3).

Autres artefacts de build qui contiennent la page (non suivis, régénérés) : `apps/doc/dist/`, `apps/doc/.vercel/output/static/animations/index.html`.

## 7. Plugin `packages/tailwind/src/plugins-tailwind/animation.ts` (556 lignes)

### 7.1 Ce qu'il exporte

- `export interface AnimationPluginOptions { prefix?: string }` (l. 4-6).
- `export const animation = plugin.withOptions(({ prefix = 'anim' }) => …)` (l. 154-556).
- Les deux sont réexportés par `plugins-tailwind/index.ts:1` (`export * from './animation'`), puis par `index.node.ts:5` et `index.browser.ts:5`. Ils font donc partie de l'**API publique** de `@udixio/tailwind` : `import { animation, AnimationPluginOptions } from '@udixio/tailwind'`.

### 7.2 Où il est enregistré

- `packages/tailwind/src/main.ts:5-10` : `main = plugin.withOptions<AnimationPluginOptions>(options => api => { animation(options).handler(api); stateGroup.handler(api); })`. Le type d'options du plugin **entier** est donc `AnimationPluginOptions`.
- `main` est l'**export par défaut** de `@udixio/tailwind` (`index.node.ts:36`, `index.browser.ts:27`). C'est ce que charge `@plugin "@udixio/tailwind"`.
- Cette ligne `@plugin "@udixio/tailwind";` est **émise automatiquement** dans le CSS de thème généré (`browser/tailwind.plugin.ts:319`, voir aussi `node/tailwind.plugin.ts:67`, `generate-static-theme-css.ts:35`). Dans la doc, elle arrive par `apps/doc/src/styles/global.css:2` (`@import "./udixio.generated.css"`).
- Plugin Vite `@udixio/tailwind/vite` : `src/vite/plugin.ts:3` importe `main` pour résoudre `@plugin` dans les moteurs Tailwind qui ne savent pas le faire (`vite/index.browser.ts:21`).

### 7.3 Options

- `prefix` (défaut `'anim'`) : préfixe des classes, des variables `--{prefix}-*`, des keyframes et des attributs `data-{prefix}-*`. Il doit être identique à l'option `prefix` d'`initAnimateOnScroll` (`AnimateOnScrollOptions { prefix?, once? }`, `AnimateOnScroll.ts:220-223`), et ce runtime ignore en partie le préfixe (§2).

### 7.4 Ce qu'il génère (résumé)

- Keyframes `@keyframes {prefix}-fade|scale|slide` (le `spin` est commenté à partir de la l. 306).
- Pour chaque effet : les classes `.{p}-{effet}`, `-in`, `-out`, `-scroll` et, pour `slide`, une variante par direction (16 alias : `up`, `from-top`, `down-right`…).
- Les paramètres `{p}-duration-*`, `{p}-delay-*`, `{p}-ease-*`, `{p}-fill-*`, `{p}-timeline-*` (`view`, `view-block`…), `{p}-scroll-{start|end}-{entry|contain|cover|exit}-*`, `{p}-timeline-block|inline|x|y`.
- Les déclencheurs `.{p}-in-run|paused`, `.{p}-out-run|paused` et `[data-{p}-in-run]`…
- Les règles de base `[class*="{p}-"]` (animation-name / will-change / play-state agrégés) et `[class*="{p}-"][class*="-scroll"]` (timeline / range).
- **Aucune prise en compte de `prefers-reduced-motion`** dans le plugin.

### 7.5 Sort

| Élément | Sort |
|---|---|
| `animation.ts` en entier | **Disparaît** (C7, C15, M4). |
| Exports publics `animation`, `AnimationPluginOptions` | **Disparaissent** : breaking change de `@udixio/tailwind`, à traiter dans D2. |
| `main.ts` (composition `animation` + `stateGroup`, type d'options) | **Migre** : `main` garde `stateGroup`. Le plugin Tailwind de `@udixio/motion` s'y branche ou reste séparé (question de D1 : « place du plugin Tailwind »). Le type d'options de `main` change. |
| Snapshots `src/emit/__snapshots__/characterization.spec.ts.snap` et `equivalence.spec.ts.snap` (l. 520-535 : `@keyframes anim-fade/scale/slide`, 25 occurrences d'`anim-` chacun) | **Régénérés** (mise à jour des snapshots). |
| `src/emit/emitter.spec.ts:5`, `:12` (« the animation @plugin line ») et `src/emit/test-utils.ts:13` (commentaire « animation utilities ») | **Migrent** : libellés ou commentaires à mettre à jour. La ligne `@plugin` subsiste tant que `stateGroup` existe. |
| `src/browser/tailwind.plugin.ts:280-284` (doc de `emitStaticCss` : « + the animation plugin ») | **Migre** (commentaire). |
| `packages/tailwind/README.md:8-9`, `:131-134` (« state layers and motion ») | **Migre** : à réécrire selon l'emplacement du plugin motion. |

## 8. Runtime `ui-react` lié à la doc (pour mémoire ; détail en E1)

| Élément | Sort |
|---|---|
| `packages/ui-react/src/lib/effects/AnimateOnScroll.ts` : exports `initAnimateOnScroll`, `AnimateOnScrollOptions`, alias `AnimateOnScrollInit`, `animateOnScroll` (l. 220-391) ; réexporté par `effects/index.ts:6` puis `lib/index.ts:2` | **Disparaît** (M4). Le rôle (déclenchement à la vue, fallback scroll-driven) **migre** vers `@udixio/motion`. |
| `packages/ui-react/src/lib/effects/scrollDriven.ts` (`initScrollViewFallback`, `InitAnimationOptions`, non réexportés, chargés dynamiquement) | **Disparaît** (M4). |
| `packages/ui-react/README.md:119` (« `AnimateOnScroll`, smooth scroll, scroll-driven animation ») | **Migre** : retirer `AnimateOnScroll` et la mention scroll-driven. Smooth scroll relève d'E1. |
| `ui-angular`, `ui-svelte` | Aucun équivalent d'`AnimateOnScroll` : rien à retirer. |

## 9. Synthèse

**Disparaît** : `animations.astro` ; l'appel `initAnimateOnScroll` du layout ; `animation.ts` et ses exports publics ; `AnimateOnScroll.ts` et `scrollDriven.ts` ; probablement `ClassNamePreview.tsx` (sauf réutilisation) ; les copies MCP correspondantes (à purger à la main ou par un script corrigé).

**Migre** : l'entrée de navigation (`Navigation.tsx:11`, `:17`, `:237`, `:303-311`) ; le lien de `introduction.mdx:41` ; les intentions de la page (entrée/sortie à la vue, scroll-driven, timing, cascade) vers les familles de la section Motion ; la composition `main.ts` et le type d'options de `@udixio/tailwind` ; les README `tailwind` et `ui-react` ; les commentaires et libellés de tests de `@udixio/tailwind`.

**Redirige** : `https://ui.udixio.fr/animations/` → accueil de la section Motion. Le mécanisme est à créer, il n'existe pas aujourd'hui (Astro `redirects` ou `vercel.json`). Il n'y a pas de miroir `.md` à rediriger.

**Régénéré** : sitemap ; `packages/mcp/{src,dist}/bundled/**` ; `components-index.json` ; snapshots `@udixio/tailwind`.

**Hors doc** : aucun composant ni exemple n'utilise `anim-*`. Supprimer `anim-*` n'oblige donc à migrer aucun usage dans les composants.
