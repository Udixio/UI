# M1 — Vote sur le registre R14

Je suis l'auteur de cinq choix notés ici (M1-R01, M1-R04, M1-R05, M1-R06, M1-R10) ; je les note sans complaisance, et le résultat de M1-R01 et M1-R04 reste bas sur la question où ils se recouvrent avec M5. Notes jugées contre le registre et contre §8 de la spec (§8.0 validé, §8.0 bis et §8.1 proposés).

## 1. Top 10

1. M3-R03 — un seul IntersectionObserver par page, pause document, inspect() : c'est §8.0 #1 et §8.0 bis #2 appliqués tels quels.
2. M3-R01 — valeurs écrites sans re-rendu, lues par store seulement pour le discret : c'est §8.0 bis #5 (defineValue) tenu jusqu'au bout.
3. M2-R03 — alternative clavier obligatoire et typée, WCAG 2.5.7 et 2.1.1 : seul le nom du champ (flèches contre espace) reste à trancher.
4. M5-R03 — manifeste produit au build (llms.txt et JSON) lu par types, lint, MCP et doc : §8.0 bis #1 et C5.
5. M2-R02 — reprise par `carry` avec `velocity.source` : §8.0 bis #4 et handle unique ; `velocityStack` reste à vérifier et la source de vitesse est en conflit avec M3-R09.
6. M1-R06 — une source de paramètres physiques, trois émissions : tokens `--udx-motion-*` ; alias Tailwind et valeurs M3 à corriger.
7. M3-R04 — une copie d'anime par page, cache par majeure (M5-07), verbe absent = zéro octet ; délai idle et déclencheur à arbitrer avec M2-R10.
8. M2-R01 — geste sans verbe via defineGesture et defineValue (§8.0 bis #5) ; `reorder` reste à placer.
9. M1-R04 — découpage après hydratation, copie sr-only, SSR en texte intact : même schéma qu'en §8.1 ; brouillage et `chars` / `letters` à trancher.
10. M2-R06 — cascade au rang visuel avec plafond en token : répond à « stagger en token » (correction §8.1) et évite le piège de `sibling-index()`.

## 2. Notes (1 à 10)

- M1-R01 : 6 — chorégraphie compilée en handle unique (§8.0 #4), mais `part` contre `step` et `at` à unifier avec M5-R05.
- M2-R06 : 8 — rang visuel et plafond en token, cohérent avec stagger en token ; `sibling-index()` écarté à raison.
- M1-R06 : 8 — une source, trois émissions, tokens `--udx-motion-*` ; alias `--duration-*` à corriger, valeurs M3 à vérifier.
- M2-R01 : 8 — geste sans verbe, defineGesture plus defineValue (§8.0 bis #5), attribut qui nomme ; place de `reorder` à trancher.
- M2-R02 : 8 — carry et velocity.source (§8.0 bis #4), handle unique ; velocityStack non vérifié, deux sources de vitesse.
- M2-R03 : 9 — alternative clavier obligatoire et typée, WCAG 2.5.7 et 2.1.1 ; aucun conflit avec §8, seul le nom du champ reste ouvert.
- M2-R04 : 7 — reorder comme geste plus layout (§8.1 #2) ; commit live modifie le DOM pendant le geste, grilles 2D exclues.
- M1-R04 : 8 — découpage après hydratation, sr-only, SSR en texte intact, option fermée ; brouillage et chars / letters à trancher.
- M3-R01 : 9 — defineValue écrite sans re-rendu, store seulement pour le discret (§8.0 bis #5) ; placement racine ou cibles à régler, le principe tient.
- M4-R06 : 8 — compteur rendu en valeur finale par le serveur, `<data>`, animation après hydratation ; locale à fixer des deux côtés.
- M3-R06 : 7 — paliers partagés avec Tailwind (C4), mais la reconstruction perd la position sans carry et le geste actif reste non réglé.
- M3-R05 : 8 — registre par racine, élagage, pas de MutationObserver sur le document (E1) ; dispose contre revert et couverture WAAPI à vérifier.
- M3-R04 : 8 — un moteur par page, cache par majeure, verbe absent = aucun octet (§8.0 #1, C16) ; délai idle et déclencheur à arbitrer.
- M3-R03 : 9 — un observateur par page, pause document, inspect() (§8.0 #1, §8.0 bis #2) ; c'est le choix le plus directement conforme à §8.
- M1-R10 : 8 — 19 contrôleurs sur motion(el, spec), même surface que l'utilisateur (§8.0 bis #3) ; migration coûteuse et rupture D2.
- M1-R05 : 7 — natif d'abord (C3) pour tracé et trajectoire ; morphTo contesté (point 9) et stroke-dashoffset hors critère de M1-01.
- M4-R02 : 7 — prop motion unique, tokens, fin du type Transition (C11) ; nom `motion` et `spring-expressive` à corriger avec M5-R02.
- M3-R07 : 5 — un jeton de réduction lu une fois par racine est une bonne idée, mais scale à 0 rend disappear instantané, contre le fondu de §8.1.
- M3-R08 : 7 — lint de budget de paint, conforme aux garde-fous §8.0 bis #1 ; allow-paint et seuil provisoire.
- M5-R03 : 9 — manifeste au build (llms.txt, JSON), seul contrat lu par types, lint, MCP et doc (§8.0 bis #1, C5).
- M5-R04 : 7 — outils MCP de validation et de recette qui prolongent le manifeste ; surface MCP à maintenir, hors §8 mais dans F23.
