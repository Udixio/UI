# Standard d'auteur multi-framework (contrat cœur + recettes React/Angular)

**Date :** 2026-07-17
**Statut :** Design validé (périmètre A+B ; machinerie « convention + primitives fines » ; validé sur Button React+Angular et TextField React)
**Suite de :** [2026-07-16-agnostic-core-states-design.md](2026-07-16-agnostic-core-states-design.md)

## Objectif

Figer **avant** le déroulé des 26 composants restants un standard sûr et sans dette pour :
- **A. Le contrat du cœur** (`@udixio/core`) — la forme par-composant : données, states, fonction
  de style pure, hook de personnalisation ; et la sortie de React hors du cœur.
- **B. La recette d'auteur par-framework** — comment un composant React puis Angular câble
  ses entrées sur le contrat du cœur, via **une primitive fine partagée par framework**.

Ce que le standard partage : **la logique (fonctions pures) et les données (types plats)**.
Ce que chaque framework garde : **sa couche de liaison idiomatique** (collecte des entrées,
events, contenu). La divergence props React/Angular vit entièrement dans cette couche et
n'atteint jamais le calcul des classes.

## Périmètre

**Dans le périmètre :** le contrat cœur finalisé, les primitives `createUseStyle` (React) et
`createStyle` (Angular), la sortie de React du moteur, et la **validation** en conformant
`Button` (React + Angular) et `TextField` (React).

**Hors périmètre (standards/travaux ultérieurs) :**
- **C.** La couche runtime d'interaction — ripple / state-layer (composant `State`, utilisé par
  11 composants React), hover/focus runtime. Standard séparé qui s'appuiera sur celui-ci.
- Le déroulé des 26 autres composants (plan séparé, une fois ce standard validé).

## A. Contrat du cœur (par composant)

Chaque composant expose dans `@udixio/core` :

```ts
// xxx.interface.ts — DONNÉES agnostiques uniquement
export interface ButtonProps {
  variant?: 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'primary' | 'secondary';
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  disabled?: boolean;
  disableTextMargins?: boolean;
  loading?: boolean;
  shape?: 'squared' | 'rounded';
  allowShapeTransformation?: boolean;
  onToggle?: (isActive: boolean) => void;   // callback à signature simple : OK
  activated?: boolean;
  label?: string;
}
export interface ButtonStates { isActive: boolean }
export interface ButtonInterface {
  type: 'button';
  props: ButtonProps;
  states: ButtonStates;
  elements: ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];
}
// xxx.style.ts — fonction PURE
export const buttonStyle = defaultClassNames<ButtonInterface>('button', buttonConfig);
```

### Décisions figées (anti-dette)

1. **Retrait de `ActionOrLink` du contrat de style.** L'interface de style utilise
   `type: 'button'` (l'élément primaire), **pas** `ActionOrLink<Props>`. Le polymorphisme
   lien/bouton (`href`, `as`) est une préoccupation de **rendu** → il vit dans la couche
   framework. C'est ce qui supprime le `href: undefined` à la racine : `href` n'est plus dans
   l'ensemble de complétude du style.

2. **Règle states-vs-props :**
   - Donnée **saisie** par l'utilisateur qui pilote le style → `props`.
   - Booléen **calculé** par le composant (interaction : `isActive`, `isFocused` ; ou dérivé d'un
     élément framework, ex. `leadingIconInteractive`) → `states`.
   - Justification : `ReactProps<T>` ne diffuse que `T['props']` ; mettre les flags calculés dans
     `states` les empêche de fuiter comme props publiques / attributs DOM.

3. **`RequiredNullable` conservé, requalifié en garde-fou.** La signature de `defaultClassNames`
   garde `RequiredNullable<T['props']>`, ce qui **oblige l'auteur à acquitter chaque prop de
   style** — protection contre l'oubli de câblage d'une prop lors de l'écriture des 28×2
   composants. Comme `props` est resserré au strict nécessaire au style (décision 1 + 2),
   l'ensemble à fournir reste petit ; un `x: undefined` résiduel est un opt-out **documenté**
   pour une prop que ce composant ne supporte pas.

4. **Hook de personnalisation.** `className?: string | ClassNameComponent<Interface>` fait partie
   de la signature de `xxxStyle`. `ClassNameComponent<T> = (state: T['states'] & T['props']) =>
   Partial<Record<element, string>>` reçoit l'état complet → personnalisation via état **interne**
   (`isActive`) **et externe** (`variant`, …). Chaque framework **doit** exposer un input/prop
   `className` de ce type et le transmettre.

### Primitives pures du cœur (inchangées, restent le contrat)

`classNames`, `getClassNames`, `defaultClassNames`, types `ClassNameComponent`, `StyleProps`,
`ComponentInterface`. Aucune dépendance framework.

## B1. Recette + primitive React

Fichier `packages/ui-react/src/lib/components/xxx.react.ts` :
```ts
export type ReactButtonProps = ReactProps<ButtonInterface> & {
  children?: ReactNode;
  icon?: Icon;
  iconPosition?: 'left' | 'right';
  href?: string;            // polymorphisme lien/bouton = couche framework
  transition?: Transition;
};
export const useButtonStyle = createUseStyle(buttonStyle);
```

**Correction de `createUseStyle`** (`packages/ui-react/src/lib/utils/create-use-style.ts`) : la
version actuelle `useMemo(() => styleFn(state), [state])` ne mémoïse pas (l'objet `state` est neuf
à chaque rendu). On la corrige **une fois** pour mémoïser sur une **comparaison shallow** des
valeurs de l'état (parité avec le `computed` Angular) :
```ts
export function createUseStyle<S extends object>(
  styleFn: (state: S) => Record<string, string>,
): (state: S) => Record<string, string> {
  return (state: S) => {
    const ref = useRef<{ state: S; result: Record<string, string> } | null>(null);
    if (!ref.current || !shallowEqual(ref.current.state, state)) {
      ref.current = { state, result: styleFn(state) };
    }
    return ref.current.result;
  };
}
```
`shallowEqual` : petit utilitaire local (comparaison clé-à-clé de 1 niveau).

Le composant assemble l'état complet (garde-fou de complétude) et appelle `useButtonStyle(state)`,
en transmettant les **vraies** valeurs (dont `href` s'il expose le binding, et `className`).

## B2. Recette + primitive Angular

Nouveau helper partagé `packages/ui-angular/src/lib/utils/create-style.ts` :
```ts
import { computed, type Signal } from '@angular/core';

export function createStyle<S>(
  styleFn: (state: S) => Record<string, string>,
  state: () => S,
): Signal<Record<string, string>> {
  return computed(() => styleFn(state()));   // mémoïsation native via computed/signals
}
```

Composant standard (`packages/ui-angular/src/lib/button/button.ts`) :
```ts
readonly variant = input<ButtonProps['variant']>('filled');
readonly size = input<ButtonProps['size']>('medium');
readonly disabled = input<boolean>(false);
readonly label = input<string>('');
readonly href = input<string>();                                   // binding framework
readonly className = input<string | ClassNameComponent<ButtonInterface>>();
protected readonly isActive = signal(false);

protected readonly styles = createStyle(buttonStyle, () => ({
  variant: this.variant(), size: this.size(), disabled: this.disabled(),
  shape: undefined, disableTextMargins: undefined, loading: undefined,
  allowShapeTransformation: undefined, onToggle: undefined,
  activated: this.isActive(), label: this.label(),
  isActive: this.isActive(),
  className: this.className(),
}));
```
- Contenu : `<ng-content>` (et/ou `label`). Events : `output()`. `href`/`as` : inputs Angular.
- Le sélecteur suit le préfixe imposé par la config lint Angular (`lib-…`).

## Sortie de React du cœur

`get-classname.ts` importe encore `useMemo` (via `createUseClassNames`/`useClassNames`).
- **Cœur (pur, cible)** : ne garde que `getClassNames`, `defaultClassNames`, `classNames`,
  `ClassNameComponent`, `StyleProps`.
- `createUseClassNames`/`useClassNames` sont **remplacés** par `createUseStyle` (ui-react) et
  `createStyle` (ui-angular). Ils restent *legacy* dans le cœur tant que des composants non
  convertis les utilisent, et sont **supprimés à la fin du déroulé** des 26.
- **Cible finale (fin de déroulé, hors périmètre ici)** : `grep -rE "from '(react|motion)'"
  packages/core/src` ne renvoie rien.

## Validation & critères de succès

Le standard est validé en y **conformant** :
- **Button** — React (`button.react.ts` + `Button.tsx`) **et** Angular (`button.ts`), sur le
  contrat cœur mis à jour (retrait `ActionOrLink`, `createStyle`).
- **TextField** — React, pour exercer la règle states-vs-props sur le cas des flags calculés.

**Critères :**
- `nx build/test` verts sur `core`, `ui-react`, `ui-angular` ; lint vert sur `core` et
  `ui-angular` (le lint `ui-react` garde sa dette pré-existante hors sujet).
- `createUseStyle` mémoïse réellement (test : même état → même référence de résultat ; état
  changé → recalcul).
- La personnalisation par **fonction `className`** est démontrée par un test dans **chaque**
  framework (React + Angular), lisant état interne + externe.
- Plus aucun `href: undefined` dans les composants de référence.
- Graphe Nx acyclique (`ui-react → core`, `ui-angular → core`).

## Livrable convention

Un document court `docs/component-authoring.md` résumant la recette reproductible pour les 26 :
(1) contrat cœur `XxxProps`/`XxxStates`/`xxxStyle` ; (2) recette React (`xxx.react.ts` +
`createUseStyle` + ré-export barrel) ; (3) recette Angular (`createStyle` + inputs + `className`) ;
(4) la règle states-vs-props et le garde-fou de complétude.
