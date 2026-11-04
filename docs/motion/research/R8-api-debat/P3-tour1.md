# P3 — Tour 1 : critères, architectures, cas-tests

Position de l'arbitre : aucun camp. Ce document fixe (1) les critères, (2) les architectures candidates, (3) les cas-tests qui les départagent, (4) une règle de partage brouillon à éprouver, (5) les questions à P1 et P2.

## 1. Critères pondérés (somme = 100)

Portes éliminatoires (non pondérées) : G1 Tailwind est un prérequis ; G2 pas de CSS-in-JS ; G3 anime.js est le seul moteur JS ; G4 le natif est le chemin par défaut quand il existe.

- **C1 (15) Une façon d'écrire par intention, erreurs visibles.** Une faute de nom ou une spec invalide échoue au build, jamais en no-op silencieux. Mesure : nombre de formes d'écriture acceptées pour une même intention.
- **C2 (15) Typage réel.** Spec et noms vérifiés par TypeScript, sans chaînes arbitraires. Mesure : une propriété fausse est une erreur `tsc`.
- **C3 (10) Tailwind-friendly.** `hover:`, `md:`, `data-[…]:` conditionnent une animation, native ou JS. Mesure : T7.
- **C4 (10) Idiomatie par framework sans pénalité croisée.** Mesure : ajouter une syntaxe n'impose rien aux autres adaptateurs.
- **C5 (10) Natif d'abord.** Zéro octet de JS quand le CSS suffit. Mesure : poids JS de T1 et T2 sur un navigateur supportant le natif.
- **C6 (15) Chargement proportionnel à l'usage.** Une page ne charge que les définitions qu'elle référence ; une section ne charge que sa logique. Mesure : bundle d'une page à une seule carte.
- **C7 (10) Îles Astro.** Aucun contexte, provider ou registre global partagé requis. Mesure : T4 fonctionne sans provider.
- **C8 (10) Couverture des 24 familles sans explosion d'API.** Le cas simple reste une ligne. Mesure : nombre de primitives publiques.
- **C9 (5) Sortie CSS statique et auditable.** Mesure : le CSS généré est inspectable.

Point d'attention sur C6 : ce n'est pas une propriété de la syntaxe. Une référence littérale (classe, prop, attribut, attache) est analysable au build dans les quatre cas ; ce qui compte est qu'elle soit littérale ou calculée. Un registre runtime indexé par chaîne rend toutes les définitions atteignables et annule C6, quelle que soit la syntaxe. Corollaire : toutes les définitions sont exportées (règle « jamais de logique internal-only ») ; la progressivité vient de la référence, pas du masquage d'export.

Principe de conception (héritage de « une formule, pas de régimes recollés ») : la règle de partage doit porter sur une **propriété de la spec**, jamais sur un seuil de complexité.

## 2. Architectures candidates

**A. Classes pures (forme P1 la plus forte).** Définitions TS (`defineMotions`), application par `motion-<nom>` et `data-motion`, le runtime découvre les usages par attribut. Forces : C3, C7, un seul vocabulaire. Faiblesses : présence (T2), identité de nœud (T3) et contrôle impératif (T5) exigent du JS d'état ; une classe fausse est silencieuse sans vérification de build ; C6 exige un mapping classe vers module produit au build.

**B. Idiomatique par framework (forme P2 la plus forte).** Wrapper React, directive Angular, attachment Svelte, sur un `MotionSpec` typé. Forces : C2, C4, C8 pour chaque framework, cycle de vie natif. Faiblesses : trois surfaces à synchroniser (dérive), `hover:` et `md:` ne se composent pas avec une animation JS sans relais, C1 au sens strict échoue (plusieurs écritures), et une île Astro n'a pas de contexte partagé pour l'identité.

**C. Référence nommée unique, encodages multiples, forme déduite de la spec (hybride).** La définition est unique et nommée. Quatre encodages résolvent la même clé : classe ou attribut (si la spec est admissible), prop React, directive Angular, attache Svelte. La forme admissible est une fonction de la spec ; le moteur est une fonction du navigateur (natif ou anime.js). Chargement : extraction statique des références littérales au build, une définition par chunk.

**D. C avec compilation AOT.** `defineMotions` est compilé au build en CSS (`@keyframes`, `@starting-style`, `animation-timeline`) et en modules JS par nom ; le runtime est un dispatcheur générique. Forces : C5, C6, C2 (erreurs au build). Coût : un plugin par bundler (Vite, Angular CLI, Astro, Next). Candidat le plus solide à ce stade, à confronter à ce coût.

Hypothèse de départ, non démontrée : C ou D. A et B échouent chacun sur au moins un cas-test ci-dessous.

## 3. Cas-tests qui départagent

- **T1 Carte qui apparaît à la vue** (fondu + translation, une fois). Teste : IntersectionObserver (JS) contre `animation-timeline: view()` (natif) ; le piège où la translation pousse l'élément observé hors écran ; C6 (page à une carte).
- **T2 Dialog qui sort.** Teste : sortie différée au démontage (présence), restauration du focus, `display` non interpolable. Natif via `transition-behavior: allow-discrete` quand supporté, sinon JS. Teste si une classe sans cycle de vie suffit (A échoue sans relais).
- **T3 Liste réordonnée avec layout.** Teste : identité de nœud (clé React, `trackBy` Angular, `each` keyed Svelte), FLIP en JS, conflit entre transition CSS et layout (cf. mémoire « Anime.js Layout coupe les transitions CSS »).
- **T4 Élément partagé entre deux îles Astro** (une île React, une île Svelte). Teste : seule une chaîne de nom traverse les îles, un contexte ne traverse pas ; C7.
- **T5 Séquence pilotée par un bouton** (lecture, pause, seek, interruption). Teste : contrôle impératif et parité des méthodes entre trois frameworks.
- **T6 Drag avec physique.** Teste la limite de la forme classe : l'entrée est continue, elle ne se déclare pas. La frontière doit être nette (core pour la physique, framework pour le geste).
- **T7 Variants Tailwind.** `hover:`, `md:` et `data-[state=open]:` appliqués à une animation native puis à une animation JS de même intention. Teste C3 et la question : un variant peut-il conditionner un moteur JS sans observateur d'attributs ?
- **T8 Référence calculée.** `animation={cond ? 'a' : 'b'}` et classe composée à l'exécution. Teste C1 (le build refuse ou avertit) et C6 (la référence calculée inclut les deux définitions ou échoue).

## 4. Règle de partage brouillon (R0, à éprouver)

1. Une animation se **définit une fois** (nom + `MotionSpec` typé). Aucun encodage ne définit d'animation.
2. Une définition se **référence** par un encodage : classe ou attribut, prop, directive, attache.
3. **Prédicat de forme** : une spec est admissible à la classe si elle est exprimable en CSS et ne requiert ni cycle de sortie, ni mesure, ni contrôle impératif, ni identité de nœud. Sinon l'encodage framework est obligatoire.
4. **Violation = erreur de build**, pas convention de documentation. Classe sur une spec non admissible : échec.
5. **Forme différente de moteur.** La forme dépend de la spec ; le moteur (natif ou anime.js) dépend du navigateur (fidélité de repli, R4). Une spec admissible à la classe peut charger anime.js en repli sans changer d'écriture.
6. **Chargement** : la référence littérale est extraite au build ; seule la définition référencée est incluse.

Attendu par cas : T1 et T7 (natif) en classe ; T2, T3, T5, T6 en framework ; T4 en nom partagé (chaîne), indépendant du framework. Un écart entre ce tableau et les résultats des tours suivants invalide R0.

## 5. Questions

À P1 (classes) :
- **Q1.** Comment `motion-card-reveal` transporte-t-il la référence au module JS sans registre runtime indexé par chaîne ? Qui produit le mapping au build, et que devient une classe composée à l'exécution (`cond ? 'motion-a' : 'motion-b'`) ?
- **Q2.** Pour une faute de nom (`motion-card-reveall`) : quelle erreur, à quel moment (build, lint, console) ? Un outil d'IDE satisfait-il C1 pour un agent qui n'exécute pas l'IDE ?
- **Q3.** Pour T2 (présence) et T3 (identité de nœud), la classe reste-t-elle la forme unique ? Si non, où passe précisément la frontière de R0 de votre point de vue ?

À P2 (idiomatique) :
- **Q1.** Dans T4, la chaîne de nom partagée est-elle encore « idiomatique », et que coûte-t-elle en API ? Un contexte framework peut-il jamais traverser une île ?
- **Q2.** Combien de formes d'écriture pour `card-reveal` dans chaque framework ? Qu'est-ce qui empêche la dérive (audit-parity) et l'erreur d'un agent qui écrit du Svelte avec une syntaxe React ? Que deviennent `hover:` et `md:` sur un `<Motion.div>` (T7) ?
- **Q3.** Un `<Motion.section>` importé depuis un barrel charge-t-il seulement sa logique ? Quelle est l'unité de chargement de votre proposition : le composant, la définition nommée, ou les deux ?

Tour 2 : chacun répond à ces questions et désigne le cas-test qui fait échouer la position adverse.
