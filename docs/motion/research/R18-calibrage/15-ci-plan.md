# Plan CI motion — phase 2

> Plan proposé ; aucun workflow ni service cloud n'a été exécuté ou validé ici.

**Objectif :** fiabiliser la sélection Nx des PR, exécuter les trois moteurs quand motion est affecté, produire le rapport de performance indicatif et protéger la release par des tests navigateur.

**Architecture :** conserver la validation Nx et ses budgets bloquants ; isoler le benchmark dans un job indicatif. Une exécution nocturne couvre les trois moteurs même sans PR et prépare la couverture des versions anciennes de C13. La protection de release est une tranche distincte, conditionnée à la résolution de la chaîne de confiance et de l’identité du commit publié.

**Référence :** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`, C13, I1 et I3. La sélection conditionnelle PR de I1 précise ici le « chaque PR » de C13 : PR affectant motion uniquement. Cette interprétation doit être réconciliée dans la spec lors de l'implémentation.

## État constaté et limites

- `.github/workflows/pr-validation.yml` ne définit pas `NX_BASE`/`NX_HEAD` ; `nx affected` et la détection de motion peuvent donc comparer la mauvaise base, notamment pour une PR vers `main`. Il installe déjà les trois moteurs si Nx considère motion affecté ; `@udixio/motion:test` utilise par défaut Chromium, Firefox et WebKit.
- `.github/workflows/release.yml` lance tous les tests sans installer les navigateurs. La publication stable passe ensuite par `publish.yml`, tandis que les préreleases sont publiées directement.
- `packages/motion/bench/run.mjs` produit `packages/motion/bench/report.json` : quatre variantes (`waapi`, `animejs`, `css`, `motion`) × 100 et 1000 éléments, Chromium et CPU 4×. Il ne couvre pas encore GSAP, les traces Chromium ni les tests de fuite requis par I3 ; ce rapport partiel ne clôt pas I3.
- Playwright WebKit n'est pas Safari réel. Les versions minimales satisfaisant `defaults` changent ; leur résolution, la disponibilité d'un service cloud et les capacités d'exécution sur Safari réel et Firefox ESR restent à établir. Aucun résultat de compatibilité ancienne n'est revendiqué.

## Travail à réaliser

### 1. Base réelle et tests PR

**Fichier :** `.github/workflows/pr-validation.yml`.

- [ ] Après le checkout avec `fetch-depth: 0` et `persist-credentials: false`, fixer au niveau du job `NX_BASE` à `github.event.pull_request.base.sha` et `NX_HEAD` au commit effectivement testé (`github.sha`, commit de merge PR contrôlé par checkout). Ces SHA doivent être disponibles localement ; échouer explicitement sinon, sans repli silencieux sur `main`. Employer exactement cette paire pour toutes les commandes `nx affected` et `nx show projects --affected`.
- [ ] Calculer une seule fois l'appartenance exacte de `@udixio/motion` aux projets affectés. Distinguer échec Nx et liste vide : capturer la sortie et le statut avant de rechercher une ligne exacte. Un échec de calcul fait échouer la validation, jamais sauter les tests. Si affecté, installer `chromium firefox webkit` avec les dépendances système via `pnpm --filter @udixio/motion exec playwright install --with-deps chromium firefox webkit` puis laisser `nx affected --target=test` exécuter les trois ; sinon ne pas installer les navigateurs motion.
- [ ] Préserver build, size, lint et tests affectés, sans `continue-on-error` ; les budgets de poids restent bloquants. Garder `pull_request`, `contents: read`, sans secrets ni `pull_request_target` et sans exécuter du code de fork dans un contexte privilégié. Conserver l'annulation des runs PR périmés.
- [ ] Vérifier sur des PR vers `develop` et `main`, y compris fork, avec motion affecté et non affecté : afficher les SHA et la liste Nx, comparer à `git diff` et vérifier présence/absence des trois installations et des tests. Simuler un SHA indisponible et une erreur Nx : validation en échec. Vérifier une mise à jour de la base et une nouvelle exécution. Ajouter le type `edited` pour un changement de branche cible et vérifier aussi les événements de mise à jour de la base ainsi que le comportement effectif de GitHub : une PR doit être revalidée quand sa base change, par un déclencheur sûr ou une politique de branche à jour. Pas de conclusion CI avant observation effective sur GitHub.

### 2. Rapport de performance isolé

**Fichier :** `.github/workflows/pr-validation.yml` ; documentation éventuelle `packages/motion/bench/README.md`.

- [ ] Ajouter un job indépendant, limité aux PR où motion est affecté, avec checkout et mêmes SHA, permissions `contents: read`, Node/pnpm cohérents avec la PR, installation gelée, `npx nx build @udixio/motion`, puis `pnpm --filter @udixio/motion exec playwright install --with-deps chromium` et `pnpm --filter @udixio/motion bench`. Un job de sélection en lecture seule avec checkout `persist-credentials: false`, indépendant de la validation complète, calcule le booléen Nx une seule fois et l’expose à la validation et au benchmark ; si son calcul échoue, rendre les contrôles concernés explicitement en échec, sans traiter une erreur comme une absence de changement. Le benchmark ne dépend pas du succès de build, size, lint ou tests de validation. Ne pas réutiliser de code ou d’artefact exécutable issu d’un autre contexte.
- [ ] Télécharger avec `actions/upload-artifact` le fichier `packages/motion/bench/report.json`, nom unique incluant run et tentative, rétention courte (7 jours), absence signalée. Configurer `if-no-files-found: error` et vérifier dans le job que le JSON contient exactement les huit couples attendus, des métriques numériques finies, la version navigateur non vide et le taux CPU 4 avant upload ; afficher le lien d'artefact dans le résumé du job. Aucun seuil temporel ne bloque la PR : job séparé non requis par la protection de branche, échec visible sans masquer les erreurs. Ne pas rendre ce job dépendance des autres contrôles ou de release.
- [ ] Sur PR motion, vérifier huit couples uniques, version navigateur, taux CPU 4 et métriques dans l'artefact ; provoquer un échec du benchmark et vérifier que build, size, lint et tests gardent leur résultat indépendant. Sur PR sans motion, vérifier que le job est sauté. Le rapport décrit uniquement les mesures actuelles et leur variabilité sur runner partagé.

### 3. Nightly

**Fichier :** nouveau `.github/workflows/motion-nightly.yml`.

- [ ] Planifier en UTC une exécution nocturne sur la branche par défaut et permettre `workflow_dispatch` ; les horaires GitHub sont indicatifs et un run planifié peut être retardé ou omis. Checkout, installation gelée, `pnpm --filter @udixio/motion exec playwright install --with-deps chromium firefox webkit`, puis `MOTION_BROWSERS=chromium,firefox,webkit npx nx run @udixio/motion:test --skip-nx-cache`. Ce run indépendant couvre les trois moteurs sans dépendre de `affected` ni d'un résultat mis en cache. Utiliser permissions lecture, timeout et concurrence annulant les nightly périmés. Les échecs restent visibles dans Actions ; prévoir le suivi d'une absence de run, pas seulement des échecs.
- [ ] Vérifier sur GitHub un déclenchement manuel et un run planifié : les trois moteurs sont effectivement lancés, même après un run identique ; vérifier l'échec visible d'un navigateur et l'absence de secrets.

### 4. Release et compatibilité ancienne — tranche distincte

**Fichiers à étudier :** `.github/workflows/release.yml`, `.github/workflows/publish.yml` et spec C13. Ne pas modifier les workflows de release dans la tranche précédente.

- [ ] Concevoir et valider séparément la chaîne de confiance entre le SHA testé, les modifications de version et le SHA effectivement publié : la prérelease publie directement, tandis que la release stable crée une PR puis `publish.yml` publie depuis `main`. Le SHA de `workflow_dispatch` seul ne garantit pas l’identité du contenu publié après merge. Le job `create-release` utilise son propre runner et `nx run-many --target=test --all` : installer aussi ses navigateurs localement, ou exclure précisément les tests navigateur uniquement après une garde équivalente démontrée sur le bon contenu ; une installation dans un autre job ne lui fournit pas les navigateurs. Définir aussi les protections contre déplacement de branche et artefact ou code non fiable ; pas de jeton privilégié accessible au code de PR non fiable.
- [ ] Une fois ce contrat établi, prévoir avant chaque publication un contrôle bloquant sur le contenu exact publié, avec `MOTION_BROWSERS=chromium,firefox,webkit`, `--skip-nx-cache` et Playwright exécuté depuis le paquet local. Tester échec d'un moteur, déplacement de branche, chemins stable et prérelease et absence de publication lors des simulations. Ne pas prétendre que cette protection existe aujourd'hui.
- [ ] Suivre C13 comme travail distinct non achevé : calculer les versions minimales `defaults`, choisir et valider un fournisseur pour Firefox ESR et Safari réels, sécuriser ses secrets sur événements fiables uniquement, puis intégrer les tests anciens nightly et avant release. Sans fournisseur ni exécution attestée, les trois moteurs récents ne satisfont pas cette partie de C13 et la release ne doit pas être présentée comme validée sur anciens navigateurs.

## Validation et coût

- [ ] Vérifier la syntaxe et les expressions des workflows avec `actionlint` si disponible, puis inspecter les logs et artefacts de runs GitHub réels. Tester aussi fork sans secrets, PR vers chaque base, Nx en erreur, absence de rapport, nightly et scénarios de confiance release simulés sans publication.
- [ ] La PR ordinaire ne télécharge aucun navigateur motion quand le paquet n'est pas affecté. Le benchmark n'installe que Chromium et ne tourne que sur PR concernée ; le nightly exécute les trois moteurs ; la future garde release doit les exécuter aussi. Mesurer les durées et ajuster cache ou fréquence seulement après observation ; ne pas annoncer d'économie chiffrée sans mesure.
- [ ] Documenter séparément les manques I3 (GSAP, traces et fuites) et C13 (versions anciennes et Safari réel), avec leur statut et leurs preuves, sans qualifier le rapport indicatif actuel de couverture complète.
