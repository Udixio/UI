# M5 — Vote sur le registre R14 (21 choix retenus)

Base : `registre.md` (21 têtes de groupe, verdicts, jugements de cohérence, 25 contradictions ouvertes). Notes jugées avec §8 de la spec (§8.0 et §8.0 bis validés, §8.1 et §8.1 bis proposés). Mes propres choix (M5-R03, M5-R04) notés avec la même sévérité que les autres.

Règle de départage : à égalité de note, le choix sans contradiction ouverte qui lui est propre passe avant celui qui en porte une ; à défaut, le choix qui est la seule réponse de sa question au niveau 8 passe devant.

## 1. Top 10

1. M1-R06 — une seule source de paramètres physiques, émise en CSS, TS et Tailwind : c'est la réponse la plus complète à Q8.
2. M3-R03 — un seul observateur par page, pause hors vue et `inspect()` : la règle de runtime attendue par §8.0 (M1-04, M5-S09).
3. M3-R04 — un moteur par page dans `globalThis`, verbes chargés à la demande : c'est §8.0 #1 appliqué au chargement.
4. M2-R06 — cascade au rang visuel mesuré, plafond de durée testable : résout la contradiction 2 et sert Q1, Q6, Q10.
5. M2-R01 — le geste est une source nommée sans huitième verbe : cohérent avec §8.0 bis #5 et la règle « l'attribut nomme ».
6. M3-R01 — valeur écrite sur les cibles, sans re-rendu : seule réponse solide à Q5 pour le continu.
7. M3-R06 — paliers nommés partagés avec Tailwind, reconstruction au seul changement de palier : la réponse Q6 la plus sobre.
8. M5-R03 — manifeste unique pour types, lint, doc et agents : §8.0 bis #1 validé, et la seule réponse Q10 qui fonde les autres.
9. M2-R03 — alternative clavier obligatoire et typée, WCAG 2.5.7 : exigence d'accessibilité non négociable, même si la forme reste à arbitrer.
10. M1-R01 — séquence compilée une fois avec un handle unique : seule réponse Q1 qui résout la chorégraphie en TS et en HTML, malgré `part` et `at` à trancher.

Premiers exclus à 7 : M1-R10, M2-R02, M2-R04, M3-R05, M3-R08 (départagés par la règle ci-dessus).

## 2. Notes (1 à 10)

M1-R01 : 7 — compilée une fois avec un handle unique, mais `part` contre `step` et `at` contre `after` / `with` restent ouverts (contradictions 3 et 7).
M1-R04 : 6 — seul choix texte retenu ; la copie `sr-only` double le texte et les contradictions 4a et 4b restent ouvertes.
M1-R05 : 6 — tracé et trajectoire natifs, bon choix ; l'affirmation sur `morphTo` est contredite (contradiction 9) et le point M1-01 est reporté en R15.
M1-R06 : 8 — une source, trois émissions, ressort en `linear()` ; manque le repli legacy et l'échelle `short` (contradictions 10 et 20).
M1-R10 : 7 — les 19 contrôleurs passent par la surface publique, cohérent avec C11 ; dépend de M1-R06 et du retrait de `transition` (contradiction 23).
M2-R01 : 8 — pas de huitième verbe, geste = source nommée via `defineValue` ; reste à trancher la place de `data-motion-gesture` en HTML.
M2-R02 : 7 — reprise en ressort avec la vitesse exposée au handle ; deux sources de vitesse non résolues (contradiction 6), et `carry` impose anime.
M2-R03 : 7 — WCAG 2.5.7 et 2.1.1 couverts ; flèches contre espace et nom du champ (contradictions 11 et 15) à arbitrer.
M2-R04 : 7 — `layout` plus geste, tri traité comme donnée, cohérent avec §8.0 bis ; `reorder` reste un geste, ce qui tranche la contradiction 1 dans ce sens.
M2-R06 : 8 — rang visuel et plafond testable, cohérent avec le token `stagger` ; le coût de lecture par liste reste à mesurer.
M3-R01 : 8 — valeur écrite sur les cibles sans re-rendu, cohérent avec M5-S04 et §8.0 bis #5 ; le seuil discret reste au store.
M3-R03 : 8 — un observateur par page, pause et raison exposée à `inspect()` ; cohérent avec M1-04 et M5-S09.
M3-R04 : 8 — un moteur par page via `globalThis`, cohérent avec §8.0 #1 ; le délai d'idle et `pointerenter` restent à unifier (contradiction 14).
M3-R05 : 7 — registre et élagage clairs ; l'élagage paresseux et le choix `revert()` demandent un test, la fin de vie se joue avec M1-R08.
M3-R06 : 8 — paliers partagés avec Tailwind, reconstruction au seul changement de palier ; la lecture de `--breakpoint-*` depuis le thème reste à vérifier.
M3-R07 : 4 — une source CSS unique, mais `--udx-motion-scale` à 0 rend `disappear` instantané, contraire au fondu de §8.1 (contradiction 8).
M3-R08 : 7 — budget de propriétés et lint, cohérent avec M5-S10 ; `allow-paint` est une échappatoire et le seuil reste à mesurer.
M4-R02 : 6 — une prop `motion` clarifie la parité, mais ajoute une troisième forme face à `data-motion-<option>` (contradiction 23) et un ressort `spring-expressive` inexistant (contradiction 18).
M4-R06 : 7 — SSR correct et hydratation protégée ; `<data>` contre `data-motion-value` (contradiction 24) et locale fragile.
M5-R03 : 7 — manifeste unique validé par §8.0 bis #1 ; son contenu et la taille de `llms.txt` ne sont pas encore testés, donc note sévère.
M5-R04 : 5 — outils MCP dépendant du manifeste et absents de §8 ; ajoute une surface à maintenir sans besoin prouvé.
