# J4 — Étape 1 : thèse

Persona : J4, concepteur d'outils pour agents IA.

## Thèse

Ma position : la solution doit être un **vocabulaire fermé, typé et déclaratif**, pas une grammaire ouverte.

- **Une intention, un verbe.** Apparaître, quitter, changer d'état, suivre le scroll, partager un élément, séquencer : chacun n'a qu'un chemin d'écriture. Deux écritures pour le même effet = l'agent en tire une au hasard, et le relecteur ne voit pas la différence.
- **Des jetons, pas des nombres.** Durées et courbes sont des noms du thème (`short | medium | long`, `standard | emphasized`). Une valeur brute échoue au typage ; l'échappement `raw(420)` existe mais il se lit en revue et se retrouve par grep.
- **La spec est une donnée.** Objet sérialisable, sans closure, passé tel quel par chaque adaptateur. La sémantique reste dans le cœur (J2) ; seule la syntaxe varie selon le framework.
- **La séquence se déclare, elle ne se calcule pas.** `stagger` sur un groupe, et non `delay: i * 120` recopié dans trois composants.
- **Le moteur est invisible à l'auteur.** Un routeur choisit WAAPI, View Transitions, animations liées au scroll ou JS selon la capacité. Je ne défends donc pas la surface d'anime.js : je défends qu'il serve de moteur de repli derrière un vocabulaire stable.

Contre Tailwind comme véhicule : `delay-[120ms]` est une valeur arbitraire dans une chaîne que le compilateur ne contrôle pas (A). Une classe mal orthographiée ne produit ni animation ni erreur (B). Donc la vérification doit porter sur des noms fermés, contrôlés à la compilation (C). La familiarité de Tailwind aide le premier jet ; elle ne compense pas une erreur muette.

Concession : J5 dira qu'un vocabulaire fermé appauvrit l'expression. Réponse : il ne l'appauvrit pas si séquence, trajectoire et élément partagé sont des verbes de première classe, et si un ressort ou une courbe sur mesure passe par un échappement nommé. Point à éprouver, pas acquis.

## Exemple 1 — Une erreur muette

```html
<li class="animate-[fadeUp_300ms_ease-out] dealy-[120ms]">
```

Aucun décalage, aucune erreur : `dealy` est ignoré en silence, et l'agent répète le motif sur toute la liste.

## Exemple 2 — Une spec, trois frameworks, un rejet

```ts
export const revealList = {
  effect: 'fade-up',
  stagger: 'short',
  duration: 'medium',
  easing: 'emphasized',
} satisfies MotionSpec;

// Rejet au typage : duration: 420
// '420' n'est pas assignable à '"short" | "medium" | "long"'
```

React : `<List motion={revealList} />`
Svelte : `<List motion={revealList} />`
Angular : `<ul [motion]="revealList">`

Même objet, même sémantique. En dev, une spec invalide qui arrive sans typage (JS, donnée externe) lève une `MotionSpecError` qui nomme le champ et la valeur attendue.

## Exemple 3 — Le routeur et son repli visible

```
MotionSpec ─► validation (typage ; garde runtime en dev)
  routeur de capacité
    ├─ opacity / transform seuls ─────► WAAPI
    ├─ élément partagé + support ─────► View Transitions
    ├─ scroll + support ──────────────► animations liées au scroll
    └─ séquence, ressort, repli ──────► moteur JS
         └─ dev : « scroll : repli JS, raison : … »
```

Le `prefers-reduced-motion` se résout ici, une fois, et non dans chaque composant. Test de couverture : une séquence de cinq éléments tient en une spec ; un élément partagé devient un verbe `share` ; compteur, texte découpé et SVG sont les endroits où le vocabulaire peut manquer, et il faudra le dire.
