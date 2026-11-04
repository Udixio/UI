# M5 — Vote sur le registre R13 (étapes 3 et 4)

Grille : §8 de la spec (verbes fermés, `data-motion` = référence seule, options de M5-V03, noms réservés de M5-V07). Les 19 choix du registre sont notés, dont les miens (M5-L02, M5-L03, M5-L04, M5-L05, M5-L07, M5-L08, M5-L09, M5-L10), jugés aussi sévèrement que les autres.

## 1. Top 10

1. M3-L02 — cache « avant » borné à la racine : seule base de FLIP sans lecture dans le callback.
2. M5-L02 — lint refusant les variantes non observables sur `layout` : rend visible l'erreur la plus probable (survol animé en `layout`).
3. M5-L09 — table verbe × option générée : une mauvaise combinaison casse au typage, au build et en dev.
4. M5-L05 — `data-motion-shared` renvoie à un nom déclaré : identité typée, conforme à la référence seule.
5. M5-L07 — présence portée par la racine retirée : une règle pour les cinq formes.
6. M3-L01 — déclencheur sur `data-*` et non sur `class` : signal propre, cohérent avec Tailwind et §8.0 bis.
7. M3-L05 — réordonnancement par identité de nœud dans le lot : sans clé, identique dans les quatre environnements.
8. M1-L01 — `motion.layout(portée, mutation)` comme transaction : point d'entrée explicite de la mesure « avant », complémentaire de M3-L02 (le cache sert hors transaction).
9. M4-L07 — `navigate(run, { direction })` pour les routeurs : consensus (quatre « valide »), mais le preset `route` sans verbe est une exception à V09.
10. M1-L05 — vitesse exacte d'un ressort analytique : seule réponse précise à la reprise (cas 2) ; tension ouverte avec M5-S05 (ressorts de token compilés en `linear()`).

Tensions signalées dans le top 10 : M4-L07 contre M5-L09 (preset sans verbe) ; M1-L05 contre M5-S05 ; M5-L05 introduit `defineShared`, troisième fonction de définition (exception de M2 non réglée). Aucun choix du top 10 n'en contredit un autre.

Hors top 10, écartés pour contradiction avec §8 ou R12 : M5-L03 (défaut `carry` pour `emphasize`), M1-L04 (`layout` sans géométrie), M2-L06 (FLIP unique contre C3).

## 2. Notes

- M1-L01 : 7 — point d'écriture explicite et précis, mais trois surfaces concurrentes (`motion.layout`, `mutate`, `udixio.motion.set`) à réduire à une.
- M1-L04 : 2 — `layout` pour couleur et rotation contredit §8.1 #2 et R12 M5-V01 ; `emphasize` couvre déjà le cas.
- M1-L05 : 6 — réponse précise à la reprise ; exige de garder les paramètres des ressorts (contre M5-S05) et ne couvre qu'un degré de liberté.
- M2-L06 : 3 — FLIP unique contre natif d'abord (C3, §4.5), sans spike ; pas retenable sans démonstration.
- M2-L10 : 4 — popLayout juste, mais `exit` est réservé (M5-V07) et l'option change le défaut de `disappear` ; M1-L09 suffit sans option.
- M3-L01 : 7 — `data-*` comme signal de layout, cohérent avec §8.0 bis ; `data-open` non préfixé et `data-motion-scope` à inscrire.
- M3-L02 : 8 — cache borné, lu dans la frame unique, sans lecture pré-mutation ; une seule source de vérité pour les quatre environnements.
- M3-L05 : 7 — détection du déplacement par identité de nœud, sans clé de framework ; limite connue sur les nœuds recréés.
- M4-L06 : 5 — fenêtre « une frame » arbitraire ; à remplacer par la fin d'hydratation et à rattacher aux défauts par verbe.
- M4-L07 : 6 — consensus et API simple pour les routeurs ; preset `route` sans verbe (V09) et `addTransitionType` à vérifier.
- M4-L08 : 5 — colle native honnête (C3), mais `ClientRouter` rejoue les scripts et les événements Astro ne sont pas vérifiés.
- M5-L02 : 7 — lint utile et cohérent avec M5-S10 ; heuristique sur classes Tailwind, à compléter par la règle de pseudo-classe.
- M5-L03 : 4 — défaut `carry` pour `emphasize` contredit R12 M5-V02 (`restart`), exception non résolue ; quatre experts le contestent ou le demandent.
- M5-L04 : 5 — `collapse` change de verbe (exception à V05) et la variante CSS de M1-L06 reste une alternative plus native non tranchée.
- M5-L05 : 7 — identité par référence déclarée, conforme à S01 ; règle de production (premier ou dernier) à trancher.
- M5-L07 : 7 — présence de sous-arbre portée par la racine, consensus de quatre experts ; `order` et `out:` restent à arbitrer.
- M5-L08 : 5 — `data-presence` est nécessaire pour Tailwind, mais le nom de valeur (`leaving` ou `exiting`) et le rendu réduit (instantané ou fondu) restent contestés.
- M5-L09 : 7 — table verbe × option cohérente avec S10 et unanime ; ne couvre pas les définitions construites à l'exécution.
- M5-L10 : 5 — utile pour les agents (C5), mais alourdit le contexte chargé et dépend de toutes les autres décisions.
