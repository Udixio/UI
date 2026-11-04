# J1 — Étape 1 : thèse (performance, natif)

## Thèse

La bonne solution n'est pas une bibliothèque d'animation JS avec des adaptateurs. C'est une **description déclarative du mouvement** (données sérialisables : cible, propriétés autorisées, keyframes, durée, décalage, repli pour `reduce`) exécutée par le moteur le moins coûteux capable de la produire : CSS (transitions, `@starting-style`, `animation-delay` piloté par variable), puis WAAPI (`element.animate`), puis un moteur JS chargé à la demande pour ce que les deux premiers n'expriment pas.

Pourquoi : le coût se paie **par capacité utilisée**, pas par bibliothèque importée. Un élément qui apparaît ne coûte aucun octet de JS si on reste sur `opacity` et `transform` : l'animation tourne sur le compositeur, hors main thread. Une cascade se fait avec une variable `--i`. `linear()` approche les courbes à ressort sans JS, ce qui affaiblit l'argument « le natif ne sait pas faire de ressort ».

Conséquences : (a) le moteur JS n'est jamais le socle, c'est un chunk importé selon la capacité demandée ; (b) une seule description compilée vers CSS, WAAPI ou JS garde une sémantique unique (J2) et une surface d'options fermée, validable (J4) ; (c) l'état et les annonces restent côté JS, donc le repli par défaut est un état final correct.

Concessions : je ne défends pas « natif d'abord » comme règle de plafond. Le plafond d'expression (J5) est atteint par le moteur JS ; mon critère est « coût minimal pour l'expression demandée, mesuré ». Contestation de `defaults` : scroll-driven et View Transitions ne sont pas partout ; je n'ai pas vérifié la couverture exacte. Le repli devrait être un état final sans animation, pas un moteur JS payé par tous.

## Exemple 1 — Le plancher : un élément qui apparaît (zéro JS)

```css
.udx-reveal {
  transition: opacity 240ms, transform 240ms;
  @starting-style { opacity: 0; transform: translateY(8px); }
}
```

Aucune bibliothèque chargée, animation sur compositeur. Ce cas se mesure en Ko et en ms : c'est le chiffre à battre. Toute solution JS doit justifier son coût par une capacité absente ici.

## Exemple 2 — Limite du natif : une cascade de cinq éléments

```css
.udx-stagger > * { animation: udx-in 240ms both; animation-delay: calc(var(--i) * 60ms); }
```

Le natif suffit tant que la séquence n'est pas interrompue et réversée en cours de route avec reprise de la vélocité. Dans ce cas, le moteur JS est justifié, et le critère est mesurable (ce que le natif ne peut pas faire), pas une liste de fonctionnalités.

## Exemple 3 — Schéma de compilation : une description, trois moteurs

```
description ──► capacité demandée ?
  opacity / transform / délai / état     → CSS
  + interruption, timing piloté par JS   → WAAPI
  + texte découpé, trajectoire, SVG,
    élément partagé                      → moteur JS (chunk chargé à la demande)
```

Règle : une capacité absente déclenche le chargement du chunk, jamais le défaut. Le découpage de texte reste O(glyphes) sur le main thread au montage ; il doit être différé hors du chemin critique et mesuré en ms (INP).
