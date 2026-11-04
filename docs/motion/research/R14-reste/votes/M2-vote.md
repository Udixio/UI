# R14 — Vote de M2 (étapes 3 et 4)

Note de méthode : je me note moi-même sur M2-R01, M2-R03 et M2-R06 ; ces trois notes sont à lire avec prudence. Les notes tiennent compte de la cohérence avec §8 de la spec et du nombre de contradictions ouvertes du registre (§4) touchant le choix.

## 1. Top 10 (M2)

1. M3-R03 — un observateur par page, pause raisonnée et `inspect()` : le socle de Q9 et de Q10, conforme à §8.0 #3 et §8.0 bis #2.
2. M5-R03 — manifeste unique (`llms.txt`, JSON) : c'est exactement §8.0 bis #1, et la seule réponse à C5 pour les agents.
3. M2-R01 — un geste est une source de valeurs sans verbe : évite un huitième verbe et réutilise `defineValue` (§8.0 bis #5).
4. M3-R01 — valeurs écrites sur les cibles, sans re-rendu : c'est la lecture la plus proche du contrat de variables de §4.2.
5. M3-R04 — chargement par verbe, cache par majeure, un moteur par page : répond à « ne charger que ce qui est utilisé » et à §8.0 #1.
6. M3-R06 — paliers lus dans le thème Tailwind, reconstruction seulement au changement de palier : cohérent avec les variants de C4.
7. M1-R04 — texte compilé, domaine fermé, source accessible conservée : la seule réponse complète à Q3 avec sa phase de réflow.
8. M1-R10 — les 19 contrôleurs passent par un chemin unique testable : concrétise l'usage interne (Q7) sans API privée.
9. M2-R06 — rang visuel mesuré et plafond de durée : la cascade qui ne dure pas 20 s, et la réponse à « décaler » de Q1.
10. M2-R03 — alternative clavier et mono-pointeur obligatoire : WCAG 2.5.7 traité au niveau de la définition, pas du composant.

## 2. Notes (1 à 10)

- M1-R01 : 7 — chorégraphie compilée une fois et pilotée par le handle unique (§8.0 #4), mais `part` / `step` et `at` / `after` restent à unifier (contradictions 3 et 7).
- M2-R06 : 8 — rang visuel, plafond et token de rythme répondent à « décaler » (Q1) ; la source sibling-index reste à réconcilier (contradictions 2 et 21).
- M1-R06 : 7 — une source, trois émissions, ressort source conforme à §8.1 #3, mais source JSON ou TS, échelle `short` ou `short1`, alias Tailwind et courbe legacy sont encore ouverts (contradictions 10, 18, 19, 20).
- M2-R01 : 8 — geste déclaré comme source sans verbe, cohérent avec `defineValue` (§8.0 bis #5) et les sept verbes de §8.1 ; c'est le choix qui tranche la contradiction 1.
- M2-R02 : 7 — relâchement en `carry` avec `velocity.source` conforme à §8.0 bis #4, mais l'algorithme de vitesse reste à unifier (contradiction 6).
- M2-R03 : 7 — alternative obligatoire conforme à WCAG 2.5.7 et au lint de §8.1 ; le nom du champ et le partage flèches / espace restent ouverts (contradictions 11 et 15).
- M2-R04 : 7 — tri en `layout` au franchissement du milieu, avec `commit` comme option de données ; ne vaut que si le verbe `reorder` disparaît (contradiction 1).
- M1-R04 : 8 — compilation, `sr-only` et phase de réflow traitent les contradictions 4a et 4b dans le sens de §8 ; reste le vocabulaire `chars` ou `letters` (contradiction 17).
- M3-R01 : 8 — écriture sur les cibles sans re-rendu, cohérente avec §4.2 ; la forme de `defineValue` (contradiction 16) reste à trancher.
- M4-R06 : 7 — compteur rendu côté serveur puis animé après hydratation, bien adapté à C6 ; `<data>` ou `data-motion-value` reste ouvert (contradiction 24).
- M3-R06 : 8 — paliers partagés avec Tailwind et reconstruction au seul changement de palier, conforme aux variants de C4 ; la perte de position sans `carry` est une limite assumée.
- M3-R05 : 7 — registre par racine et élagage à la frame suivante, sans `MutationObserver` document ; `dispose()` ou `revert()` (contradiction 12) reste à trancher.
- M3-R04 : 8 — chargement par verbe et cache par majeure conformes à §8.0 #1 et #5 ; les déclencheurs de préchargement sont encore à fusionner (contradiction 14).
- M3-R03 : 9 — un observateur par page, `pauseOnDocumentHidden` et `inspect()` donnant la raison de pause : le meilleur équilibre entre Q9 et Q10, sans contradiction bloquante.
- M1-R10 : 8 — migration des 19 contrôleurs sur `motion(el, spec)` avec faux backend ; dépend de la prop unique (M4-R02) et de la rupture D2 à assumer.
- M1-R05 : 7 — SVG natif d'abord (C3), morphing en JS seulement si nécessaire ; `offset-path` sans repli et le point `morphTo` (contradiction 9) affaiblissent la réponse.
- M4-R02 : 6 — prop `motion` unique qui retire `Transition`, bonne direction, mais les noms de tokens (`'short2'`, `'spring-expressive'`) n'existent pas et la forme est en concurrence (contradictions 18 et 23).
- M3-R07 : 5 — un jeton de réduction global est utile, mais `scale = 0` rend le fondu de `disappear` instantané, en contradiction avec §8.1 et M5-V02 (contradiction 8).
- M3-R08 : 6 — lint de paint dans les boucles et tracé SVG natif, cohérent avec C3 et §8.0 bis #2 ; `allow-paint` est une échappatoire et le seuil reste provisoire.
- M5-R03 : 9 — manifeste machine unique qui alimente types, lint, MCP et doc : exactement §8.0 bis #1 et la réponse à Q10.
- M5-R04 : 7 — outils MCP lus dans le manifeste, en s'appuyant sur `packages/mcp` existant (vérifié) ; une surface de plus à maintenir, et en partie redondante avec M5-R03.

## 3. Notes en une ligne (format id=note)

M1-R01=7 M2-R06=8 M1-R06=7 M2-R01=8 M2-R02=7 M2-R03=7 M2-R04=7 M1-R04=8 M3-R01=8 M4-R06=7 M3-R06=8 M3-R05=7 M3-R04=8 M3-R03=9 M1-R10=8 M1-R05=7 M4-R02=6 M3-R07=5 M3-R08=6 M5-R03=9 M5-R04=7
