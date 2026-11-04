# Vote tour 1 — J2

Critère : quelle solution résout le problème de 00-probleme.md (motion commun, multi-framework, îles Astro, banal, fiable pour humain et agent, coût maîtrisé, accessible).

1. J4 — Force : contrat fermé, erreurs de build nommées, pause et variante réduite obligatoires, une spec pour quatre liaisons. Faiblesse : pas de compteur ni de défilement explicite, et aucune coordination de séquence entre îles.
2. J5 — Force : la meilleure expressivité (cascade, partage inter-pages, compteur, texte) avec des jetons que le designer règle sans code. Faiblesse : pas de pause pour les boucles (WCAG 2.2.2), et une contradiction entre la thèse (repli FLIP JS) et la solution (repli en état final).
3. J1 — Force : coût garanti par construction (palier chargé seulement si la spec l'exige), mesurable en ms et Ko. Faiblesse : la sélection de palier par détection DOM est fragile, et la contrainte agent (noms fermés, pause) est presque absente.
4. J3 — Force : meilleure politique d'accessibilité (mode unique au cœur, rendu réduit obligatoire, invariants de focus). Faiblesse : couche d'accessibilité plus que solution de motion ; séquence, partage et texte n'y sont pas exprimés.
