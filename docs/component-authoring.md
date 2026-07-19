# Écrire un composant (standard multi-framework)

Le style vit **une seule fois** dans `@udixio/core` (fonction pure + données).
Chaque framework ajoute une couche de liaison fine.

## 1. Cœur (`@udixio/core`), par composant

```ts
// xxx.interface.ts
export interface XxxProps {           // DONNÉES agnostiques réellement câblées (personnalisables)
  variant?: ...; size?: ...; disabled?: boolean; /* callbacks à signature simple OK */
}
export interface XxxStates { isActive: boolean } // booléens CALCULÉS par le composant
export interface XxxInterface {
  type: 'button'; props: XxxProps; states: XxxStates; elements: ['xxx', ...];
}
// xxx.style.ts
export const xxxStyle = defaultClassNames<XxxInterface>('xxx', xxxConfig); // PURE
```

Règles :
- **`props`** = données agnostiques exposées ET transmises par le composant (pas « ce que lit le
  style par défaut »). Une prop déclarée mais non câblée (« creuse ») est **interdite** : la
  signature `RequiredNullable` force `déclaré == câblé` à la compilation.
- **`states`** = booléens calculés (`isActive`, `isFocused`, `leadingIconInteractive`…). Jamais
  dans `props` (sinon ils fuient au DOM via `ReactProps`).
- Pas de type framework dans le cœur (`ReactNode`, `RefObject`, `Transition`, signaux…). Pas
  d'`ActionOrLink` dans le contrat de style : lien/bouton (`href`, `as`) = couche framework.

## 2. React (`@udixio/ui-react`)

```ts
// xxx.react.ts
export type ReactXxxProps = ReactProps<XxxInterface> & {
  children?: ReactNode; icon?: Icon; href?: string; transition?: Transition; // bindings React
};
export const useXxxStyle = createUseStyle(xxxStyle);
```
Ré-exporter `xxx.react` depuis `components/index.ts`. Le composant assemble l'état complet
(toutes les props + states + `className`) et appelle `useXxxStyle(state)`.

## 3. Angular (`@udixio/ui-angular`)

```ts
readonly variant = input<XxxProps['variant']>('...');   // un input par prop, valeur réelle
readonly className = input<string | ClassNameComponent<XxxInterface>>();
protected isActive = signal(false);
protected styles = createStyle(xxxStyle, () => ({ /* toutes les props+states+className */ }));
```
Contenu via `<ng-content>` ; events via `output()` ; `href`/`as` = inputs Angular. Sélecteur
préfixé `lib-…`.

## 4. Personnalisation

`className` accepte `string | (state) => Partial<Record<element, string>>`. La fonction reçoit
l'état complet (interne `isActive` + externe `variant`, …) — d'où l'importance de la règle
« pas de prop creuse ».

## 5. Vérification du typage (obligatoire par composant)

La garantie « déclaré == câblé » (via `RequiredNullable`) n'a de valeur que si le type-checker
tourne. **`nx build`/`nx test` de `ui-react` ne vérifient PAS les types** (Vite + vitest).
Chaque composant converti doit donc passer :

```
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.lib.json --noEmit
```

sans erreur **sur son fichier** (l'appel `useXxxStyle({...})` doit ne contenir que les clés de
`XxxProps` + `states` + `className` — ni binding React en trop, ni clé omise). Côté Angular,
`nx build ui-angular` (ng-packagr) fait un vrai `tsc` : l'erreur est bloquante d'office.

> **Dette / fin de déroulé :** `ui-react` a des erreurs `tsc` pré-existantes (composants non
> encore convertis + typage de rendu React). Un **gate CI `tsc --noEmit`** sur `ui-react` sera
> **activé à la fin du déroulé**, une fois les 26 composants convertis et typecheck-propres —
> même échéance que le retrait de `react`/`motion` du cœur.

**Limite connue des primitives :** `createUseStyle`/`createStyle` renvoient `Record<string,string>`,
donc une faute de frappe sur une clé d'élément (`styles.buton`) n'est pas détectée. Améliorer les
primitives pour préserver `Record<T['elements'][number], string>` est un chantier séparé.
