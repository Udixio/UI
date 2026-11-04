# Finale — résultat

| Juge | Choix |
|---|---|
| J1 | J2 |
| J3 | J4 |
| J5 | J2 |

**Vainqueur : J2 « Intentions » (v4)**, 2 voix contre 1 — `J2-finale-solution.md`.

Raison majoritaire (J1, J5) : seul à tenir « natif d'abord » de bout en bout
avec un palier fixe par verbe (`move` en WAAPI, `scroll` en scroll timeline,
`share` en View Transitions) ; le JS ne reste que pour `count` et `write`.

Raison minoritaire (J3) : J4 ferme mieux contre les omissions silencieuses
(`sequence` et `exit` sont des verbes ; `change` sans `aria-controls` refusé).

## À reprendre de J4 dans la solution gagnante (convergence des 3 juges)

- Un verbe `sequence` distinct (un `group` oublié doit échouer au build) — J1, J3.
- Sortie explicite (`exit`, reliée à `animate.leave` / `out:`) — J3, J5.
- Contrôle de build : `group` sans membre, `change` sans `aria-controls` — J3, J5.
- Pause des boucles en CSS (`animation-play-state`), pilotable au clavier — J2 lui-même.
- Budget chiffré du cœur mesuré en CI — J1, J5.
