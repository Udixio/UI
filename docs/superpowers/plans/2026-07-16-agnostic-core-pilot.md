# Cœur agnostique (pilote Button + TextField) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renommer `@udixio/styles` en `@udixio/core`, puis découpler `Button` et `TextField` de React (interfaces agnostiques + fonctions de style pures + bindings/hook React dans ui-react), en preuve de pattern.

**Architecture:** Approche A (Hybride). Le cœur expose une interface de props agnostique + `xxxStyle(state)` pure ; ui-react étend par composition (`children`, `ref`, `icon`, `transition`) et fournit le hook `createUseStyle`. Les 26 autres composants restent inchangés (dette transitionnelle assumée).

**Tech Stack:** Nx 22, pnpm, Vite (lib), TypeScript (setup TS-solution, `moduleResolution: bundler`), vitest, React 19.

## Global Constraints

- Toutes les commandes `nx` sont préfixées de `NX_IGNORE_UNSUPPORTED_TS_SETUP=true`.
- Le cœur utilise `moduleResolution: bundler` — imports relatifs **sans** extension `.js`.
- Fichiers convertis (`button`/`text-field` `.style.ts` + `.interface.ts`) : **aucun** import `react`/`motion`.
- Ne PAS toucher aux 26 autres composants ni à `apps/doc/*` ni à `.superpowers/`.
- Commits fréquents ; messages terminés par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Renommer `@udixio/styles` → `@udixio/core`

**Files:**
- Rename dir: `packages/styles/` → `packages/core/`
- Modify: `packages/core/package.json` (name, vite `lib.name`), `packages/core/vite.config.mts`
- Modify: `tsconfig.base.json` (alias paths), `tsconfig.json` (référence), `packages/ui-react/tsconfig.lib.json` (référence)
- Modify: tous les fichiers important `@udixio/styles` (ui-react `src/`, tests)

**Interfaces:**
- Produces: package `@udixio/core` à `packages/core`, alias `@udixio/core` → `packages/core/src/index.ts`.

- [ ] **Step 1: Déplacer le dossier avec historique git**

```bash
cd /home/joel/Documents/projets/udixio/ui/components
git mv packages/styles packages/core
```

- [ ] **Step 2: Renommer le package dans les configs**

Dans `packages/core/package.json` : `"name": "@udixio/core"`.
Dans `packages/core/vite.config.mts` : remplacer les deux `@udixio/styles` (`test.name`, `build.lib.name`) et `cacheDir: '../../node_modules/.vite/packages/core'` par `packages/core`.
Dans `tsconfig.base.json` : `"@udixio/core": ["./packages/core/src/index.ts"]`.
Dans `tsconfig.json` racine : la référence `./packages/styles` → `./packages/core`.
Dans `packages/ui-react/tsconfig.lib.json` : la référence `../styles/tsconfig.lib.json` → `../core/tsconfig.lib.json`.

- [ ] **Step 3: Réécrire tous les imports `@udixio/styles` → `@udixio/core`**

```bash
cd /home/joel/Documents/projets/udixio/ui/components
grep -rl "@udixio/styles" packages/ui-react/src | while read -r f; do
  perl -i -pe "s#\@udixio/styles#\@udixio/core#g" "$f"
done
# vérif : plus aucune occurrence
grep -rn "@udixio/styles" packages/ | grep -v "docs/" || echo "OK: plus de @udixio/styles"
```

- [ ] **Step 4: Réinstaller et vérifier build + graphe acyclique**

```bash
pnpm install --silent
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build core --skip-nx-cache 2>&1 | grep -E "Successfully|error TS" | head
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build ui-react --skip-nx-cache 2>&1 | grep -E "Successfully ran target build for project @udixio/ui-react" | head
```
Expected: `@udixio/core` build OK ; ui-react build OK (warnings dts pré-existants tolérés).

- [ ] **Step 5: Commit**

```bash
git add -A packages tsconfig.base.json tsconfig.json pnpm-lock.yaml nx.json
git commit -m "refactor: rename @udixio/styles to @udixio/core

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Hook `createUseStyle` dans ui-react

**Files:**
- Create: `packages/ui-react/src/lib/utils/create-use-style.ts`
- Modify: `packages/ui-react/src/lib/index.ts` (exporter le helper si pas déjà via un barrel)
- Test: `packages/ui-react/src/tests/createUseStyle.spec.tsx`

**Interfaces:**
- Consumes: `@udixio/core` `defaultClassNames` (les `xxxStyle` sont des `(state) => Record<element,string>`).
- Produces: `createUseStyle<TState>(styleFn: (s: TState) => Record<string, string>): (s: TState) => Record<string, string>` — mémoïse via `useMemo(() => styleFn(s), [s])`.

- [ ] **Step 1: Écrire le test qui échoue**

```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createUseStyle } from '../lib/utils/create-use-style';

describe('createUseStyle', () => {
  it('renvoie le résultat de la fonction de style', () => {
    const style = (s: { variant: string }) => ({ root: `v-${s.variant}` });
    const useStyle = createUseStyle(style);
    const { result } = renderHook(() => useStyle({ variant: 'filled' }));
    expect(result.current).toEqual({ root: 'v-filled' });
  });

  it('mémoïse tant que le state ne change pas', () => {
    const style = (s: { n: number }) => ({ root: String(s.n) });
    const useStyle = createUseStyle(style);
    const state = { n: 1 };
    const { result, rerender } = renderHook(({ s }) => useStyle(s), {
      initialProps: { s: state },
    });
    const first = result.current;
    rerender({ s: state });
    expect(result.current).toBe(first);
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "createUseStyle|Cannot find|FAIL" | head
```
Expected: FAIL (module `create-use-style` introuvable).

- [ ] **Step 3: Implémenter le helper**

```ts
// packages/ui-react/src/lib/utils/create-use-style.ts
import { useMemo } from 'react';

export function createUseStyle<TState>(
  styleFn: (state: TState) => Record<string, string>,
): (state: TState) => Record<string, string> {
  return (state: TState) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => styleFn(state), [state]);
}
```

Ajouter l'export dans `packages/ui-react/src/lib/index.ts` (une ligne, après les exports existants) :
```ts
export * from './utils/create-use-style';
```

- [ ] **Step 4: Lancer le test (succès attendu)**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "createUseStyle|Test Files|passed" | head
```
Expected: les 2 tests `createUseStyle` passent.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-react/src/lib/utils/create-use-style.ts packages/ui-react/src/lib/index.ts packages/ui-react/src/tests/createUseStyle.spec.tsx
git commit -m "feat(ui-react): add createUseStyle hook wrapper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Découpler `Button`

**Files:**
- Modify: `packages/core/src/lib/interfaces/button.interface.ts` (props agnostiques)
- Modify: `packages/core/src/lib/styles/button.style.ts` (retirer `useButtonStyle`, garder `buttonStyle` pur)
- Create: `packages/ui-react/src/lib/components/button.react.ts` (type `ReactButtonProps` + `useButtonStyle`)
- Modify: `packages/ui-react/src/lib/components/Button.tsx` (imports)

**Interfaces:**
- Consumes: Task 2 `createUseStyle`.
- Produces (core): `ButtonProps` (agnostique), `ButtonStates { isActive: boolean }`, `ButtonInterface`, `buttonStyle`.
- Produces (ui-react): `ReactButtonProps`, `useButtonStyle = createUseStyle(buttonStyle)`.

- [ ] **Step 1: Rendre `button.interface.ts` agnostique (cœur)**

Retirer les imports `react`/`motion` et le type `Icon`. Séparer `ButtonProps` (données de style + `onToggle`) des bindings. Résultat :

```ts
// packages/core/src/lib/interfaces/button.interface.ts
import { ActionOrLink } from '../utils';

type ButtonVariant = 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
type ButtonVariantAlias = 'primary' | 'secondary';

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  variant?: ButtonVariant | ButtonVariantAlias;
  disabled?: boolean;
  disableTextMargins?: boolean;
  loading?: boolean;
  shape?: 'squared' | 'rounded';
  allowShapeTransformation?: boolean;
  onToggle?: (isActive: boolean) => void;
  activated?: boolean;
  label?: string;
}

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export type ButtonInterface = ActionOrLink<ButtonProps> & {
  elements: Elements;
  states: { isActive: boolean };
};
```

- [ ] **Step 2: Rendre `button.style.ts` pur (cœur)**

Le corps de `buttonConfig` est inchangé (il lit déjà des données plates). Retirer l'export du hook `useButtonStyle` et l'import `createUseClassNames` ; ne garder que `buttonStyle`.

```ts
// bas de packages/core/src/lib/styles/button.style.ts
export const buttonStyle = defaultClassNames<ButtonInterface>(
  'button',
  buttonConfig,
);
```
Ajuster l'import en tête : `import { classNames, defaultClassNames } from '../utils';` (retirer `createUseClassNames`). Retirer `iconPosition`/`icon` de la déstructuration du config s'ils y sont (non lus). Garder `type ClassNameComponent` importé.

- [ ] **Step 3: Créer les bindings React `button.react.ts` (ui-react)**

```ts
// packages/ui-react/src/lib/components/button.react.ts
import type { ReactNode } from 'react';
import type { Transition } from 'motion';
import {
  buttonStyle,
  type ButtonInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import type { Icon } from '../icon';

export type ReactButtonProps = ReactProps<ButtonInterface> & {
  children?: ReactNode;
  icon?: Icon;
  iconPosition?: 'left' | 'right';
  transition?: Transition;
};

export const useButtonStyle = createUseStyle(buttonStyle);
```

- [ ] **Step 4: Recâbler `Button.tsx`**

Dans `packages/ui-react/src/lib/components/Button.tsx`, remplacer l'import de `useButtonStyle` (depuis `@udixio/core`) et du type de props par des imports depuis `./button.react` :
```ts
import { useButtonStyle, type ReactButtonProps } from './button.react';
```
Remplacer l'ancien type de props du composant (ex. `ReactProps<ButtonInterface>` / `ButtonProps`) par `ReactButtonProps`. Ne rien changer d'autre à la logique.

- [ ] **Step 5: Vérifier build + test + garde-fou**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build core --skip-nx-cache 2>&1 | grep -E "Successfully|error TS" | head
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "Button|Test Files|passed|failed" | head
grep -rE "from '(react|motion)" packages/core/src/lib/styles/button.style.ts packages/core/src/lib/interfaces/button.interface.ts || echo "OK: Button cœur sans react/motion"
```
Expected: build core OK ; `Button.spec` (20 tests) vert ; garde-fou OK.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/lib/interfaces/button.interface.ts packages/core/src/lib/styles/button.style.ts packages/ui-react/src/lib/components/button.react.ts packages/ui-react/src/lib/components/Button.tsx
git commit -m "refactor: decouple Button interface/style from React

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Découpler `TextField` (cas icônes)

**Files:**
- Modify: `packages/core/src/lib/interfaces/text-field.interface.ts`
- Modify: `packages/core/src/lib/styles/text-field.style.ts` (remplacer `React.isValidElement`)
- Create: `packages/ui-react/src/lib/components/text-field.react.ts`
- Modify: `packages/ui-react/src/lib/components/TextField.tsx`

**Interfaces:**
- Consumes: Task 2 `createUseStyle`.
- Produces (core): `TextFieldProps` agnostique avec `leadingIconInteractive?: boolean`, `trailingIconInteractive?: boolean` ; `textFieldStyle` pure.
- Produces (ui-react): `ReactTextFieldProps` (avec `leadingIcon?: ReactElement | Icon`), `useTextFieldStyle`.

- [ ] **Step 1: Repérer les props réellement lues par le style**

```bash
grep -nE "\b(leadingIcon|trailingIcon|isValidElement|variant|disabled|errorText|isFocused|value|suffix|multiline)\b" packages/core/src/lib/styles/text-field.style.ts | head -30
```
Noter les props lues → elles vont dans `TextFieldProps` (cœur). `leadingIcon`/`trailingIcon` (éléments) → remplacés par `leadingIconInteractive`/`trailingIconInteractive` booléens dans le cœur.

- [ ] **Step 2: Rendre `text-field.style.ts` pur (cœur)**

Remplacer dans le corps :
```ts
{ 'cursor-text': !React.isValidElement(leadingIcon) },
```
par
```ts
{ 'cursor-text': !leadingIconInteractive },
```
idem pour `trailingIcon` → `!trailingIconInteractive`. Retirer l'`import React from 'react'`. Mettre à jour la déstructuration : `leadingIcon, trailingIcon` → `leadingIconInteractive, trailingIconInteractive`. Retirer l'export du hook `useTextFieldStyle` (ne garder que `textFieldStyle` pur ; ajuster l'import utils comme pour Button).

- [ ] **Step 3: Rendre `text-field.interface.ts` agnostique (cœur)**

Retirer les imports `react`/`motion` et `Icon`. `TextFieldProps` ne contient que les données lues par le style, dont `leadingIconInteractive?: boolean` et `trailingIconInteractive?: boolean` (à la place des props-éléments). Conserver `TextFieldStates`, `elements`, `type`. Toute prop React non lue (handlers, `leadingIcon` élément, menu) part côté ui-react.

- [ ] **Step 4: Créer `text-field.react.ts` (ui-react) avec le calcul du booléen**

```ts
// packages/ui-react/src/lib/components/text-field.react.ts
import type { ReactElement, ReactNode } from 'react';
import {
  textFieldStyle,
  type TextFieldInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import type { Icon } from '../icon';

export type ReactTextFieldProps = ReactProps<TextFieldInterface> & {
  children?: ReactNode;
  leadingIcon?: ReactElement | Icon;
  trailingIcon?: ReactElement | Icon;
  // ...autres bindings React repris de l'ancienne interface (handlers, suffix…)
};

export const useTextFieldStyle = createUseStyle(textFieldStyle);
```

- [ ] **Step 5: Recâbler `TextField.tsx` (calcul des booléens interactifs)**

Dans `TextField.tsx`, importer `useTextFieldStyle`/`ReactTextFieldProps` depuis `./text-field.react`. Avant l'appel du hook, calculer :
```ts
import React from 'react';
const leadingIconInteractive = React.isValidElement(leadingIcon);
const trailingIconInteractive = React.isValidElement(trailingIcon);
```
et passer ces booléens (au lieu des éléments) à `useTextFieldStyle({ ...states, leadingIconInteractive, trailingIconInteractive })`. Le reste du rendu (affichage réel des icônes) reste inchangé.

- [ ] **Step 6: Vérifier build + test + garde-fou**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build core --skip-nx-cache 2>&1 | grep -E "Successfully|error TS" | head
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "Test Files|passed|failed" | head
grep -rE "from '(react|motion)" packages/core/src/lib/styles/text-field.style.ts packages/core/src/lib/interfaces/text-field.interface.ts || echo "OK: TextField cœur sans react/motion"
```
Expected: build core OK ; tests ui-react verts ; garde-fou OK.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lib/interfaces/text-field.interface.ts packages/core/src/lib/styles/text-field.style.ts packages/ui-react/src/lib/components/text-field.react.ts packages/ui-react/src/lib/components/TextField.tsx
git commit -m "refactor: decouple TextField interface/style from React

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Vérification finale du pilote

**Files:** aucun (vérification).

- [ ] **Step 1: Build + test + lint des deux packages**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx run-many -t build test lint -p core ui-react --skip-nx-cache 2>&1 | grep -E "Successfully ran|Failed tasks|- @udixio" | tail -15
```
Expected: seuls les échecs pré-existants (lint ui-react) subsistent ; `core` build/test/lint OK ; ui-react build/test OK.

- [ ] **Step 2: Garde-fou pilote (4 fichiers convertis)**

```bash
grep -rE "from '(react|motion)" \
  packages/core/src/lib/styles/button.style.ts \
  packages/core/src/lib/styles/text-field.style.ts \
  packages/core/src/lib/interfaces/button.interface.ts \
  packages/core/src/lib/interfaces/text-field.interface.ts \
  && echo "ÉCHEC: react/motion présent" || echo "OK: 4 fichiers convertis sans react/motion"
```
Expected: `OK`.

- [ ] **Step 3: Graphe acyclique**

```bash
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx graph --file=/tmp/graph.json >/dev/null 2>&1 && node -e "const g=require('/tmp/graph.json').graph.dependencies; const c=(g['@udixio/core']||g['core']||[]).map(d=>d.target); console.log('core deps:', c, '| cycle:', c.some(t=>/ui-react/.test(t)))"
```
Expected: `core deps: [] | cycle: false`.
