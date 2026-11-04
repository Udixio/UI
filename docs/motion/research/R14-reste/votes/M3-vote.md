# Vote de M3 — R14 (registre consolidé, 21 choix)

Critères : cohérence avec §8 de la spec (§8.0 et §8.0 bis validés ; §8.1 et §8.1 bis proposés), robustesse runtime (observateurs, frame unique, cycle de vie, coût), réponse directe à la question. Notes discriminées au sein d'une même question.

## 1. Top 10

1. M3-R04 — un seul moteur par page via le cache `globalThis` (§8.0 #1), chargement par verbe (§8.0 #5) : la charge JS ne croît pas avec les îles.
2. M1-R10 — les 19 contrôleurs passent par `motion(el, spec)` avec test de parité : répond à Q7 sans API privée (§8.0 bis #3).
3. M1-R06 — une source de paramètres physiques, trois émissions : répond à Q8 et tient le ressort comme source (§8.0 #4, `carry`).
4. M2-R03 — alternative clavier typée et obligatoire, erreur de build : tient WCAG 2.5.7 par le garde-fou S10 (§8.0 bis #1).
5. M3-R05 — registre par racine et élagage par `isConnected` : pas de fuite en îles Astro (C6) sans `MutationObserver` global.
6. M2-R01 — geste hors des sept verbes avec `defineGesture` et `defineValue` : respecte §8.1 #2 sans huitième verbe.
7. M1-R01 — chorégraphie compilée une fois, pilotée par le handle unique (§8.0 #4) : répond à Q1 avec la grammaire §8.1.
8. M1-R04 — texte découpé après polices, domaine fermé, source accessible : répond à Q3 ; le `sr-only` évite les pièges de `aria-label`.
9. M4-R06 — compteur rendu à la valeur finale par le serveur, animé après hydratation : répond à Q5 sans divergence d'hydratation.
10. M3-R03 — un observateur par page et frame unique arrêtée à vide (§8.0 #3, §8.0 bis #2) : cœur de la performance, `inspect()` donne la raison de pause.

## 2. Notes (21 choix)

M1-R01 : 8 — séquence compilée et handle unique conformes (§8.0 #4, §8.1) ; reste à trancher `part` contre `step` (contradiction 3).
M2-R06 : 7 — rang visuel et plafond testable, token nouveau à inscrire au manifeste ; coût de lecture et `sibling-index()` à réconcilier (contradictions 2 et 21).
M1-R06 : 9 — une source, trois émissions, noms `--udx-motion-*` (§8.1), ressort source compatible avec `carry` (§8.0 bis #4) ; valeurs M3 à vérifier à la source.
M2-R01 : 8 — geste sans verbe, `defineGesture` et `defineValue` (§8.0 bis #5) : cohérent avec les sept verbes de §8.1 #2.
M2-R02 : 6 — reprise par ressort et handle conformes (§8.0 #4), mais la vitesse vient de `Draggable` d'anime et non du pointeur : tension non tranchée (contradiction 6).
M2-R03 : 9 — alternative clavier typée, obligatoire, erreur de build (§8.0 bis #1) ; WCAG 2.5.7 et 2.1.1 ; touche Espace à valider avec les composants.
M2-R04 : 7 — reorder comme geste plus `layout` avec seuil de position, cohérent §8.1 ; `commit="live"` modifie le DOM pendant le geste, dette à arbitrer.
M1-R04 : 8 — découpage après polices, domaine fermé, `sr-only` et `aria-hidden` ; la copie double le texte mais évite le défaut d'`aria-label` (contradictions 4a et 4b).
M3-R01 : 7 — écriture DOM sans re-rendu, cohérent avec le contrat de variables §4.2 ; placement racine ou cibles et forme de référence HTML à fixer (contradiction 5).
M4-R06 : 8 — compteur SSR à la valeur finale, hydratation sans divergence, locale explicite ; `<data>` à confronter à `data-motion-value` (contradiction 24).
M3-R06 : 7 — paliers lus dans le thème et reconstruction au seul changement de palier, cohérent §8.0 bis (tokens) ; keyframes WAAPI figés à traiter.
M3-R05 : 8 — registre par racine, élagage par `isConnected`, sans `MutationObserver` ; décisif pour les îles (C6) ; `dispose` ou `revert` et confusion avec `inspect()` à corriger.
M3-R04 : 9 — cache `globalThis` par majeure, un moteur par page (§8.0 #1), chargement par verbe (§8.0 #5, C16) ; budgets à mesurer en I3.
M1-R10 : 9 — les 19 contrôleurs sur un chemin unique avec test de parité et faux backend (C8, C11, §8.0 bis #3) ; migration à planifier par famille.
M1-R05 : 8 — tracé `pathLength` natif, trajectoire `offset-path`, morphing JS (§8.0 #5, natif d'abord) ; contradiction sur `morphTo` à vérifier.
M4-R02 : 7 — prop `motion` unique et tokens, parité des adaptateurs ; nom distinct des `data-motion-*` (§8.1, une seule façon d'écrire) et breaking à planifier.
M3-R07 : 6 — jeton de réduction unique utile, mais `scale` à 0 rend `disappear` instantané, contraire au fondu de §8.1 ; corriger en réduisant la distance et non la durée du fondu.
M3-R08 : 7 — budget de propriétés et lint de paint, cohérent avec M5-S10 ; échappatoire `allow-paint` et seuil à mesurer en I3.
M5-R03 : 8 — manifeste `llms.txt` et JSON au build, un seul contrat pour types, lint, MCP et doc (§8.0 bis #1) ; à versionner.
M5-R04 : 7 — outils MCP de recette et de validation utiles aux agents (C5) ; dépend du manifeste M5-R03 et ne couvre pas les définitions construites à l'exécution.
M3-R03 : 8 — un `IntersectionObserver` par page et frame unique arrêtée à vide (§8.0 #3, §8.0 bis #2) ; `inspect()` donne la raison de pause ; limite connue sur les entrées hors écran.
