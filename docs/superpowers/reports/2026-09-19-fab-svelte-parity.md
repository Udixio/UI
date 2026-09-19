# Parité Fab — React → Svelte (validate)

Date : 2026-09-19 — Branche : `feat/svelte` — Mode : `validate`, cible Svelte.
Audit réalisé avec `create-material-component`, `sync-svelte-component` puis
`audit-parity` du plugin `udixio-ui-governance` 0.5.0. Baseline de l’API :
`b2e4e13e`.

## Formes de livraison

| Adaptateur | Forme | Justification |
| --- | --- | --- |
| React | composant `Fab` | source par défaut |
| Angular | composant `udx-fab` | contrat déjà établi |
| Svelte | composant `Fab.svelte` | le composant possède le bouton ou le lien qu’il rend |

Même forme partout : aucun `FORM-*`.

## Matrice

| Dimension | Verdict | Preuve |
| --- | --- | --- |
| Contrat et défauts (`FabProps`) | identique | `fab.interface.ts`, `fab.style.ts` et `SvelteFabProps` ; `primary`, `small`, `false`, `false` sont les défauts effectifs |
| Label compact / étendu | identique | label toujours monté, largeur/opacité initiales correctes, `aria-hidden` compact, `aria-label` compact seulement |
| Animation et cleanup | identique | `createFabLabelController` partagé via `$effect`, une connexion par élément, `destroy()` au démontage, `extended` suivi par `update()` |
| Tooltip | identique + | attachment Svelte compact seulement, texte personnalisé ou suppression explicite, `describeTarget` aligné ; `null` explicite désactive réellement les triggers |
| DOM et interaction | identique | bouton natif avec `type="button"`, lien natif avec `aria-current`, lien désactivé sans `href`, `aria-disabled` et `tabindex=-1` |
| Callbacks | `platform-adaptation` | `onclick` minuscule est le handler DOM Svelte 5 ; il est appelé seulement pour une interaction acceptée |
| Personnalisation et attributs | `platform-adaptation` | `class` + `classes` sont fusionnés par le contrat core ; rest props transmettent `data-*`, `aria-*`, `tabindex`, `title`, `target` et `rel` |
| Styles et états visuels | identique | `fabStyle`, `StateLayer`, `Icon` et les couleurs de state layer sont réutilisés sans décision de classe locale |
| Accessibilité | identique | nom accessible stable, cible 48 px, focus visible, axe validé pour l’action |
| Exports | identique | `packages/ui-svelte/src/index.ts` expose `Fab` et `SvelteFabProps` |
| Tests | identique + | 14 scénarios Svelte couvrant le portage React/Angular, controller lifecycle, tooltip désactivé, attributs, link/action, pointer cleanup et axe |
| Documentation | identique | cinq exemples Svelte, overview enrichie et payload API Svelte généré |

## Findings

| Finding | Severity / confidence | Evidence and impact | Remediation / disposition |
| --- | --- | --- | --- |
| `API-DESIGN-001` | minor / high | Le commentaire core de `FabProps.size` annonçait `medium`, alors que React, Angular et le contrat Svelte appliquent `small`. | Corriger le TSDoc core à `@default 'small'`, régénérer l’API. **fixed** |

No other `PARITY-*`, `API-DESIGN-*` or `FORM-*` finding remains open.

## Validation

- 14 tests `Fab` Svelte et 24 tests `IconButton` Svelte ciblés : succès.
- `nx test ui-svelte`, `nx typecheck ui-svelte`, `nx lint ui-svelte`, `nx build ui-svelte` : succès.
- `svelte-check` : 0 erreur, 0 warning.
- docgen, `docgen:check`, validations API `fab`/`icon-button` et `nx sync:check` : succès.
- build Astro : succès (`exit 0`), avec seulement les avertissements existants du dépôt.
- inspection déterministe des routes générées : panneaux Svelte et API Fab présents.
- contrôle interactif navigateur non exécuté : aucun navigateur contrôlable n’était disponible dans la session.
