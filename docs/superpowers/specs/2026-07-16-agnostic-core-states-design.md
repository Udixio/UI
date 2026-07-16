# Découplage React du cœur : renommage `@udixio/core` + interfaces agnostiques (pilote)

**Date :** 2026-07-16
**Statut :** Design validé (approche A · Hybride ; pilote Button + TextField ; renommage d'abord)
**Suite de :** [2026-07-15-extract-styles-package-design.md](2026-07-15-extract-styles-package-design.md)

## Objectif

Rendre le package de styles **indépendant de tout framework**. Aujourd'hui `@udixio/styles`
contient les configs Tailwind (`*.style.ts`) et leurs interfaces, mais ces interfaces
importent encore `react` (`ReactNode`, `RefObject`, `Dispatch`, `ReactElement`, handlers) et
`motion` (`Transition`), et un `*.style.ts` appelle `React.isValidElement` au runtime.

Cible : le cœur ne contient plus **aucun** import `react`/`motion`. Par composant il expose
une **interface de props agnostique** + une **fonction de style pure** `xxxStyle(state) → classes`.
Chaque framework (React d'abord, Angular ensuite) ajoute sa couche de bindings par-dessus.

**Approche retenue : A · Hybride.** Le cœur définit une interface de props agnostique (données
de style + callbacks à signature simple) ; chaque framework l'étend par composition avec ses
bindings de rendu. Justification (flexibilité, SOLID/ISP, dette, typage strict par framework)
dans l'historique de décision — B (génériques paramétrés) rejeté pour la rigidité d'arité
générique et la fragilité d'inférence ; C (StyleState seul) rejeté pour la duplication/dérive.

## Périmètre de cette spec

- **Renommage** `@udixio/styles` → `@udixio/core` (fait **en premier**, avant le découplage).
- **Déplacement des hooks React** hors du cœur vers `@udixio/ui-react`.
- **Conversion complète de 2 composants pilotes** : `Button` (cas toggle typique) et
  `TextField` (cas dur : props-éléments lues par le style via `React.isValidElement`).
- **Garde-fou** empêchant la réapparition de `react`/`motion` dans `core/src`.

Les **26 autres composants** sont **hors périmètre** : ils suivront dans un plan de déroulé
séparé, une fois le pattern prouvé. Pendant cette spec ils restent tels quels (interfaces
encore couplées React), ce qui est toléré transitoirement.

## Architecture (2 couches)

### `@udixio/core` — aucun import react/motion

- Moteur : `classNames`, `getClassNames`, `defaultClassNames`, `ComponentInterface`,
  `ActionOrLink`, `HTMLElements` (types **DOM**, pas React), `ComponentClassName`, `string`.
- Type `Icon` (`IconDefinition | SvgImport | string`) — agnostique (dépendance de **type**
  fortawesome uniquement).
- Par composant : interface de props agnostique + states + `elements` + fonction `xxxStyle`.
- **À terme, retiré du cœur** (cible finale du déroulé) : `createUseClassNames`,
  `useClassNames` (hooks) ; `ReactProps`, `MotionProps` (mappers React) ; les dépendances
  `react`/`motion`. **Pendant le pilote** ils restent dans le cœur (utilisés par les 26 non
  convertis) — voir « Nature transitionnelle du pilote ».

### `@udixio/ui-react` — couche framework

- Mappers `ReactProps` / `MotionProps` (déplacés depuis le cœur).
- Helper unique `createUseStyle(styleFn)` = `(state) => useMemo(() => styleFn(state), [state])`.
  Les hooks `useButtonStyle`, `useTextFieldStyle`, … deviennent
  `createUseStyle(buttonStyle)`, etc. (noms conservés, API composant inchangée).
- Interfaces React composées : `ReactProps<XxxInterface> & { bindings React }`.

## Convention (exemple `Button`)

```ts
// @udixio/core — button.interface.ts
export interface ButtonProps {
  variant?: 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  disabled?: boolean;
  shape?: 'squared' | 'rounded';
  allowShapeTransformation?: boolean;
  disableTextMargins?: boolean;
  loading?: boolean;
  label?: string;
  onToggle?: (active: boolean) => void;
}
// NB: `icon` et `iconPosition` sont destructurés mais NON lus par le calcul
// des classes → ce sont des bindings ui-react, pas des props du cœur.
export interface ButtonStates { isActive: boolean }
export interface ButtonInterface {
  type: 'button' | 'a';
  props: ButtonProps;
  states: ButtonStates;
  elements: ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];
}

// @udixio/core — button.style.ts (pure)
export const buttonStyle = defaultClassNames<ButtonInterface>('button', buttonConfig);
```

```ts
// @udixio/ui-react
export type ReactButtonProps = ReactProps<ButtonInterface> & {
  children?: ReactNode;
  icon?: Icon;
  iconPosition?: 'left' | 'right';
  transition?: Transition;
};
export const useButtonStyle = createUseStyle(buttonStyle);
```

**Non-dérive** : `buttonStyle` est typée sur `ButtonProps & ButtonStates` ; l'interface React
étend `ButtonProps` → ajouter une prop de style au cœur la propage et le compilateur vérifie
l'appel. Style et interface ne peuvent pas se désynchroniser.

## Règle de classification des props

| Nature | Emplacement | Exemple |
|---|---|---|
| Donnée pilotant le style | cœur (type plat) | `variant`, `size`, `disabled`, `isActive` |
| Callback à signature simple | cœur | `onToggle: (active: boolean) => void` |
| Binding de rendu | ui-react | `children: ReactNode`, `ref`, `transition: Transition`, handlers DOM |
| Élément framework **lu par le style** | cœur en **donnée plate** ; le composant la calcule | voir TextField ci-dessous |

## Cas dur : `TextField`

`text-field.style.ts` lit `React.isValidElement(leadingIcon)` / `(trailingIcon)` pour appliquer
`cursor-text` quand l'icône n'est **pas** un élément interactif.

- **Cœur** : `TextFieldProps` reçoit `leadingIconInteractive?: boolean` et
  `trailingIconInteractive?: boolean` (données plates). Le style fait
  `{ 'cursor-text': !leadingIconInteractive }`. Plus aucun `React.` dans le cœur.
- **ui-react** : l'interface React garde `leadingIcon?: ReactElement | Icon` (binding), et le
  composant `TextField` calcule `leadingIconInteractive = React.isValidElement(leadingIcon)`
  avant d'appeler `useTextFieldStyle`.

Toute autre prop React de `TextFieldInterface` non lue par le style (handlers `onChange`,
`suffix`, éléments de menu, etc.) devient un binding ui-react.

## Renommage `@udixio/styles` → `@udixio/core` (étape 1)

Fait avant le découplage pour ne pas réécrire les imports deux fois :
- `packages/styles/` → `packages/core/`, `name`/`importPath` `@udixio/core`, alias dans
  `tsconfig.base.json`, référence dans `tsconfig.json` racine et `ui-react/tsconfig.lib.json`.
- Réécriture des imports `@udixio/styles` → `@udixio/core` dans ui-react et les tests.
- `@udixio/core` reste dépendance `workspace:*` de ui-react, qui continue de le ré-exporter.

## Nature transitionnelle du pilote

Tant que les 26 autres composants ne sont pas convertis, le cœur **garde** transitoirement
`react`/`motion` : leurs interfaces importent encore des types React, et ils consomment les
hooks `createUseClassNames`/`useClassNames` du cœur. Ces éléments **restent dans le cœur**
pendant le pilote ; leur suppression totale (et le retrait de `react`/`motion` du
`package.json` du cœur) est l'affaire du **déroulé** une fois les 28 composants convertis.

Le pilote introduit le hook `createUseStyle` **dans ui-react** (sans supprimer
`createUseClassNames` du cœur, encore utilisé par les 26). Idem `ReactProps`/`MotionProps` :
ils restent dans le cœur tant que des interfaces non converties en dépendent.

## Garde-fou anti-régression (limité aux fichiers convertis)

Un check échoue si un **fichier converti** réimporte un framework. Pendant le pilote il porte
sur les 4 fichiers convertis :
`grep -rE "from '(react|motion)" packages/core/src/lib/{styles/button.style.ts,styles/text-field.style.ts,interfaces/button.interface.ts,interfaces/text-field.interface.ts}`
doit ne rien renvoyer. La version globale (`packages/core/src`) sera activée en fin de déroulé.

## Critères de succès

- `nx build core` réussit ; les 4 fichiers convertis n'importent plus `react`/`motion`
  (garde-fou limité vert).
- `nx build ui-react`, `nx test ui-react` passent ; `Button.spec` toujours vert ; le test du
  hook (ex-`useClassNames.spec`) passe.
- `Button` et `TextField` : interfaces cœur agnostiques, `buttonStyle`/`textFieldStyle` pures
  (plus de `useXxxStyle` exporté depuis le cœur **pour ces deux**), composants React recâblés
  sur les bindings + `createUseStyle` local, rendu inchangé.
- Les 26 autres composants **compilent et testent toujours** (dette transitionnelle assumée).
- Graphe Nx acyclique (`ui-react → core`).

## Hors périmètre (déroulé ultérieur)

- Conversion des 26 autres composants sur le même pattern.
- Consommation depuis `@udixio/ui-angular` (couche de bindings Angular).
- Généralisation éventuelle du `State`/ripple (effets d'interaction runtime) — non traité ici,
  seul le typage des interfaces l'est.
