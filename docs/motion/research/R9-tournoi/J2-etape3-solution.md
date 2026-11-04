# J2 — Étape 3 : solution « Intentions » (v2)

## 1. Nom et description

**Intentions** (`@udixio/motion`) : neuf verbes fermés (`enter`, `reveal`, `leave`, `change`, `loop`, `share`, `cascade`, `count`, `write`). Chaque verbe a un rendu réduit (défaut `fade` ou `instant`, surchargeable par jeton), une pause si le verbe boucle, et des options typées qui n'acceptent que des noms de jetons.
Un cœur sans framework valide, applique la politique de réduction une fois, et exécute chaque verbe à un palier fixé par verbe (natif, puis chunk JS chargé à l'appel). Il n'y a pas d'échappement libre : une capacité nouvelle devient un verbe nommé, avec ses fixtures.
Les liaisons (HTML `data-motion`, React, Angular, Svelte) n'écrivent que la syntaxe ; l'état vit sur l'élément, et la coordination de groupe passe par le DOM.

## 2. Exemples

**Astro / HTML** (une fois dans le layout, puis n'importe quelle île ou page) :

```html
<script src="/motion/core.js" type="module"></script>

<!-- les îles React ou Svelte du même groupe rejoignent la cascade -->
<ul data-motion="cascade" data-motion-group="intro" data-motion-rythme="serre">
  <li>Un</li><li>Deux</li>
</ul>
<button aria-expanded="false" aria-controls="aide" data-motion-trigger="aide">Aide</button>
<div id="aide" data-motion="reveal" hidden>…</div>
<!-- sans data-motion-pause : erreur de build, « loop » boucle -->
<div data-motion="loop" data-motion-every="lent" data-motion-pause="pause-slides">…</div>
<button id="pause-slides">Pause</button>
```

**React** (le composant n'écrit ni `hidden`, ni la réduction, ni le focus) :

```tsx
import { useMotion } from '@udixio/motion/react';

export function Aide({ open }: { open: boolean }) {
  // useMotion('reveal', { open, duree: 420 }) : erreur de typage, « duree » n'est pas une option
  const ref = useMotion<HTMLDivElement>('reveal', { open, focus: 'premier' });
  return <div ref={ref}>…</div>;
}
```

## 3. Pourquoi

- Surface fermée et petite : neuf verbes, un jeu d'options par verbe. Un échappement libre est un chemin hors contrat qu'un agent empruntera (J4, J5) ; la capacité manquante s'ajoute comme verbe.
- Réduction et pause dans le type (J3, J4) : `loop` exige `pause`, `essential` exige `reason`, chaque verbe porte son rendu réduit. Oublier l'un est une erreur de build.
- Plancher de coût sans détection magique (J1, J4) : le palier est fixé par verbe et documenté dans une table ; le chunk JS n'est chargé que par l'appel d'un verbe qui en a besoin, jamais par la présence d'un attribut.
- Expressivité par nommage (J5, J3) : cascade, partage, compteur et écriture sont des verbes de premier rang ; le rythme est un jeton, jamais une valeur dans un composant.
- Îles : groupe résolu par le DOM, politique par attribut sur `<html>`, aucun contexte partagé.

## 4. Comment

1. `tokens.json` (durées, courbes, rythmes `serre | moyen | large`, rendus réduits) : le designer le règle, il génère les types et les propriétés `--udx-*`. Les composants ne contiennent aucun nombre.
2. `attach(el, verbe, options)` valide contre les types et lève une erreur nommée en dev. `motion check` fait le même contrôle sur le HTML construit, en CI, sans plugin Astro au runtime.
3. Paliers fixés : `enter`, `reveal`, `leave`, `change`, `loop` tournent en CSS ou WAAPI (WAAPI si interrompu). `cascade`, `count`, `write` et `share` chargent un chunk JS à l'appel ; `share` utilise View Transitions si présentes, sinon FLIP dans le même chunk.
4. Invariants du cœur : `reveal` et `leave` passent en `inert` avant l'animation, puis retirent `hidden` ou le nœud ; le focus revient au déclencheur avant l'animation ; une région `role="status"` existe dès le chargement.
5. Groupes : `data-motion-group` résolu par `querySelectorAll` au premier `attach`. Un membre tardif (île `client:visible`) joue son propre verbe sans rejoindre une cascade déjà jouée : exception documentée.
6. Politique : `matchMedia` et `data-motion-policy` sur `<html>` donnent un mode unique. En `reduce`, seul le rendu réduit est compilé ; un `fade` ne télécharge aucun chunk.
7. Parité : fixtures par verbe ; même DOM final, même focus et mêmes annonces dans les quatre liaisons. `<Presence>` React n'existe que pour `leave` sur un nœud géré par React : exception documentée.

## 5. Ce qui a changé et pourquoi

- Supprimé `motion.custom` et `raw()`, ajouté `count`, `write`, `share` comme verbes : les échappements étaient les chemins hors contrat relevés par J4 et J5 ; l'expressivité passe par des verbes nommés.
- Pause, rendu réduit et invariants (focus, `inert`, annonces) passés dans le type et le cœur (J3), rythme réduit à trois jetons sans valeur brute dans les composants (J4, J5).
- Palier fixé par verbe au lieu de détection DOM (J1, J4), et `reveal` garde le nœud avec `hidden` : Presence ne sert plus qu'à `leave`.
