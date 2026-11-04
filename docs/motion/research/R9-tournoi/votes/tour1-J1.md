# Vote 1 — J1 (juge)

1. J2 — Force : un cœur unique, des liaisons minces et des exceptions documentées, dont le cas des îles Astro sans contexte partagé. Faiblesse : surface de maintenance élevée (routage, registre, wrapper Presence de React) et vérifiabilité par agent limitée au build.
2. J4 — Force : erreurs nommées au build qui couvrent l'exigence « un agent doit pouvoir l'écrire correctement », avec lexique fermé et pause typée. Faiblesse : fermeture susceptible de peser sur l'expressivité, et l'échappement `raw()` reste un point d'entrée non contrôlé.
3. J5 — Force : couvre les cas de la liste du problème (cascade, partage, compteur, texte) et laisse le designer régler les valeurs sans code. Faiblesse : contradiction sur le plancher, puisque `partition.scan` est chargé sur toute page ; pause et défaut du scroll non traités.
4. J3 — Force : politique de réduction et pause dans le cœur, avec un test de conformité entre modes `full` et `instant`. Faiblesse : ne couvre ni partage, ni texte, ni SVG, ni séquences ; c'est une couche d'accessibilité, pas une solution complète au problème.
