# Finale — vote de J1 (juge)

Choix : **J2 « Intentions » (v4)**.

Raison décisive : J2 tient le principe « le navigateur change le rendu, jamais le palier » sans exception. `move` (FLIP mesuré) et `scroll` (scroll timeline) restent en palier 1 natif, et seuls `count` et `write` chargent du JS. J4 garde `move`, `scroll` et `share` dans un chunk JS, ce qui fait payer le JS à des pages qui n'en ont pas besoin. Un nom par verbe et par option, identique dans les trois langages, sans `entry` ni `rise` qui réapparaissent dans les exemples de J4.

Ce que la gagnante doit reprendre de J4 : le verbe `sequence` distinct d'`enter`, pour qu'un oubli de `group` échoue au build et non en silence ; et le budget chiffré du cœur (2 Ko gzip, mesuré en CI).
