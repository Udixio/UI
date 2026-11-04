# Vote M4 — R13 (étapes 3 et 4)

Expert M4 (frameworks, îles, SSR). Notes sur 10 ; jugement de cohérence contre §8 (grammaire `data-motion` + `data-motion-<option>`, verbes §8.1, noms réservés, reprise `carry` / `restart` par verbe §8.0 bis #4, surface §8.0 bis #3, frame unique §8.0 #3, handle §8.0 #4). Les faits « à vérifier » du registre restent ouverts dans les notes qui les touchent.

## (1) Top 10

- M3-L02 — seule source de vérité du « avant », base de tout le FLIP et des autres choix ; cohérent avec la frame unique.
- M5-L09 — table verbe × option qui rend une mauvaise combinaison visible au typage, au build et en dev ; aucune exception.
- M1-L01 — primitive `motion.layout(portée, mutation)` pour les mutations impératives ; forme TS de `data-motion="layout"` ; absorbe `mutate` (M5-L01) et les points de capture par environnement.
- M5-L02 — lint verbe × variante qui refuse `hover:` sur `layout` et renvoie à `emphasize` ; réponse directe à C5.
- M4-L07 — navigation de page avec `direction` existant et repli propre ; garde l'option `route` sans verbe à arbitrer avec V09.
- M4-L08 — Astro et MPA en chemins natifs (C3, C6) ; n'ajoute aucune option ; dépend de la vérification des événements Astro.
- M5-L07 — présence portée par la racine retirée, sans liste de clés ; cohérent avec §8.0 #2 ; `order` reste à trancher.
- M1-L05 — vitesse exacte d'un ressort analytique, `velocity.source` honnête, sans saut en `carry` ; limité au ressort à un degré de liberté.
- M5-L05 — identité typée et référence seule (§8.0 bis, S01) ; `defineShared` à réduire à une option de `defineMotion` pour respecter S04.
- M5-L10 — recette citée au moment de l'erreur, utile aux agents ; reste un complément de M5-L02 et de M5-L09, sans verbe.

Pas de contradiction dans le top 10. M1-L01 et M3-L02 sont complémentaires (la transaction lit le cache). M4-L07 et M4-L08 couvrent des cas distincts (même document, cross-document). Ex æquo à 7 exclus du top 10 : M3-L05 (réordonnancement sans clé) ; il entre si l'un des dix sort.

## (2) Notes

- M3-L02 = 9 — Cache « avant » borné à la racine, une seule lecture groupée en frame (§8.0 #3) ; le coût reste à mesurer.
- M5-L09 = 9 — Table verbe × option générée, cohérente avec §8.0 bis #1 (manifeste et types) ; ne couvre pas les définitions construites à l'exécution.
- M1-L01 = 8 — Transaction de layout explicite, cohérente avec la frame unique et le handle ; limitée aux mutations synchrones, à compléter par M3-L02 pour l'asynchrone.
- M5-L02 = 8 — Erreur de build pour `hover:` sur `layout` ; cohérente avec S10 ; exception déclarée pour `emphasize`, et le lint ne voit pas les classes dynamiques.
- M4-L07 = 8 — Navigation de route avec `direction` existant (§8.1 #4), repli sans VT ; le preset `route` sans verbe contredit V09 et reste à arbitrer.
- M4-L08 = 8 — Deux chemins natifs (`ClientRouter`, `@view-transition`), conformes à C3 et C6 ; l'usage de `transition:name` reste hors grammaire, déclaré.
- M5-L07 = 8 — Présence sur la racine retirée, options fermées (V03) et défaut réduit instantané (V02) ; `order` et l'enfant ajouté pendant la sortie restent ouverts.
- M1-L05 = 8 — Vitesse exacte d'un ressort analytique, `velocity.source` conforme à §8.0 bis #4 ; le `linear()` seul ne suffit pas à la reprise, à retenir en token (M5-S05).
- M5-L05 = 7 — Identité typée, référence seule (S01) et registre global (§8.0 #1) ; `defineShared` est une troisième fonction de définition à fusionner dans `defineMotion`.
- M5-L10 = 7 — Fiches « cas » et erreurs qui citent la recette ; cohérent avec S10 et V10, n'est pas un verbe ; coût de contexte pour l'agent à mesurer.
- M3-L05 = 7 — Réordonnancement détecté par identité de nœud dans un lot MutationObserver, sans clé de framework ; le nœud recréé n'est pas reconnu et le lot dépend de la coalescence.
- M3-L01 = 6 — Déclencheur par attribut, cohérent avec §8.0 bis ; `data-open` non préfixé doit devenir `data-state` et `data-motion-scope` doit entrer dans V03.
- M5-L03 = 6 — `emphasize` avec `interrupt="carry"` et `defineMotion` conformes au modèle ; le défaut `restart` contredit §8.0 bis #4 (exemple : `carry` pour un changement d'état), à corriger avant de retenir.
- M4-L06 = 6 — Fenêtre de contrepartie pour îles hydratées à des moments différents ; le seuil « une frame » est arbitraire, la fin d'hydratation serait plus juste, et la fenêtre globale sort des défauts par verbe.
- M5-L08 = 6 — `data-presence` écrit par le runtime, stylable et lisible par `inspect()` ; exception à §4.3 et à « l'auteur écrit les attributs », et `leaving` contre `exiting` n'est pas tranché.
- M2-L10 = 5 — Option `pop` utile pour les listes, mais elle change la géométrie du flux ; `exit` est réservé (V07), et elle ne doit pas être le défaut.
- M5-L04 = 4 — Passer `collapse` de `appear` / `disappear` à `layout` contredit V05 ; il faut décider avec M1-L06 (CSS pur) et unifier l'appel `useMotion('collapse')` avec les définitions.
- M2-L06 = 3 — FLIP unique sans `match-element` contredit C3 et §4.5 sans démonstration ; à retenir seulement si un spike montre la fidélité.
- M1-L04 = 2 — `layout` pour couleur et rotation élargit le verbe au-delà de la géométrie (§8.1 #2) et expose au risque C5 ; `emphasize` couvre déjà le cas.
