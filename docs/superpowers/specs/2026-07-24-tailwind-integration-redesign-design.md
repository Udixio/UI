# Refonte de l'intégration `@udixio/tailwind` — Design

Date : 2026-07-24
Statut : approuvé (brainstorming), prêt pour plan d'implémentation

## Contexte et problème

L'intégration Tailwind actuelle (`packages/tailwind`) est fragile pour trois raisons
indépendantes, toutes issues d'une volonté de « zéro-config » :

1. **Scan du système de fichiers** — `findTailwindCssFile` (`node/file.ts`) parcourt
   récursivement tout le projet pour trouver un `.css`/`.scss`/`.sass` contenant
   `@import "tailwindcss"`. Heuristique : peut tomber sur le mauvais fichier ou échouer.
2. **Mutation du CSS source de l'utilisateur** — le plugin réécrit ce fichier
   (`replaceFileContent`) pour y injecter `@import "./udixio.css"`, puis **écrit
   `udixio.css` dans l'arbre source** à chaque build. Résultat : fichier généré committé,
   bruit git, effets de bord surprenants (un simple `nx build` modifie l'arbre source).
3. **Round-trip de config en chaînes** — la config structurée (`colorKeys`, `fontStyles`,
   `responsiveBreakPoints`, `fontFamily`) est sérialisée en chaînes
   `role-size prop[value]` dans un bloc `@plugin "@udixio/tailwind" { … }`
   (`node/tailwind.plugin.ts`), puis re-parsée dans `main.ts` par `.split(' ')` / `.split('[')`.
   N'importe quel espace dans une valeur casse le parsing.

La cause racine côté Tailwind v4 est réelle : la config est passée via CSS
(`@plugin`, `@theme`) et un plugin ne peut plus recevoir d'objet JS riche. Mais
l'implémentation actuelle contourne mal cette contrainte.

Une brique propre existe déjà : `generateThemeCss()`
(`packages/ui-react/src/lib/effects/generateThemeCss.ts`) produit un CSS pur en
variables, sans scan ni écriture (chemin utilisé pour le SSR).

## Décisions de conception (brainstorming)

1. **Câblage : import explicite assumé.** L'utilisateur ajoute lui-même une ligne
   `@import`. Supprime scan FS + mutation source + fichier committé. Aligné sur le modèle
   CSS-first de Tailwind v4. Migration repo quasi nulle (les `@import` sont déjà en dur dans
   `apps/doc/src/styles/global.css` et `packages/ui-react/src/index.css`).
2. **Utilitaires : split propre.** `colors + font + state + shadow` → CSS généré statique
   (via `@theme` / `@utility` / `@apply`, que Tailwind résout dans un fichier `@import`é).
   `animation` reste un plugin Tailwind v4 (besoin réel de `matchUtilities` à valeurs
   arbitraires). Conséquence : le round-trip string disparaît entièrement, car ses seuls
   consommateurs (font, state) sont désormais générés en amont.
3. **Livraison : fichier généré gitignoré.** Le plugin build écrit `udixio.generated.css`
   à un chemin déterministe gitignoré ; l'utilisateur l'importe explicitement. Robuste
   partout (Vite/Next/Astro/webpack) car Tailwind v4 lit un vrai fichier via `@import`.

## Architecture cible

### Setup utilisateur (final)

```css
/* global.css */
@import "tailwindcss";
@import "./udixio.generated.css";   /* généré, gitignoré, écrit au build */
```

Une seule ligne ajoutée. Aucun scan, aucune mutation du CSS source, aucun fichier
généré committé.

### Contenu de `udixio.generated.css`

Émis à 100 % en CSS par le côté JS du thème (le `TailwindImplPlugin`) :

| Bloc | Source de données | Forme émise | Changement |
|---|---|---|---|
| Couleurs | palette M3 | `@theme { --color-* }` + `@layer theme` (dark/dynamic/subThemes) | inchangé (déjà émis aujourd'hui par `loadColor`) |
| Typo `.text-{role}-{size}` | `fontStyles` (FontPlugin) | CSS statique + `@media` responsive | déplacé de plugin JS → CSS généré |
| State `.state-*`, `.state-layer`, `.state-group` | `colorKeys` | `@utility` réutilisant les **mêmes corps `@apply`** | déplacé de plugin JS → CSS généré |
| Shadow `.shadow`, `.shadow-1..4`, `.box-shadow-5` | statique | CSS statique | déplacé de plugin JS → CSS généré |
| Animation | — | ligne `@plugin "@udixio/tailwind";` en tête | reste un plugin JS |

**Insight technique porteur du design** : parce que le fichier est `@import`é dans le
pipeline Tailwind v4, du CSS généré peut utiliser `@theme`, `@utility` et `@apply` —
Tailwind les résout. Pour `state`, on réutilise **verbatim** les chaînes `@apply`
existantes (`group-hover/…:bg-[var(--state-color)]/[0.08]`, etc.) → risque de drift
quasi nul.

### Le plugin `animation` conservé

`animation` (566 lignes, `packages/tailwind/src/plugins-tailwind/animation.ts`) garde
besoin de l'API JS de Tailwind (`matchUtilities` à valeurs arbitraires : durées, délais,
paramètres). Il ne lit **aucune** donnée du thème (seulement `prefix`, défaut `'anim'`).

- Il devient le contenu principal du default export de `@udixio/tailwind` (`main.ts` réduit
  à animation-only).
- Il est câblé par la ligne `@plugin "@udixio/tailwind";` que **le fichier généré émet
  lui-même** → l'utilisateur n'a toujours qu'un seul `@import` à écrire.

### Intégration build / livraison

Le `vitePlugin()` / unplugin existant (`packages/theme/src/loader/unplugin.ts`, déjà
branché dans `apps/doc/astro.config.ts`) est conservé. Son `TailwindPlugin` node
(`packages/tailwind/src/node/tailwind.plugin.ts`) est réécrit :

- **supprime** `findTailwindCssFile` (scan FS) et la réécriture du CSS source
  (`replaceFileContent` sur le fichier utilisateur) ;
- **écrit** `udixio.generated.css` à un chemin déterministe (défaut : à côté de
  `theme.config.ts` ; option `outFile` pour override) ;
- **garantit l'entrée `.gitignore`** pour le fichier généré (ajout idempotent) ;
- **régénère** au `buildStart` (avant que Tailwind ne traite le CSS) et sur changement de
  `theme.config.ts` (HMR déjà géré par l'unplugin : `handleHotUpdate` → `full-reload`).

### `generateThemeCss()` (SSR) conservé

L'API string existante (`packages/ui-react/.../generateThemeCss.ts`) reste, pour SSR pur /
palettes par tenant. Elle produira désormais le CSS complet (colors + font + state +
shadow), pas seulement les couleurs — car l'émission static est centralisée dans le plugin.

## Périmètre des changements

### Supprimé

- `packages/tailwind/src/node/file.ts` (scan FS + `replace-in-file` + `chalk`).
- La logique d'auto-injection/scan dans `packages/tailwind/src/node/tailwind.plugin.ts`.
- Le type `ConfigCss` et le parsing par `.split(' ')` / `.split('[')` dans
  `packages/tailwind/src/main.ts` (réduit au plugin `animation`).
- Les dépendances devenues inutiles (`replace-in-file`, potentiellement `chalk`) si plus
  aucun autre usage.

### Modifié

- `packages/tailwind/src/browser/tailwind.plugin.ts` — `loadColor`/`onLoad` étendus pour
  émettre aussi font + state + shadow en CSS statique (en plus des couleurs). C'est le point
  de génération unique réutilisé par le node plugin et par `generateThemeCss`.
- `packages/tailwind/src/node/tailwind.plugin.ts` — écrit le fichier généré + gitignore, sans
  scan ni mutation.
- `packages/tailwind/src/main.ts` — default export = plugin `animation` seul.
- `packages/tailwind/src/plugins-tailwind/{font,state,shadow}.ts` — convertis en helpers purs
  qui **retournent une chaîne CSS** (`.text-*`, `.state-*`/`@apply`, `.shadow-*`), consommés
  par l'émetteur CSS statique du `browser/tailwind.plugin.ts`. Ils ne sont plus des plugins
  Tailwind JS (`plugin.withOptions`). `animation.ts` reste un plugin JS inchangé.

### Migration des consommateurs (repo)

- `apps/doc/src/styles/global.css` : pointer `@import "./udixio.css"` →
  `@import "./udixio.generated.css"`.
- `packages/ui-react/src/index.css` : idem.
- Dé-committer les anciens `udixio.css` générés et les gitignore
  (`apps/doc/src/styles/udixio.css`, `packages/ui-react/src/udixio.css`).

## Résultats du spike (2026-07-24) — les 3 hypothèses sont VALIDÉES

Vérifié avec `compile()` de `@tailwindcss/node` 4.1.14 sur Tailwind 4.1.14.

**1. `NESTED_PLUGIN_OK = true`** — un `@plugin` placé dans un fichier `@import`é est bien
traité. Entrée `@import "tailwindcss"; @import "./imported.css";` où `imported.css` contient
`@plugin "./plg.cjs";` → sortie :

```css
.plg-mark { outline: 1px solid green; }
```

→ **Décision** : le fichier généré émet lui-même `@plugin "@udixio/tailwind";`. L'utilisateur
n'écrit qu'un seul `@import`.

**2. `UTILITY_IN_IMPORT_OK = true`** — un `@utility` défini dans un fichier `@import`é produit
un utilitaire fonctionnel **et** compatible avec les variants :

```css
.probe-box { color: red; }
.hover\:probe-box { @media (hover: hover) { color: red; } }
```

→ **Décision** : l'approche CSS statique est viable (elle conditionnait tout le design).

**3. `THEME_IN_MEDIA_OK = true`** — `theme(--breakpoint-lg)` est résolu dans un `@media`
imbriqué à l'intérieur d'un `@utility` :

```css
.probe-font { font-size: 3.5rem; @media (min-width: 64rem) { font-size: 4rem; } }
```

→ **Décision** : le helper `font` émet `@media (min-width: theme(--breakpoint-<name>))`. Le
repli sur des largeurs en rem codées en dur n'est **pas** nécessaire, et les breakpoints
personnalisés de l'utilisateur restent donc respectés.

### Deux corrections d'outillage découvertes pendant le spike

- `@tailwindcss/node` n'était qu'une dépendance **transitive** de `@tailwindcss/vite`, non
  résolvable depuis `packages/tailwind` → ajoutée en `devDependencies` de ce package.
- `compile()` résout `@import "tailwindcss"` depuis son `base` : un `base` en `os.tmpdir()`
  échoue (`Can't resolve 'tailwindcss'`). Les tests doivent créer leur répertoire temporaire
  **à l'intérieur du projet** (ex. `packages/tailwind/.tmp-test/`) pour que la résolution
  Node remonte jusqu'aux `node_modules` du dépôt.

Risque restant : équivalence exacte des utilitaires `state` émis en CSS généré vs. via
`matchUtilities`. Mitigé en réutilisant verbatim les corps `@apply` et en comparant le CSS
résolu par Tailwind avant/après.

## Stratégie de test

- **Golden snapshot** du `udixio.generated.css` complet pour une `theme.config` de référence
  (même approche que la caractérisation du class-engine).
- **Équivalence** : comparer le CSS résolu par Tailwind (classes `.text-*`, `.state-*`,
  `.shadow-*`, `@theme --color-*`) avant/après refonte, pour une même config.
- **Builds verts** : `apps/doc` (Astro) et `@udixio/ui-react`.
- **Non-régression du fichier généré** : vérifier qu'aucune écriture n'a lieu dans l'arbre
  source hors du fichier gitignoré désigné.

## Hors périmètre (YAGNI)

- Pas de refonte du module `color` ni de la math M3 (point 1 du diagnostic : non pertinent).
- Pas de simplification du `variant` / API de config couleur (point 2 : chantier séparé).
- Pas de support d'un module virtuel `virtual:udixio-theme.css` (écarté : risque de
  résolution CSS par Tailwind v4, couplage Vite). Le fichier généré gitignoré est retenu.


## Correction post-implémentation — `state-group` doit rester un plugin (2026-07-25)

La bascule statique avait émis `state-group`/`state-ripple-group` en `@utility` statique.
ERREUR : les composants les utilisent avec une valeur arbitraire — `state-ripple-group-[button]`
— dont le nom s'interpole dans un **variant de groupe nommé** (`group-hover/button:`). Un
`@utility` statique ne peut pas exprimer ça, et comme les racines de composants sont des groupes
nommés (`group/button`), le `group-hover:` nu ne se déclenche jamais : le state layer (hover/
active/focus) était **silencieusement mort** sur tous les composants interactifs.

Correctif : `state-group`/`state-ripple-group` sont restaurés en plugin `matchUtilities`
sans config (`plugins-tailwind/state-group.ts`), câblés via `@plugin "@udixio/tailwind"`.
`state-layer` et le setter `state-{key}` restent statiques. Règle générale : **tout utilitaire
à valeur arbitraire `-[...]` doit rester un plugin JS** (comme `animation`) ; seuls les
utilitaires à noms fixes/énumérables peuvent devenir du CSS statique.
