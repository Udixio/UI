# J4 — Étape 3 : solution

## 1. Nom et description

**Lexique** : dix intentions fermées (`enter`, `exit`, `change`, `reveal`, `share`, `sequence`, `count`, `split`, `draw`, `loop`), des options qui n'acceptent que des jetons nommés de `tokens.json`, et une spec en données. Le cœur valide, résout la politique de réduction une fois, puis compile chaque intention vers CSS, WAAPI, View Transitions ou un chunk JS chargé à la demande.
Un lexique pour React, Angular, Svelte et l'HTML d'Astro ; le moteur reste invisible ; pause et rendu réduit sont exigés par le type. Hors v1 : les gestes, déclarés absents plutôt que partiellement implémentés.

## 2. Exemples d'utilisation

### Astro (HTML, îles sans contexte partagé)

```html
<ul data-motion="sequence" data-motion-entry="rise" data-motion-rhythm="medium" data-motion-group="intro">
  <li>Carte 1</li><li>Carte 2</li>
</ul>
<strong data-motion="count" data-motion-entry="slow">1280</strong>
<h2 data-motion="split" data-motion-entry="rise">Titre</h2>
```

La cible du compteur se lit dans le texte : `1280` est du contenu, pas une valeur de mouvement. Le build Astro refuse `data-motion="sequnce"` et `data-motion-rhythm="0.12"` (un nombre n'est pas un jeton).

### Angular (typé)

```ts
import { sequence, loop } from '@udixio/motion/angular';

@Component({ template: `<ul [udxMotion]="intro"><li>…</li></ul>` })
export class Liste {
  intro = sequence({ entry: 'rise', rhythm: 'medium', group: 'intro' }); // valide
  // sequence({ entry: 'rise', rhythm: 0.12 })  erreur : 'rhythm' attend un jeton de tokens.json
  // sequence({ entry: 'rise', duree: 420 })    erreur : propriété inconnue
  // loop({ every: 'slow' })                     erreur : 'pause' manquant (WCAG 2.2.2)
}
```

Il n'existe pas de `raw()` dans les composants : un lint de build refuse toute valeur numérique de mouvement hors de `tokens.json`.

## 3. Pourquoi

- L'échec principal d'un agent est l'erreur muette : tout nom ou nombre étranger échoue au build, et l'agent ne dispose que de noms à reproduire.
- Dix intentions couvrent la liste du problème, sauf les gestes : apparitions, sorties, scroll (`reveal`, explicite, désactivé par défaut), transitions d'état et mise en page (`change`), éléments partagés, listes, séquences, compteurs, texte, SVG.
- Un seul chemin par effet : l'agent reproduit le motif le plus fréquent de son corpus, il faut donc que ce motif soit le bon.
- Pause et rendu réduit sont des champs du type (J3), avec un défaut générique (`fade`, ou `instant` pour `count`) que le designer peut surcharger.
- Le plancher de coût vient de la table de routage : `enter` reste en CSS sans rien charger d'autre, et un test CI le vérifie.

## 4. Comment

1. `tokens.json` (durées, courbes, rythmes nommés, variantes réduites) appartient au designer ; c'est le seul fichier qui contient des nombres. Il génère les types.
2. Le manifeste des dix intentions est la source unique : types TypeScript, validation du HTML au build Astro, page de doc avec un exemple par intention.
3. Routage au plus bas palier : `enter`, `exit`, `reveal`, `change` en CSS ou WAAPI ; `share` en View Transitions si supporté, sinon état final (pas de FLIP, assumé) ; `sequence`, `count`, `split`, `draw` en chunk JS chargé à la demande.
4. `exit(el)` renvoie une Promise et le nœud reste dans le DOM jusqu'à sa résolution. Angular le mappe sur `animate.leave`, Svelte sur `out:`, React paie un wrapper de présence documenté.
5. Groupes résolus par `data-motion-group` dans le DOM, donc compatibles avec les îles ; le registre `globalThis[Symbol.for('udixio.motion@1')]` ne porte que l'état des séquences.
6. Invariants runtime (J3) : focus, `aria-expanded` et `inert` changent de façon synchrone ; une animation ne retarde jamais une action ni une annonce ; un `hidden` posé à la main est refusé en dev.
7. Parité : des fixtures communes tournent dans les quatre liaisons ; une divergence est un test rouge.

## 5. Ce qui a changé et pourquoi

- Ajout de `count`, `split`, `draw` et d'un protocole `exit` explicite : compteurs, texte, SVG et sorties figuraient dans le problème et manquaient à ma version précédente (critiques de J1, J2, J3, J5).
- `raw()` retiré des composants, rythmes devenus jetons illimités dans `tokens.json` : l'échappement non contrôlé et le plafond de trois préréglages sont corrigés.
- Repris de J3 et J2 : défaut réduit générique, scroll explicite, invariants de focus, coordination des groupes par DOM ; le FLIP JS en repli disparaît.
