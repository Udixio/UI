# J5 — Étape 3 : solution

## 1. Partition (v3)

Un langage de mouvement en dix verbes fermés : entrer, sortir, changer, partager, sequencer, boucler, compter, ecrire, tracer, suivre.
Chaque verbe reçoit des jetons nommés que le designer définit dans un seul fichier ; une phrase s'écrit en attributs HTML ou en objet typé, avec la même validation.
Le cœur choisit le palier par verbe (table publique), applique la politique de réduction, et n'embarque que les paliers demandés.

## 2. Exemples

### Astro / HTML

```astro
<!-- cascade : le rythme est un jeton, jamais un nombre dans la page -->
<ul data-sequencer="entree" data-rythme="serre">
  {cartes.map(c => <li><a href={`/c/${c.id}`} data-partager={`carte-${c.id}`}>{c.titre}</a></li>)}
</ul>

<!-- 1280 est une valeur de contenu, pas un paramètre de mouvement -->
<strong data-compter="1280" data-jeton="lent">0</strong>

<!-- boucle : data-pause est obligatoire, sinon erreur de build -->
<div data-boucler="lent" data-pause="#pause-defile">…</div>
<button id="pause-defile">Pause</button>
```

### React (le même objet vaut pour Svelte et Angular ; jetons du designer ci-dessous)

```json
{ "entree": { "duree": 480, "courbe": [0.2, 0, 0, 1], "reduit": "fondu" },
  "lent":   { "duree": 1200, "courbe": "standard", "reduit": "instantane" },
  "rythmes": { "serre": 0.08, "standard": 0.12 } }
```

```tsx
import { usePartition, Presence } from '@udixio/motion/react';

const cascade = { sequencer: 'entree', rythme: 'standard' } as const; // 'entre' ne compile pas
const retrait = { sortir: 'entree' } as const; // une sortie rejoue le jeton d'entrée à l'envers

export function Liste({ items, visible }: { items: Carte[]; visible: boolean }) {
  const ref = usePartition<HTMLUListElement>(cascade);
  return (
    <Presence present={visible} spec={retrait}>{/* garde le nœud jusqu'à la sortie */}
      <ul ref={ref}>{items.map(i => <li key={i.id}>{i.titre}</li>)}</ul>
    </Presence>
  );
}
```

## 3. Pourquoi

- Dix verbes fermés couvrent la liste du problème, un chemin d'écriture par verbe (J4) ; les nombres vivent dans le fichier du designer, 1280 reste une donnée (J5).
- Le palier est une table publique par verbe, pas une détection DOM, et le plancher tient : une page sans verbe JS ne reçoit aucun script (J1, porteur).
- L'accessibilité est au cœur (J3) : pause typée pour `boucler`, `essentiel` requis, `suivre` désactivé par défaut, focus et `inert` garantis.
- Les îles Astro (J2) : un registre versionné par page et un observateur du DOM remplacent `partition.scan(document)`, qui ne voyait pas les îles hydratées tard.

## 4. Comment

1. Le build (HTML) ou le typage (TS) valide chaque phrase : verbe inconnu, jeton absent, pause manquante pour `boucler`, raison manquante pour `essentiel`. L'erreur nomme le champ.
2. Table de paliers : entrer, changer, sortir, partager, sequencer → CSS ou WAAPI (View Transitions pour `partager`, sinon état final dessiné par le designer) ; compter, ecrire, tracer, boucler, suivre → JS chargé à la demande, seulement si présent.
3. La politique réduite est résolue une fois (`matchMedia` et `data-motion-policy` sur `<html>`) et applique le jeton `reduit`, choisi par le designer parmi deux rendus nommés.
4. Sortie : `inert` posé, animation, retrait ; le focus revient au déclencheur avant l'animation. Une capacité absente se déclare dans un fichier d'extensions du projet, jamais en argument d'un composant.
5. Dev : `inspecter(el)` affiche verbe, palier et poids ; test de conformité : `full` et `instant` donnent le même DOM final, focus et annonces.

## 5. Ce qui a changé et pourquoi

- Dix verbes fermés et une table de paliers publique remplacent les mots-clés flous et la détection DOM ; les valeurs brutes sortent des attributs et des composants (juges 1, 3, 4).
- Sortie, pause typée, `essentiel`, `suivre` désactivé, `inert` et test full/instant entrent dans la solution (J3, J4) ; `motion.custom` et `raw()` deviennent une extension déclarée au projet (J2, J4).
- Le repli du partage est l'état final, mesuré (FLIP retiré) ; `scan(document)` cède la place à un registre et un observateur (J1, J2).
