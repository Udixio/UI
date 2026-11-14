# Validation partielle du ProgressIndicator indéterminé

Cette tranche applique la politique de mouvement aux boucles indéterminées. **F20 reste partielle** : les transitions et délais déterminés ne sont pas couverts par cette politique et l'audit général d'accessibilité reste ouvert. Ce relevé ne remplace pas le plan [27](./27-progress-policy-plan.md).

## Résultats observés

- React : 14 tests ciblés réussis, dont le rendu serveur sans globals DOM des deux variantes, leur nom par référence, l'absence de valeur courante et la géométrie initiale. L'hydratation en réduction est vérifiée sous jsdom : les nœuds serveur sont conservés et aucune erreur n'est signalée.
- Svelte : 9 tests du composant réussis. Quatre tests navigateur SSR et hydratation réussis sous Chromium et Firefox : deux variantes, noms par référence et par label, absence de valeur courante, forme initiale et conservation des nœuds, avec préférence réduite et normale. Ces tests n'incluent pas les feuilles de style compilées.
- Angular : 38 tests ciblés réussis pour ProgressIndicator et Button, avec un avertissement de configuration ts-jest `TS151001`. Le rayon SVG du cercle indéterminé et celui du bouton sont vérifiés dans le repère 48 × 48.
- Contrôleurs réels : 14 tests navigateur réussis sous Chromium et Firefox. Le test de délai de visibilité utilise une horloge simulée et vérifie les bornes 99/100 ms et l'annulation ; il ne mesure pas la précision du temps réel. Le rayon SVG numérique `22` remplace `calc(50% - 2px)`, rejeté par Firefox, dans les trois adaptateurs et le bouton Angular.
- Une relance indépendante rapportée par l'agent principal confirme 13 tests core sur les deux contrôleurs, puis 18 tests navigateur combinés sous Chromium et Firefox. Son `git diff --check` global a réussi.
- L'agent correcteur rapporte la réussite des 430 tests de la suite core et de la vérification TypeScript core. Ces deux commandes ont été exécutées depuis `packages/core` :

  ```sh
  ../../node_modules/.bin/vitest run --config vite.config.mts
  ../../node_modules/.bin/tsc --noEmit -p tsconfig.lib.json
  ```

Commandes exécutées depuis la racine, avec les binaires installés localement :

```sh
(cd packages/ui-react && ../../node_modules/.bin/vitest run src/tests/ProgressIndicator.ssr.spec.tsx src/tests/ProgressIndicator.hydration.spec.tsx src/tests/ProgressIndicator.spec.tsx)
(cd packages/ui-svelte && ../../node_modules/.bin/vitest run src/lib/progress-indicator/progress-indicator.spec.ts)
(cd packages/ui-angular && ../../node_modules/.bin/jest --config jest.config.cjs --runInBand src/lib/progress-indicator/progress-indicator.spec.ts src/lib/button/button.spec.ts)
(cd packages/tailwind && MOTION_BROWSERS=chromium,firefox ../../node_modules/.bin/vitest run --config search-motion.config.mts tests/progress-svelte-hydration.browser.spec.ts)
(cd packages/tailwind && MOTION_BROWSERS=chromium,firefox ../../node_modules/.bin/vitest run --config search-motion.config.mts src/progress-motion.browser.spec.ts)
```

## Limites et travaux restants

- WebKit : les sept tests navigateur des contrôleurs et les deux tests d'hydratation Svelte passent aussi avec le WebKit Playwright local. Pour ce test, les bibliothèques Ubuntu `libevent-2.1-7t64`, `libmanette-0.2-0` et `libhidapi-hidraw0` ont été extraites dans `/tmp` et le lanceur WebKit copié temporairement a été adapté pour les trouver ; elles ne sont pas installées sur le système. Ces résultats ne démontrent pas le comportement des anciennes versions de navigateurs.
- L'arbre d'accessibilité et les annonces avec lecteur d'écran restent à contrôler manuellement, notamment pour le bouton en chargement. Les contrastes, tailles et thèmes de la forme fixe restent à vérifier visuellement.
- La matrice complète du plan 27 reste à établir, notamment SSR/hydratation Angular, hydratation React en navigateur avec les deux politiques, styles compilés, Shadow DOM, présence et absence de `motion.css`, surcharges locales et comportement des boutons. Les tests indiqués ci-dessus ne suffisent pas à l'attester.
- Les animations sur objets écrivent les styles depuis JavaScript à chaque frame. Une mesure synthétique locale est décrite ci-dessous ; elle ne constitue pas un budget de performance produit.
- Vérifier les builds, la compilation des styles et la publication coordonnée : version de `@udixio/motion` et présence effective de l'export `internal-policy` dans le paquet distribué. Les résultats ci-dessus ne constituent pas une validation de publication.

## Mesure exploratoire du coût

Le script `packages/tailwind/tests/progress-performance.cjs` crée 0, 1, 20 puis 100 paires d'indicateurs linéaire et circulaire, sans styles compilés, dans Chromium headless. Après 500 ms de chauffe, il mesure les intervalles `requestAnimationFrame` pendant environ 2,5 s et instrumente `CSSStyleDeclaration.setProperty`. Exécution depuis `packages/tailwind` : `node tests/progress-performance.cjs`.

Une première exécution a relevé respectivement 152, 151, 151 et 73 images, avec un 95e percentile des intervalles de 16,8, 16,7, 16,7 et 100 ms. Les nombres d'écritures étaient 0, 1 037, 20 580 et 52 100 ; les temps cumulés instrumentés des seuls appels `setProperty` étaient 0, 6,6, 47,5 et 200,7 ms. Une seconde exécution sous charge concurrente a relevé 152, 112, 83 et 32 images : la variabilité est donc importante. L'instrumentation ajoute elle-même un coût ; les temps d'appel excluent notamment la logique Motion, les lectures de styles et le rendu différé. Les résultats dépendent du matériel et de la charge et ne prédisent pas les performances d'une application.

À forte densité, la dégradation justifie une investigation avec une charge représentative et un profilage navigateur avant une optimisation. Les lectures de styles actuelles permettent de détecter les écritures externes et de les restaurer : les supprimer sans mécanisme équivalent casserait ce comportement. Aucun changement de production n'a été déduit de cette seule mesure.

### Comparaison avec et sans instrumentation

Le banc exécute désormais trois répétitions par défaut, dans des pages neuves, en alternant l'ordre des densités et des modes avec ou sans interception de `setProperty`. Il affiche chaque résultat brut au format JSON, la version de Chromium, la durée réelle, et les métriques Chromium `TaskDuration`, `ScriptDuration`, `LayoutDuration` et `RecalcStyleDuration`. Ces métriques CDP sont cumulées depuis leur activation avant la création des indicateurs : elles comprennent donc la création et les 500 ms de chauffe, contrairement aux intervalles d'image et aux écritures instrumentées. Les durées CDP ne constituent pas des catégories exclusives à additionner. Les champs d'écriture sont `null` sans interception. `PROGRESS_BENCH_REPETITIONS` et `PROGRESS_BENCH_DURATION_MS` permettent d'adapter la durée ; par défaut, chaque fenêtre mesurée dure 2,5 s.

Une vérification courte (trois répétitions de 500 ms, Chromium headless 156.0.8078.4) donne, pour 100 paires, 31 à 32 images et un 95e percentile de 16,7 à 16,8 ms dans les deux modes. La médiane CDP de `ScriptDuration` est respectivement 280 et 280 ms sans et avec interception, et celle de `TaskDuration` 549 et 533 ms ; ces chiffres incluent la chauffe et leur variation interdit de conclure que l'instrumentation est gratuite. Cette exécution courte ne reproduit pas la dégradation précédente et ne permet pas d'attribuer un coût précis au suivi des styles. Un profil CPU navigateur et une charge avec styles réels restent nécessaires avant de modifier ce mécanisme.
