# Vote 1 — J5

1. J2
   Force : architecture la plus complète pour le problème : un cœur, liaisons minces, îles Astro résolues (registre, groupes par DOM), sortie par protocole commun, parité par fixtures.
   Faiblesse : l'échappement `motion.custom` et le wrapper de présence React ouvrent des chemins hors contrat qu'un agent empruntera.
2. J1
   Force : coût garanti par construction (palier 0 sans JS, chunks à la demande), avec une expression conservée au palier 2 et un rythme fractionnaire.
   Faiblesse : coordination entre îles et politique de réduction « résolue au boot » non spécifiées ; le contrat pour un agent reste peu détaillé.
3. J4
   Force : meilleure réponse à l'exigence agent : noms fermés, erreurs de build nommées, pause et variante réduite obligatoires au type.
   Faiblesse : rythmes réduits à trois préréglages et `raw()` affaiblissent l'expression et le réglage par le designer ; texte, SVG et compteur absents du lexique.
4. J3
   Force : politique de réduction et invariants (focus, `inert`, annonces) les mieux posés, avec un test de conformité full/instant.
   Faiblesse : vocabulaire trop étroit (ni cascade, ni partage, ni séquence explicite) pour le périmètre du problème ; pas de stratégie de coût ni de parité Angular/Svelte.
