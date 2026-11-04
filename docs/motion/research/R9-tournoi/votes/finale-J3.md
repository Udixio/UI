# Finale, vote de J3 (juge)

Choix : J4.

Raison décisive : le problème nomme la fragilité face à un agent, et c'est là que J4 tient : `sequence` et `exit` sont des verbes qu'on ne peut pas omettre en silence, et `motion check` refuse un `change` sans `aria-controls` ou un `loop` sans pause, ce qui encode WCAG 2.2.2 et la relation disclosure dans le build. J2 réintroduit une omission silencieuse (`group` sans `enter` laisse les membres visibles) et met la pause derrière un handle JS.

Ce que J4 doit reprendre de J2 : le routage natif-d'abord de `move` (FLIP mesuré en WAAPI) et de `scroll` (scroll timeline), pour que les effets courants de mise en page ne chargent pas de module JS ; et la règle que aucune option ne change le palier.
