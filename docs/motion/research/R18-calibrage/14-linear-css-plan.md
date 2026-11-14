# Plan F1 — courbes `linear()` dans le provider CSS

**But :** accepter les courbes de `defineTokens()` sans élargir le contrat aux expressions CSS arbitraires. Référence : spécification `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §8.2.6, I2 et I25 ; plans F1 précédents.

## Décision et limites

`MotionTiming` reste `{ duration, easing, delay? }`. Dans `css.ts`, autoriser exactement les chaînes `linear.easing` issues des données générées des deux schemes, comparées octet pour octet à l'entrée avant toute mutation ; construire cet ensemble depuis la source générée, sans recopier les courbes. `defineTokens()` retourne des copies : aucune identité d'objet ni confiance dans un objet mutable n'est nécessaire. La durée reste celle fournie par l'appelant : utiliser `spring.linear` entier pour préserver son calibrage ; ne pas associer implicitement une durée à la chaîne, ni changer `delay`.

Cette liste fermée évite un parseur CSS général et garantit des extrémités 0 et 1, indispensables au contrôle actuel de visibilité et à la persistance des fins. Les `linear()` personnalisés, variantes de format, substitutions, fonctions imbriquées, listes et commentaires restent refusés, même si le navigateur les accepte. Conserver les règles existantes pour mots-clés, `steps()` et `cubic-bezier()` ; ne pas introduire de régression de leur validation. L'autre option, parser un sous-ensemble numérique de `linear()`, élargirait inutilement le contrat et imposerait de prouver ses extrémités et ses bornes. L'égalité textuelle est une limite publique explicite, pas une garantie pour des courbes éditées.

Vérifier `CSS.supports('animation-timing-function', easing)` dans le document cible avant l'installation ; si faux, lever l'erreur actuelle sans écriture, animation ni fuite. Aucun repli automatique ici : `MotionTiming` ne contient pas le couple `fallback` ni l'identité du ressort. La future résolution de `SpringRef` choisira explicitement le couple officiel `{ duration, easing }` de dernier recours ; ne jamais substituer seulement l'easing en conservant la durée analytique. `linear()` est largement disponible depuis décembre 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear)); la détection réelle prime sur une liste de versions.

Le dépassement (> 1) est attendu ([CSS Easing Functions](https://www.w3.org/TR/css-easing-1/)) : mesurer `translate`, qui ne sature pas, plutôt que l'opacité bornée. La preuve de visibilité actuelle vérifie des extrémités synchrones uniquement ; elle ne détecte pas tous les masquages de cascade ou changements concurrents et ne doit pas être présentée comme telle. Garder le rejet des conflits existants, la restauration conditionnelle, et les limites light DOM / `!important` documentées.

## Travail et vérification

- [ ] Dans `packages/motion/src/providers/css.browser.spec.ts`, remplacer le rejet généralisé de `linear()` par des tests d'acceptation des 12 combinaisons (deux schemes × trois vitesses × deux rôles, même si certaines valeurs sont communes). Vérifier durée retournée, délai, pause et `seek(delay + p * duration)` ; utiliser un déplacement de 100 px et comparer plusieurs progressions, dont un pic spatial expressif > 100 px, à l'interpolation des stops. Confirmer départ et fin, résolution et nettoyage.
- [ ] Garder dans `tokens.spec.ts` la comparaison indépendante à la réponse analytique sur toutes les combinaisons (erreur absolue normalisée ≤ 0,002, 21–26 stops, endpoints et overshoot) ; les mesures navigateur valident le transport, sans prétendre que la précision d'arrondi CSS prouve seule cette borne. Utiliser une tolérance explicite de rendu, par exemple 0,1 px pour 100 px, en plus de la borne analytique existante.
- [ ] Tester les chaînes modifiées, `linear(0.5, 1)`, `linear(0, 0.5)`, `var()`, `calc()`, commentaires et injection, avec vérification d'absence de mutation, de style ajouté et de handle actif. Simuler `CSS.supports` négatif pour une courbe reconnue et vérifier le même nettoyage. Couvrir cible déjà animée, masquage `!important`, annulation et restauration après écriture concurrente ; conserver les tests existants des easings non `linear()`.
- [ ] Implémenter la liste fermée dans `packages/motion/src/providers/css.ts`, avant toute mutation, et actualiser son TSDoc et `packages/motion/README.md` : seuls les `linear.easing` exacts des tokens sont acceptés, durée et délai explicites, repli futur et limites de cascade.
- [ ] Ajouter un scénario I2 avec `runScenario` et forçage CSS, échantillonnant un ressort sur `translate` à plusieurs progressions ; réutiliser le format et les tolérances du harness sans prétendre à une parité animejs `linear()` non implémentée. Exécuter le scénario commun F2 existant pour éviter une régression.
- [ ] Exécuter les tests ciblés, puis `nx test motion` et le build du package selon les commandes du dépôt ; relever séparément les navigateurs réellement exécutés et tout blocage WebKit. Contrôler que l'import SSR reste sans accès DOM au chargement du module.

## Précisions de revue

- Comparer `timing.easing` brut à la liste fermée **avant** toute normalisation CSSOM ; ne jamais comparer le résultat du probe à la liste, car la sérialisation varie selon le navigateur. Conserver la branche de validation existante des autres easings distincte. Dans les deux branches, vérifier `view.CSS.supports` sur le document de la cible avant mutation. Installer la valeur brute reconnue avec `setProperty`, puis conserver la valeur effective de `getPropertyValue` dans `installed` pour les contrôles et la restauration existants.
- Tester les 12 accès aux tokens et expliciter la déduplication des chaînes identiques entre schemes et rôles ; la liste doit dériver des données générées sans copie supplémentaire des courbes. Mesurer le poids de l'entrée `providers/css` avant et après build et consigner l'écart, afin de détecter l'import accidentel de code ou de données superflus.
- Pour les douze accès, comparer numériquement les stops de la valeur CSSOM sérialisée avec ceux de l'entrée (valeurs et positions, tolérance d'arrondi explicite), sans exiger une égalité textuelle. Un oracle de test indépendant interprète les stops de la chaîne source et calcule l'interpolation linéaire ; comparer les styles calculés CSS à cet oracle, sans utiliser un autre provider comme référence. La tolérance de transport navigateur (0,1 px sur 100 px) est distincte de l'erreur analytique normalisée ≤ 0,002 déjà vérifiée par `tokens.spec.ts`.
- Avec et sans délai, vérifier la fin naturelle après `seek(delay + duration)`, `finished`, persistance de la dernière image et nettoyage ; vérifier aussi reverse jusqu'à la première image, puis annulation en cours de progression et résolution `cancelled`, sans fuite et avec restauration conditionnelle des styles. Les observations asynchrones doivent attendre effectivement `finished` et ne pas supposer une résolution synchrone après `seek`.
- Documenter F1 comme encore incomplète : le résolveur `SpringRef` et son repli automatique restent à livrer. En attendant, l'appelant choisit manuellement le couple complet `spring.fallback` lorsque `linear()` n'est pas pris en charge, après détection dans le document cible ; il peut ajouter son délai séparément.
- Tester le refus sans support en simulant `CSS.supports` sur `target.ownerDocument.defaultView.CSS` et restaurer le remplacement dans un `finally`, y compris en cas d'échec ; vérifier l'absence de mutations. Après build, contrôler les exports effectifs ESM et CJS `@udixio/motion/providers/css`, leurs dépendances et fichiers générés, ainsi que la taille de chaque format ; vérifier l'import sans DOM dans les deux formats.

## Mesures de validation F1

Build local : `providers/css.js` passe de 5 634 à 6 072 octets (+438) et
`providers/css.cjs` de 4 659 à 5 067 octets (+408). Chaque entrée dépend du
chunk partagé des données générées : 5 929 octets en ESM et 5 393 en CJS.
Les exports effectifs `@udixio/motion/providers/css` ESM et CJS exposent
`cssProvider` et s'importent sans DOM. Les tests complets exécutés avec
`MOTION_BROWSERS=chromium` passent, ainsi que les tests ciblés CSS avec Firefox.
WebKit n'a pas pu démarrer : les bibliothèques système `libevent-2.1-7t64` et
`libmanette-0.2-0` manquent dans cet environnement.
