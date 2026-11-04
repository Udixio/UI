# J5 — Étape 1 : thèse (motion designer)

## Mini-thèse

1. La forme du mouvement vient du mouvement voulu, pas de l'outil. La solution doit d'abord exprimer une cascade, une trajectoire, un élément partagé, un texte découpé, un compteur, un ressort.
2. Le plancher de coût se règle dans le backend, pas dans le vocabulaire. Je ne demande pas le plafond au détriment du coût : je demande que l'auteur n'ait pas à choisir le moteur.
3. Le vocabulaire est un langage d'intentions (entrer, sortir, déplacer, enchaîner, partager, révéler au scroll), pas de propriétés (translateY, opacity). Chaque intention se compile vers le moteur le moins cher qui la tient : CSS ou Web Animations API pour un fondu, JS pour une séquence avec ressort interruptible.
4. Pourquoi : le natif tient un élément qui apparaît. Il ne tient pas proprement une séquence de cinq éléments avec ressort interruptible : CSS ne conserve pas la vitesse lors d'une interruption, et linear() échantillonne une courbe figée. Les cas de la liste du problème demandent donc du JS coordonné.
5. J1 a raison sur le coût du cas simple, et ce coût reste faible si l'auteur n'écrit pas le backend. Le fondu compilé en WAAPI n'embarque aucun JS.
6. Le designer doit reprendre une valeur sans toucher au code. Les réglages vivent dans des tokens nommés, en données. Les décalages sont des fractions de la durée, pour que changer la durée garde le rythme.
7. La variante réduite est dessinée par le designer, comme token jumeau. Ce n'est ni au développeur d'improviser, ni à la bibliothèque de couper silencieusement le mouvement (rejoint J3).
8. Une valeur hors plage (durée nulle ou négative, ressort instable, décalage supérieur à 1) échoue au typage ou au build, avec le nom du token. Pas de mouvement qui casse en silence (rejoint J4).
9. Limite assumée : ce langage coûte plus cher à concevoir que des classes utilitaires. Je l'accepte pour que les séquences ne soient pas écrites à la main.

## Exemple 1 — Cas à exprimer : cinq cartes en cascade, puis une carte devient le détail

```ts
motion.sequence(cartes, {
  entree: 'monter-fondu',
  rythme: 0.12,                       // fraction de la durée : 0.12 -> 0.2 sans toucher au code
  partage: { de: '#carte-3', vers: '#detail-hero' }
});
```

Le `partage` se compile en View Transitions quand la cible le permet, en FLIP JS sinon. L'auteur ne voit que l'intention. Le coût accepté : le designer valide les deux rendus, ce qui est le prix d'un moteur à deux branches.

## Exemple 2 — Contre-exemple : le même rythme en classes utilitaires

```html
<li class="animate-[monter-fondu_480ms_ease-out_both] motion-reduce:animate-none"
    style="animation-delay: calc(var(--i) * 60ms)">
```

Cette ligne est répétée sur cinq éléments : la durée existe en cinq exemplaires, le rythme est un `60ms` en dur, le partage est inexprimable, et `motion-reduce:animate-none` supprime tout le mouvement au lieu de proposer une variante dessinée. Verdict : utile pour le plancher, inutilisable comme langage de séquence.

## Exemple 3 — Fichier de tokens, éditable par le designer

```json
{
  "entree": { "duree": 480, "courbe": [0.2, 0, 0, 1], "reduit": "fondu-seul" },
  "rebond": { "type": "ressort", "raideur": 180, "amortissement": 22, "reduit": "fondu-seul" }
}
```

Le designer règle `raideur` en regardant le rendu ; le développeur ne touche jamais ce fichier. `entree` compile en Web Animations API, sans JS embarqué. `rebond` n'embarque le moteur de ressort que si un composant l'utilise. Une valeur `"raideur": -5` ou `"duree": 0` échoue au build et nomme le token fautif.
