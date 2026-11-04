# Vote 2 — J5

1. J4
   Force : couvre le plus de cas de la liste (compteur, texte, SVG, séquence, partage, sortie) avec un contrôle strict à la compilation : tout nombre hors `tokens.json` et tout nom inconnu échouent au build, parité par fixtures.
   Faiblesse : pas de verbe pour la trajectoire (déplacer) ; le partage tombe à l'état final sans VT, ce qui réduit l'expressivité sur une partie des navigateurs `defaults`.
2. J1
   Force : onze intentions, dont trajectoire (`déplacer`), SVG (`dessiner`) et défilement (`défiler`) ; table de paliers fixe et testée, avec retombées signalées en dev.
   Faiblesse : le contrôle agent repose surtout sur les erreurs de build, sans lint de valeurs numériques hors jetons ; la coordination entre îles et la parité des quatre liaisons restent peu détaillées.
3. J2
   Force : meilleure architecture pour les îles (groupe par DOM, politique sur `<html>`, `motion check` en CI) et aucun échappement libre.
   Faiblesse : neuf verbes sans SVG ni défilement, deux cas explicites du problème ; un membre tardif de cascade est une exception qui réduit la garantie de séquence.
