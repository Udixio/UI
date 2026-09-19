# Parité IconButton — React → Svelte (validate)

Date : 2026-09-19 — Branche : `feat/svelte` — Mode : `validate`, cible Svelte.
Audit réalisé avec `sync-svelte-component` puis `audit-parity` du plugin
`udixio-ui-governance` 0.5.0. Baseline de l’API : `5759dc30`.

## Formes de livraison

| Adaptateur | Forme | Justification |
| --- | --- | --- |
| React | composant `IconButton` | source par défaut |
| Angular | composant `udx-icon-button` | contrat déjà établi |
| Svelte | composant `IconButton.svelte` | le composant possède le `button` ou le lien qu’il rend |

Même forme partout : aucun `FORM-*`.

## Matrice

| Dimension | Verdict | Preuve |
| --- | --- | --- |
| Contrat et défauts (`IconButtonProps`) | identique | `icon-button.interface.ts`, styles et comportement core, puis `SvelteIconButtonProps` |
| État pressé contrôlé / non contrôlé | `platform-adaptation` | `bind:pressed` et function binding Svelte ; la primitive core décide les transitions et le setter du propriétaire peut refuser |
| Callbacks | `platform-adaptation` | `onPressedChange` conserve le vocabulaire public ; `onclick` minuscule est le handler DOM Svelte 5 |
| Personnalisation | `platform-adaptation` | `class` + `classes`, fusionnés par `mergeClassNames`, comme l’adaptation Angular |
| Attributs natifs | `platform-adaptation` | rest props transmis au bouton/lien ; `type`, `target`, `rel`, `tabindex`, `aria-*` sont vérifiés par les tests |
| DOM et sémantique | identique | bouton natif ou lien natif, nom accessible, `aria-pressed` seulement en mode action toggleable, lien désactivé inert |
| Styles et états visuels | identique | `iconButtonStyle`, `getIconButtonStateColor` et `getIconButtonShapeTransition` sont réutilisés depuis `@udixio/core` |
| Tooltip, pointer, clavier, focus, cleanup | identique | attachment tooltip et `StateLayer` partagés ; tests de focus, activation clavier, ripple et démontage |
| Accessibilité | identique | nom obligatoire, cible 48 px, axe sans violation pour bouton et lien |
| Exports | identique | `packages/ui-svelte/src/index.ts` expose `IconButton` et `SvelteIconButtonProps` |
| Tests | identique + | scénarios React portés, avec round-trip `bind:pressed` et refus par function binding propres à Svelte |
| Documentation | identique | cinq exemples Svelte, page overview et payload API généré |

## Findings

Aucun défaut `PARITY-*`. Aucun `API-DESIGN-*` : le contrat public est déjà partagé
par core, React et Angular. Les différences signalées sont des adaptations syntaxiques
ou d’idiome Svelte, couvertes par des tests et documentées.

## Validation

- 23 tests `IconButton` Svelte : succès.
- `svelte-check` : 0 erreur, 0 warning.
- `test`, `typecheck`, `lint`, `build` Nx de `ui-svelte` : succès.
- docgen, `docgen:check`, validation API ciblée et `git diff --check` : succès.
- build Astro : succès (`exit 0`), avec seulement les avertissements existants du dépôt.
