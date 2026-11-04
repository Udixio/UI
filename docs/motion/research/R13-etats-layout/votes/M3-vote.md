# Vote M3 — R13 (étapes 3 et 4)

Notes sur 10, sur les 19 choix du registre. Chaque note juge aussi la cohérence avec §8 du spec (fondations §8.0, surface §8.0 bis, grammaire et verbes §8.1). Deux de mes propres choix figurent dans le registre (M3-L01, M3-L02, M3-L05) : je les note comme les autres, sans les surnoter.

## (1) Top 10

Pas de paire contradictoire dans le top 10. Deux dépendances sont signalées ci-dessous, et deux choix restent ouverts sur un point non tranché.

1. M3-L02 — c'est la mesure « avant » par défaut, sans lecture dans le callback de mutation ; tous les autres choix de Q1 s'y appuient.
2. M3-L01 — déclencheur sur attribut `data-*` et non sur classe, ce qui rend le signal observable sans bruit et cohérent avec §8.0 bis.
3. M5-L02 — le lint verbe × variante traite l'erreur la plus probable (animer un survol en `layout`) et renvoie à la recette ; garde-fou de M5-S10.
4. M5-L05 — identité partagée typée (`defineShared`), conforme à la référence seule de §8.1 #1 ; seul choix qui tranche proprement Q4.
5. M5-L07 — la présence est portée par la racine retirée ; c'est la réponse la plus simple à Q6 et elle reste dans §8.0 #2.
6. M5-L09 — table verbe × option générée, une seule source pour types, build et dev : elle rend les autres choix vérifiables.
7. M5-L03 — `emphasize` avec `interrupt="carry"` répond à Q2 sans verbe nouveau ; réserve : le défaut `restart` de R12 contredit §8.0 bis #4, à trancher.
8. M5-L08 — `data-presence` écrit par le runtime donne un état stylable sans JS ; réserve : le nom et la valeur (`leaving` / `exiting`) sont à unifier.
9. M4-L07 — une seule API de navigation pour quatre intégrations, avec `direction` existant ; réserve : preset `route` hors verbes, et API React/React Router à vérifier.
10. M3-L05 — réordonnancement reconnu par identité de nœud dans un même lot MutationObserver, sans clé de framework ; dépend de M3-L02 (dépendance, non contradiction).

Dépendances : M3-L05 dépend de M3-L02 ; M5-L02 et M3-L01 partagent la même détection d'attribut. Aucune contradiction à l'intérieur du top 10.

Hors top 10 : M5-L04 (conteste le verbe de `collapse` et chevauche M1-L06), M4-L06 (fenêtre de rétention utile, mais « une frame » est arbitraire), M1-L01 (mesure en transaction, en double avec M3-L02), M1-L05 (ressort exact limité au degré de liberté 1), M4-L08 (natif assumé, événements Astro à vérifier), M5-L10 (fiches utiles pour les agents mais hors des six questions), M2-L10 (sortie hors flux, option qui change la géométrie et chevauche `exit` réservé), M2-L06 et M1-L04 (contestés par la majorité).

## (2) Notes

M3-L02 : 8 — mesure « avant » par cache de frame, bornée à la racine, sans lecture dans le callback ; base de Q1 ; cohérent §8.0 #3 ; limite : cache périmé hors runtime (déclarée).
M1-L01 : 6 — primitive de transaction utile, mais second point d'écriture pré-mutation à côté de M3-L02 et mutation synchrone seulement ; exception à §8.0 bis #3 (`motion.layout` impératif) à fusionner.
M5-L02 : 8 — lint verbe × variante ferme la plus grosse erreur d'agent ; cohérent M5-S10 ; exception déclarée pour `emphasize` + `hover:`.
M5-L03 : 7 — réponse directe à Q2 avec les sept verbes ; le défaut de reprise reste contradictoire (`restart` R12 contre `carry` §8.0 bis #4) ; à trancher avant adoption.
M5-L04 : 6 — preset `collapse` en `layout` répond à Q3 ; contredit le verbe de V05 et chevauche la mécanique pure CSS de M1-L06 ; il faut choisir l'une des deux.
M5-L05 : 8 — `defineShared` respecte la référence typée (§8.1 #1, S01) ; le registre global tient entre îles ; seul point faible : l'ordre de chargement.
M4-L07 : 7 — `navigate(run, { direction })` unifie les quatre intégrations et respecte `start` / `end` ; preset `route` sans verbe à inscrire ; API React à vérifier.
M4-L08 : 6 — deux chemins natifs (C3) couvrent Astro et MPA ; événements `astro:*` non vérifiés, Firefox sans cross-document non traité.
M5-L07 : 8 — présence portée par la racine, ordre DOM sans clés, cohérent §8.0 #2 et options fermées ; `order` à trancher.
M5-L08 : 7 — état de sortie écrit par le runtime, stylable en Tailwind ; exception justifiée à « l'auteur écrit les attributs » ; nom et valeur encore en contradiction.
M2-L10 : 5 — sortie hors flux répond à un vrai défaut visuel, mais change la géométrie, touche au mot réservé `exit` et chevauche M1-L09 ; option à justifier davantage.
M1-L04 : 2 — `layout` pour couleur, rotation et opacité contredit §8.1 #2 et le risque C5 ; quatre experts sur cinq le contestent ; `emphasize` couvre le cas.
M1-L05 : 6 — vitesse exacte pour un ressort analytique, `velocity.source` honnête ; limité aux ressorts à un degré de liberté, bascule natif → JS non résolue ; cohérent §8.0 bis #4.
M2-L06 : 3 — FLIP JS unique sans démonstration, contredit C3 et §4.5 ; à ne retenir que si un spike prouve la fidélité.
M3-L01 : 8 — déclencheur attribut `data-*` sans bruit de classes, observation bornée par racine, cohérent §8.0 bis ; exceptions déclarées (`data-open` non préfixé, `data-motion-scope`).
M3-L05 : 7 — réordonnancement sans clé de framework par identité dans le lot MutationObserver ; limite connue (nœud recréé non reconnu) ; cohérent avec `layout` et `carry`.
M4-L06 : 6 — évite l'élément fantôme pour les îles hydratées à des moments différents (C6) ; « une frame » est arbitraire et `client:visible` reste non couvert.
M5-L09 : 8 — compatibilité verbe × option en types, build et dev ; une source pour quatre garde-fous (S10) ; messages TS plus longs, définition dynamique hors typage.
M5-L10 : 5 — fiches de recettes utiles pour un agent (C5), mais hors des six questions et dépendantes de la maintenance des frameworks.
