# Formes idiomatiques par framework — révision de la doctrine du plugin de gouvernance

Date : 2026-09-09
Statut : design approuvé, implémentation à planifier
Périmètre : `plugins/udixio-ui-governance/` uniquement

## Problème

Le plugin `udixio-ui-governance` a été écrit pour unifier les styles et le comportement des
composants entre React et Angular, en prenant React comme adapter source. Dans les faits, il a
produit une conversion trop littérale : l'API publique Angular reproduit la *forme* React au lieu
de reproduire son *concept*.

Le cas révélateur est `packages/ui-angular/src/lib/tooltip/tooltip.ts`. Le composant expose un
input `target` requis pointant l'élément déclencheur, justifié en commentaire par l'absence
d'équivalent Angular à `cloneElement`. Or `targetRef` est un mécanisme React, pas un concept du
contrat : Angular dispose d'un primitif supérieur — une directive s'attache nativement à son hôte
et injecte son `ElementRef`. Le résultat est une API de 548 lignes exigeant du consommateur qu'il
gère une référence, là où `[udxTooltip]` suffirait. `packages/ui-angular/src/lib/` ne contient
aujourd'hui **aucun `@Directive`** : tout est devenu un composant `udx-*`.

Trois causes, indépendantes et cumulatives.

### Cause 1 — Le contrat public est traité comme une chose unique

`references/public-api-standard.md` ne distingue pas le concept produit du mécanisme
d'implémentation. Il autorise « idiomatic binding syntax such as React `onPressedChange` and
Angular `pressedChange` », ce qui couvre le nommage mais rien de plus. Rien n'énonce qu'un
`RefObject`, un `cloneElement` ou des render props ne sont pas des concepts transposables.

### Cause 2 — L'audit ne sait pas nommer une divergence de forme

`skills/audit-parity/SKILL.md` compare les « public props/inputs » 1:1 et classe chaque écart en
`defect`, `platform-adaptation` ou `documented-exception`. `platform-adaptation` est défini comme
« same public meaning and user-observable behavior », et ses seuls exemples sont syntaxiques :
`children`/`ng-content`, callbacks/outputs, refs/view queries. Un audit lancé sur une directive
`[udxTooltip]` face à un composant React classerait donc l'écart en `defect`.

### Cause 3 — La couche partagée s'arrête trop tôt

`skills/audit-multiframework/SKILL.md` exige « one Motion JavaScript controller when both
frameworks need the same imperative effect ». La règle ne nomme que l'animation. Le reste du
comportement impératif n'a pas de propriétaire désigné.

Conséquence mesurée sur Tooltip : `packages/ui-react/src/lib/hooks/useTooltipTrigger.ts` (331
lignes) possède les timers, le long-press tactile, la suppression des events de compatibilité
tactile et la synchro `aria-describedby`. `@udixio/core` ne partage que la fonction pure
`resolveTooltipInteraction`. Angular a donc ré-écrit à la main environ 250 lignes de machine à
états impérative. Cette duplication est la raison économique pour laquelle la forme directive n'a
jamais été envisagée : sans contrôleur partagé, elle imposait un troisième portage manuel.

### Cause 4 — Le vocabulaire d'animation du plugin est périmé

Le plugin écrit « Motion » (majuscule) dans sept fichiers. `references/repository-map.md` prescrit
« Motion JavaScript when animated ». Ce n'est pas le concept d'animation, c'est la bibliothèque
dont le dépôt migre. `@udixio/core/dom` est déjà sur anime.js (`auto-layout`, `fab`, `search`,
`switch`, `text-field`, `tooltip`) ; il reste quatre composants React sur `motion/react` : `Chip`,
`NavigationRail`, `NavigationRailItem`, `SideSheet`. Le plugin prescrit donc aujourd'hui la
direction abandonnée.

## Décisions

Prises explicitement au cours du design :

| Décision | Choix retenu |
| --- | --- |
| Invariant cross-framework | Contrat core + comportement observable. La forme de livraison et la surface de binding sont libres et justifiées par framework. |
| Garde-fou contre la divergence libre | Finding bloquant `FORM-<AREA>-NNN` + arbitrage humain, sur le modèle existant d'`API-DESIGN-*`. Pas de catalogue fermé. |
| Portée de ce document | Le plugin seul. Tooltip est le cas de validation, traité séparément. |

## Conception

### 1. Trois couches dans le contrat public

Ajouter à `references/public-api-standard.md` une section qui scinde ce que le document traite
aujourd'hui comme un bloc unique.

| Couche | Exemple Tooltip | Statut cross-framework |
| --- | --- | --- |
| Concept — interface core | `variant`, `position`, `trigger`, `openDelay`, état contrôlé `open` | Invariant. Identique partout. |
| Vocabulaire — noms publics | `openChange` / `onOpenChange` | Invariant, hors idiome de binding. |
| Forme de livraison | composant `udx-tooltip` / directive `[udxTooltip]` / hook | Libre par framework, choisie par idiome. |

Et la règle qui manque :

> Un mécanisme propre à un framework — `cloneElement`, `targetRef`, `RefObject`, render props,
> `children` employé comme déclencheur — n'est jamais un concept du contrat. Il ne doit être ni
> promu dans core, ni transcrit littéralement dans l'autre adapter. Sa contrepartie est le
> mécanisme équivalent du framework cible, pas sa traduction.

### 2. Verdict `platform-shape` et finding `FORM-*`

Dans `skills/audit-parity/SKILL.md` :

- Ajouter un **quatrième verdict `platform-shape`**, distinct de `platform-adaptation`. Le choix
  d'une catégorie séparée plutôt que d'un élargissement est délibéré : `platform-adaptation` a
  déjà été lu comme « syntaxe uniquement », et réécrire sa définition ne corrigerait pas cette
  lecture. Définition : *le concept core et le comportement observable sont préservés, seul le
  vecteur de livraison diffère*.
- Reformuler le point 1 de la matrice de parité : comparer les **concepts du contrat core**, non
  les props/inputs 1:1.
- Ajouter une **étape 0** : identifier la forme de livraison de chaque adapter et vérifier qu'elle
  est idiomatique, avant toute comparaison. Une forme différente est un point de départ légitime,
  pas une dérive.
- Interdire explicitement de signaler une directive Angular comme drift lorsque le concept core et
  le comportement observable sont préservés.

Dans `references/public-api-standard.md` et `references/audit-contract.md`, définir le finding
bloquant `FORM-<AREA>-NNN`, calqué sur `API-DESIGN-*`. Contenu exigé :

1. la forme React actuelle et le concept qu'elle sert ;
2. la forme proposée pour le framework cible et son idiome de référence ;
3. les invariants préservés — contrat core, comportement observable, a11y, styles, tests ;
4. ce qui n'est plus exprimable dans la nouvelle forme, ou l'affirmation étayée qu'il n'y a rien ;
5. l'impact migration, documentation et tests.

L'agent émet le finding puis **s'arrête et demande l'arbitrage**. Sévérité `major` par défaut,
`blocker` si la forme actuelle rend une interaction primaire inaccessible.

### 3. Ownership élargi du comportement impératif

Dans `skills/audit-multiframework/SKILL.md`, remplacer la règle limitée à l'animation :

> Tout comportement impératif nécessaire aux deux frameworks — timers, listeners
> pointeur/clavier/tactile, synchronisation ARIA, coordination inter-instances, animation —
> appartient à un contrôleur de `@udixio/core/dom`. Un hook React n'est jamais le propriétaire
> d'une logique non-rendu partagée ; il n'en est que l'adaptateur réactif.

Ajouter un signal détectable : **un hook React de plus de ~50 lignes de logique non-rendu est
présumé être un contrôleur core manquant** → finding `MULTI-OWNERSHIP-*`. Le seuil est un
déclencheur d'inspection, pas un critère d'échec : l'agent doit confirmer que la logique est
réellement partageable avant de conclure.

### 4. Purge du vocabulaire « Motion »

Remplacer dans tout le plugin le nom de la bibliothèque par le concept, et nommer anime.js comme
cible. Texte de référence à placer dans `references/repository-map.md` :

> Les effets animés partagés sont implémentés une fois dans `@udixio/core/dom` avec **anime.js**,
> choisi parce qu'il est en JavaScript natif et donc consommable identiquement par React et
> Angular. `motion/react` est un reliquat en cours de migration (`Chip`, `NavigationRail`,
> `NavigationRailItem`, `SideSheet`) : c'est de la dette à résorber, jamais un motif à reproduire.
> Toucher un de ces composants pour une autre raison n'oblige pas à le migrer, mais y **ajouter**
> un effet animé impose de descendre dans `core/dom`.

Cette correction rend la doctrine auto-cohérente : `sync-angular-component` interdit déjà de
porter `motion/react` vers Angular, sans jamais dire où l'animation partagée doit aller.

### 5. Choisir la forme avant de traduire

Dans `skills/sync-angular-component/SKILL.md`, ajouter une étape à « Resolve the source », placée
avant toute traduction :

> Choisir la forme Angular avant de traduire le contrat. Question déterminante : le composant
> React **rend-il** du contenu qui lui appartient (→ composant), ou **attache-t-il** du
> comportement à un élément que le consommateur possède déjà (→ directive) ? Un service convient
> quand le comportement n'a pas d'hôte ; un pipe, quand il s'agit d'une transformation pure.

Renforcer l'interdiction existante : *ne jamais introduire un input dont le seul rôle est de
rejouer une `ref` ou un `targetRef` React.*

### 6. Documenter la forme quand elle diverge

Dans `skills/audit-documentation/SKILL.md`, ajouter : lorsqu'un composant porte un verdict
`platform-shape`, l'overview MDX doit énoncer explicitement la forme de chaque framework. Une doc
qui laisse croire à une API unique alors que les vecteurs diffèrent est un défaut `DOCS-*`.

## Fichiers touchés

| Fichier | Changement |
| --- | --- |
| `references/public-api-standard.md` | Section « trois couches » ; règle sur les mécanismes propres à un framework ; définition de `FORM-*`. |
| `references/audit-contract.md` | `FORM-*` dans la politique d'acceptation, à côté d'`API-DESIGN-*` ; règle de sévérité. |
| `references/repository-map.md` | « Motion JavaScript » → anime.js ; note sur la dette `motion/react`. |
| `references/material-3-workflow.md` | Vocabulaire Motion ; étape 4 et 6 alignées sur l'ownership élargi et le choix de forme. |
| `skills/audit-parity/SKILL.md` | Étape 0 ; verdict `platform-shape` ; matrice comparant les concepts core ; interdiction de signaler une forme idiomatique comme drift. |
| `skills/audit-multiframework/SKILL.md` | Ownership élargi ; seuil des ~50 lignes ; `MULTI-OWNERSHIP-*` ; vocabulaire Motion. |
| `skills/sync-angular-component/SKILL.md` | Étape « choisir la forme » ; interdiction du rejeu de `ref` ; vocabulaire Motion. |
| `skills/audit-documentation/SKILL.md` | Obligation de documenter la forme sous verdict `platform-shape`. |
| `skills/audit-public-api/SKILL.md` | Renvoi vers la section « trois couches ». |
| `.claude-plugin/plugin.json` | Bump de version. |

## Validation

Conformément à `skills/evolve-governance/SKILL.md` :

- exécuter chaque script sur une fixture passante et une fixture échouante, dont
  `test_validate_api_docs.py` ;
- quick-validate toutes les skills ;
- valider le manifeste du plugin Codex ;
- exécuter `claude plugin validate` ;
- forward-tester la nouvelle doctrine sur un composant réel.

Le forward-test est le cas Tooltip : un `audit-parity` sur `Tooltip` doit désormais produire un
`FORM-*` sur `target` plutôt qu'un verdict de conformité, et un `MULTI-OWNERSHIP-*` sur
`useTooltipTrigger`. Tant que ces deux findings ne sortent pas, la révision n'a pas mordu.

## Hors périmètre

Le pilote Tooltip est conçu mais volontairement séparé. Pour mémoire, sa forme cible :
`createTooltipTriggerController` dans `packages/core/src/lib/dom/tooltip.ts` absorbant listeners,
timers, long-press tactile et synchro ARIA ; `useTooltipTrigger` ramené à ~80 lignes ; directive
`[udxTooltip]` avec préfixes `udxTooltip*` et contenu riche par `TemplateRef` ; `udx-tooltip`
supprimé sans alias, ce qu'autorise `@udixio/ui-angular@0.2.2-next.6` avec Tooltip en
`@status beta`. Le point de risque connu est côté React : le mode `children` fait aujourd'hui un
`cloneElement` avec des handlers, et devra fusionner une `ref` sur l'enfant cloné.

Le réaudit des autres composants Angular à la recherche d'une meilleure forme est également hors
périmètre.
