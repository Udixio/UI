# Contrôleur de déclenchement Tooltip partagé — cycle 1

Date : 2026-09-09
Statut : design approuvé
Périmètre : `packages/core` et `packages/ui-react`. Angular et la chaîne de documentation
relèvent du cycle 2.

## Problème

L'orchestration du déclenchement du Tooltip existe aujourd'hui en **trois** exemplaires.

Dans React, deux fois :

- `packages/ui-react/src/lib/components/Tooltip.tsx:138-195` — mode `children` : treize handlers
  JSX posés par `cloneElement`, chacun fusionné à la main avec le handler homonyme de l'enfant ;
- `packages/ui-react/src/lib/components/Tooltip.tsx:197-266` — mode `targetRef` : neuf
  `addEventListener` plus sa propre synchronisation de `aria-describedby`.

Dans Angular, une troisième fois : `packages/ui-angular/src/lib/tooltip/tooltip.ts:240-547`
réimplémente la même machine à la main. Le forward-test
(`docs/superpowers/reports/2026-09-09-tooltip-forward-test.md`) en donne la table de
correspondance, douze comportements alignés ligne à ligne.

Ce que `@udixio/core` partage réellement ne couvre pas cette duplication : la **décision** est
partagée (`behaviors/tooltip.behavior.ts:52-95`, `resolveTooltipInteraction`, pure), l'**animation**
l'est aussi (`dom/tooltip.ts:110-141`), ainsi que trois primitives d'évènement
(`dom/tooltip.ts:23-48`, `67-85`). L'**orchestration** — minuteries, séquence tactile, câblage
clavier/pointeur, synchronisation ARIA, arbitrage inter-instances — n'appartient à personne.

C'est le finding `MULTI-OWNERSHIP-001`, et la règle qu'il enfreint est celle que ce dépôt vient de
se donner : *« Tout comportement impératif nécessaire aux deux frameworks appartient à un contrôleur
de `@udixio/core/dom`. Un hook React n'est jamais le propriétaire d'une logique non-rendu partagée ;
il n'en est que l'adaptateur réactif. »*

### Ce que l'inspection a corrigé dans l'analyse initiale

Une première estimation annonçait que le mode `children` exigerait de fusionner une `ref` sur
l'enfant cloné, et qualifiait ce point de risque principal. C'est faux :
`Tooltip.tsx:121-122` calcule déjà `resolvedRef = targetRef || internalRef`, et le `cloneElement`
passe déjà `ref: internalRef` (l. 141). La ref unifiée existe. Le risque annoncé n'existe pas.

Vérifié également : les deux adaptateurs sont **identiques** sur l'arbitrage inter-tooltips,
`suppressedByPeer` compris (`useTooltipTrigger.ts:116-138` contre `tooltip.ts:241-263`). Aucune
divergence de comportement à trancher. Une seule différence, en faveur d'Angular : React écoute sur
`document` global, Angular sur `target.ownerDocument`, correct dans une iframe ou une popup.

## Décisions

| Décision | Choix retenu |
| --- | --- |
| Découpage | Deux cycles. Cycle 1 : contrôleur core + React. Cycle 2 : directive Angular + docgen. |
| Sort de `useTooltipTrigger` | Reste public, retour refondu : `triggerRef` remplace `triggerProps`. Breaking assumé, sans alias. |
| Lecture des options réactives | Getters, pas un objet figé ni une méthode `update()`. |
| Document de référence | `target.ownerDocument`, pas `document`. |

## Conception

### 1. Le contrat du contrôleur

Dans `packages/core/src/lib/dom/tooltip.ts`, à côté des primitives existantes :

```ts
export interface TooltipTriggerControllerOptions {
  /** L'élément déclencheur. Le contrôleur y attache tout son câblage. */
  target: HTMLElement;
  /** Identifiant stable, pour `aria-describedby` et l'arbitrage inter-tooltips. */
  tooltipId: string;
  /** Lectures paresseuses : changer une option ne réattache jamais les listeners. */
  triggers: () => TooltipTriggerKind[];
  openDelay: () => number;
  closeDelay: () => number;
  describeTarget: () => boolean;
  isControlled: () => boolean;
  /** Appelé à chaque transition acceptée, y compris celles imposées par un pair. */
  onStateChange: (
    state: TooltipInteractionState,
    suppressedByPeer: boolean,
  ) => void;
}

export interface TooltipTriggerController {
  /** Reflète le `open` contrôlé de l'adaptateur dans la machine. */
  setControlledState(state: TooltipInteractionState): void;
  /** Le survol de la surface, qui annule une fermeture en attente. */
  setSurfaceHovered(hovered: boolean): void;
  destroy(): void;
}

export function createTooltipTriggerController(
  options: TooltipTriggerControllerOptions,
): TooltipTriggerController;
```

Les options réactives sont des getters : c'est déjà ce que fait le code Angular avec
`untracked(this.openDelay)`, cela épouse aussi bien les signals que les refs React, et surtout cela
évite de détacher puis réattacher neuf listeners chaque fois qu'un délai change.

Un seul callback sortant. L'adaptateur dérive `isOpen` de l'état et émet lui-même son événement
public — c'est du rendu et de l'événementiel de framework, pas de l'orchestration.

Le contrôleur devient la source de vérité de la machine ; l'adaptateur n'en garde qu'un miroir.
C'est ce qui permet de supprimer `suppressedByPeer` des deux adaptateurs. La contrepartie est la
seule subtilité du contrat : en mode contrôlé, l'adaptateur doit pousser son `open` via
`setControlledState`, faute de quoi les deux divergent.

### 2. Répartition des responsabilités

**Dans le contrôleur** — les douze comportements listés par le forward-test : les neuf listeners du
déclencheur (`mouseover`/`mouseout` via `addPointerEnterLeaveListener`, `focus`/`blur` en capture,
`click`, `keydown`, `pointerdown`/`move`/`up`/`cancel`, `contextmenu`), les trois minuteries, la
séquence tactile complète (long press, tolérance de mouvement, délai de masquage, suppression des
évènements de compatibilité), la synchronisation `aria-describedby`, et l'arbitrage inter-tooltips
avec sa suppression par un pair.

**Dans l'adaptateur** — le rendu de la surface, le miroir de l'état dans sa primitive réactive,
l'émission de l'événement public, et le branchement du survol de surface via `setSurfaceHovered`.

**Inchangé** — `resolveTooltipInteraction` reste la décision pure dans `behaviors/` ;
`createTooltipTransitionController` reste séparé. Le contrôleur de déclenchement ne connaît pas
l'animation.

### 3. La refonte de `useTooltipTrigger`

```ts
export interface UseTooltipTriggerOptions {
  /** Déclencheur externe. Omis, le hook crée sa propre ref. */
  targetRef?: RefObject<HTMLElement | null>;
  trigger?: Trigger | Trigger[];
  describeTarget?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  id?: string;
}

export interface UseTooltipTriggerReturn {
  /** À poser sur le déclencheur. Vaut `targetRef` s'il a été fourni. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Inchangé : `id`, `role`, `aria-hidden`, et le survol de la surface. */
  tooltipProps: {
    id: string;
    role: 'tooltip';
    'aria-hidden': boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  isOpen: boolean;
  state: TooltipInteractionState;
}
```

`triggerProps` disparaît, `triggerRef` le remplace. Le hook absorbe la résolution
`targetRef || internalRef` qui vivait dans `Tooltip.tsx:121-122` : l'ambiguïté sur la propriété de
la ref se referme là.

Effet sur `Tooltip.tsx` : le `cloneElement` redevient `cloneElement(children, { ref: triggerRef })`
et le `useEffect` du mode `targetRef` disparaît. La fusion manuelle des handlers de l'enfant devient
inutile — des listeners natifs coexistent avec les handlers React de l'enfant au lieu de les
écraser, donc le problème qu'elle résolvait n'existe plus. Onze fusions manuelles, chacune une
occasion d'oublier de propager un évènement, disparaissent.

`anchorRef` et `positioningRef` restent dans `Tooltip.tsx` : c'est du positionnement, pas du
déclenchement.

**SSR.** `packages/ui-react/src/tests/Tooltip.ssr.spec.tsx` existe. Le contrôleur touche le DOM et
`ownerDocument` : il ne doit être créé que dans un effet, jamais pendant le rendu.

### 4. Preuve

**Les 20 tests de `packages/ui-react/src/tests/Tooltip.spec.tsx` ne changent pas d'une ligne.**
C'est la thèse du cycle : l'API publique de `Tooltip` est inchangée, le comportement est inchangé,
donc une suite verte sans retouche est la seule preuve qui vaille. Si un test doit être ajusté, un
comportement a été modifié sans intention — le test a raison.

**La matrice sémantique descend dans `packages/core/src/lib/dom/tooltip.spec.ts`** (15 tests
aujourd'hui), en portant les douze comportements du forward-test : minuteries d'ouverture et de
fermeture, séquence tactile, priorité des états, `aria-describedby`, arbitrage inter-tooltips.
Testés une fois, en JSDOM, sans framework.

Gates : `pnpm nx test @udixio/core`, `pnpm nx test @udixio/ui-react`, puis
`NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.lib.json --noEmit`.
Pas de docgen : aucune API de composant ne change dans ce cycle.

### 5. Migration

`UseTooltipTriggerReturn` est un contrat public de `@udixio/ui-react@5.1.0-next.5`. Le breaking est
autorisé explicitement ; aucun alias de compatibilité n'est créé, conformément à la règle du dépôt
sur la dette de dépréciation. Le changement est documenté dans la TSDoc du hook.

Les exemples de `apps/doc` n'utilisent pas le hook — seul `Tooltip.tsx` le consomme — mais ces
exemples ne sont pas typecheckés, donc la vérification se fait par balayage manuel.

## Ce que ce cycle ne fait pas

- La directive `[udxTooltip]` et la suppression de `udx-tooltip`.
- La reprise du Tooltip Angular sur le contrôleur : `MULTI-OWNERSHIP-001` reste **ouvert** à la fin
  du cycle 1. La logique existera alors en deux endroits au lieu de trois — une amélioration, pas
  une résolution.
- `apps/doc/scripts/docgen.js`, le `schemaVersion` de l'API générée et les `allowed_fields` de
  `validate_api_docs.py`.
- Toute modification de l'API publique du composant `Tooltip` dans l'un ou l'autre framework.
