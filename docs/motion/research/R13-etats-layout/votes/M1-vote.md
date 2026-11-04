# M1 — Vote sur le registre R13 (moteur et rendu)

Jugé sur les 19 choix du registre (section 2). Chaque note tient compte du moteur (reprise, frame, lecture avant mutation, coût) et de la cohérence avec §8 de la spec (verbes fermés, grammaire `data-motion` + `data-motion-<option>`, options partagées, défauts de reprise et de rendu réduit, handle, présence, Tailwind pour états).

## 1. Top 10

1. M1-L05 — seule façon de reprendre un ressort interrompu sans saut de vitesse ; résout la tension §8.0 a.
2. M3-L02 — base unique de la valeur « avant », dont dépendent L03, L05, L08 et L10.
3. M3-L05 — réordonnancement détecté sans clé de framework : nœud retiré puis réinséré dans un même lot.
4. M4-L07 — `run` résout au montage de la nouvelle route, donc la capture est correcte ; `direction` existe déjà.
5. M5-L02 — rend visible l'erreur la plus probable (survol animé en `layout`) au build.
6. M5-L09 — une table verbe × option pour les cinq formes ; une mauvaise combinaison échoue au typage.
7. M5-L05 — identité typée, sans chaîne libre, conforme à S01 ; reprend l'unicité de M3-L08 et M2-L05.
8. M5-L07 — une seule racine porte la présence ; l'ordre de sortie suit le DOM.
9. M2-L10 — les frères ne sautent pas pendant une sortie ; à condition que l'option `pop` soit déclarée et non imposée par défaut.
10. M3-L01 — déclencheur par attribut, coût borné par racine ; à condition d'inscrire `data-open` et `data-motion-scope`.

Compatibilité des dix : aucune contradiction retenue. M1-L01 et M3-L02 proposent deux lectures de « avant » (lecture synchrone dans la transaction, ou cache de la frame précédente) : je ne retiens que M3-L02, M1-L01 ne serait qu'un repli quand le cache est invalidé. M2-L10 et M5-L07 sont compatibles : la présence est portée par la racine, le nœud sorti d'une liste passe hors flux. M5-L05 remplace les variantes M2-L05, M3-L08 et M4-L05 ; sa règle de production (premier ou dernier inscrit) reste à trancher (contradiction 12).

## 2. Notes (1 à 10)

- M3-L02 : 8 — socle de toute la détection, lecture groupée en frame unique (§8.0 #3) ; invalidation par ResizeObserver et MutationObserver bien posée, coût par élément suivi à mesurer.
- M1-L01 : 6 — mécanisme juste mais doublon de M5-L01 et second « avant » concurrent de M3-L02 ; nouvelle fonction publique hors grammaire (exception à §8.0 bis #3).
- M5-L02 : 7 — garde-fou nécessaire, à inscrire dans S10 ; reste heuristique sur classes dynamiques ; cohérence ok, exception déclarée pour `emphasize`.
- M5-L03 : 5 — forme propre, mais défaut `restart` d'`emphasize` contredit l'exemple de §8.0 bis #4 (changement d'état = `carry`) ; option `interrupt` hors liste partagée.
- M5-L04 : 5 — un seul preset pour la hauteur auto, mais change `collapse` de V05 et passe par un `layout` sur hauteur que M1-L06 fait en CSS pur, sans verbe.
- M5-L05 : 7 — identité typée et lint des noms orphelins ; `defineShared` est une troisième fonction de définition, exception justifiée par S01.
- M4-L07 : 8 — API unique, `run` résout au montage, `direction` existant ; le preset `route` sans verbe est une exception déclarée (V09 veut un verbe par entrée).
- M4-L08 : 6 — deux chemins natifs cohérents avec C3 ; dépend de noms d'événements Astro non vérifiés et de `<ClientRouter />` qui rejoue les scripts.
- M5-L07 : 7 — présence portée par la racine, ordre DOM sans clé ; cohérent avec V01, V02, V03 ; la sortie inverse reste hors liste fermée.
- M5-L08 : 5 — `data-presence` écrit par le runtime est juste, mais le rendu réduit instantané contredit le fondu de `disappear` (§8.1 corrigé) et `leaving` diverge de `exiting`.
- M2-L10 : 7 — sortie hors flux à la géométrie mesurée, c'est la seule façon d'éviter le saut des frères ; l'option change la géométrie du flux et doit rester explicite.
- M1-L04 : 3 — élargir `layout` aux valeurs non géométriques contredit §8.1 #2 et le sens donné en R12 ; `emphasize` couvre le cas, comme le disent quatre experts.
- M1-L05 : 9 — vitesse exacte pour un ressort analytique, `velocity.source` honnête, pas de saut en `carry` ; la contrainte sur les tokens (garder les paramètres, pas seulement `linear()`) est déjà requise par M1-V05 ; cohérence ok.
- M2-L06 : 3 — FLIP unique contredit C3 et §4.5 sans démonstration ; à écarter sauf spike qui le justifie.
- M3-L01 : 6 — déclencheur par attribut, coût borné par racine ; deux exceptions à inscrire (`data-open` non préfixé, `data-motion-scope`), et duplication avec la classe.
- M3-L05 : 8 — détection du réordonnancement sans clé, par identité de nœud dans le lot MutationObserver : technique réelle, valable pour les trois frameworks qui déplacent via insertBefore ; cohérence ok.
- M4-L06 : 4 — fenêtre de rétention utile pour les îles, mais « une frame » est arbitraire, `client:visible` non couvert, et la fenêtre est une règle globale hors défauts par verbe.
- M5-L09 : 7 — table verbe × option testable et partagée par cinq formes, cohérence ok ; limite connue des messages TS et de la construction dynamique.
- M5-L10 : 5 — utile pour les agents (C5) mais surtout de la documentation à maintenir ; cohérence ok.

## 3. Lecture par famille

- Le moteur (reprise, lecture avant mutation) est porté par M1-L05, M3-L02, M3-L05 : ce sont les choix à garder pour le noyau.
- La surface (API, grammaire, garde-fous) est portée par M5-L02, M5-L05, M5-L09 : cohérents avec §8.0 bis #1 et #3.
- Les choix contestés (M1-L04, M2-L06, M4-L06) touchent C3, §8.1 #2 ou la règle des fenêtres : je ne les garde pas en l'état.
