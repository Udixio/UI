# Extraction du package `@udixio/styles`

**Date :** 2026-07-15
**Statut :** Design validé (périmètre + nom approuvés)

## Objectif

Extraire la logique de styles (classes Tailwind dynamiques pilotées par des props)
hors de `@udixio/ui-react` vers un nouveau package `@udixio/styles`, pour qu'elle
puisse à terme être consommée par n'importe quel framework (React, Angular, Vue…).

**Cette étape ne fait que le déplacement mécanique.** Le découplage vis-à-vis de
React (types `Icon`, `ReactNode`, `RefObject`, hooks) est explicitement reporté à
une étape ultérieure. React/motion restent des dépendances du package pour l'instant.

## Contrainte structurante : la chaîne de dépendances

Les fichiers `styles/*.style.ts` ne sont pas isolables seuls. Leur fermeture de
dépendances est :

```
styles/*.style.ts
   ├── utils/styles/          (moteur : classNames, getClassNames,
   │                           defaultClassNames, createUseClassNames, useClassNames)
   ├── utils/component.ts     (ComponentInterface, ActionOrLink, ReactProps, MotionProps)
   ├── utils/component-helper.ts (ComponentClassName, HTMLElements)
   ├── utils/string.ts        (convertToKebabCase)
   └── interfaces/            (ButtonInterface, … — 28 fichiers)
         ├── type Icon        (depuis ../icon)
         ├── react + motion   (types uniquement)
         └── ../components     (1 arête inverse : carousel.interface → CarouselItem)
```

Déplacer seulement `styles/` en le faisant importer `interfaces`/`utils` depuis
`@udixio/ui-react` créerait un **cycle** `ui-react → styles → ui-react` (refusé par Nx).
Il faut donc déplacer toute la fondation avec les styles.

## Périmètre déplacé vers `packages/styles`

| Depuis `ui-react/src/lib/` | Vers `styles/src/lib/` |
|---|---|
| `styles/` (30 fichiers) | `styles/` |
| `utils/styles/` (classnames, get-classname, use-classnames, index) | `utils/styles/` |
| `utils/component.ts`, `component-helper.ts`, `string.ts` | `utils/` |
| `interfaces/` (28 fichiers) | `interfaces/` |
| **type** `Icon` (extrait de `icon/icon.tsx`) | `icon/icon.type.ts` |

**Reste dans `ui-react` :** le composant React `<Icon>` (`icon/icon.tsx`), tous les
composants (`components/`), hooks et logique spécifiques React.

## Ajustements de couplage (2)

1. **`carousel.interface.ts`** importe le *composant* `CarouselItem`. On le remplace
   par le type de props correspondant (`CarouselItemInterface` / props), pour supprimer
   l'arête `interfaces → components`.
2. **type `Icon`** : extrait dans `@udixio/styles` (`icon/icon.type.ts`, contenu
   `IconDefinition | SvgImport | string`). Le composant `<Icon>` de ui-react réimporte
   ce type depuis `@udixio/styles`.

## Consommation depuis `ui-react` (rétro-compatibilité)

`ui-react` ajoute `@udixio/styles` en dépendance (`workspace:*`) et **ré-exporte**
styles / interfaces / utils depuis ses barrels existants (`utils/index.ts`,
`interfaces/index.ts`, et le point d'entrée des styles). Objectif : **les 30 fichiers
de `components/` ne changent pas** — leurs `import … from '../interfaces'` /
`'../styles'` / `'../utils'` continuent de résoudre via ré-export.

## Package `@udixio/styles`

- **Emplacement :** `packages/styles`, nom `@udixio/styles`, version `0.0.1`.
- **Build :** scaffold généré via `nx g @nx/js:lib styles --directory=packages/styles
  --bundler=vite --importPath=@udixio/styles`, puis `vite.config.ts` aligné sur celui
  de ui-react (mode librairie `formats: ['es','cjs']`, `vite-plugin-dts`, plugin
  `@vitejs/plugin-react`, `external` incluant react/motion/clsx/tailwind-merge).
- **Dépendances runtime :** `clsx`, `tailwind-merge`.
- **peerDependencies :** `react` (>19), `motion` (types), `@fortawesome/fontawesome-svg-core` (type `IconDefinition`).
- **Point d'entrée `src/index.ts` :** ré-exporte `styles`, `interfaces`, `utils`, `icon` (type).

## Critères de succès

- `nx build styles` réussit et produit `dist` (ESM + CJS + `.d.ts`).
- `nx build ui-react` réussit **sans modification des fichiers `components/`**.
- `nx test ui-react` et `nx lint ui-react` passent.
- Aucune dépendance circulaire dans le graphe Nx (`nx graph`).

## Hors périmètre (étape ultérieure)

- Découplage des types React (`Icon`, `ReactNode`, `RefObject`, `Transition`).
- Suppression des hooks React (`createUseClassNames`, `useClassNames`) du package agnostique.
- Consommation depuis `@udixio/ui-angular`.
