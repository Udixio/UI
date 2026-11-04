# J4 — Étape 4 : solution

## 1. Nom et description

**Lexique** : onze intentions fermées (`enter`, `exit`, `change`, `move`, `share`, `sequence`, `count`, `split`, `draw`, `scroll`, `loop`). Les noms et les options sont au code ; les valeurs (durées, courbes, rythmes, rendus réduits, repli du partage) sont au designer, dans `tokens.json`. Le cœur valide, résout la politique de réduction une fois, puis exécute chaque intention à un palier fixe publié.
Un lexique pour React, Angular, Svelte et l'HTML d'Astro, avec des identifiants anglais partout ; seule la documentation est en français. Hors v1 : les gestes, déclarés absents plutôt que partiellement implémentés.

## 2. Exemples d'utilisation

### Astro (HTML, îles sans contexte partagé)

```html
<ul data-motion="sequence" data-motion-entry="rise" data-motion-rhythm="snug" data-motion-group="intro">
  <li>Carte 1</li><li>Carte 2</li>
</ul>
<strong data-motion="count" data-motion-duration="long">1280</strong>
<figure data-motion="share" data-motion-name="hero">…</figure>
```

`1280` est du contenu : la cible du compteur se lit dans le texte. Le build Astro refuse `data-motion="sequnce"`, `data-motion-rhythm="0.12"` et un `share` sans `data-motion-name`.

### Angular (typé)

```ts
import { sequence, loop } from '@udixio/motion/angular';

@Component({ template: `<ul [udxMotion]="intro"><li>…</li></ul>` })
export class Liste {
  intro = sequence({ entry: 'rise', rhythm: 'snug', group: 'intro' }); // valide
  // sequence({ entry: 'rise', rhythm: 0.12 })   erreur : attend tight | snug | medium | loose | wide
  // sequence({ entry: 'rise', duration: 420 })  erreur : attend short | medium | long
  // loop({ every: 'long' })                     erreur : 'pause' manquant (WCAG 2.2.2)
}
```

Aucun `raw()` et aucune extension : un lint de build refuse toute valeur numérique de mouvement hors de `tokens.json`.

## 3. Pourquoi

- L'échec principal d'un agent est l'erreur muette : un nom ou un nombre étranger échoue au build, et l'agent ne dispose que de noms à reproduire.
- Onze intentions couvrent la liste du problème : apparitions et sorties (`enter`, `exit`, avec `on: 'view'` pour le déclenchement au défilement), transitions et mise en page (`change`, `move`), partage, listes et séquences, compteurs, texte, SVG, défilement lié (`scroll`), boucles. Les gestes restent hors v1.
- Noms au code, valeurs au designer : le vocabulaire reste fermé, et le designer règle le rendu sans toucher au code. Ajouter un rythme est un changement de version, pas une valeur ad hoc.
- Chaque intention a un palier fixe publié et testé : le coût se lit avant d'écrire la page. Le designer choisit le repli du partage (`fallback`), donc le compromis coût/expression est une décision visible, pas un repli silencieux.
- Pause et rendu réduit sont dans le type (J3) ; `loop` se met en pause par `animation-play-state`, sans JS.

## 4. Comment

1. `tokens.json` donne une valeur à chaque nom fixé au code : `short | medium | long`, `tight | snug | medium | loose | wide`, rendus réduits `fade | instant`, repli du partage `flip | none`. Il génère les types et les `--udx-*`.
2. Un manifeste unique des onze intentions génère les types, la validation du HTML (`motion check` en CI, sans plugin Astro à l'exécution) et la doc, avec un exemple par intention.
3. Table de paliers fixes : `enter`, `exit`, `change`, `sequence`, `loop` en CSS ou WAAPI ; `share` en View Transitions, repli FLIP selon le jeton ; `move`, `count`, `split`, `draw`, `scroll` en chunk JS chargé à l'appel. Toute retombée est signalée en dev avec sa raison.
4. `exit(el)` renvoie une Promise ; le nœud reste dans le DOM jusqu'à sa résolution (Angular `animate.leave`, Svelte `out:`, React avec un wrapper de présence documenté).
5. Groupes résolus par `data-motion-group` dans le DOM. Un membre tardif d'île (`client:visible`) joue son verbe sans rejoindre une cascade déjà jouée : exception documentée. Le registre `globalThis[Symbol.for('udixio.motion@1')]` ne porte que l'état des séquences.
6. Invariants runtime : focus, `aria-expanded` et `inert` changent de façon synchrone ; aucune animation ne retarde une action ni une annonce ; un `hidden` posé à la main est refusé en dev.
7. Politique : `matchMedia` et `data-motion-policy` sur `<html>` donnent un mode unique ; en `reduce`, seul le rendu réduit est compilé.
8. Parité : des fixtures par intention tournent dans les quatre liaisons. CI : une page dont les seules intentions sont `enter` n'embarque aucun module de palier 2.

## 5. Ce qui a changé et pourquoi

- Ajout de `move` (FLIP, palier 2) et séparation de `scroll` ; `reveal` devient `enter` avec `on: 'view'` : onze intentions pour la trajectoire et le défilement, sans verbe ambigu (critiques de J2, J5).
- Le repli du partage est un jeton choisi par le designer, et les noms de rythme et de durée sont fixés au code : le coût reste visible, l'expression n'est plus sacrifiée silencieusement, et `tokens.json` ne rouvre plus un espace illimité (J3, J5).
- Identifiants en anglais partout, membres tardifs d'île documentés comme exception, `loop` en pause CSS : les incohérences de J1 et les invariants d'île de J2 sont corrigés.
