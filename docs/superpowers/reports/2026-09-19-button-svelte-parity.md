# Parité Button — React → Svelte (validate)

Date : 2026-09-19 — Branche : `feat/svelte` — Mode : `validate`, cible Svelte.
Forward-test du plugin `udixio-ui-governance` 0.5.0 (`sync-svelte-component` + `audit-parity`)
sur le pilote de la phase B.

## Formes de livraison

| Adaptateur | Forme | Justification |
| --- | --- | --- |
| React | composant `Button` | source par défaut |
| Angular | composant `udx-button` | décision antérieure |
| Svelte | composant `Button.svelte` | rien ne s'attache à un hôte étranger ; le composant possède `button`/`a` |

Même forme partout : aucun `FORM-*`.

## Matrice

| Dimension | Verdict | Preuve |
| --- | --- | --- |
| Concepts et défauts du contrat (`ButtonProps`) | identique | `apps/doc/src/data/api/button.json` — `frameworks.svelte.props` : mêmes noms, mêmes défauts (`filled`, `button`, `start`, `medium`, `rounded`, `morph`, `false`) |
| `label` / `children` | `platform-adaptation` | React interdit les deux par le type ; Svelte les accepte (le snippet gagne, comme React à l'exécution). Documenté dans `@devx` (« Ignored when `children` is provided ») |
| Callbacks | `platform-adaptation` | `onPressedChange` conservé ; `onclick` en minuscules = idiome DOM Svelte 5 |
| État contrôlé | `platform-adaptation` | `bind:pressed` + assignation sur transition acceptée ; refus par function binding. Spec « requests controlled changes without mutating the owned value » |
| Personnalisation | `platform-adaptation` | `class` + `classes` (split Angular) au lieu de `className` ; même `mergeClassNames` |
| Attributs natifs transmis | `platform-adaptation` | attributs communs `button`/`a` + `target`, `rel` (liste explicite comme Angular) ; React transmet tout le type natif |
| DOM sémantique | identique | `button`/`a`, `aria-pressed`, `aria-busy`, `aria-disabled` + `tabindex=-1` + `role=link` + `href` retiré ; touch target, StateLayer, icône, indicateur de chargement |
| Styles | identique | même `buttonStyle`, mêmes clés d'état (spec `classes` fonction : `v-tonal p-true`) |
| Pointer / clavier / focus / animation / cleanup | identique | contrôleurs `@udixio/core/dom` via `StateLayer` ; spec « connects pointer feedback and removes it during cleanup » |
| ARIA | identique | 5 scénarios axe + 37 scénarios React portés |
| Exports | identique | `packages/ui-svelte/src/index.ts`, `dist/index.d.ts` généré |
| Tests | identique + | 37 scénarios React → 42 Svelte (5 spécifiques : `bind:`, function binding, snippet, `class`/`classes`, nom accessible) |
| Documentation | identique | 6 exemples Svelte, page API Svelte (props, `bind:pressed`, snippets), miroir `api.svelte.md` |

## Findings

Aucun `defect`. Aucun `API-DESIGN-*` : le contrat Button est stable et déjà audité pour Angular.

## Retours sur le plugin (evolve-governance)

1. La convention « `Svelte<X>Props` dans `<x>.types.ts` » n'existait pas dans la spec initiale :
   un `.svelte` ne peut pas ré-exporter un type par le barrel, et le docgen a besoin d'un
   fichier TS. Ajoutée à `repository-map.md` et `svelte-conventions.md`.
2. Les specs qui utilisent des runes doivent s'appeler `*.spec.svelte.ts`. Ajouté.
3. Un `$effect` de connexion doit lire ses dépendances via `$derived` quand le parent peut
   spreader ses props (sinon recréation du contrôleur à chaque mise à jour). Ajouté à
   `svelte-conventions.md`.
