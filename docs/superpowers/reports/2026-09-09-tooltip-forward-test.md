# Forward-test de la doctrine révisée sur `Tooltip`

Date : 2026-09-09 — Branche : `feat/theme-config` — Base : `5c6f0ad7`

## Objet

Vérifier que la révision de `plugins/udixio-ui-governance/` (tâches 1 à 8) **mord** réellement :
appliquée au composant `tooltip`, elle doit produire trois findings que la doctrine précédente ne
savait pas exprimer, et n'en produire aucun qui exigerait que l'adaptateur Angular reste un
`@Component`.

**Cet audit est en lecture seule.** Aucun fichier de `packages/` ni de `apps/` n'a été modifié.
Le seul fichier créé est ce rapport.

Doctrine testée (texte lu avant jugement) :

- `plugins/udixio-ui-governance/references/public-api-standard.md` — modèle en trois couches
  (concept / vocabulaire / forme de livraison) et section « Propose a delivery shape before
  adopting it ».
- `plugins/udixio-ui-governance/skills/audit-parity/SKILL.md` — étape 0 « Identify the delivery
  shape first » (l. 12-23) et verdict `platform-shape` (l. 41-55).
- `plugins/udixio-ui-governance/skills/audit-multiframework/SKILL.md` — propriété des
  comportements impératifs (l. 21-35).
- `plugins/udixio-ui-governance/skills/audit-documentation/SKILL.md` — couverture des formes
  Angular à l'extraction (l. 29-33).

---

## Findings

### `FORM-API-001` — l'input requis `target` rejoue `targetRef`

**Sévérité : `major`** (bloquant au sens de la doctrine : décision humaine requise avant toute
adoption de forme). **Confiance : haute.**

Preuves :

- `packages/ui-angular/src/lib/tooltip/tooltip.ts:139`
  ```ts
  readonly target = input.required<ElementRef<HTMLElement> | HTMLElement>();
  ```
  Un input **requis** dont l'unique rôle est de faire porter au consommateur l'élément hôte.
- `packages/ui-angular/src/lib/tooltip/tooltip.ts:53-57` — la TSDoc du composant assume
  explicitement la transcription : « `target` is therefore always required, **mirroring React's
  `targetRef` mode** ».
- Source React répliquée : `packages/ui-react/src/lib/components/Tooltip.tsx:49`
  (`targetRef: RefObject<T | null>`), `:94`, `:111-112`, `:122`, `:198-266`.
- `packages/ui-angular/src/lib/tooltip/tooltip.ts:412-416` — `resolveElement()` existe uniquement
  pour déballer ce que le framework saurait résoudre seul.
- Forme actuelle : `@Component({ selector: 'udx-tooltip', host: { style: 'display: contents' } })`
  (`tooltip.ts:87-93`). Un composant à hôte `display: contents` qui n'attache son comportement qu'à
  un élément **détenu par le consommateur** (`tooltip.ts:332-353`) est la définition même d'une
  directive.

Règles déclenchées :

- `references/public-api-standard.md` : « A framework-specific mechanism is never a contract
  concept: `cloneElement`, `targetRef`, a `RefObject`, render props, and `children` used as a
  trigger belong to React, not to the product. Never promote one into core and never transliterate
  one into another adapter. »
- `skills/audit-parity/SKILL.md:21-23` : « an adapter that replays a foreign framework's mechanism —
  an input whose only purpose is to carry a `ref`, a required host element the framework could
  resolve itself — is an `API-DESIGN-*` defect even when both adapters agree. »
- `skills/sync-angular-component/SKILL.md:43-46` : « Never introduce an input whose only purpose is
  to replay a React `ref` or `targetRef`. A directive injects its own `ElementRef`. »
- `references/public-api-standard.md`, « Propose a delivery shape before adopting it » : la forme
  cible (`[udxTooltip]`) diffère de celle de l'adaptateur source ⇒ finding `FORM-<AREA>-NNN`
  bloquant, décision utilisateur requise avant écriture.

Verdict : **le finding tient**. La doctrine précédente ne pouvait que constater une parité
d'API réussie (`target` ≈ `targetRef`) ; la doctrine révisée la requalifie en mécanisme translittéré
et exige une décision de forme.

Note de rigueur : deux règles se recouvrent ici. L'input `target` est un défaut
`API-DESIGN-*` en soi (audit-parity l. 21-23) ; le remède — passer à `[udxTooltip]` — est ce qui
déclenche le `FORM-*`. Les deux se lisent comme un seul dossier de décision, mais un auditeur
pointilleux pourrait légitimement les émettre séparément. Ce n'est pas une faiblesse de la
doctrine, c'est la superposition normale d'un défaut et de la forme qui le corrige.

---

### `MULTI-OWNERSHIP-001` — `useTooltipTrigger` détient une logique non-rendu dupliquée à la main en Angular

**Sévérité : `major`. Confiance : haute.**

Preuves :

- `packages/ui-react/src/lib/hooks/useTooltipTrigger.ts:1-331` — 331 lignes, dont
  ~230 de logique non-rendu (l. 86-305) : minuteries `open`/`close`/compatibilité (l. 86-114,
  154-171), coordination inter-instances (l. 124-138), machine de commit contrôlé/non contrôlé
  (l. 140-152), séquençage tactile long-press (l. 215-286), `Escape` (l. 287-295), survol de la
  surface (l. 297-304), et `aria-describedby` (l. 308).
- Duplication Angular, quasiment ligne à ligne :

  | Comportement | React | Angular |
  | --- | --- | --- |
  | Réclamation de visibilité inter-tooltip | `useTooltipTrigger.ts:124-138` | `tooltip.ts:241-263` |
  | `commit()` contrôlé/non contrôlé | `useTooltipTrigger.ts:140-152` | `tooltip.ts:512-524` |
  | `request()` + temporisation | `useTooltipTrigger.ts:154-171` | `tooltip.ts:526-547` |
  | `blur` avec `closeDelay` | `useTooltipTrigger.ts:190-210` | `tooltip.ts:291-310` |
  | Long press tactile (`pointerdown`) | `useTooltipTrigger.ts:239-256` | `tooltip.ts:449-468` |
  | Tolérance de mouvement tactile | `useTooltipTrigger.ts:258-281` | `tooltip.ts:470-489` |
  | `finishTouch` + délai de masquage | `useTooltipTrigger.ts:215-237` | `tooltip.ts:491-510` |
  | `contextmenu` supprimé | `useTooltipTrigger.ts:282-286` | `tooltip.ts:320-324` |
  | `Escape` | `useTooltipTrigger.ts:287-295` | `tooltip.ts:325-330` |
  | Survol de la surface | `useTooltipTrigger.ts:297-304` | `tooltip.ts:402-410` |
  | Purge des minuteries | `useTooltipTrigger.ts:99-112` | `tooltip.ts:434-447` |
  | `aria-describedby` | `useTooltipTrigger.ts:308` | `tooltip.ts:356-361`, `418-432` |

- Ce que `@udixio/core` partage **réellement** aujourd'hui, et qui ne couvre donc pas la
  duplication ci-dessus :
  - `packages/core/src/lib/behaviors/tooltip.behavior.ts:52-95` — `resolveTooltipInteraction`,
    machine d'états **pure** (décision oui/non), plus les trois constantes l. 4-10 ;
  - `packages/core/src/lib/dom/tooltip.ts:23-48` — `claimTooltipVisibility` /
    `listenForTooltipVisibilityClaims`, primitives d'évènement ;
  - `packages/core/src/lib/dom/tooltip.ts:67-85` — `addPointerEnterLeaveListener` ;
  - `packages/core/src/lib/dom/tooltip.ts:110-141` — `createTooltipTransitionController`.

  Autrement dit : la **décision** et l'**animation** sont partagées ; l'**orchestration**
  (minuteries, séquence tactile, câblage clavier/pointeur, synchronisation ARIA, arbitrage
  contrôlé/non contrôlé) ne l'est pas. C'est précisément le périmètre que la doctrine révisée
  attribue à `@udixio/core/dom`.

Règles déclenchées (`skills/audit-multiframework/SKILL.md`) :

- l. 25-26 : « `@udixio/core/dom` for every imperative behavior both frameworks need — timers,
  pointer, keyboard and touch listeners, ARIA synchronization, cross-instance coordination, and
  animation ».
- l. 26-28 : « A React hook is never the owner of shared non-render logic; it is only its reactive
  adapter. »
- l. 31-35 : le seuil des ~50 lignes déclenche l'inspection ; l'inspection est ici concluante,
  puisque le second adaptateur **duplique déjà** la logique aujourd'hui, condition explicitement
  exigée par la règle avant de conclure.

Verdict : **le finding tient, largement**. Le seuil n'est pas frôlé, il est dépassé d'un facteur
quatre, et la condition de confirmation (duplication effective par le second adaptateur) est
satisfaite par une correspondance quasi ligne à ligne.

Rectification factuelle par rapport au brief : le brief situe la duplication Angular en
`tooltip.ts:198-547`. La plage exacte est **`tooltip.ts:240-547`** (constructeur + méthodes
privées) ; les lignes 198-239 sont des champs d'état et des `computed` de rendu. Le finding n'en
est pas affaibli.

---

### `DOCS-API-001` — l'extraction API ne reconnaît que le décorateur `Component`

**Sévérité : `major` aujourd'hui, `blocker` dès qu'une directive publique est exportée.
Confiance : haute.**

Preuves :

- `apps/doc/scripts/docgen.js:373-381` — `getComponentDecorator` ne retient qu'un décorateur dont
  `getAngularCoreImportName(...) === 'Component'`. `Directive`, `Injectable` et `Pipe` ne sont
  jamais reconnus.
- `apps/doc/scripts/docgen.js:489-500` — le balayage des sources Angular ne collecte une classe que
  si `getComponentDecorator(statement, checker)` répond ; une directive exportée par le barrel est
  simplement absente de la `Map`.
- `apps/doc/scripts/docgen.js:383-395` — `extractAngularComponent` retourne `undefined` sans
  décorateur `Component`.
- `apps/doc/scripts/docgen.js:545-559` — la clé `angular` n'est ajoutée au document que
  `...(angular ? { angular } : {})`.
- La disponibilité du framework est ensuite **dérivée de la présence de la charge utile** :
  - `apps/doc/src/lib/componentApi.ts:9` — `FRAMEWORK_ORDER.filter((f) => !!api.frameworks[f])` ;
  - `apps/doc/src/lib/component-md-routes.ts:14` — `api.frameworks.angular ? ['react','angular'] : ['react']` ;
  - `apps/doc/src/lib/component-markdown.ts:292-293`.

  Une directive `[udxTooltip]` publique apparaîtrait donc à l'utilisateur comme **« Angular non
  supporté »**, exactement le mode de défaillance silencieux que la règle nomme.

Règle déclenchée (`skills/audit-documentation/SKILL.md:29-33`) : « Require the extraction to
recognize every public Angular shape — component, directive, service, pipe — not the `Component`
decorator alone. An Angular adapter exported by the package barrel whose API payload is missing from
the generated artifact is a `blocker` `DOCS-*` defect, never a framework unavailability. This rule
exists because framework availability is derived from non-empty payloads, which silently turns an
unrecognized shape into "Angular not supported". »

Verdict : **le finding tient, avec une nuance de sévérité qu'il serait malhonnête de taire.**
La limitation du générateur est réelle et vérifiée dans les quatre fichiers ci-dessus. En revanche
la condition littérale du `blocker` — « an Angular adapter **exported by the package barrel** whose
API payload is missing » — n'est **pas encore remplie aujourd'hui** : `grep -rl '@Directive\|@Injectable\|@Pipe' packages/ui-angular/src/lib/`
ne renvoie aucun fichier, et `apps/doc/src/data/api/tooltip.json` contient bien une charge
`frameworks.angular` (le Tooltip est encore un `@Component`). Le défaut est donc **latent** :
`major` en l'état, `blocker` à la seconde où la directive `[udxTooltip]` est exportée. Le classer
`blocker` dès maintenant serait de l'inflation de sévérité, ce que `references/audit-contract.md:37`
interdit explicitement.

---

### `GOV-SHAPE-001` — quatrième finding : la question binaire « rendre ou attacher » ne tranche pas le cas hybride

**Sévérité : `minor`. Confiance : moyenne. Porte sur la doctrine, pas sur `packages/`.**

`skills/sync-angular-component/SKILL.md:18-21` fait reposer le choix de forme sur une question
binaire : « does the React component **render** content it owns (component), or does it **attach**
behavior to an element the consumer already owns (directive)? »

`Tooltip` fait **les deux** : il rend une surface qui lui appartient
(`packages/ui-angular/src/lib/tooltip/tooltip.ts:95-133`, y compris une projection `<ng-content />`
l. 129) *et* il attache neuf écouteurs à un élément détenu par le consommateur
(`tooltip.ts:332-340`). La question, prise littéralement, renvoie « component » à cause de la
surface, alors que la bonne réponse idiomatique est une directive qui crée sa surface en surcouche.

Ce n'est pas bloquant — le `FORM-API-001` sort quand même, par la voie de l'input `target`
translittéré — mais la règle gagnerait à traiter explicitement le cas hybride : quand un adaptateur
rend son propre contenu *et* attache un comportement à un hôte étranger, c'est l'attachement qui
décide la forme, le contenu rendu étant déplaçable en surcouche. Proposition de renforcement pour
un futur passage sur la tâche 5, à ne pas confondre avec un échec du forward-test.

---

## Absence de faux positif — vérification explicite

**Aucun faux positif du type décrit n'est produit.** Deux vérifications :

1. **La doctrine n'exige nulle part que l'Angular Tooltip reste un composant.** Une recherche
   sur l'ensemble du plugin (`grep -rn "one-to-one\|1:1\|mirror\|same shape\|must be a component\|@Component" --include=*.md`)
   ne renvoie qu'une seule occurrence, et elle dit le contraire — `skills/audit-parity/SKILL.md:31` :
   « not a one-to-one props/inputs table, **which a legitimate shape difference invalidates** ».

2. **La doctrine interdit explicitement de classer une directive comme drift.** Texte vérifié,
   `skills/audit-parity/SKILL.md:17-20` :

   > « A shape that differs across adapters is a legitimate starting point, not drift. **Never
   > report an Angular directive as a defect** when the core contract and the observable behavior
   > are preserved. »

   Renforcé par `references/public-api-standard.md` : « Angular's equivalent of a React component is
   not always a component. A directive attaches behavior to a host the consumer already owns and
   injects its own `ElementRef` », et par le verdict `platform-shape`
   (`skills/audit-parity/SKILL.md:47-51`) qui donne à la différence de forme une case de
   classement propre — délibérément distincte de `platform-adaptation`
   (l. 53-55) — plutôt que la case `defect`.

**Contre-épreuve — la doctrine discrimine, elle ne condamne pas tout input d'élément.**
`packages/ui-angular/src/lib/anchor-positioner/anchor-positioner.ts:51` déclare
`readonly anchor = input.required<ElementRef<HTMLElement> | HTMLElement>()`, syntaxiquement
identique au `target` du Tooltip et calqué sur `anchorRef`
(`packages/ui-react/src/lib/components/AnchorPositioner.tsx:21`). Il n'est **pas** un finding : la
règle vise « a required host element **the framework could resolve itself** ». `AnchorPositioner`
rend son propre contenu à côté d'un élément d'ancrage arbitraire et distant, qu'aucune injection
d'`ElementRef` ne saurait résoudre ; l'input y est un concept, pas une translittération. La doctrine
révisée produit donc bien un finding sur `target` et aucun sur `anchor` — c'est la preuve qu'elle
discrimine sur le fond et non sur la forme du type.

---

## Gates exécutés en tâche 8 (rappel, source : `task-8-report.md`)

| Gate | Résultat |
| --- | --- |
| Manifestes `.claude-plugin` / `.codex-plugin` parsés, versions identiques | `json ok` — `0.2.0+codex.20260909101404` |
| `claude plugin validate plugins/udixio-ui-governance` | `✔ Validation passed` |
| `python3 -m unittest test_validate_api_docs -v` | 7 tests, `OK` |
| Frontmatter des skills | `10 skills ok` |
| `git diff --check` | aucune sortie, code 0 |
| Conformité des identifiants au regex `^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-[0-9]{3}$` | `API-DESIGN-001`, `FORM-API-001`, `MULTI-OWNERSHIP-001` : MATCH |

Les quatre identifiants employés dans le présent rapport — `FORM-API-001`, `MULTI-OWNERSHIP-001`,
`DOCS-API-001`, `GOV-SHAPE-001` — satisfont ce même regex.

---

## Conclusion

La révision **mord**. Les trois findings attendus sortent, chacun adossé à des preuves
fichier/ligne vérifiées dans le code source et non déduites du brief :

| Finding | Sévérité | Tient ? |
| --- | --- | --- |
| `FORM-API-001` — input requis `target` | `major` | Oui, preuve directe (`tooltip.ts:139` + TSDoc l. 53-57) |
| `MULTI-OWNERSHIP-001` — `useTooltipTrigger` | `major` | Oui, ~230 lignes non-rendu dupliquées ligne à ligne |
| `DOCS-API-001` — extraction API | `major` (→ `blocker` à l'atterrissage) | Oui, avec nuance de sévérité assumée |
| `GOV-SHAPE-001` — cas hybride non tranché | `minor` | Renforcement doctrinal proposé |

Aucun faux positif. La doctrine ne réclame pas que l'Angular Tooltip reste un composant et interdit
nommément de traiter une directive comme un drift.

---

## Hors périmètre — explicitement non fait

Ce forward-test est un audit. Les travaux suivants appartiennent au pilote Tooltip, qui fera l'objet
de sa propre spec et de son propre plan, et **aucun d'eux n'a été entrepris ici** :

- **Implémenter la directive `[udxTooltip]`** — et *a fortiori* supprimer ou déprécier
  `udx-tooltip` / l'input `target`. `FORM-API-001` est bloquant : il exige une décision humaine
  avant toute écriture d'adaptateur.
- **Créer un contrôleur de déclenchement partagé dans `@udixio/core/dom`** (par exemple
  `createTooltipTriggerController` dans `packages/core/src/lib/dom/tooltip.ts`), et la
  refactorisation de `useTooltipTrigger.ts` ni du mode `children` / `cloneElement` de React qui
  s'ensuivraient.
- **Modifier `apps/doc/scripts/docgen.js`**, le `schemaVersion` de l'API générée, les
  `allowed_fields` de `validate_api_docs.py`, ou les artefacts de `apps/doc/src/data/api/`.
- **Réauditer les autres composants Angular** à la recherche d'une meilleure forme de livraison
  (`AnchorPositioner` inclus, examiné ici uniquement à titre de contre-épreuve).
- **Renforcer `skills/sync-angular-component/SKILL.md`** sur le cas hybride (`GOV-SHAPE-001`) :
  proposition consignée, non appliquée.
