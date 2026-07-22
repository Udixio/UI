# Standard de comportement multi-framework

Ce document définit le contrat runtime commun à React et Angular. Il complète
le standard d'auteur des composants : le cœur partage les règles, les
adaptateurs ne font que relier ces règles au modèle réactif du framework.

## 1. Nommer l'état selon sa sémantique

`active` est trop ambigu pour faire partie d'une API publique. Chaque famille
utilise le vocabulaire ARIA et métier correspondant :

| Composant       | Valeur     | Valeur initiale   | Notification     | État résolu  |
| --------------- | ---------- | ----------------- | ---------------- | ------------ |
| Button toggle   | `pressed`  | `defaultPressed`  | `pressedChange`  | `isPressed`  |
| Checkbox/Switch | `checked`  | `defaultChecked`  | `checkedChange`  | `isChecked`  |
| Chip/Option     | `selected` | `defaultSelected` | `selectedChange` | `isSelected` |
| Menu/Dialog     | `open`     | `defaultOpen`     | `openChange`     | `isOpen`     |

En React, la notification est préfixée par `on` (`onPressedChange`). En
Angular, l'output reprend exactement le nom `pressedChange`, ce qui permet
aussi `[(pressed)]`.

## 2. Contrat contrôlé / non contrôlé

- Une valeur différente de `undefined` rend le composant **contrôlé**. Elle est
  l'unique source de vérité ; une interaction notifie le parent sans modifier
  localement la valeur rendue.
- Sans valeur contrôlée, le composant est **non contrôlé**. Il capture
  `defaultXxx` une fois à l'initialisation, puis possède son état.
- Changer de mode pendant la durée de vie du composant est une erreur d'usage.
- Une transition identique à la valeur courante n'émet rien.
- La notification est émise exactement une fois par transition acceptée.

Les primitives de référence sont `useControllableState` dans `ui-react` et
`createControllableState` dans `ui-angular`.

## 3. Séparer mode, valeur et événement

La présence d'un callback ne doit jamais modifier le style ou activer un mode.
Pour Button :

- `toggleable` active la sémantique et le rendu `aria-pressed` ;
- `pressed` / `defaultPressed` portent la valeur ;
- `onPressedChange` / `pressedChange` notifient une demande de transition ;
- `onClick` reste un événement d'action indépendant.

Un lien de navigation courant utilise `aria-current`, pas `pressed`.

## 4. Transitions pures dans le cœur

Toute règle partagée qui décide si une interaction est acceptée ou quel est
son prochain état est une fonction pure de `@udixio/core`. Elle ne dépend ni du
DOM, ni de React, ni d'Angular. Les adaptateurs appliquent ensuite le résultat
avec leur primitive d'état contrôlable.

Les états pointeur (`hover`, `focus-visible`, `active`) restent en CSS tant
qu'ils n'affectent pas une logique métier ou une API d'accessibilité.

### Effets visuels pilotés par le DOM

Les effets nécessitant des coordonnées, un geste ou une animation impérative
vivent dans le sous-module `@udixio/core/dom`, jamais dans un adaptateur de
framework. Ce sous-module utilise l'API JavaScript de Motion et retourne une
fonction de nettoyage.

- React connecte le contrôleur dans `useEffect` ;
- Angular le connecte dans `afterRenderEffect` ;
- le contrôleur Motion, les durées, le filtrage pointer/clavier et
  `prefers-reduced-motion` sont uniques et partagés ;
- les adaptateurs rendent la même structure (`touchTarget`, `stateLayer`,
  contenu et indicateur de chargement).

Lorsqu'un composant expose `transition`, il utilise directement le contrat
`Transition` de Motion dans ses props communes. Les adaptateurs ne le
convertissent jamais en raccourci CSS et le cœur ne fusionne pas une transition
fournie avec des valeurs par défaut cachées. Pour une transformation de forme,
Motion anime le rayon du composant interactif et le `stateLayer` hérite de ce
rayon : ils partagent ainsi, à chaque frame, une seule valeur géométrique.

Une implémentation `motion/react` et une réécriture Angular équivalente sont
interdites pour un même effet : elles dériveraient inévitablement.

## 5. Matrice de tests obligatoire

Chaque état interactif doit avoir les mêmes scénarios dans les deux packages :

1. initialisation et transition non contrôlées ;
2. demande de transition contrôlée sans mutation locale ;
3. mise à jour par le propriétaire contrôlé ;
4. absence de transition quand le composant est bloqué ;
5. attribut ARIA correspondant ;
6. exposition de l'état résolu à `className` ;
7. test unitaire de la transition pure dans le cœur.

Cette matrice est une condition d'acceptation, pas une convention facultative.
