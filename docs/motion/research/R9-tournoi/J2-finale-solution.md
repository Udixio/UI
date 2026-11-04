# J2 — Finale : solution « Intentions » (v4)

## 1. Nom et description

**Intentions** (`@udixio/motion`) : onze verbes fermés, un nom par verbe, identique en HTML, en JS et dans `tokens.json` : `enter`, `leave`, `reveal`, `change`, `move`, `share`, `scroll`, `loop`, `count`, `write`, `draw`. Un verbe par effet ; la cascade est une option `group` d'`enter` ou de `leave`, pas un verbe.
Chaque verbe a un palier fixe (0 CSS, 1 API native, 2 module JS), publié et testé. Aucune option, aucun navigateur et aucun jeton ne change le palier. Le designer règle les valeurs et le rendu de repli (`fade` ou `instant`), jamais le coût.
Un cœur sans framework valide, applique la politique de réduction une fois, puis exécute. Pas d'échappement, pas d'extension projet : une capacité nouvelle est une ligne de la table, avec ses fixtures, en version mineure.

## 2. Exemples

**Astro / HTML** (script du cœur injecté par le layout, seulement sur les pages qui déclarent une intention) :

```html
<script src="/motion/core.js" type="module"></script>

<ul data-motion="enter" data-motion-group="intro" data-motion-rhythm="medium">
  <li>Un</li><li>Deux</li>
</ul>
<!-- la cible du compteur est le texte : aucun nombre de mouvement dans un attribut -->
<strong data-motion="count">1280</strong>
<button aria-expanded="false" aria-controls="aide" data-motion-trigger="aide">Aide</button>
<div id="aide" data-motion="reveal" hidden>…</div>
<div data-motion="loop" data-motion-every="long" data-motion-pause="pause-slides">…</div>
<button id="pause-slides">Pause</button>
<!-- sans data-motion-pause : erreur de build, « loop » boucle -->
```

**React, Angular, Svelte** (une seule forme de spec : `verb` plus les options) :

```tsx
import { useMotion } from '@udixio/motion/react';

export function Galerie({ photos }: { photos: Photo[] }) {
  // réduction, repli et focus sont gérés par le cœur, jamais par le composant
  const liste = useMotion<HTMLUListElement>({ verb: 'enter', group: 'intro', rhythm: 'medium' });
  // { verb: 'enter', rhythm: 0.12 } : erreur de typage, rhythm attend tight | medium | loose
  // { verb: 'loop', every: 'long' } : erreur de typage, pause manquant (WCAG 2.2.2)
  return <ul ref={liste}>{photos.map((p) => <li key={p.id}>{p.label}</li>)}</ul>;
}
// Angular : <ul [udxMotion]="{ verb: 'enter', group: 'intro', rhythm: 'medium' }">
// Svelte  : <ul use:motion={{ verb: 'enter', group: 'intro', rhythm: 'medium' }}>
```

## 3. Pourquoi

- Palier fixe, repli choisi : le coût d'une page se lit dans la table et ne dépend ni du navigateur ni du designer. `share` reste sur View Transitions (palier 1) ; son repli est un `fade` ou un `instant`, jamais un FLIP qui réintroduit du JS à la demande.
- Natif d'abord, JS nommé : `move` mesure dans le cœur et anime en WAAPI (palier 1) ; `scroll` passe par la scroll timeline (palier 1), repli `instant`, désactivé par défaut. Le JS ne reste que pour `count` et `write`, qui réécrivent le texte, et `draw` reste en CSS pour le trait.
- Un nom par verbe et par option, identique dans les trois langages : `group`, `rhythm`, `every`, `pause`, `open`, `focus` gardent leur nom partout.
- Accessibilité au type (J3) : `loop` exige `pause`, `essential` exige `reason`, chaque verbe porte son rendu réduit.
- Espace de réglage fermé : trois rythmes (`tight`, `medium`, `loose`) et trois durées (`short`, `medium`, `long`). Le designer règle les valeurs, pas les noms ; une nouvelle échelle est une version. Ce coût de fermeture est assumé.

## 4. Comment

1. `tokens.json` (designer) : durée, courbe, rythme, `reduit` et `repli` (`fade | instant`). C'est le seul fichier qui contient des nombres ; un lint refuse tout nombre dans un composant ou un attribut.
2. Un manifeste unique des onze verbes génère les types, la validation du HTML construit (`motion check` en CI, sans plugin Astro à l'exécution) et la page de doc, avec un exemple par verbe.
3. Table fixe. Palier 0 : `enter`, `leave`, `reveal`, `change`, `loop`, `draw`. Palier 1 : `move` (FLIP mesuré, WAAPI), `share` (View Transitions, repli `fade`), `scroll` (scroll timeline, repli `instant`). Palier 2 : `count`, `write`, chargés à l'appel.
4. Sémantique : `enter` et `leave` agissent sur la présence d'un nœud dans le flux ; `reveal` bascule la visibilité d'un nœud qui reste, avec `hidden` et `inert`. Un panneau relève de `reveal`, une liste de `enter` et `leave`.
5. Invariants : `inert` avant toute sortie, retrait du nœud ou `hidden` à la fin, focus rendu au déclencheur avant l'animation, région `role="status"` présente au chargement.
6. Sortie par liaison : Angular `animate.leave`, Svelte `out:`, HTML natif du cœur, React `Presence` (wrapper documenté comme exception).
7. Groupe : `group` résolu dans le DOM au premier `attach`. Un membre tardif (île hydratée après) joue seul : exception documentée. Recommandation : les membres d'une cascade sont dans une même île ou en `client:load`.
8. Politique : `matchMedia` et `data-motion-policy` sur `<html>` donnent un mode unique ; en `reduce`, seul le rendu réduit est compilé.
9. Parité : fixtures des onze verbes dans les quatre liaisons (même DOM final, même focus, mêmes annonces). Une page avec `enter` seul ne charge aucun module de palier 2.

## 5. Ce qui a changé et pourquoi

- `move` et `scroll` passent du palier 2 au palier 1 (FLIP mesuré en WAAPI, scroll timeline) : le JS ne reste que pour `count` et `write` (critiques de J1 et J5).
- Aucune option ne fait plus varier le palier : `share` garde View Transitions, et seul le repli `fade | instant` se choisit (critiques de J3 et J4).
- Le script du cœur n'est injecté que sur les pages qui déclarent une intention, et `enter` (présence) est séparé de `reveal` (visibilité) pour lever le chevauchement relevé par J4.

## 6. Pourquoi choisir cette solution plutôt que celle de J4

- Le palier ne se négocie pas : chez J4, le jeton `fallback: flip` rend `share` coûteux à la demande du designer ; ici le coût d'une page est identique pour tous, et la décision du designer se limite au rendu de repli.
- Le natif passe avant le JS : `move` et `scroll` restent sans module de palier 2, là où J4 les garde en chunk JS. Une page sans `count` ni `write` n'exécute que du CSS et de l'API native.
- J4 a raison sur la pause CSS (`animation-play-state`), moins chère que mon handle, et sur le manifeste unique ; je les reprends si la pause reste pilotable au clavier.
