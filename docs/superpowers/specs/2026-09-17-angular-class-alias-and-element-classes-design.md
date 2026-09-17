# `class` natif côté Angular et classes par élément — contrat de style multi-framework

Date : 2026-09-17
Statut : design approuvé
Périmètre : `packages/core` (`get-classname.ts`), `packages/ui-angular` (34 composants),
`packages/ui-react` (aucun changement de code, changement de type observable), `apps/doc`
(exemples Angular, page API), documentation des limitations.

## Problème

Le contrat de style `className?: string | ClassNameComponent<T>` (`packages/core/src/lib/utils/styles/get-classname.ts:22-28`)
est né en React. React n'a pas de `this` réactif : pour laisser le consommateur styler un
élément interne selon ce que le composant *est* à l'instant du rendu — sa variante, son
`disabled`, son `selected`, son `isPressed` dérivé, tout ce que le CSS ne voit pas — la seule
forme propre était un callback recevant `states & props` en entier et rendant une map
`élément → classes`. Les états d'interaction (`hover`, `focus`, `active`) ne motivent pas cette
forme : les variantes Tailwind (`hover:`, `focus-visible:`) les couvrent depuis une simple chaîne.
La chaîne simple couvrait le root.

Angular a reçu ce contrat transcrit tel quel sous l'input `classes` (renommé depuis `className`
par `8ec6c3db`). Trois conséquences :

1. **Le réflexe Angular ne marche pas.** `<udx-button class="mt-4">` est la syntaxe que tout
   développeur Angular écrit. Aucun composant n'aliase `class` (`grep "alias: 'class'"` → 0).
   Sur les 36 composants à hôte `display: contents`, la classe atterrit sur un hôte sans boîte :
   sans effet. Sur les trois dont l'hôte *est* le root (`MenuGroup`, `MenuHeadline`, `TabPanel`,
   host binding `'[class]': "styles()['x']"`), la classe statique coexiste avec les classes
   calculées sans passer par `twMerge` : `class="bg-red-500"` ne remplace pas le `bg-surface`
   interne, l'ordre du CSS Tailwind tranche. Sur les directives (`[udxBadge]`, `[udxTooltip]`),
   ça marche. Trois comportements pour une syntaxe.

2. **Styler un élément interne oblige à écrire une fonction en TS.** `[classes]="fn"` où
   `fn = () => ({ label: 'uppercase' })`. Aucune syntaxe de template ne permet aujourd'hui de
   cibler `label` statiquement, alors que le cœur déclare déjà `elements: ['button', 'label',
   'icon', …]` comme tuple typé.

3. **`classes="mt-4"` et `class="mt-4"` diraient la même chose** si l'alias existait — deux
   orthographes pour un concept, ce que le renommage `8ec6c3db` cherchait précisément à éviter.

Ce que font les bibliothèques Angular du même besoin : Material n'expose aucune classe interne
(theming par custom properties) et réserve un input par slot aux seuls overlays (`panelClass`) ;
PrimeNG expose une map par élément (`[pt]="{ root: {…}, label: {…} }"`) ; spartan-ng, la lib
Tailwind la plus proche d'Udixio, aliase `class` (`input<ClassValue>('', { alias: 'class' })`) et
fusionne avec `tailwind-merge`. Aucune n'appelle `class` autre chose que la chaîne de l'élément
principal.

## Décisions

| Décision | Choix retenu |
| --- | --- |
| Root Angular | Input aliasé `class` (`hostClass`), routé vers le root interne via le cœur, jamais posé sur l'hôte `display: contents`. |
| Slots Angular | Un seul input `classes`, type `ElementClasses<T> \| ClassNameComponent<T>`. **`string` retiré.** |
| Cœur | `className` accepte une troisième forme : l'objet statique `ElementClasses<T>`. |
| React | `className` accepte la même troisième forme. Aucun renommage. |
| Un input par élément (`labelClass`, `iconClass`, …) | **Rejeté.** |
| Précédence | Ordre fixe : défauts du style → `classes` → `class`. `twMerge` tranche les conflits. |
| Rétro-compat | Aucune. `classes="…"` (chaîne) devient une erreur de type. |

### Pourquoi pas un input par élément

TextField déclare 11 éléments, DatePicker 9, Search 9, Slider 7. Un input par élément ferait
~150 inputs `xxxClass` sur la bibliothèque, chacun avec sa TSDoc, sa ligne de docgen et son test
d'existence. Surtout, ces noms seraient écrits à la main dans 34 fichiers alors que le tuple
`elements` du cœur les possède déjà : `Partial<Record<T['elements'][number], string>>` est
*dérivé* du contrat, un élément ajouté à l'interface apparaît dans l'autocomplétion du template
sans rien toucher côté Angular. Material ne s'autorise l'input par slot que pour les overlays
parce qu'il n'y a qu'un slot.

### Pourquoi garder la forme fonction

La fonction reçoit `T['states'] & T['props']` : tout ce que le composant sait de lui-même,
props résolues et états internes confondus. Trois niveaux de besoin, trois réponses :

- **États d'interaction** (`hover`, `focus`, `active`) : les variantes Tailwind dans une chaîne
  (`class="hover:bg-primary"`, `[classes]="{ icon: 'group-hover:rotate-45' }"`). Aucune fonction
  requise, ni en React ni en Angular.
- **Ce que le consommateur fournit lui-même** (`variant`, `disabled`, un `selected` contrôlé) :
  ses propres signaux dans l'objet statique, `[classes]="{ icon: selected() ? 'x' : 'y' }"`.
- **Ce que seul le composant connaît** : les états internes non exposés (`dragging`, `open` non
  contrôlé, `isPressed` dérivé du mode contrôlé/non contrôlé) et les props résolues à l'intérieur
  (valeur par défaut appliquée). La fonction reste le seul canal ; elle devient le cas rare au
  lieu de l'entrée principale.

### Pourquoi retirer `string` de `classes`

Avec `class` disponible, `classes="mt-4"` serait un doublon strict. Le nom `classes` redevient
honnête : un contrat par éléments, jamais une chaîne. C'est un breaking mineur sur le même input
que le breaking majeur de `8ec6c3db` ; les deux s'absorbent dans la même version.

Le modèle en trois couches de `references/public-api-standard.md` : le **concept** (« des
classes pour les éléments du composant ») est invariant, le **vocabulaire** du cœur reste
`className`, et l'**orthographe** appartient à la forme de livraison. React expose les trois
formes sur un prop `className` (idiomatique : un prop). Angular les découpe sur deux inputs parce
que son HTML a déjà un canal pour la chaîne.

## Conception

### 1. Cœur — `get-classname.ts`

```ts
/** Static classes per element, keyed by the interface's `elements` tuple. */
export type ElementClasses<T extends ComponentInterface> = Partial<
  Record<T['elements'][number], string>
>;

export type ClassNameComponent<T extends ComponentInterface> = (
  states: T['states'] & T['props'],
) => ElementClasses<T>;

export interface StyleProps<T extends ComponentInterface> {
  /** Root classes, static element classes, or state-aware element classes. */
  className?: string | ElementClasses<T> | ClassNameComponent<T>;
}
```

`getClassNames.classNameList` accepte la même union. La branche existante
(`get-classname.ts:36-48`) gagne un cas : ni `string` ni `function` → itérer l'objet comme on
itère aujourd'hui le résultat de la fonction. `defaultClassNames` ne change pas de logique ; seul
le type de `states.className` s'élargit.

L'ordre de précédence est déjà le bon. `classNameList: [states.className, defaultClassName]`
puis `value.reverse()` (`get-classname.ts:57`) place les classes du consommateur **après** les
défauts, et `classNames(...)` est `twMerge` (`classnames.ts`). Une chaîne va dans le bucket
`args.default`, c'est-à-dire le root (`get-classname.ts:39`). Rien à changer pour que
`class="bg-primary"` batte le `bg-primary-container` interne.

`ElementClasses` est exporté depuis l'index public du cœur ([[feedback_no-internal-only-logic]]).

### 2. Angular — les 34 composants

Chaque composant remplace :

```ts
/** Classes or state-aware element classes applied through the shared style contract. */
readonly classes = input<string | ClassNameComponent<ButtonInterface>>();
```

par :

```ts
/** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
readonly hostClass = input<string>('', { alias: 'class' });

/** Static or state-aware classes for the component's internal elements, keyed by element name. */
readonly classes = input<ElementClasses<ButtonInterface> | ClassNameComponent<ButtonInterface>>();
```

et passe les deux au style dans l'ordre de précédence :

```ts
className: mergeClassNames<ButtonInterface>('button', this.classes(), this.hostClass()),
```

`mergeClassNames(defaultElement, ...items)` est une fonction du cœur qui compose plusieurs
valeurs de `className` en une seule `ClassNameComponent` (une chaîne est routée vers
`defaultElement`, l'élément racine), afin que `className` reste une valeur unique dans
le contrat et que React n'ait rien à apprendre. Elle ignore les `undefined` et la chaîne vide,
préserve l'ordre reçu, et ne fait pas de `twMerge` elle-même : c'est `getClassNames` qui le fait,
une seule fois, par élément. Exportée publiquement.

Le nom de membre est `hostClass` et non `class` : `class` est un mot réservé en position de
membre de classe TypeScript ; `hostClass` dit d'où vient la valeur (l'attribut posé sur l'hôte),
pas où elle va. `docgen` extrait déjà les alias (`apps/doc/scripts/docgen.js:234` `getAlias`),
la page API montrera `class` comme nom de liaison.

#### Comportement Angular vérifié (core 21.2.18, `_debug_node-chunk.mjs`)

| Le consommateur écrit | L'hôte reçoit | L'input `hostClass` reçoit |
| --- | --- | --- |
| `class="a b"` | oui (attribut statique) | `"a b"` (à `ɵɵelementEnd`, via `setDirectiveInputsWhichShadowsStyling`) |
| `[class]="expr"` | **non** — la map est *shadowée* par l'input | `"a b " + expr` (statique préfixé) |
| `[class.foo]="cond"` | oui | **non** — `checkStylingProperty` n'a pas de branche shadow |
| `[ngClass]="…"` | oui | non |

Deux conséquences à assumer :

- **Sur les 36 hôtes `display: contents`**, la classe statique est aussi dans le DOM de l'hôte.
  Sans effet visuel ; seul un sélecteur CSS du consommateur qui compterait sur `.mt-4` pourrait
  y matcher deux fois. Documenté comme limitation, pas contourné.
- **`[class.foo]` et `[ngClass]` restent sur l'hôte** et ne peuvent pas être interceptés. Ils n'ont
  pas d'effet sur un hôte `display: contents`. Documenté comme limitation (`@limitations` des
  composants concernés, et une entrée de doc générale « Styler un composant Udixio en Angular »).
  La seule levée de cette limite serait de livrer les composants simples comme directives
  d'attribut (`<button udxButton>`) ; hors périmètre, décision séparée.

#### Les trois composants dont l'hôte est le root

`MenuGroup`, `MenuHeadline`, `TabPanel` ont `'[class]': "styles()['x']"` en host binding. Un host
binding n'est jamais shadowé (`!isInHostBindings`), donc il continue d'écrire sur l'hôte. Comme
`hostClass()` entre dans `styles()` via le cœur, `styles()['x']` contient déjà la version
fusionnée ; le host binding écrase l'attribut statique avec le même contenu, mergé. Aucun cas
particulier dans le code : le mécanisme général suffit.

### 3. React

Aucun changement de code dans `packages/ui-react`. `ComponentClassName<T>['className']`
(`component-helper.ts:134`) s'élargit mécaniquement à la nouvelle union, donc
`className={{ label: 'uppercase' }}` devient valide. La forme chaîne et la forme fonction ne
bougent pas. C'est un ajout non-breaking côté React.

### 4. Documentation et exemples

- `apps/doc/src/examples/angular/*` : les 20 usages de `classes="…"` / `[classes]="'…'"` (chaîne)
  passent à `class="…"`. Recette de balayage dans [[doc-examples-not-typechecked]] : ces fichiers
  ne sont pas compilés, chaque site doit être vérifié à la main via `grep`.
- Un exemple par framework montrant la forme objet (`[classes]="{ label: '…' }"` /
  `className={{ label: '…' }}`) sur TextField, qui a le plus d'éléments.
- La page API Angular affiche `class` (alias) et `classes` avec leurs TSDoc propres. Aucune
  description n'est dérivée d'une correspondance de nom avec React (règle 0.2.0).
- `@limitations` Angular : `[class.x]` / `[ngClass]` sans effet sur hôte `display: contents`.

### 5. Tests

- **Cœur** (`get-classname.spec.ts`) : forme objet routée vers les bons buckets ; ordre de
  précédence défauts → objet/fonction → chaîne vérifié par un conflit Tailwind (`bg-a` vs
  `bg-b`) ; `mergeClassNames` ignore `undefined` et préserve l'ordre.
- **Angular**, sur Button (hôte `display: contents`) et TabPanel (hôte root) :
  `class="x"` statique → `x` présent sur le root interne ; `[class]="sig()"` → réactif ;
  `[class]="'bg-red-500'"` sur un composant dont le style pose `bg-surface` → seul
  `bg-red-500` reste ; `[classes]="{ label: 'y' }"` → `y` sur l'élément `label` uniquement.
  Un test d'existence de `hostClass` aliasé `class` sur les 34 composants (matrice).
- **Gate de type** : `classes="x"` (chaîne) doit échouer à `ngc`. Vérifié en stripant les codes
  ANSI avant `grep` (leçon de `8ec6c3db`).

## Migration

BREAKING CHANGE `@udixio/ui-angular` : `classes` n'accepte plus de chaîne. Remplacer
`classes="…"` / `[classes]="'…'"` par `class="…"` / `[class]="…"`. La forme fonction est
inchangée.

`@udixio/core` et `@udixio/ui-react` : ajout de la forme objet, non-breaking.

## Hors périmètre

- Convertir des composants en directives d'attribut pour rendre `[class.x]` / `[ngClass]`
  opérants. C'est le successeur naturel de ce design, pas un rejet : une fois `class` routé par le
  cœur, passer Button/IconButton/Chip en directive ne change rien au contrat de style.
- Exposer les états internes (`hovered`, `focused`) en outputs Angular.
- Un `slotProps` / `pt` généralisé (attributs autres que `class` par élément).
