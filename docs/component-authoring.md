# Écrire un composant (standard multi-framework)

Le style et les transitions de comportement vivent **une seule fois** dans
`@udixio/core` (fonctions pures + données). Chaque framework ajoute une couche
de liaison fine. Le contrat détaillé des états interactifs est défini dans
[`component-behavior.md`](./component-behavior.md).

## 1. Cœur (`@udixio/core`), par composant

```ts
// xxx.interface.ts
export interface XxxProps {           // DONNÉES agnostiques réellement câblées (personnalisables)
  variant?: ...; size?: ...; disabled?: boolean; /* callbacks à signature simple OK */
}
export interface XxxStates { isSelected: boolean } // état sémantique RÉSOLU
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
- **`states`** = valeurs calculées (`isPressed`, `isSelected`, `isFocused`,
  `leadingIconInteractive`…). Jamais
  dans `props` (sinon ils fuient au DOM via `ReactProps`).
- Pas de **type framework** dans le cœur (`ReactNode`, `RefObject`, signaux…). Pas
  d'`ActionOrLink` dans le contrat de style : lien/bouton (`href`, `as`) = couche framework.
- **Les types agnostiques vont dans le cœur, même « renderables ».** `Icon`
  (`IconDefinition | SvgImport | string`) est agnostique → `icon?: Icon` vit dans `XxxProps`
  (partagé entre frameworks). Ne partent en couche framework que les types **réellement** liés à
  un framework (`ReactNode`, `RefObject`). Le type `Transition` de l'API JavaScript de Motion est
  agnostique : il vit dans le cœur lorsqu'une animation est exécutée par `@udixio/core/dom` pour
  tous les adaptateurs.
- Une icône passée comme chaîne SVG est un **asset statique de confiance**, produit par les
  packages `@udixio/icons-*`. Les adaptateurs doivent la rendre de la même manière, mais ne doivent
  jamais accepter du SVG provenant d'un utilisateur ou d'une API sans assainissement préalable.

## 2. React (`@udixio/ui-react`)

Le type de props React et le hook vivent **en haut du fichier composant** `Xxx.tsx`
(pas de fichier `.react.ts` séparé — redondant dans un package mono-framework) :

```ts
// Xxx.tsx
export type ReactXxxProps = ReactProps<XxxInterface> & {
  children?: ReactNode;
  href?: string;
};
export const useXxxStyle = createUseStyle(xxxStyle);

export const Xxx = (props: ReactXxxProps) => {
  /* … */
};
```

Le barrel `components/index.ts` exporte simplement `./Xxx`. Le composant assemble l'état complet
(toutes les props + states + `className`) et appelle `useXxxStyle(state)`.

## 3. Angular (`@udixio/ui-angular`)

```ts
readonly variant = input<XxxProps['variant']>('...');   // un input par prop, valeur réelle
readonly className = input<string | ClassNameComponent<XxxInterface>>();
protected isSelected = /* primitive d'état contrôlable */;
protected styles = createStyle(xxxStyle, () => ({ /* toutes les props+states+className */ }));
```

Contenu via `<ng-content>` ; events via `output()` ; `href`/`as` = inputs Angular. Sélecteur
préfixé `lib-…`.

## 3 bis. Svelte (`@udixio/ui-svelte`)

Svelte 5, runes uniquement. Deux fichiers par composant dans `src/lib/<xxx>/` :

```ts
// xxx.types.ts — le contrat public ET la TSDoc du composant (source du docgen)
/** Description… @status … @category … @devx … @a11y … @limitations … */
export interface SvelteXxxProps extends XxxProps {
  children?: Snippet;                                     // contenu = snippets, jamais <slot>
  class?: string;                                         // classe(s) de l'élément racine
  classes?: ElementClasses<XxxInterface> | ClassNameComponent<XxxInterface>;
  onSelectedChange?: (selected: boolean) => void;         // callbacks = noms du contrat
}
```

```svelte
<!-- Xxx.svelte -->
<script lang="ts">
  let { variant = '...', selected = $bindable(), defaultSelected = false,
        class: hostClass = '', classes, children, ...rest }: SvelteXxxProps = $props();
  const selectedState = createControllableState({
    value: () => selected, defaultValue: () => defaultSelected,
    onChange: onSelectedChange, assign: (next) => (selected = next),
  });
  const styles = createStyle(xxxStyle, () => ({ /* toutes les props+states */,
    className: mergeClassNames('xxx', classes, hostClass) }));
  $effect(() => { const c = createXxxController(...); return () => c.destroy(); });
</script>
<button {...rest} class={styles.current['xxx']}>{@render children?.()}</button>
```

- Pas d'élément hôte : l'élément racine du template porte la sémantique, `class` et les attributs
  natifs (`...rest`, typé sur les attributs communs aux éléments racines possibles).
- Valeur contrôlable = `$bindable()` ; en mode contrôlé, une transition acceptée appelle le
  callback **et** assigne la prop. Le propriétaire refuse via un function binding
  (`bind:selected={() => v, (next) => { if (ok) v = next }}`) — un enfant ne peut pas savoir si la
  prop est liée. `default*` initialise le mode non contrôlé ; le mode est fixé pour la vie du
  composant.
- Specs colocalisées `xxx.spec.ts` (vitest + `@testing-library/svelte`, jsdom) ; une spec qui
  utilise des runes s'appelle `xxx.spec.svelte.ts`. Un fixture `.fixture.svelte` exerce `bind:`,
  le function binding qui refuse, et les snippets.
- Gates : `nx test ui-svelte`, `nx typecheck ui-svelte` (svelte-check), `nx build ui-svelte`
  (svelte-package), `nx lint ui-svelte`.

## 4. Personnalisation

`className` accepte `string | (state) => Partial<Record<element, string>>`. La fonction reçoit
l'état complet (résolu `isSelected` + externe `variant`, …) — d'où l'importance de la règle
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
`nx build ui-angular` (ng-packagr) fait un vrai `tsc` : l'erreur est bloquante d'office. Côté
Svelte, `nx typecheck ui-svelte` (svelte-check) est le gate de typage : `svelte-package` émet les
déclarations sans bloquer sur les erreurs.

> **Dette / fin de déroulé :** `ui-react` a des erreurs `tsc` pré-existantes (composants non
> encore convertis + typage de rendu React). Un **gate CI `tsc --noEmit`** sur `ui-react` sera
> **activé à la fin du déroulé**, une fois les 26 composants convertis et typecheck-propres —
> même échéance que le retrait des dépendances React du cœur.

**Limite connue des primitives :** `createUseStyle`/`createStyle` renvoient `Record<string,string>`,
donc une faute de frappe sur une clé d'élément (`styles.buton`) n'est pas détectée. Améliorer les
primitives pour préserver `Record<T['elements'][number], string>` est un chantier séparé.
