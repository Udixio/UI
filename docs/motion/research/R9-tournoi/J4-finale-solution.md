# J4 — Finale : solution

## 1. Nom et description

**Lexique** : onze intentions fermées (`enter`, `exit`, `change`, `move`, `share`, `sequence`, `count`, `split`, `draw`, `scroll`, `loop`). Un nom par verbe, identique en HTML, en JS et dans `tokens.json` ; les options reprennent leur nom dans l'attribut (`data-motion-rhythm` pour `rhythm`). Les noms et les options sont au code ; les valeurs (durées, courbes, rythmes, rendus réduits) sont au designer.
Le cœur valide, résout la politique de réduction une fois, puis exécute chaque intention à un palier fixe publié : le navigateur change le rendu, jamais le palier. Hors v1 : les gestes, déclarés absents.

## 2. Exemples d'utilisation

### Astro (HTML, îles sans contexte partagé)

```html
<script src="/motion/core.js" type="module"></script>

<ul data-motion="sequence" data-motion-entry="rise" data-motion-rhythm="snug" data-motion-group="intro">
  <li>Carte 1</li><li>Carte 2</li>
</ul>
<strong data-motion="count" data-motion-duration="long">1280</strong>
<button aria-controls="aide">Aide</button>
<div id="aide" data-motion="change" hidden>…</div>
<figure data-motion="share" data-motion-name="hero">…</figure>
```

`1280` est du contenu : la cible du compteur se lit dans le texte. `motion check` refuse `data-motion="sequnce"`, `data-motion-rhythm="0.12"`, un `share` sans `data-motion-name`, et un `change` sur un nœud `hidden` qu'aucun `aria-controls` ne référence.

### Angular (typé)

```ts
import { sequence, loop } from '@udixio/motion/angular';

@Component({
  template: `@if (ouvert) { <ul [udxMotion]="liste"><li>…</li></ul> }`,
})
export class Liste {
  liste = sequence({ entry: 'rise', rhythm: 'snug', group: 'intro' }); // valide
  // sequence({ entry: 'rise', rhythm: 0.12 })  erreur : attend tight | snug | medium | loose | wide
  // sequence({ entry: 'rise', duration: 420 }) erreur : attend short | medium | long
  // loop({ every: 'long' })                    erreur : 'pause' manquant (WCAG 2.2.2)
}
```

Le retrait du `@if` déclenche `exit` : Angular le relie à `animate.leave`, sans appel explicite. Aucun `raw()` et aucune extension : un lint refuse tout nombre de mouvement hors de `tokens.json`.

## 3. Pourquoi

- L'échec principal d'un agent est l'erreur muette. Un nom ou un nombre étranger échoue au build ; l'agent n'a que des noms à reproduire, et un seul chemin par effet.
- Onze intentions couvrent la liste du problème : apparitions et sorties, transitions d'état et disclosure, mise en page, partage, listes en séquence, compteurs, texte, SVG, défilement lié, boucles. Les gestes restent hors v1, dit explicitement.
- Le coût est lisible avant d'écrire la page : chaque verbe a un palier fixe, publié et testé. Une page qui n'utilise que `enter`, `change` ou `loop` n'embarque aucun module JS.
- Pause, rendu réduit et disclosure sont traités par le cœur (J3) : `loop` exige `pause`, `change` pose `hidden`, `inert`, `aria-expanded` et le focus. Aucun composant ne les écrit à la main.
- Noms au code, valeurs au designer : un rythme nouveau est un changement de version, et le designer règle chaque valeur sans toucher au code.

## 4. Comment

1. `tokens.json` donne une valeur à chaque nom fixé au code : `short | medium | long`, `tight | snug | medium | loose | wide`, rendus réduits `fade | instant`. Il génère les types et les `--udx-*`.
2. Un manifeste unique des onze verbes génère les types, la validation du HTML (`motion check` en CI, sans plugin Astro à l'exécution) et la doc, avec un exemple par verbe.
3. Table de paliers fixes : `enter`, `exit`, `change`, `sequence`, `loop` en CSS ou WAAPI (`loop` se met en pause par `animation-play-state`) ; `draw` en CSS pour le trait seul ; `move`, `count`, `split`, `scroll`, `share` en chunk JS chargé à l'appel. `share` utilise View Transitions dans ce chunk si elles existent, sinon le FLIP.
4. `exit(el)` renvoie une Promise ; le nœud reste dans le DOM jusqu'à sa résolution. Angular (`animate.leave`), Svelte (`out:`) ; React paie un wrapper de présence documenté, seule exception de liaison.
5. Groupes résolus par `data-motion-group` dans le DOM au premier attach. Un membre tardif d'île joue son verbe sans rejoindre une cascade déjà jouée : exception documentée. Recommandation : une liste en `sequence` tient dans une seule île.
6. Politique : `matchMedia` et `data-motion-policy` sur `<html>` donnent un mode unique ; en `reduce`, seul le rendu réduit est compilé. Invariants : focus, `aria-expanded` et `inert` synchrones ; aucune animation ne retarde une action ni une annonce.
7. Budget : cible de 2 Ko gzip pour le cœur d'attache, à valider au prototype et mesurée en CI ; une page dont les seuls verbes sont `enter`, `change` ou `loop` ne charge aucun module de palier 2.
8. Parité : des fixtures par verbe tournent dans les quatre liaisons (même DOM final, même focus, mêmes annonces).

## 5. Ce qui a changé et pourquoi

- Le palier de `share` est fixé à 2 et le repli `flip | none` disparaît du jeton : le navigateur change le rendu, jamais le palier (critiques de J1, J2, J3).
- La disclosure passe par `change` avec `aria-controls` vérifié au build, et la règle `data-motion-<option>` est lintée : le panneau masqué a de nouveau un verbe, et les attributs suivent la nomenclature du code (critiques de J1, J2).
- Un budget chiffré pour le cœur, et des rythmes et durées fermés au code mais réglés par valeur (critiques de J5, J3).

## 6. Pourquoi choisir cette solution plutôt que celle de J2

- Un `sequence` est un verbe, pas un modificateur de `enter` : un `group` sans `enter` échoue en silence (un membre reste visible), alors qu'un `sequence` mal écrit échoue au build. Pour un agent, un verbe qu'on ne peut pas oublier est plus sûr qu'un attribut qu'on peut omettre.
- Le partage garde son FLIP sur tous les navigateurs : J2 tombe à l'état final sans View Transitions, ce qui sacrifie l'expression sur une partie de la cible `defaults`. Le coût est connu et ne pèse que sur les pages qui utilisent `share`.
- Le contrat de J2 est plus court à retenir, et si le jury juge la surface plus importante que la forme des cascades, c'est son avantage réel.
