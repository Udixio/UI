# Standard d'auteur multi-framework — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figer le standard d'auteur A+B (contrat cœur + primitives/recettes React & Angular) et le valider en y conformant Button (React + Angular) et TextField (React).

**Architecture:** Le cœur `@udixio/core` expose par composant des données agnostiques (`XxxProps`), des états calculés (`XxxStates`) et une fonction de style pure `xxxStyle`. Chaque framework a UNE primitive fine : React `createUseStyle` (mémoïsation réelle), Angular `createStyle` (`computed`). Le composant assemble l'état complet (garanti par `RequiredNullable`) et appelle la primitive. Le polymorphisme lien/bouton et le contenu/évènements restent dans la couche framework.

**Tech Stack:** Nx 22, pnpm, TypeScript (TS-solution, `moduleResolution: bundler`), React 19 + vitest, Angular 20 (standalone/signals) + jest.

## Global Constraints

- Toutes les commandes `nx` sont préfixées de `NX_IGNORE_UNSUPPORTED_TS_SETUP=true`.
- `moduleResolution: bundler` partout — imports relatifs **sans** extension `.js`.
- **`RequiredNullable` reste** dans `defaultClassNames` : garantie « déclaré == câblé ». **Aucune prop creuse** — pas de `x: undefined` ; chaque prop de `XxxProps` est un vrai input transmis.
- **Règle states-vs-props** : donnée agnostique saisie et transmise → `props` ; booléen calculé par le composant → `states` (jamais dans `props`, pour ne pas fuiter au DOM via `ReactProps`).
- Ne PAS toucher aux 26 autres composants, ni `apps/doc/*`, ni `.superpowers/`. Ne pas modifier la logique de classes de `buttonConfig`/`textFieldConfig`.
- Les hooks legacy du cœur (`createUseClassNames`/`useClassNames`) restent en place (supprimés à la fin du déroulé, hors périmètre).
- Commits fréquents ; message terminé par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Mémoïsation réelle de `createUseStyle` (primitive React)

**Files:**
- Create: `packages/ui-react/src/lib/utils/shallow-equal.ts`
- Modify: `packages/ui-react/src/lib/utils/create-use-style.ts`
- Test: `packages/ui-react/src/tests/createUseStyle.spec.tsx`

**Interfaces:**
- Produces: `shallowEqual(a, b): boolean` ; `createUseStyle<S extends object>(styleFn: (s: S) => Record<string,string>): (s: S) => Record<string,string>` — mémoïse sur comparaison shallow des valeurs de `s`.

- [ ] **Step 1: Écrire le test de mémoïsation par valeur (échoue)**

Remplacer le 2ᵉ test de `packages/ui-react/src/tests/createUseStyle.spec.tsx` (le test « mémoïse tant que le state ne change pas ») par celui-ci, et garder le 1ᵉʳ test tel quel :

```tsx
  it('mémoïse sur égalité shallow (nouvel objet, mêmes valeurs → même référence de résultat)', () => {
    const style = (s: { n: number }) => ({ root: String(s.n) });
    const useStyle = createUseStyle(style);
    const { result, rerender } = renderHook(({ s }) => useStyle(s), {
      initialProps: { s: { n: 1 } },
    });
    const first = result.current;
    rerender({ s: { n: 1 } }); // nouvel objet, même valeur → mémoïsé
    expect(result.current).toBe(first);
    rerender({ s: { n: 2 } }); // valeur changée → recalcul
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ root: '2' });
  });
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "createUseStyle|même référence|✗|failed"`
Expected: le nouveau test ÉCHOUE (l'impl actuelle avec `[state]` recalcule à chaque nouvel objet → `result.current` ≠ `first`).

- [ ] **Step 3: Créer `shallow-equal.ts`**

```ts
export function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
```

- [ ] **Step 4: Réécrire `create-use-style.ts`**

```ts
import { useRef } from 'react';
import { shallowEqual } from './shallow-equal';

export function createUseStyle<S extends object>(
  styleFn: (state: S) => Record<string, string>,
): (state: S) => Record<string, string> {
  return (state: S) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef<{ state: S; result: Record<string, string> } | null>(
      null,
    );
    if (
      !ref.current ||
      !shallowEqual(
        ref.current.state as Record<string, unknown>,
        state as Record<string, unknown>,
      )
    ) {
      ref.current = { state, result: styleFn(state) };
    }
    return ref.current.result;
  };
}
```

- [ ] **Step 5: Lancer les tests (succès attendu)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "Test Files|Tests |failed"`
Expected: tous verts (Button 20 + createUseStyle 2 + éventuels autres).

- [ ] **Step 6: Commit**

```bash
git add packages/ui-react/src/lib/utils/shallow-equal.ts packages/ui-react/src/lib/utils/create-use-style.ts packages/ui-react/src/tests/createUseStyle.spec.tsx
git commit -m "fix(ui-react): make createUseStyle memoize on shallow-equal state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Retirer `ActionOrLink` du contrat de style de Button + aligner le Button React

**Files:**
- Modify: `packages/core/src/lib/interfaces/button.interface.ts`
- Modify: `packages/ui-react/src/lib/components/button.react.ts`
- Modify: `packages/ui-react/src/lib/components/Button.tsx` (retirer `href` de l'appel `useButtonStyle`)
- Test: `packages/ui-react/src/tests/Button.spec.tsx` (ajouter le test `className`-fonction)

**Interfaces:**
- Consumes: Task 1 `createUseStyle`.
- Produces (core): `ButtonInterface = { type: 'button'; props: ButtonProps; states: { isActive: boolean }; elements: [...] }` (plus d'`ActionOrLink`).
- Produces (ui-react): `ReactButtonProps` avec `href?: string` ajouté.

- [ ] **Step 1: Écrire le test `className`-fonction (échoue si régression)**

Ajouter à `packages/ui-react/src/tests/Button.spec.tsx` (adapter l'import `render`/`screen` à ceux déjà utilisés dans le fichier) :

```tsx
  it('accepte className en fonction, lisant état interne (isActive) et externe (variant)', () => {
    render(
      <Button
        label="X"
        variant="tonal"
        activated
        className={(s) => ({ button: `v-${s.variant} a-${s.isActive}` })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('v-tonal'); // prop externe câblée
    expect(button.className).toContain('a-true'); // état interne câblé
  });
```

- [ ] **Step 2: Lancer le test (doit passer — preuve de capacité)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "className en fonction|Tests |failed"`
Expected: le test **passe** — `Button.tsx` transmet déjà `variant` et `isActive` (via `activated`) à `useButtonStyle`, donc la fonction `className` les lit. Ce test est une **preuve du contrat de personnalisation** ; le refactor des steps suivants (retrait d'`ActionOrLink`) ne doit pas le casser (revérifié au Step 6). S'il échoue ici, c'est que `variant`/`isActive` ne sont pas câblés → à corriger avant de continuer.

- [ ] **Step 3: Rendre `ButtonInterface` explicite (retrait d'`ActionOrLink`)**

Dans `packages/core/src/lib/interfaces/button.interface.ts` : retirer l'import `ActionOrLink` et remplacer la déclaration finale par une interface explicite. Résultat complet du bas du fichier :

```ts
type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export interface ButtonInterface {
  type: 'button';
  props: ButtonProps;
  states: { isActive: boolean };
  elements: Elements;
}
```
(La 1ʳᵉ ligne `import { ActionOrLink } from '../utils';` est supprimée. `ButtonProps` reste inchangé.)

- [ ] **Step 4: Ajouter `href` à `ReactButtonProps`**

Dans `packages/ui-react/src/lib/components/button.react.ts`, ajouter `href?: string;` à l'objet de bindings :

```ts
export type ReactButtonProps = ReactProps<ButtonInterface> & {
  children?: ReactNode;
  icon?: Icon;
  iconPosition?: 'left' | 'right';
  href?: string;
  transition?: Transition;
};
```

- [ ] **Step 5: Retirer `href` de l'appel `useButtonStyle` dans `Button.tsx`**

Dans `packages/ui-react/src/lib/components/Button.tsx`, l'objet passé à `useButtonStyle({ ... })` contient une ligne `href,`. La **supprimer** (href n'est plus une donnée de style ; il reste destructuré des props et utilisé pour le rendu `<a>`/`elementProps`). Ne rien changer d'autre.

- [ ] **Step 6: Vérifier build core + tests + garde-fou**

Run:
```
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build core --skip-nx-cache 2>&1 | grep -E "Successfully|error TS"
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "Test Files|Tests |failed"
grep -nE "ActionOrLink" packages/core/src/lib/interfaces/button.interface.ts || echo "OK: plus d'ActionOrLink dans button.interface"
```
Expected: build core OK ; Button 20 tests + le nouveau test `className` verts ; plus d'`ActionOrLink`.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lib/interfaces/button.interface.ts packages/ui-react/src/lib/components/button.react.ts packages/ui-react/src/lib/components/Button.tsx packages/ui-react/src/tests/Button.spec.tsx
git commit -m "refactor(core): drop ActionOrLink from Button style contract; href is a React binding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Primitive Angular `createStyle`

**Files:**
- Create: `packages/ui-angular/src/lib/utils/create-style.ts`
- Test: `packages/ui-angular/src/lib/utils/create-style.spec.ts`

**Interfaces:**
- Produces: `createStyle<S>(styleFn: (s: S) => Record<string,string>, state: () => S): Signal<Record<string,string>>` — enveloppe `computed` (mémoïsation native signals).

- [ ] **Step 1: Écrire le test (échoue)**

```ts
// packages/ui-angular/src/lib/utils/create-style.spec.ts
import { signal } from '@angular/core';
import { createStyle } from './create-style';

describe('createStyle', () => {
  it('calcule le résultat de la fonction de style et recalcule au changement de signal', () => {
    const n = signal(1);
    const styles = createStyle(
      (s: { n: number }) => ({ root: String(s.n) }),
      () => ({ n: n() }),
    );
    expect(styles()).toEqual({ root: '1' });
    n.set(2);
    expect(styles()).toEqual({ root: '2' });
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-angular --skip-nx-cache 2>&1 | grep -E "createStyle|Cannot find|FAIL"`
Expected: FAIL (module `create-style` introuvable).

- [ ] **Step 3: Implémenter `create-style.ts`**

```ts
import { computed, type Signal } from '@angular/core';

/**
 * Primitive Angular : enveloppe une fonction de style pure de @udixio/core
 * dans un `computed`, qui mémoïse nativement sur les signaux lus par `state`.
 */
export function createStyle<S>(
  styleFn: (state: S) => Record<string, string>,
  state: () => S,
): Signal<Record<string, string>> {
  return computed(() => styleFn(state()));
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-angular --skip-nx-cache 2>&1 | grep -E "Tests:|createStyle|passed|failed"`
Expected: le test `createStyle` passe.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-angular/src/lib/utils/create-style.ts packages/ui-angular/src/lib/utils/create-style.spec.ts
git commit -m "feat(ui-angular): add createStyle signal primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Conformer le Button Angular au standard (createStyle, vrais inputs, className)

**Files:**
- Modify: `packages/ui-angular/src/lib/button/button.ts`
- Test: `packages/ui-angular/src/lib/button/button.spec.ts` (ajouter le test `className`-fonction)

**Interfaces:**
- Consumes: Task 2 `ButtonInterface`/`buttonStyle` (sans `ActionOrLink`) ; Task 3 `createStyle`.

- [ ] **Step 1: Réécrire `button.ts` (tous les inputs réels, `createStyle`, `className`, zéro `undefined`)**

Remplacer intégralement `packages/ui-angular/src/lib/button/button.ts` par :

```ts
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  buttonStyle,
  type ButtonProps,
  type ClassNameComponent,
  type ButtonInterface,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';

/**
 * Exemple/référence : Button Angular consommant le cœur agnostique.
 * Chaque prop de ButtonProps est un vrai input, transmis avec sa valeur
 * (RequiredNullable l'impose) — aucune prop creuse. `href` est un binding
 * de rendu (couche framework), hors contrat de style.
 */
@Component({
  selector: 'lib-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="styles()['button']"
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.aria-pressed]="onToggle() ? isActive() : null"
      (click)="handleClick()"
    >
      <span [class]="styles()['label']">{{ label() }}</span>
    </button>
  `,
})
export class Button {
  readonly type = input<NonNullable<ButtonProps['type']>>('button');
  readonly variant = input<ButtonProps['variant']>('filled');
  readonly size = input<ButtonProps['size']>('medium');
  readonly disabled = input<boolean>(false);
  readonly disableTextMargins = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly shape = input<ButtonProps['shape']>('rounded');
  readonly allowShapeTransformation = input<boolean>(false);
  readonly label = input<string>('');
  readonly onToggle = input<ButtonProps['onToggle']>();
  readonly className = input<string | ClassNameComponent<ButtonInterface>>();
  readonly href = input<string>(); // binding de rendu (<a>/<button>)

  readonly toggled = output<boolean>();

  protected readonly isActive = signal(false);

  protected readonly styles = createStyle(buttonStyle, () => ({
    type: this.type(),
    variant: this.variant(),
    size: this.size(),
    disabled: this.disabled(),
    disableTextMargins: this.disableTextMargins(),
    loading: this.loading(),
    shape: this.shape(),
    allowShapeTransformation: this.allowShapeTransformation(),
    onToggle: this.onToggle(),
    activated: this.isActive(),
    label: this.label(),
    isActive: this.isActive(),
    className: this.className(),
  }));

  protected handleClick(): void {
    if (this.disabled() || !this.onToggle()) {
      return;
    }
    this.isActive.update((active) => !active);
    this.onToggle()?.(this.isActive());
    this.toggled.emit(this.isActive());
  }
}
```
Note : le template utilise l'accès par crochets `styles()['button']`/`['label']` (et non `.button`), car `noPropertyAccessFromIndexSignature` est actif et la primitive `createStyle` renvoie `Record<string, string>`.

- [ ] **Step 2: Ajouter le test `className`-fonction (état interne + externe)**

Ajouter à `packages/ui-angular/src/lib/button/button.spec.ts` :

```ts
  it('accepte className en fonction, lisant état externe (variant) et interne (isActive)', () => {
    fixture.componentRef.setInput('variant', 'tonal');
    fixture.componentRef.setInput('className', (s: { variant?: string; isActive?: boolean }) => ({
      button: `v-${s.variant} a-${s.isActive}`,
    }));
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('v-tonal');
    expect(button.className).toContain('a-false');
  });
```

- [ ] **Step 3: Vérifier build + tests + absence de `undefined`**

Run:
```
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx build ui-angular --skip-nx-cache 2>&1 | grep -E "Built Angular Package|Successfully ran|error TS"
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-angular --skip-nx-cache 2>&1 | grep -E "Tests:|passed|failed"
grep -nE ": undefined" packages/ui-angular/src/lib/button/button.ts && echo "ÉCHEC: prop creuse" || echo "OK: aucune prop creuse"
```
Expected: build ui-angular OK ; tests verts (dont le nouveau) ; aucune `: undefined`.

- [ ] **Step 4: Lint Angular (sélecteur/préfixe)**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx lint ui-angular --skip-nx-cache 2>&1 | grep -E "problem|Successfully"`
Expected: `Successfully` (sélecteur `lib-button` conforme). Si erreur d'import inutilisé (`computed`), la corriger puis relancer.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-angular/src/lib/button/button.ts packages/ui-angular/src/lib/button/button.spec.ts
git commit -m "refactor(ui-angular): Button follows the authoring standard (createStyle, real inputs, className)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Vérifier la conformité de TextField (React) au standard

**Files:**
- Verify only: `packages/core/src/lib/interfaces/text-field.interface.ts`, `packages/core/src/lib/styles/text-field.style.ts`, `packages/ui-react/src/lib/components/text-field.react.ts`

**Interfaces:**
- Consumes: Task 1 `createUseStyle` (utilisé transitivement par `useTextFieldStyle`).

- [ ] **Step 1: Vérifier states-vs-props et absence d'`ActionOrLink`**

Run:
```
grep -nE "ActionOrLink|from 'react'|from 'motion'" packages/core/src/lib/interfaces/text-field.interface.ts && echo "ÉCHEC" || echo "OK: interface agnostique, sans ActionOrLink"
grep -nE "leadingIconInteractive|trailingIconInteractive" packages/core/src/lib/interfaces/text-field.interface.ts
```
Expected : aucun `ActionOrLink`/react/motion ; les deux flags `*Interactive` apparaissent **sous `TextFieldStates`** (le step 2 le confirme structurellement).

- [ ] **Step 2: Confirmer que les flags sont dans `states`, pas dans `props`**

Lire `packages/core/src/lib/interfaces/text-field.interface.ts` et vérifier que `leadingIconInteractive`/`trailingIconInteractive` sont déclarés dans le type des `states` (membre `states:` de `TextFieldInterface`) et **pas** dans le type des `props`. Si (et seulement si) ils sont encore dans `props`, les déplacer vers `TextFieldStates` (comme pour Button/pilote) ; sinon ne rien changer.

- [ ] **Step 3: Confirmer l'usage de la primitive et la non-régression**

Run:
```
grep -nE "createUseStyle\(textFieldStyle\)" packages/ui-react/src/lib/components/text-field.react.ts && echo "OK: useTextFieldStyle via createUseStyle"
NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx test ui-react --skip-nx-cache 2>&1 | grep -E "Test Files|Tests |failed"
```
Expected : `useTextFieldStyle = createUseStyle(textFieldStyle)` présent ; suite ui-react verte.

- [ ] **Step 4: Commit (uniquement si une correction a été nécessaire au Step 2)**

Si aucun changement : passer ce step (rien à committer). Sinon :
```bash
git add packages/core/src/lib/interfaces/text-field.interface.ts
git commit -m "refactor(core): move TextField interactive flags to states (conformance)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Document de convention `docs/component-authoring.md`

**Files:**
- Create: `docs/component-authoring.md`

- [ ] **Step 1: Écrire le document**

Créer `docs/component-authoring.md` avec ce contenu :

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add docs/component-authoring.md
git commit -m "docs: component authoring standard (core contract + React/Angular recipes)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Vérification finale du standard

**Files:** aucun (vérification).

- [ ] **Step 1: Build + test des trois packages**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx run-many -t build test -p core ui-react ui-angular --skip-nx-cache 2>&1 | grep -E "Successfully ran|Failed tasks|- @udixio|- ui-angular"`
Expected: tout vert (pas d'échec).

- [ ] **Step 2: Lint core + ui-angular**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx run-many -t lint -p core ui-angular --skip-nx-cache 2>&1 | grep -E "Successfully ran|Failed"`
Expected: `Successfully` (le lint `ui-react` garde sa dette pré-existante et n'est pas dans cette commande).

- [ ] **Step 3: Aucune prop creuse dans les références**

Run: `grep -rnE ": undefined" packages/ui-angular/src/lib/button/button.ts packages/ui-react/src/lib/components/Button.tsx && echo "ÉCHEC" || echo "OK: aucune prop creuse"`
Expected: `OK`.

- [ ] **Step 4: Graphe acyclique**

Run: `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/nx graph --file=/tmp/graph.json >/dev/null 2>&1 && node -e "const g=require('/tmp/graph.json').graph.dependencies; const c=(g['@udixio/core']||g['core']||[]).map(d=>d.target); console.log('core deps:', JSON.stringify(c), '| cycle:', c.some(t=>/ui-react|ui-angular/.test(t)))"`
Expected: `core deps: [] | cycle: false`.
