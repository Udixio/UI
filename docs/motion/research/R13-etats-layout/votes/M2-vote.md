# R13 — Vote de M2 (layout, partagé, présence)

Notes sur 10 pour les 19 choix du registre. Cohérence jugée contre §8 de la spec (§8.0 frame unique et présence, §8.0 bis surface et reprise, §8.1 grammaire et verbes). Je suis l'auteur de M2-L06 et M2-L10 : ils sont notés sur le fond, sans indulgence.

## 1. Top 10

- M3-L02 : source de vérité unique pour la « géométrie avant », lue en frame unique (§8.0 #3).
- M5-L07 : un seul nœud porte la présence, ordre DOM et `stagger` en token, cohérent avec M4-03.
- M5-L09 : une table verbe × option pour les cinq formes, appliquée au type, au build et au dev (S10).
- M5-L02 : erreur de build sur `hover:` avec `layout`, avec renvoi à la recette ; exception déclarée pour `emphasize`.
- M5-L05 : identité typée (S01) sur le registre global ; `defineShared` à inscrire comme troisième définition.
- M1-L05 : vitesse exacte d'un ressort à un degré de liberté, honnête via `velocity.source` ; à concilier avec M5-S05.
- M3-L01 : déclencheur en attribut, cohérent avec §8.0 bis (Tailwind règle l'état) ; `data-open` et `data-motion-scope` à inscrire.
- M4-L07 : API unique `navigate(run, { direction })` pour les routeurs ; le preset `route` reste à inscrire hors des dix de §8.1 #4.
- M4-L08 : deux chemins natifs (C3) pour Astro et le multi-document ; `transition:name` documenté comme non portable.
- M3-L05 : réordonnancement reconnu par identité de nœud, sans clé de framework, identique dans les cinq formes.

Paires : aucune paire contradictoire dans ce top 10. M4-L07 remplace M5-L06 et M1-L08 (fusionnés). M3-L05 n'est pas en conflit avec M5-L07, qui ne traite pas le réordonnancement. Hors top 10 : M5-L10 (7, rang 11).

## 2. Notes

- M3-L02 : 9 — source de vérité unique, lecture groupée en frame unique ; invalidation ResizeObserver explicite ; coût à mesurer.
- M5-L07 : 9 — un seul nœud porte la présence, ordre DOM et `stagger` token ; reste à trancher `order` et l'enfant ajouté pendant la sortie.
- M5-L09 : 9 — table verbe × option pour les cinq formes, sans exception à S10 ; limite connue sur les définitions construites à l'exécution.
- M5-L02 : 8 — lint verbe × variante avec recette citée ; exception déclarée pour `emphasize` ; repose sur S10.
- M5-L05 : 8 — identité typée et registre global, conforme à S01 ; `defineShared` est une troisième définition à inscrire (§8.0 bis #5).
- M1-L05 : 8 — vitesse exacte pour un ressort 1 DDL, pas pour une courbe de designer ; conflit à trancher avec M5-S05 (`linear()` au build).
- M3-L01 : 8 — attribut comme signal de layout, cohérent avec §8.0 bis ; deux noms à ajouter aux listes fermées.
- M4-L07 : 7 — une API pour les intégrations de routeurs, `direction` existant ; preset `route` hors §8.1 #4, dépendance à vérifier pour `addTransitionType`.
- M4-L08 : 7 — chemins natifs conformes à C3 ; `transition:name` hors grammaire, déclaré ; événements Astro à vérifier.
- M3-L05 : 7 — réordonnancement sans clé, identique partout ; un nœud recréé n'est pas reconnu, à documenter.
- M5-L10 : 7 — fiches « cas » utiles aux agents (C5) ; documentation plus que comportement de mouvement.
- M1-L01 : 6 — mesure transactionnelle utile, mais trois points d'écriture pré-mutation coexistent (M1-L01, M5-L01, M3-L03) ; à garder seulement fusionné.
- M5-L03 : 6 — `emphasize` avec définition explicite ; défaut `restart` contredit §8.0 bis #4 (`carry` pour un changement d'état) ; à corriger.
- M5-L04 : 6 — `layout` pour l'accordéon sans `display: none` ; change le verbe du preset `collapse` (exception V05) ; `hidden` et `inert` forment deux sources.
- M5-L08 : 6 — attribut de présence fermé, utile en Tailwind ; rendu réduit instantané contredit le fondu de §8.1 corrigé ; `leaving` à trancher contre `exiting`.
- M2-L10 : 5 — popLayout juste sur le fond ; option redondante avec M1-L09 et nom `exit` réservé (M5-V07) ; choix de l'auteur, noté sans indulgence.
- M4-L06 : 5 — besoin réel des îles (C6) ; seuil « une frame » arbitraire et fenêtre globale hors convention.
- M2-L06 : 4 — rendu unique et fidèle à §4.7, mais contredit C3 et §4.5 sans démonstration ; choix de l'auteur, noté sans indulgence.
- M1-L04 : 2 — `layout` pour couleur et rotation contredit §8.1 #2 et le sens de V01 ; `emphasize` couvre déjà le cas ; contesté par quatre experts.
