# Vote tour 2 — J2

1. J4 — Force : dix intentions fermées, sortie explicite mappée sur `animate.leave` et `out:`, tokens sources des types, vérification au build du HTML, parité par fixtures. Faiblesse : partage sans View Transitions réduit à l'état final, et pas de déplacement FLIP explicite.
2. J1 — Force : table de paliers publique et testée, dev qui affiche palier, poids et raison de toute retombée, vocabulaire cohérent. Faiblesse : sortie décrite seulement pour React, et `compter` charge toujours un module JS.
3. J5 — Force : expressivité la plus riche et designer maître des valeurs, avec une table de paliers. Faiblesse : `data-compter="1280"` contredit sa propre règle, la syntaxe HTML et JS diverge (`data-sequencer` / `sequencer`), et le fichier d'extensions reconduit un échappement hors contrat.
