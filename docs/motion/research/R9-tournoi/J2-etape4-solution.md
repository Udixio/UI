# J2 — Étape 4 : solution « Intentions » (v3)

## 1. Nom et description

**Intentions** (`@udixio/motion`) : onze verbes fermés, un seul nom par verbe, identique en HTML, en JS et dans `tokens.json` : `enter`, `leave`, `reveal`, `change`, `move`, `share`, `loop`, `count`, `write`, `draw`, `scroll`. La cascade n'est pas un verbe : c'est un `group` qui décale les membres d'un `enter` ou d'un `leave`.
Chaque verbe a un palier fixe (table publiée et testée), un rendu réduit (défaut `fade` ou `instant`, surchargeable par jeton), et des champs obligatoires : `pause` pour `loop`, `reason` pour `essential`.
Un cœur sans framework valide, applique la politique de réduction une fois, puis exécute. Il n'y a ni échappement libre ni extension projet : une capacité nouvelle est une ligne de la table, avec son rendu réduit et ses fixtures, en version mineure. Les liaisons HTML, React, Angular et Svelte n'écrivent que la syntaxe.

## 2. Exemples

**Astro / HTML** (une fois dans le layout, puis n'importe quelle page ou île) :

```html
<script src="/motion/core.js" type="module"></script>

<ul data-motion="enter" data-motion-group="intro" data-motion-rhythm="medium">
  <li>Un</li><li>Deux</li>
</ul>
<strong data-motion="count">1280</strong>
<button aria-expanded="false" aria-controls="aide" data-motion-trigger="aide">Aide</button>
<div id="aide" data-motion="reveal" hidden>…</div>
<!-- sans data-motion-pause : erreur de build -->
<div data-motion="loop" data-motion-every="slow" data-motion-pause="pause-slides">…</div>
<button id="pause-slides">Pause</button>
```

**React, Angular, Svelte** (une seule forme de spec : `verb` plus les options) :

```tsx
import { useMotion } from '@udixio/motion/react';

export function Aide({ open }: { open: boolean }) {
  // hidden, inert, focus et réduction : gérés par le cœur, jamais par le composant
  const ref = useMotion<HTMLDivElement>({ verb: 'reveal', open, focus: 'first' });
  // { verb: 'reveal', open, duration: 420 } : erreur de typage, « duration » attend un jeton
  return <div ref={ref}>…</div>;
}
// Angular : <div [udxMotion]="{ verb: 'reveal', open: isOpen }">
// Svelte  : <div use:motion={{ verb: 'reveal', open: isOpen }}>
```

## 3. Pourquoi

- Onze verbes couvrent la liste du problème : apparition, sortie, état, mise en page et trajectoire, partage, liste en cascade, séquence, compteur, texte, SVG, défilement, boucle. Les gestes sont hors v1, et je le dis.
- Un nom par verbe et par option, identique dans les trois langages (HTML, JS, tokens) : l'agent et le relecteur n'ont qu'une langue. C'est la réponse aux noms mêlés relevés par J1, J3, J4 et J5.
- Palier fixe, sans condition de navigateur : `move`, `count`, `write` et `scroll` chargent un module JS à l'appel, `share` utilise View Transitions et tombe à l'état final sinon. Le coût se lit dans la table.
- Pause, rendu réduit et `essential` sont dans le type (J3). Le rythme tient en trois noms (`tight`, `medium`, `loose`) : le designer règle leurs valeurs, il ne peut pas en inventer.
- Aucun échappement libre : une capacité absente s'ajoute au cœur, pas au projet. C'est la réponse à « renvoyé à un verbe à ajouter sans contrat » (J2 vu par J3).

## 4. Comment

1. `tokens.json` : durées, courbes, `rhythm`, rendu réduit par verbe. Il génère les types et contient le seul nombre du système ; un lint refuse un nombre dans un composant ou un attribut.
2. `attach(el, spec)` valide contre les types et lève une erreur nommée en dev. `motion check` valide le HTML construit en CI, sans plugin Astro au runtime.
3. Table des paliers : `enter`, `leave`, `reveal`, `change`, `loop` en CSS ou WAAPI (WAAPI si interrompu) ; `draw` en CSS pour le trait seul (un morphing SVG est hors v1) ; `share` en View Transitions ; `move`, `count`, `write`, `scroll` en chunk JS chargé à l'appel.
4. Invariants : `reveal` et `leave` passent en `inert` avant l'animation, puis retirent `hidden` ou le nœud ; le focus revient au déclencheur avant l'animation ; une région `role="status"` existe dès le chargement.
5. Groupe : résolu par `querySelectorAll` au premier `attach`, le rythme vaut pour les membres. Un membre tardif (île hydratée après) joue seul : exception documentée. Recommandation : les membres d'une cascade partagent une île ou un `client:load`.
6. Politique : `matchMedia` et `data-motion-policy` sur `<html>` donnent un mode unique ; en `reduce`, seul le rendu réduit est compilé.
7. Sortie : Angular mappe sur `animate.leave`, Svelte sur `out:`, React paie un wrapper `Presence`, exception documentée.
8. Parité : fixtures des onze verbes dans les quatre liaisons (même DOM final, même focus, mêmes annonces).

## 5. Ce qui a changé et pourquoi

- Noms unifiés en anglais, identiques en HTML, JS et tokens, avec trois rythmes fermés : fin des noms mêlés relevés par J1, J3, J4 et J5.
- Verbes `move`, `draw`, `write`, `scroll` ajoutés et nommés ; `cascade` devient un `group` ; `count` lit le texte, plus de nombre dans un attribut ; `scroll` passe en palier 2 fixe, sans condition.
- Extension projet et rythmes libres supprimés : une capacité s'ajoute au cœur avec table, rendu réduit et fixtures. `share` garde l'état final sans FLIP par défaut, tenu par la table et non par un repli caché.
