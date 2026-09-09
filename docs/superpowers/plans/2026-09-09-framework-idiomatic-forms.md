# Formes idiomatiques par framework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réviser la doctrine du plugin `udixio-ui-governance` pour qu'une API idiomatique par framework (directive Angular, service, pipe) soit un résultat légitime et arbitré, au lieu d'être signalée comme une dérive.

**Architecture:** Modifications de documentation uniquement, dans `plugins/udixio-ui-governance/`. Le contrat public est scindé en trois couches (concept / vocabulaire / forme de livraison) ; l'audit de parité gagne un quatrième verdict `platform-shape` ; un finding bloquant `FORM-*` impose l'arbitrage humain ; l'ownership de `@udixio/core/dom` est élargi à tout comportement impératif partagé ; le vocabulaire « Motion » est remplacé par anime.js. Aucun composant n'est modifié.

**Tech Stack:** Markdown (SKILL.md + references), JSON (manifestes Claude et Codex), Python 3 `unittest` pour les scripts existants, `claude plugin validate`.

**Spec:** `docs/superpowers/specs/2026-09-09-framework-idiomatic-forms-design.md`

## Global Constraints

- Périmètre strict : `plugins/udixio-ui-governance/` seulement. Ne modifier aucun fichier de `packages/` ni de `apps/`. Le pilote Tooltip et les changements de `apps/doc/scripts/docgen.js` sont explicitement hors périmètre.
- Le dépôt est partagé avec d'autres sessions. Ne jamais exécuter `git stash`, `git checkout <fichier>`, `git restore` ni `git add -A`. Chaque commit liste ses chemins explicitement.
- Les fichiers du plugin sont en **anglais**. Tout texte ajouté aux `SKILL.md` et aux `references/` doit être rédigé en anglais, comme l'existant. Seuls la spec et ce plan sont en français.
- Identifiants de findings : ils doivent satisfaire `^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-[0-9]{3}$` (`scripts/validate_audit_report.py:20`). `FORM-API-001` et `MULTI-OWNERSHIP-001` sont conformes ; aucun script n'a besoin d'être modifié pour les accepter.
- `platform-shape` est un **quatrième** verdict, distinct de `platform-adaptation`. Ne pas fusionner les deux ni réécrire la définition de `platform-adaptation` : la séparation est délibérée, `platform-adaptation` ayant déjà été lu comme « syntaxe uniquement ».
- Le seuil de ~50 lignes pour un hook React est un **déclencheur d'inspection**, jamais un critère d'échec automatique.
- Bibliothèque d'animation cible : **anime.js**, parce qu'elle est en JavaScript natif et donc consommable identiquement par React et Angular. `motion/react` est de la dette résiduelle dans exactement quatre composants React : `Chip`, `NavigationRail`, `NavigationRailItem`, `SideSheet`.
- Ne jamais éditer à la main les artefacts générés (`apps/doc/src/data/api/*.json`).

---

## File Structure

| Fichier | Responsabilité après changement | Tâche |
| --- | --- | --- |
| `references/public-api-standard.md` | Source unique des trois couches du contrat et de la définition du finding `FORM-*` | 1 |
| `references/audit-contract.md` | Sémantique des findings et politique d'acceptation, `FORM-*` inclus | 2 |
| `skills/audit-parity/SKILL.md` | Étape 0 « forme », verdict `platform-shape`, matrice comparant les concepts core | 3 |
| `skills/audit-multiframework/SKILL.md` | Ownership du comportement impératif partagé, `MULTI-OWNERSHIP-*` | 4 |
| `skills/sync-angular-component/SKILL.md` | Choix de la forme Angular avant traduction du contrat | 5 |
| `skills/audit-documentation/SKILL.md` | Couverture de toutes les formes par l'extraction API, point d'attache | 6 |
| `references/repository-map.md` | Chemins, vocabulaire anime.js, convention de nommage des directives | 7 |
| `references/material-3-workflow.md` | Séquence de création alignée sur l'ownership élargi et le choix de forme | 7 |
| `skills/audit-public-api/SKILL.md` | Renvoi vers les trois couches, vocabulaire d'animation | 7 |
| `skills/create-material-component/SKILL.md` | Vocabulaire d'animation | 7 |
| `skills/audit-accessibility/SKILL.md` | Vocabulaire d'animation | 7 |
| `README.md` | Inventaire des skills et des findings émis | 8 |
| `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` | Version publiée du plugin | 8 |

Aucun script Python n'est modifié. La tâche 1 le **prouve** par une fixture plutôt que de le supposer.

---

### Task 1: Trois couches du contrat et définition de `FORM-*`

**Files:**
- Modify: `plugins/udixio-ui-governance/references/public-api-standard.md`
- Test: `.superpowers/sdd/2026-09-09-framework-idiomatic-forms/form-finding-fixture.json` (fixture jetable, répertoire git-ignoré, non commitée)

**Interfaces:**
- Consumes: rien.
- Produces: la section `## Separate concept, vocabulary, and delivery shape` et la section `## Propose a delivery shape before adopting it`, citées par les tâches 2, 3, 5 et 7 via des liens relatifs Markdown.
- Produces: l'identifiant de finding `FORM-<AREA>-NNN`, utilisé par les tâches 2, 3 et 9.

- [ ] **Step 1: Prouver que le contrat de rapport accepte déjà `FORM-*`**

Créer la fixture. Elle sert à vérifier qu'aucun script Python n'a besoin d'évoluer pour le nouvel identifiant.

```bash
cat > .superpowers/sdd/2026-09-09-framework-idiomatic-forms/form-finding-fixture.json <<'JSON'
{
  "checker": "audit-parity",
  "component": "tooltip",
  "action": "audit",
  "status": "fail",
  "findings": [
    {
      "id": "FORM-API-001",
      "checker": "audit-parity",
      "severity": "major",
      "confidence": "high",
      "framework": "angular",
      "evidence": ["packages/ui-angular/src/lib/tooltip/tooltip.ts:139"],
      "expected": "Angular attaches tooltip behavior through a directive on the trigger element.",
      "actual": "Angular requires a `target` input that replays React's `targetRef`.",
      "impact": "Consumers must hold and pass an ElementRef for a behavior that has a native Angular host.",
      "remediation": "Emit a FORM finding and obtain the user's decision before synchronizing.",
      "disposition": "open",
      "validation": "Reviewed against the core Tooltip contract and Angular directive semantics."
    }
  ],
  "validations": []
}
JSON
```

- [ ] **Step 2: Exécuter le validateur de rapport sur la fixture**

Run: `python3 plugins/udixio-ui-governance/scripts/validate_audit_report.py .superpowers/sdd/2026-09-09-framework-idiomatic-forms/form-finding-fixture.json`

Expected: PASS. Si le validateur rejette la fixture pour une raison **structurelle** (champ manquant), corriger la fixture. S'il la rejette parce que `FORM-API-001` ne satisfait pas `FINDING_ID`, **arrêter** : le plan suppose l'inverse et doit être révisé avant de continuer.

- [ ] **Step 3: Insérer la section des trois couches**

Dans `plugins/udixio-ui-governance/references/public-api-standard.md`, insérer entre le paragraphe d'introduction et `## Review vocabulary before implementation` :

```markdown
## Separate concept, vocabulary, and delivery shape

A public contract has three layers. Conflating them is what turns a faithful port into a bad API.

| Layer | Tooltip example | Cross-framework status |
| --- | --- | --- |
| Concept — the core interface | `variant`, `position`, `trigger`, `openDelay`, controlled `open` | Invariant. Identical everywhere. |
| Vocabulary — public names | `openChange` / `onOpenChange` | Invariant, apart from binding idiom. |
| Delivery shape — how a consumer reaches the concept | component `udx-tooltip` / directive `[udxTooltip]` / hook | Free per framework, chosen by idiom. |

A framework-specific mechanism is never a contract concept: `cloneElement`, `targetRef`, a
`RefObject`, render props, and `children` used as a trigger belong to React, not to the product.
Never promote one into core and never transliterate one into another adapter. Its counterpart is
the target framework's equivalent mechanism, not its transcription.

Angular's equivalent of a React component is not always a component. A directive attaches behavior
to a host the consumer already owns and injects its own `ElementRef`; a service fits behavior with
no host; a pipe fits a pure transformation. Choosing the shape is a design act that precedes
naming.
```

- [ ] **Step 4: Relier la section au vocabulaire existant**

Remplacer la puce existante :

```
- uses one framework-neutral canonical concept while allowing idiomatic binding syntax such as
  React `onPressedChange` and Angular `pressedChange`;
```

par :

```
- uses one framework-neutral canonical concept while allowing idiomatic binding syntax such as
  React `onPressedChange` and Angular `pressedChange`, and while allowing a different delivery
  shape as defined above — an attribute-selector directive may prefix its inputs when the host
  element is not its own, provided each prefixed input maps to one canonical concept;
```

- [ ] **Step 5: Ajouter la section `FORM-*`**

Insérer après la section `## Make proposals before synchronization`, avant `## Protect stability without preserving accidental debt` :

```markdown
## Propose a delivery shape before adopting it

A shape that differs from the source adapter's is legitimate, but never silent. Before writing the
target adapter, emit a blocking `FORM-<AREA>-NNN` finding containing:

1. the source adapter's shape and the concept it serves;
2. the proposed shape for the target framework and the idiom that justifies it;
3. the invariants preserved — core contract, observable behavior, accessibility, styles, tests;
4. what the new shape can no longer express, or an evidence-backed statement that nothing is lost;
5. migration, documentation, and test impact.

Emit the finding, then stop and request the user's decision. Default severity is `major`; use
`blocker` when the current shape makes a primary interaction unreachable. Never adopt a different
shape merely because it is shorter, and never keep the source shape merely to make a parity table
line up.
```

- [ ] **Step 6: Vérifier la cohérence des liens et l'absence de doublon**

Run:
```bash
grep -c "Separate concept, vocabulary, and delivery shape\|Propose a delivery shape before adopting it" plugins/udixio-ui-governance/references/public-api-standard.md
grep -n "FORM-<AREA>-NNN" plugins/udixio-ui-governance/references/public-api-standard.md
```
Expected: `2` pour la première commande (chaque titre une seule fois), au moins une ligne pour la seconde.

- [ ] **Step 7: Commit**

```bash
rm -f .superpowers/sdd/2026-09-09-framework-idiomatic-forms/form-finding-fixture.json
git add plugins/udixio-ui-governance/references/public-api-standard.md
git commit -m "docs(governance): separate concept, vocabulary and delivery shape

Adds the three-layer model of a public contract and the blocking FORM-*
finding that requires a human decision before adopting a delivery shape
that differs from the source adapter."
```

---

### Task 2: `FORM-*` dans la politique d'acceptation

**Files:**
- Modify: `plugins/udixio-ui-governance/references/audit-contract.md`

**Interfaces:**
- Consumes: la section `## Propose a delivery shape before adopting it` de la tâche 1.
- Produces: la règle d'acceptation que les tâches 3 et 9 invoquent pour justifier qu'un `FORM-*` bloque la synchronisation.

- [ ] **Step 1: Ajouter la règle d'acceptation**

Dans `## Acceptance policy`, remplacer :

```
- An intentional framework difference must have a platform reason, a test, and documentation.
```

par :

```
- An intentional framework difference must have a platform reason, a test, and documentation. A
  difference in delivery shape — component, directive, service, pipe, hook — is legitimate when the
  core contract and the observable behavior are preserved, but it requires an accepted
  `FORM-*` finding as defined in [the public API standard](public-api-standard.md). Adopting a
  different shape without that decision is itself a defect; so is reporting an idiomatic shape as
  drift.
```

- [ ] **Step 2: Ajouter la sévérité de `FORM-*`**

Ne pas toucher aux quatre puces de sévérité. Dans `## Severity`, ajouter un nouveau paragraphe juste après la ligne `Do not inflate severity. Absence of evidence is not a pass.` :

```markdown
A `FORM-*` finding is `major` by default and `blocker` when the current shape makes a primary
interaction unreachable or forces the consumer to manage a reference that the target framework
resolves natively.
```

- [ ] **Step 3: Vérifier**

Run: `grep -n "FORM-\*" plugins/udixio-ui-governance/references/audit-contract.md`
Expected: exactement 2 lignes.

- [ ] **Step 4: Commit**

```bash
git add plugins/udixio-ui-governance/references/audit-contract.md
git commit -m "docs(governance): accept delivery-shape differences through FORM findings"
```

---

### Task 3: Verdict `platform-shape` dans l'audit de parité

**Files:**
- Modify: `plugins/udixio-ui-governance/skills/audit-parity/SKILL.md`

**Interfaces:**
- Consumes: `FORM-<AREA>-NNN` et la section des trois couches (tâche 1) ; la règle d'acceptation (tâche 2).
- Produces: le verdict `platform-shape`, utilisé par la tâche 6 pour conditionner l'obligation documentaire.

- [ ] **Step 1: Ajouter l'étape 0 avant la matrice**

Insérer juste avant `## Build a parity matrix` :

```markdown
## Identify the delivery shape first

Before comparing anything, record how each adapter delivers the concept: React component, Angular
component, directive, service, pipe, or hook. Then judge whether each shape is the idiomatic one
for its framework, using
[the public API standard](../../references/public-api-standard.md#separate-concept-vocabulary-and-delivery-shape).

A shape that differs across adapters is a legitimate starting point, not drift. Never report an
Angular directive as a defect when the core contract and the observable behavior are preserved.
Report the opposite instead: an adapter that replays a foreign framework's mechanism — an input
whose only purpose is to carry a `ref`, a required host element the framework could resolve itself
— is an `API-DESIGN-*` defect even when both adapters agree.
```

- [ ] **Step 2: Comparer les concepts, pas les props 1:1**

Remplacer :

```
1. public props/inputs, defaults, aliases, and blocked states;
```

par :

```
1. the concepts of the core contract, their defaults, aliases, and blocked states, mapped to each
   adapter's members — not a one-to-one props/inputs table, which a legitimate shape difference
   invalidates;
```

- [ ] **Step 3: Remplacer le vocabulaire d'animation**

Remplacer :

```
5. pointer, keyboard, focus, Motion, interruption, cleanup, and reduced motion;
```

par :

```
5. pointer, keyboard, focus, animation, interruption, cleanup, and reduced motion;
```

- [ ] **Step 4: Ajouter le quatrième verdict**

Remplacer :

```
Classify every difference as `defect`, `platform-adaptation`, or `documented-exception`. A valid
platform adaptation preserves the same public meaning and user-observable behavior.
```

par :

```
Classify every difference as `defect`, `platform-adaptation`, `platform-shape`, or
`documented-exception`.

- `platform-adaptation` covers binding syntax at equal shape: `children`/`ng-content`,
  callbacks/outputs, refs/view queries. It preserves the same public meaning and user-observable
  behavior.
- `platform-shape` covers a different delivery vector — component against directive, service, or
  pipe — where the core contract and the observable behavior are preserved and only the way a
  consumer reaches the concept differs. It requires an accepted `FORM-*` finding and an explicit
  statement of each framework's shape in the component documentation.

These two verdicts are deliberately separate. Do not widen `platform-adaptation` to cover shape:
its scope has already been read as syntax-only, and a same-shape syntax difference needs no `FORM-*`
decision while a shape difference does.
```

- [ ] **Step 5: Vérifier**

Run:
```bash
grep -n "platform-shape" plugins/udixio-ui-governance/skills/audit-parity/SKILL.md
grep -n "\bMotion\b" plugins/udixio-ui-governance/skills/audit-parity/SKILL.md
```
Expected: exactement 2 lignes pour `platform-shape` (la ligne de classification et la puce de
définition) ; **aucune** ligne pour `Motion`.

- [ ] **Step 6: Commit**

```bash
git add plugins/udixio-ui-governance/skills/audit-parity/SKILL.md
git commit -m "docs(governance): add platform-shape verdict to parity audit

Parity now compares core-contract concepts instead of a one-to-one
props/inputs table, and identifies each adapter's delivery shape before
comparing anything."
```

---

### Task 4: Ownership du comportement impératif partagé

**Files:**
- Modify: `plugins/udixio-ui-governance/skills/audit-multiframework/SKILL.md`

**Interfaces:**
- Consumes: le vocabulaire anime.js fixé dans les Global Constraints.
- Produces: le finding `MULTI-OWNERSHIP-<AREA>-NNN`, attendu par la tâche 9.

- [ ] **Step 1: Corriger la description du frontmatter**

Remplacer `DOM/Motion controllers` par `DOM and animation controllers` dans la ligne `description:`.

- [ ] **Step 2: Élargir la puce d'ownership**

Remplacer :

```
- `@udixio/core/dom` for shared imperative DOM/Motion behavior;
```

par :

```
- `@udixio/core/dom` for every imperative behavior both frameworks need — timers, pointer,
  keyboard and touch listeners, ARIA synchronization, cross-instance coordination, and animation;
```

- [ ] **Step 3: Remplacer la règle limitée à l'animation**

Remplacer :

```
Flag hollow props, framework types in core, duplicated decisions, and behavior hidden in adapter-only
CSS. Require one Motion JavaScript controller when both frameworks need the same imperative effect.
```

par :

```
Flag hollow props, framework types in core, duplicated decisions, and behavior hidden in adapter-only
CSS.

Require one shared controller in `@udixio/core/dom` whenever both frameworks need the same
imperative behavior. A React hook is never the owner of shared non-render logic; it is only its
reactive adapter. Animated effects use anime.js, chosen because it is plain JavaScript and
therefore consumable identically by React and Angular.

A React hook holding more than roughly fifty lines of non-render logic is presumed to be a missing
core controller: report `MULTI-OWNERSHIP-<AREA>-NNN`. The threshold triggers an inspection, never a
verdict on its own — confirm that the logic is genuinely shareable, and that the second adapter
either duplicates it today or would have to, before concluding.
```

- [ ] **Step 4: Étendre la distinction parité/syntaxe à la forme**

Remplacer :

```
Distinguish API parity from platform syntax: `children`/`ng-content`, callbacks/outputs, and refs/view
queries may differ while semantics remain equal.
```

par :

```
Distinguish API parity from platform syntax and from delivery shape: `children`/`ng-content`,
callbacks/outputs, and refs/view queries may differ while semantics remain equal, and an adapter may
deliver the concept through a different vector entirely — see
[the public API standard](../../references/public-api-standard.md#separate-concept-vocabulary-and-delivery-shape).
Ownership is decided per concept, never per framework member.
```

- [ ] **Step 5: Vérifier**

Run:
```bash
grep -n "MULTI-OWNERSHIP\|anime.js" plugins/udixio-ui-governance/skills/audit-multiframework/SKILL.md
grep -n "\bMotion\b" plugins/udixio-ui-governance/skills/audit-multiframework/SKILL.md
```
Expected: au moins 2 lignes pour la première ; **aucune** pour la seconde.

- [ ] **Step 6: Commit**

```bash
git add plugins/udixio-ui-governance/skills/audit-multiframework/SKILL.md
git commit -m "docs(governance): own every shared imperative behavior in core/dom

The rule named only animation, which let a 331-line React tooltip trigger
hook escape it and be hand-ported into Angular. Adds MULTI-OWNERSHIP-*
and names anime.js as the shared animation engine."
```

---

### Task 5: Choisir la forme Angular avant de traduire

**Files:**
- Modify: `plugins/udixio-ui-governance/skills/sync-angular-component/SKILL.md`

**Interfaces:**
- Consumes: `FORM-<AREA>-NNN` et la section des trois couches (tâche 1).
- Produces: rien de nouveau ; consommé par la tâche 9 comme chemin de remédiation.

- [ ] **Step 1: Insérer l'étape de choix de forme**

Dans `## Resolve the source`, remplacer la liste numérotée complète :

```
1. Read [the repository map](../../references/repository-map.md), current authoring/behavior docs,
   and inventory the component.
2. Apply [the public API standard](../../references/public-api-standard.md) to every source prop,
   callback, default, and type before conversion. React is not presumed correct.
3. If a contract is negative, implementation-shaped, ambiguous, or unstable, emit proposals and
   stop before editing Angular. Do not obtain parity by propagating the defect or adding an alias.
4. Audit core and React enough to establish that the source behavior is valid. Fix confirmed source
   defects before conversion.
5. Write a parity matrix for API, defaults, state ownership, events, DOM semantics, styles, Motion,
   accessibility, exports, and tests.
```

par :

```
1. Read [the repository map](../../references/repository-map.md), current authoring/behavior docs,
   and inventory the component.
2. Apply [the public API standard](../../references/public-api-standard.md) to every source prop,
   callback, default, and type before conversion. React is not presumed correct.
3. If a contract is negative, implementation-shaped, ambiguous, or unstable, emit proposals and
   stop before editing Angular. Do not obtain parity by propagating the defect or adding an alias.
4. Audit core and React enough to establish that the source behavior is valid. Fix confirmed source
   defects before conversion.
5. Choose the Angular delivery shape before translating the contract. The deciding question: does
   the React component **render** content it owns (component), or does it **attach** behavior to an
   element the consumer already owns (directive)? A service fits behavior with no host; a pipe fits
   a pure transformation. When the answer is not the source adapter's shape, emit `FORM-*` and stop
   for the user's decision, as
   [the public API standard](../../references/public-api-standard.md#propose-a-delivery-shape-before-adopting-it)
   requires.
6. Write a parity matrix for API, defaults, state ownership, events, DOM semantics, styles,
   animation, accessibility, exports, and tests.
```

- [ ] **Step 2: Interdire le rejeu d'une `ref` React**

Dans `## Translate the contract, not JSX`, remplacer :

```
- Preserve idiomatic Angular templates and avoid React-shaped APIs when Angular has a semantic
  equivalent.
```

par :

```
- Preserve idiomatic Angular templates and avoid React-shaped APIs when Angular has a semantic
  equivalent.
- Never introduce an input whose only purpose is to replay a React `ref` or `targetRef`. A directive
  injects its own `ElementRef`; a component queries its own view. An input that asks the consumer to
  hand over an element the framework can resolve itself is a transliterated mechanism, not a
  contract concept.
```

- [ ] **Step 3: Pointer vers le moteur d'animation partagé**

Remplacer :

```
- Use shared core styles, pure behavior, and DOM controllers; do not port React hooks or
  `motion/react` concepts into Angular.
```

par :

```
- Use shared core styles, pure behavior, and DOM controllers; do not port React hooks or
  `motion/react` concepts into Angular. Shared animated effects live once in `@udixio/core/dom`
  with anime.js, which both frameworks consume identically.
```

- [ ] **Step 4: Vérifier**

Run:
```bash
grep -n "delivery shape\|targetRef\|anime.js" plugins/udixio-ui-governance/skills/sync-angular-component/SKILL.md
grep -n "\bMotion\b" plugins/udixio-ui-governance/skills/sync-angular-component/SKILL.md
```
Expected: au moins 3 lignes pour la première ; **aucune** pour la seconde.

- [ ] **Step 5: Commit**

```bash
git add plugins/udixio-ui-governance/skills/sync-angular-component/SKILL.md
git commit -m "docs(governance): choose the Angular delivery shape before translating

Adds the component-versus-directive decision as an explicit step and
forbids inputs whose only purpose is to replay a React ref."
```

---

### Task 6: Couverture de toutes les formes par l'extraction API

**Files:**
- Modify: `plugins/udixio-ui-governance/skills/audit-documentation/SKILL.md`

**Interfaces:**
- Consumes: le verdict `platform-shape` (tâche 3).
- Produces: le critère d'acceptation que le pilote Tooltip devra satisfaire côté `apps/doc/scripts/docgen.js` ; le finding attendu par la tâche 9.

- [ ] **Step 1: Exiger la couverture de toutes les formes**

Remplacer :

```
- Verify the generator extracts descriptions, props, defaults, and documentation tags for every
  available framework. Shared/core API may be represented once, but React-only bindings and
  Angular inputs, outputs, aliases, projection, and templates must remain framework-specific.
```

par :

```
- Verify the generator extracts descriptions, props, defaults, and documentation tags for every
  available framework. Shared/core API may be represented once, but React-only bindings and
  Angular inputs, outputs, aliases, projection, and templates must remain framework-specific.
- Require the extraction to recognize every public Angular shape — component, directive, service,
  pipe — not the `Component` decorator alone. An Angular adapter exported by the package barrel
  whose API payload is missing from the generated artifact is a `blocker` `DOCS-*` defect, never a
  framework unavailability. This rule exists because framework availability is derived from
  non-empty payloads, which silently turns an unrecognized shape into "Angular not supported".
- Never derive a member description from a React-to-Angular name match. An adapter that adopts an
  idiomatic prefix documents its own members; a name-matching fallback re-couples the two adapters
  through vocabulary and contradicts the delivery-shape rule.
```

- [ ] **Step 2: Exiger l'énoncé de la forme sous verdict `platform-shape`**

Remplacer :

```
- Record intentional framework differences and migration/breaking changes explicitly.
```

par :

```
- Record intentional framework differences and migration/breaking changes explicitly.
- When a component carries a `platform-shape` verdict, state each framework's shape in the MDX
  overview and expose each shape's attachment point — element or attribute selector — on the API
  page, not only its member list. Documentation that implies a single API while the delivery vectors
  differ is a `DOCS-*` defect.
```

- [ ] **Step 3: Vérifier**

Run: `grep -n "platform-shape\|attachment point\|name match" plugins/udixio-ui-governance/skills/audit-documentation/SKILL.md`
Expected: au moins 3 lignes.

- [ ] **Step 4: Commit**

```bash
git add plugins/udixio-ui-governance/skills/audit-documentation/SKILL.md
git commit -m "docs(governance): require API extraction to cover every Angular shape

A directive would make frameworks.angular vanish from the generated JSON
and drop the Angular tab with no error. A missing payload for an exported
adapter is now a blocker, not an unavailability."
```

---

### Task 7: Purge du vocabulaire « Motion » et convention de nommage

**Files:**
- Modify: `plugins/udixio-ui-governance/references/repository-map.md`
- Modify: `plugins/udixio-ui-governance/references/material-3-workflow.md`
- Modify: `plugins/udixio-ui-governance/skills/audit-public-api/SKILL.md`
- Modify: `plugins/udixio-ui-governance/skills/create-material-component/SKILL.md`
- Modify: `plugins/udixio-ui-governance/skills/audit-accessibility/SKILL.md`

**Interfaces:**
- Consumes: les tâches 3, 4 et 5 doivent être terminées, car le gate final de cette tâche est un grep sur l'ensemble du plugin.
- Produces: le vocabulaire anime.js définitif et la convention de nommage des directives, consommés par le pilote Tooltip.

- [ ] **Step 1: Corriger la ligne « Shared DOM effects » de la carte du dépôt**

Dans `references/repository-map.md`, remplacer :

```
| Shared DOM effects       | `packages/core/src/lib/dom/`                                | One imperative implementation, Motion JavaScript when animated       |
```

par :

```
| Shared DOM effects       | `packages/core/src/lib/dom/`                                | One imperative implementation, anime.js when animated                |
```

- [ ] **Step 2: Ajouter la note sur la dette `motion/react`**

Dans `references/repository-map.md`, insérer juste après le tableau `## Canonical layers`, avant le paragraphe `Read \`docs/component-authoring.md\`` :

```markdown
Shared animated effects are implemented once in `@udixio/core/dom` with **anime.js**, chosen because
it is plain JavaScript and therefore consumable identically by React and Angular. `motion/react` is
a residual dependency under migration in exactly four React components — `Chip`, `NavigationRail`,
`NavigationRailItem`, `SideSheet` — and is debt to retire, never a pattern to reproduce. Touching one
of them for an unrelated reason does not require migrating it, but **adding** an animated effect
requires moving that effect down into `core/dom`.
```

- [ ] **Step 3: Corriger la carte de nommage**

Dans `references/repository-map.md`, remplacer :

```
- Angular selector: `lib-progress-indicator`.
- Angular inputs use contract names; outputs drop React's `on` prefix (`onValueChange` maps to
  `valueChange`).
```

par :

```
- Angular component selector: `udx-progress-indicator`. Verify the prefix against neighboring
  components before assuming it; this reference is not a substitute for reading the source.
- Angular attribute-directive selector: `[udxProgressIndicator]`, with inputs prefixed the same way
  (`udxProgressIndicatorValue`) because the host element is not the directive's own. The prefix is
  the exception that a directive's shape justifies, not a general naming rule.
- Angular inputs otherwise use contract names; outputs drop React's `on` prefix (`onValueChange`
  maps to `valueChange`).
```

- [ ] **Step 4: Aligner la séquence Material 3**

Dans `references/material-3-workflow.md`, remplacer :

```
4. Add pure behavior and a single shared DOM/Motion controller when imperative effects are needed.
```

par :

```
4. Add pure behavior and a single shared controller in `@udixio/core/dom` when imperative effects
   are needed — timers, listeners, ARIA synchronization, cross-instance coordination, animation.
   Animated effects use anime.js.
```

Puis remplacer :

```
6. Synchronize Angular from the resolved contract, not by transliterating JSX.
```

par :

```
6. Choose the Angular delivery shape — component, directive, service, pipe — then synchronize from
   the resolved contract, not by transliterating JSX.
```

Puis remplacer :

```
Reject invented variants, hollow props, framework types in core, duplicated animations, CSS-only
reimplementations of shared Motion behavior, and documentation examples that cannot compile.
```

par :

```
Reject invented variants, hollow props, framework types in core, duplicated animations, CSS-only
reimplementations of shared animated behavior, transliterated framework mechanisms, and
documentation examples that cannot compile.
```

- [ ] **Step 5: Corriger `audit-public-api`**

Remplacer :

```
implementation and whether the contract remains truthful if markup, CSS, Motion, or internal state
changes.
```

par :

```
implementation and whether the contract remains truthful if markup, CSS, animation, delivery shape,
or internal state changes.
```

Puis, dans la même section `## Judge for long-term use`, ajouter à la fin du dernier paragraphe (celui qui se termine par `inspect behavior before recommending the final replacement.`) :

```markdown
Judge the concept, the vocabulary, and the delivery shape as three separate layers, as
[the public API standard](../../references/public-api-standard.md#separate-concept-vocabulary-and-delivery-shape)
defines them. A member that exists only to carry a foreign framework's mechanism fails this checker
even when both adapters expose it.
```

- [ ] **Step 6: Corriger `create-material-component`**

Remplacer `Motion/DOM effects` par `DOM and animation effects` dans la ligne `description:` du frontmatter.

Puis remplacer :

```
1. Add core interface, resolved states, pure style, pure behavior, and shared DOM/Motion controller
```

par :

```
1. Add core interface, resolved states, pure style, pure behavior, and shared DOM/animation controller
```

- [ ] **Step 7: Corriger `audit-accessibility`**

Dans `skills/audit-accessibility/SKILL.md`, remplacer :

```
- Verify Motion/reduced-motion behavior and state-layer geometry without relying on screenshots
```

par :

```
- Verify animation and reduced-motion behavior and state-layer geometry without relying on screenshots
```

- [ ] **Step 8: Gate global — plus aucune occurrence de « Motion »**

Les douze occurrences capitalisées au moment de la rédaction de ce plan sont réparties ainsi :
`repository-map.md:13`, `material-3-workflow.md:26,33` (tâche 7), `audit-parity/SKILL.md:21`
(tâche 3), `create-material-component/SKILL.md:3,24` (tâche 7),
`sync-angular-component/SKILL.md:18` (tâche 5), `audit-multiframework/SKILL.md:3,19,23` (tâche 4),
`audit-public-api/SKILL.md:31` (tâche 7), `audit-accessibility/SKILL.md:24` (tâche 7).

Run: `grep -rn '\bMotion\b' plugins/udixio-ui-governance --include=*.md`
Expected: **aucune sortie**, code de retour 1. Les occurrences de `reduced-motion` et `motion duration` en minuscules sont le concept et doivent rester.

Si le grep renvoie encore des lignes, ce sont des fichiers oubliés : les corriger avec la même substitution conceptuelle avant de continuer.

- [ ] **Step 9: Commit**

```bash
git add plugins/udixio-ui-governance/references/repository-map.md \
        plugins/udixio-ui-governance/references/material-3-workflow.md \
        plugins/udixio-ui-governance/skills/audit-public-api/SKILL.md \
        plugins/udixio-ui-governance/skills/create-material-component/SKILL.md \
        plugins/udixio-ui-governance/skills/audit-accessibility/SKILL.md
git commit -m "docs(governance): replace Motion with anime.js across the plugin

The plugin prescribed the library the repository is migrating away from.
Also records the directive naming convention and corrects the stale
lib- selector prefix in the naming map."
```

---

### Task 8: Manifestes, README et validation du plugin

**Files:**
- Modify: `plugins/udixio-ui-governance/README.md`
- Modify: `plugins/udixio-ui-governance/.claude-plugin/plugin.json`
- Modify: `plugins/udixio-ui-governance/.codex-plugin/plugin.json`

**Interfaces:**
- Consumes: toutes les tâches 1 à 7.
- Produces: la version publiée du plugin, référencée par le rapport final.

- [ ] **Step 1: Documenter les findings dans le README**

Dans `README.md`, ajouter une section juste avant `## Layout` :

```markdown
## Blocking findings

Two finding families stop an audit and require the user's decision instead of an automatic fix.

| Finding | Emitted by | Meaning |
| --- | --- | --- |
| `API-DESIGN-*` | `audit-public-api`, `audit-parity`, `sync-angular-component` | A public name or contract is ambiguous, negative, or implementation-shaped |
| `FORM-*` | `audit-parity`, `sync-angular-component` | An adapter should deliver the concept through a different shape — directive, service, pipe — than the source adapter |

`MULTI-OWNERSHIP-*`, emitted by `audit-multiframework`, is not blocking: it reports shared imperative
logic that belongs in `@udixio/core/dom` rather than in a framework hook.
```

- [ ] **Step 2: Bumper les deux manifestes**

Le format actuel est `0.1.0+codex.<horodatage>`. Passer en `0.2.0` (changement de doctrine, rétrocompatible pour les consommateurs du plugin) avec un nouvel horodatage.

```bash
STAMP="0.2.0+codex.$(date -u +%Y%m%d%H%M%S)"
cd plugins/udixio-ui-governance
python3 - "$STAMP" <<'PY'
import json, sys
stamp = sys.argv[1]
for path in ('.claude-plugin/plugin.json', '.codex-plugin/plugin.json'):
    with open(path, encoding='utf-8') as handle:
        data = json.load(handle)
    data['version'] = stamp
    with open(path, 'w', encoding='utf-8') as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write('\n')
    print(path, '->', stamp)
PY
cd -
```

- [ ] **Step 3: Vérifier que les manifestes restent valides**

Run:
```bash
python3 -c "import json;[json.load(open(f'plugins/udixio-ui-governance/{p}')) for p in ('.claude-plugin/plugin.json','.codex-plugin/plugin.json')];print('json ok')"
claude plugin validate plugins/udixio-ui-governance
```
Expected: `json ok`, puis `✔ Validation passed`.

- [ ] **Step 4: Exécuter les tests des scripts**

Aucun script n'a été modifié ; ce gate prouve l'absence de régression collatérale.

Run:
```bash
cd plugins/udixio-ui-governance/scripts && python3 -m unittest test_validate_api_docs -v; cd -
```
Expected: `OK`.

- [ ] **Step 5: Vérifier que chaque SKILL.md garde un frontmatter valide**

Run:
```bash
python3 - <<'PY'
import pathlib, re
root = pathlib.Path('plugins/udixio-ui-governance/skills')
failures = []
for skill in sorted(root.glob('*/SKILL.md')):
    text = skill.read_text(encoding='utf-8')
    match = re.match(r'^---\nname: (.+)\ndescription: (.+)\n---\n', text)
    if not match:
        failures.append(f'{skill}: frontmatter manquant ou mal formé')
        continue
    if match.group(1) != skill.parent.name:
        failures.append(f'{skill}: name={match.group(1)!r} != dossier {skill.parent.name!r}')
    if len(match.group(2)) < 40:
        failures.append(f'{skill}: description trop courte')
print('\n'.join(failures) if failures else f'{len(list(root.glob("*/SKILL.md")))} skills ok')
PY
```
Expected: `10 skills ok`.

- [ ] **Step 6: Vérifier la propreté du diff**

Run: `git diff --check && git status --short plugins/udixio-ui-governance`
Expected: aucune erreur d'espaces ; seuls les fichiers du plugin listés dans ce plan apparaissent modifiés.

- [ ] **Step 7: Commit**

```bash
git add plugins/udixio-ui-governance/README.md \
        plugins/udixio-ui-governance/.claude-plugin/plugin.json \
        plugins/udixio-ui-governance/.codex-plugin/plugin.json
git commit -m "docs(governance): document blocking findings and release 0.2.0"
```

---

### Task 9: Forward-test — la doctrine doit mordre sur Tooltip

**Files:**
- Read only: `packages/ui-angular/src/lib/tooltip/tooltip.ts`, `packages/ui-react/src/lib/hooks/useTooltipTrigger.ts`, `packages/core/src/lib/dom/tooltip.ts`, `apps/doc/scripts/docgen.js`
- Create: `docs/superpowers/reports/2026-09-09-tooltip-forward-test.md`

**Interfaces:**
- Consumes: `FORM-<AREA>-NNN` (tâche 1), `platform-shape` (tâche 3), `MULTI-OWNERSHIP-<AREA>-NNN` (tâche 4), la règle de couverture des formes (tâche 6).
- Produces: la preuve d'acceptation exigée par `skills/evolve-governance/SKILL.md`.

**Ce test est un audit en lecture seule. Ne modifier aucun fichier de `packages/` ni de `apps/`.**

- [ ] **Step 1: Auditer Tooltip avec les règles révisées**

Invoquer la skill `udixio-ui-governance:audit-parity` en action `audit` sur le composant `tooltip`, puis `udixio-ui-governance:audit-multiframework` en action `audit`, puis `udixio-ui-governance:audit-documentation` en action `audit`.

- [ ] **Step 2: Vérifier que les trois findings attendus sortent**

La révision n'a mordu que si l'audit produit **les trois** :

| Finding attendu | Preuve à exiger dans le rapport |
| --- | --- |
| `FORM-*` sur l'input `target` | `packages/ui-angular/src/lib/tooltip/tooltip.ts:139` — un input requis qui rejoue `targetRef`, alors qu'une directive injecterait son `ElementRef` |
| `MULTI-OWNERSHIP-*` sur `useTooltipTrigger` | `packages/ui-react/src/lib/hooks/useTooltipTrigger.ts` fait 331 lignes de logique non-rendu ; `packages/ui-angular/src/lib/tooltip/tooltip.ts:198-547` la duplique à la main |
| `DOCS-*` sur l'extraction API | `apps/doc/scripts/docgen.js:373-381` — `getComponentDecorator` ne reconnaît que le décorateur `Component` |

Si un seul des trois manque, la règle correspondante est trop faible ou mal placée : **revenir à la tâche concernée et la renforcer**, puis rejouer cette tâche. Ne pas consigner un forward-test partiel comme un succès.

- [ ] **Step 3: Vérifier l'absence de faux positif**

L'audit ne doit **pas** produire de finding réclamant que l'Angular Tooltip reste un composant, ni classer une directive comme drift. Si c'est le cas, la formulation de l'étape 0 en tâche 3 n'est pas assez explicite.

- [ ] **Step 4: Consigner le rapport**

Écrire `docs/superpowers/reports/2026-09-09-tooltip-forward-test.md` avec : les trois findings et leurs preuves fichier/ligne, la confirmation de l'absence de faux positif, les gates exécutés en tâche 8 avec leur résultat, et la liste explicite de ce qui reste hors périmètre (implémentation de la directive, `createTooltipTriggerController`, changements de `docgen.js` et du schéma API).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/reports/2026-09-09-tooltip-forward-test.md
git commit -m "docs(governance): forward-test the revised doctrine on Tooltip

Confirms the revision produces FORM-*, MULTI-OWNERSHIP-* and DOCS-*
findings on Tooltip that the previous doctrine could not express."
```

---

## Ce que ce plan ne fait pas

Consigné pour éviter toute dérive de périmètre pendant l'exécution :

- aucune implémentation de la directive `[udxTooltip]`, aucune suppression de `udx-tooltip` ;
- aucune création de `createTooltipTriggerController` dans `packages/core/src/lib/dom/tooltip.ts` ;
- aucune refactorisation de `useTooltipTrigger.ts` ni du mode `children`/`cloneElement` de React ;
- aucune modification de `apps/doc/scripts/docgen.js`, du `schemaVersion` de l'API générée, ni des `allowed_fields` de `validate_api_docs.py` ;
- aucun réaudit des autres composants Angular à la recherche d'une meilleure forme.

Ces travaux appartiennent au pilote Tooltip, qui fera l'objet de sa propre spec et de son propre plan.
