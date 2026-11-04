# J1 — Étape 2 : solution

## 1. Nom et description

**Motion par paliers.** Une spec fermée, en données, dont le palier d'exécution (0 : CSS seul ; 1 : WAAPI ; 2 : JS, View Transitions, FLIP) est déduit de l'intention demandée. Le code d'un palier n'est chargé que si une spec l'exige : une page qui n'anime que des apparitions ne charge aucun JS. Le plancher de coût est garanti par construction, pas par discipline.

## 2. Exemples

### Exemple A — Astro : apparition et cascade, palier 0 et palier 1

```astro
---
import '@udixio/motion/tier0.css'; // palier 0 : CSS seul, aucun script
---
<h2 data-motion="enter">Titre</h2>
<!-- palier 1 : le boot charge le module WAAPI seulement parce que
     data-motion-stagger est présent dans le DOM -->
<ul data-motion="enter" data-motion-stagger="short">
  <li>Carte 1</li>
  <li>Carte 2</li>
</ul>
<script src="@udixio/motion/boot"></script>
```

Le CSS place l'état final dans le HTML et ne pose le mouvement que sous `prefers-reduced-motion: no-preference` (J3). Un JavaScript absent laisse la page lisible.

### Exemple B — React : séquence typée, rejet d'une valeur hors jeton

```tsx
import { useMotion, enter } from '@udixio/motion/react';

export function Galerie({ photos }: { photos: { id: string; label: string }[] }) {
  // palier 1 : rythme = fraction de la durée du jeton « standard »
  const cascade = useMotion(enter.sequence({ tone: 'standard', rythme: 0.12 }));
  // enter.sequence({ duree: 420 }) : erreur de typage, la durée n'est pas un jeton
  return (
    <ul ref={cascade.ref}>
      {photos.map((p) => <li key={p.id} data-motion-item>{p.label}</li>)}
    </ul>
  );
}
```

## 3. Pourquoi

- Le coût se paie par palier utilisé : une page sans séquence ni partage n'embarque pas le palier 2.
- Une spec fermée (J4) rend le palier déterminable à partir de l'intention : l'auteur ne le choisit pas, et l'agent ne peut pas écrire une version plus chère par erreur.
- Un seul runtime et une seule spec (J2) : les adaptateurs ne font que l'attachement, les mesures de coût sont faites une fois par palier, dans le cœur.
- Le palier 0 est l'état final du HTML (J3) : le mouvement est une couche, pas un défaut à retirer.
- L'expressivité (J5) reste au palier 2, sans CSS écrit par le designer ni classes utilitaires répétées sur chaque élément.
- Le coût du palier 2 n'est payé que par les pages qui l'utilisent, et il se mesure (ms de main thread, INP) dans la doc.

## Comment

1. Une intention (`enter`, `leave`, `share`, `sequence`) reçoit des jetons nommés (`tone`, `rythme` en fraction de durée). Le typage refuse les valeurs brutes ; le runtime lève une erreur nommée en dev pour une donnée non typée.
2. Le routeur lit la spec et choisit le palier le plus bas : fondu ou transition simple en CSS (0), décalage et rythme en WAAPI (1), partage, ressort interruptible et découpe de texte en JS (2).
3. Chaque palier est un module séparé, importé dynamiquement au premier usage. Le registre est `globalThis[Symbol.for('udixio.motion@1')]`, versionné par majeure (J2).
4. Interruption : CSS et WAAPI ne conservent pas la vitesse ; le palier 2 le fait. La règle de bascule est écrite dans la doc, pas laissée au hasard.
5. La politique de réduction est résolue une fois au boot ; la variante réduite est un jeton jumeau dessiné par le designer (J5), à défaut un fondu seul.

## 4. Repris et rejeté

- Repris de J2 (spec pure, runtime unique, registre `globalThis`, parité par fixtures), de J4 (vocabulaire fermé, jetons, rejet au typage) et de J3 (état final correct, politique au cœur).
- Repris de J5 : les intentions et la variante réduite dessinée. Rejeté : « le ressort est forcément JS » ; le ressort en `linear()` suffit tant qu'il n'est pas interrompu.
- Contesté : anime.js comme moteur par défaut (J1 initial) ; il n'est retenu qu'au palier 2, pour ce que ni CSS ni WAAPI ne tiennent.
