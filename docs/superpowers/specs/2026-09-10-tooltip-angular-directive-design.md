# Directive Tooltip Angular et extraction API des directives — cycle 2

Date : 2026-09-10
Statut : design approuvé
Périmètre : `packages/ui-angular`, `apps/doc` (générateur, schéma, renderer, exemples), et
`plugins/udixio-ui-governance/scripts/validate_api_docs.py`. Le contrôleur partagé et l'adaptateur
React relèvent du cycle 1, déjà livré.

## Problème

Trois findings du forward-test restent ouverts après le cycle 1.

**`FORM-API-001`.** `packages/ui-angular/src/lib/tooltip/tooltip.ts:139` expose
`readonly target = input.required<ElementRef<HTMLElement> | HTMLElement>()`, un input requis dont
l'unique rôle est de faire porter au consommateur l'élément déclencheur. Sa propre TSDoc
(l. 53-57) assume la transcription : « mirroring React's `targetRef` mode ». `resolveElement()`
(l. 412-416) n'existe que pour le déballer. Un composant à hôte `display: contents` qui n'attache
son comportement qu'à un élément détenu par le consommateur est la définition d'une directive.

**`MULTI-OWNERSHIP-001`.** Le cycle 1 a ramené la duplication de trois exemplaires à deux : le
contrôleur `createTooltipTriggerController` et le Tooltip Angular, qui réimplémente toujours à la
main les ~230 lignes de `tooltip.ts:240-547`.

**`DOCS-API-001`.** `apps/doc/scripts/docgen.js:373-381` (`getComponentDecorator`) et `:482-500`
(`getAngularComponents`) ne reconnaissent que le décorateur `Component`. Une directive ferait
disparaître la clé `frameworks.angular` du JSON généré ; la disponibilité d'un framework étant
dérivée de la présence d'un payload non vide, l'onglet Angular de la page API s'évaporerait sans
erreur. Le finding est aujourd'hui `major` faute de directive ; il devient `blocker` le jour où
`[udxTooltip]` existe. Ce cycle crée ce jour-là : la correction du générateur n'est donc pas
optionnelle, elle est bloquante.

## Décisions

| Décision | Choix retenu |
| --- | --- |
| Forme | Directive seule. `udx-tooltip` supprimé, sans alias de compatibilité. |
| Nommage | Membres de classe = le concept (`position`, `variant`) ; le préfixe `udxTooltip*` passe par `alias`. |
| Contenu riche | `TemplateRef` via `[udxTooltipContent]`. |
| Surface | Composant `TooltipSurface` instancié dynamiquement, exporté publiquement. |
| Schéma d'API | `schemaVersion` 2 → 3, avec un champ `selector` au niveau du framework. |

Le choix du nommage mérite sa justification, car il n'est pas le plus évident. Angular Material
nomme ses membres avec le préfixe (`matTooltipPosition`). Ici les membres gardent le nom du
concept et le préfixe vit dans l'`alias` :

```ts
readonly position = input<TooltipProps['position']>(undefined, {
  alias: 'udxTooltipPosition',
});
```

Cette séparation est exactement le modèle en trois couches de
`references/public-api-standard.md` : le **concept** est `position`, le **vocabulaire** est
`position`, et le préfixe appartient à la **forme de livraison**. Un lecteur du code Angular voit
le même vocabulaire que le code React ; seule la syntaxe de liaison porte la marque de la forme.
`docgen` extrait déjà les alias (`getAlias`), donc la page API montrera les deux.

## Conception

### 1. La directive

```ts
@Directive({ selector: '[udxTooltip]', standalone: true })
export class Tooltip implements OnDestroy {
  /** Supporting text. The directive's own binding carries it. */
  readonly text = input<string | undefined>(undefined, { alias: 'udxTooltip' });
  readonly title = input<TooltipProps['title']>(undefined, { alias: 'udxTooltipTitle' });
  readonly variant = input<TooltipProps['variant']>('plain', { alias: 'udxTooltipVariant' });
  readonly position = input<TooltipProps['position']>(undefined, { alias: 'udxTooltipPosition' });
  readonly trigger = input<TooltipProps['trigger']>(['hover', 'focus'], { alias: 'udxTooltipTrigger' });
  readonly describeTarget = input(true, { alias: 'udxTooltipDescribeTarget', transform: booleanAttribute });
  readonly openDelay = input(400, { alias: 'udxTooltipOpenDelay' });
  readonly closeDelay = input(150, { alias: 'udxTooltipCloseDelay' });
  readonly open = input<boolean | undefined, unknown>(undefined, { alias: 'udxTooltipOpen', transform: optionalBooleanAttribute });
  readonly defaultOpen = input(false, { alias: 'udxTooltipDefaultOpen', transform: booleanAttribute });
  readonly buttons = input<TooltipButtonAction | TooltipButtonAction[] | undefined>(undefined, { alias: 'udxTooltipButtons' });
  readonly transition = input<TooltipProps['transition']>(undefined, { alias: 'udxTooltipTransition' });
  readonly tooltipId = input<string | undefined>(undefined, { alias: 'udxTooltipId' });
  readonly className = input<string | ClassNameComponent<TooltipInterface> | undefined>(undefined, { alias: 'udxTooltipClass' });
  /** Custom content, replacing title/text/buttons when provided. */
  readonly content = input<TemplateRef<unknown> | undefined>(undefined, { alias: 'udxTooltipContent' });
  /** Anchor for positioning. Defaults to the host. */
  readonly anchor = input<ElementRef<HTMLElement> | HTMLElement | undefined>(undefined, { alias: 'udxTooltipAnchor' });

  readonly openChange = output<boolean>({ alias: 'udxTooltipOpenChange' });
}
```

`target` **disparaît** : la directive injecte son `ElementRef`. Disparaissent avec lui
`resolveElement()`, le `viewChild` de la surface, et le contournement `display: contents` — le
problème s'évapore puisque la directive est *sur* le composant déclencheur.

`anchor` est ajouté par parité avec le `anchorRef` de React, qui n'avait pas d'équivalent Angular.

### 2. La surface

La directive instancie `TooltipSurface` par `ViewContainerRef.createComponent()`. Ce composant
encapsule `AnchorPositioner`, rend la mise en page par défaut (`title`/`text`/`buttons`) ou le
`TemplateRef` fourni, et porte `role="tooltip"`.

Conformément à la règle du dépôt « jamais de logique internal-only », `TooltipSurface` est exporté
depuis le barrel, au même statut documentaire qu'`AnchorPositioner` : brique publique, non
documentée comme composant autonome.

### 3. La reprise sur le contrôleur partagé

La directive pilote `createTooltipTriggerController` exactement comme le hook React : options
réactives lues par getters adossés aux signals, `onStateChange` qui met à jour un signal d'état et
émet `openChange`, `setControlledState` poussé par un `effect` sur l'état résolu, et
`setSurfaceHovered` branché sur les évènements de survol de la surface.

Disparaissent de `tooltip.ts` : les trois minuteries, la séquence tactile complète, les neuf
`addEventListener`, la synchronisation `aria-describedby`, `suppressedByPeer`, et les
`afterRenderEffect` correspondants. C'est ce qui ferme `MULTI-OWNERSHIP-001`.

### 4. Le générateur de documentation

**`getComponentDecorator`** devient `getAngularDecorator`, qui accepte `Component`, `Directive`,
`Injectable` et `Pipe`, et renvoie le décorateur trouvé avec son nom. `getAngularComponents` filtre
sur cette fonction élargie.

**Le sélecteur est extrait** du littéral de métadonnées et exposé dans le payload :
`frameworks.angular.selector`. Pour un composant, `udx-tooltip` ; pour une directive,
`[udxTooltip]`.

**`extractProjectedContent`** ne s'applique qu'aux classes possédant un `template` ; une directive
n'en a pas, donc pas de clé `content`. Un `TemplateRef` reste documenté comme un input ordinaire de
type `TemplateRef<unknown>` — c'est exact, et la TSDoc de l'input dit à quoi il sert.

**`getReactFallbackDescription`** résout aujourd'hui les descriptions par correspondance exacte de
nom avec les props React. Un input aliasé garde son nom de membre (`position`), donc la
correspondance continue de fonctionner. Cependant la règle de doctrine interdit d'en dépendre :
chaque input de la directive porte sa propre TSDoc, et le fallback ne sert plus que de filet.

**Schéma.** `schemaVersion` passe de 2 à 3, seule évolution de forme. Dans
`validate_api_docs.py` : `selector` rejoint les `allowed_fields` Angular, le contrôle de version
attend 3, et `selector` est exigé non vide pour un payload Angular.

**Renderer.** `ComponentApiReference.tsx` affiche le point d'attache au-dessus des tables de
membres, pour que la page dise sur quoi poser les inputs.

### 5. Documentation et exemples

Les trois exemples `apps/doc/src/examples/angular/tooltip-{basic,controlled,rich}.ts` sont
réécrits : plus de `viewChild`, plus d'`ElementRef`, la directive se pose sur le déclencheur. Le
`tooltip.overview.mdx` gagne l'énoncé exigé par la doctrine sous verdict `platform-shape` — React
livre un composant enveloppant, Angular une directive — et une note de rupture.

`packages/mcp/src/bundled/doc-src/data/components/tooltip.overview.mdx` porte une copie du MDX :
elle doit suivre.

### 6. Tests

Les 28 tests de `packages/ui-angular/src/lib/tooltip/tooltip.spec.ts` sont réécrits contre la
directive. La matrice sémantique elle-même n'a pas à être reportée : elle vit désormais dans
`packages/core/src/lib/dom/tooltip.spec.ts`. Les tests Angular couvrent ce que le contrôleur ne
peut pas couvrir — la liaison des inputs, la projection du `TemplateRef`, le cycle de vie de la
surface, l'émission de `openChange`, et l'accessibilité rendue.

Un test de non-régression est ajouté côté documentation : un payload Angular sans `selector` doit
faire échouer `validate_api_docs.py`.

## Ce que ce cycle ne fait pas

- Aucune modification de l'API publique React ni du contrôleur partagé, sauf défaut avéré.
- Aucune migration des autres composants Angular vers une forme différente.
- Aucun `@Injectable` ni `@Pipe` réel : le générateur les reconnaîtra, mais aucun n'existe encore.
