# J5 — Étape 2 : solution

## 1. Partition

Un langage de mouvement en intentions : une phrase = un verbe (entrer, sortir, partager, compter, écrire, suivre) + un jeton du designer + un rythme relatif.
La même phrase s'écrit en attributs HTML (Astro, pages statiques) ou en objet typé (React, Svelte, Angular), et le cœur la valide de la même façon.
Il la compile vers le moteur le moins coûteux capable de la tenir, et applique la variante réduite dessinée par le designer.

## 2. Exemples

### Astro / HTML

```astro
---
const cartes = await getCartes();
---
<ul data-entrer="entree" data-rythme="0.12">
  {cartes.map(c => (
    <li><a href={`/c/${c.id}`} data-partage={`carte-${c.id}`}>{c.titre}</a></li>
  ))}
</ul>
<strong data-compter="1280" data-entrer="lent">0</strong>
<script>import { partition } from '@udixio/motion'; partition.scan(document);</script>
```

La page détail porte `<h1 data-partage="carte-3">`. Le partage est résolu par nom, sans navigation JS dédiée. Sans capacité JS demandée, la page n'embarque que le fondu compilé en CSS ou WAAPI.

### React (Svelte et Angular : le même objet)

Fichier du designer, validé au build :

```json
{ "entree": { "duree": 480, "courbe": [0.2, 0, 0, 1], "reduit": "fondu-seul" },
  "lent":   { "duree": 1200, "courbe": "standard", "reduit": "instantane" } }
```

```tsx
import { usePartition } from '@udixio/motion/react';

const cascade = { entrer: 'entree', rythme: 0.12 } as const; // 'entre' ne compile pas

export function Liste({ items }: { items: Carte[] }) {
  const ref = usePartition<HTMLUListElement>(cascade);
  return <ul ref={ref}>{items.map(i => <li key={i.id}>{i.titre}</li>)}</ul>;
}
```

Svelte : `<ul use:partition={cascade}>`. Angular : `<ul [partition]="cascade">`.

## 3. Pourquoi

- Le mouvement voulu décide de la forme. Cascade, partage, compteur et texte découpé doivent être des verbes de première classe, pas des options ajoutées à une primitive.
- Le plancher de J1 tient : le coût se paie par capacité demandée. Un fondu n'embarque aucun JS ; le chunk moteur n'arrive que pour une capacité absente du natif.
- Le designer reprend une valeur sans toucher au code : les nombres vivent dans un seul fichier de jetons, les composants ne voient que des noms.
- Une seule sémantique (J2) : la forme HTML et les liaisons de framework sont deux syntaxes de la même phrase.

## 4. Comment

1. Le cœur parse la phrase (attributs ou objet), la valide contre les types générés depuis les jetons, et lève une erreur nommée en dev.
2. Il choisit le moteur : CSS pour opacity, transform, délai ; WAAPI pour un fondu interruptible ; View Transitions pour `partage` quand le navigateur le tient ; sinon état final sans animation.
3. Le moteur JS (anime.js derrière un chunk chargé à la demande) ne sert qu'au ressort interruptible, à la découpe de texte, aux trajectoires, au SVG et au compteur.
4. La politique réduite est résolue une fois (`matchMedia` et `data-motion` sur `<html>`) et applique le jeton `reduit`. Aucune liaison ne peut la contourner.
5. Les jetons sont exportés en propriétés CSS (`--udx-entree-duree`) : Tailwind les consomme, il n'écrit pas les séquences.
6. En dev, `partition.ralenti(0.25)` et le rejeu permettent au designer de valider le rythme sans relancer l'application ; un fondu seul doit livrer zéro Ko de JS (test de CI).

## 5. Repris et rejeté

- Repris de J1 : coût par capacité, chunk JS à la demande, repli en état final. J2 : une sémantique, liaisons minces, registre versionné, parité par fixtures. J3 : politique unique, pause obligatoire, parallaxe désactivée par défaut. J4 : verbes fermés, jetons nommés, spec sérialisable.
- Rejeté de J4 : l'interdiction absolue des valeurs brutes. Les nombres existent, mais seulement dans le fichier du designer, validé au build ; `raw()` dans un composant reste interdit.
- Rejeté de ma thèse 1 : le FLIP JS en repli de `partage`, qui coûte du JS à tous ; J1 a raison, le repli devient l'état final.
