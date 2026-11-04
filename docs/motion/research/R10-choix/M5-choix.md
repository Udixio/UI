# M5 — Choix de conception (API, DX, outillage)

### M5-01 — Vocabulaire fermé de huit verbes d'intention
- Énoncé : toute animation s'écrit avec un des huit verbes `enter`, `exit`, `state`, `reveal`, `track`, `layout`, `sequence`, `loop`, décrits par ce qu'ils obtiennent et jamais par le moteur ; tout autre nom est refusé. Chaque verbe déclare sa nature : `state`, `reveal`, `loop` restent globaux ; `enter`, `exit`, `layout`, `sequence`, `track` exigent une instance.
- Familles : F2, F3, F4, F5, F7, F8, F10, F11, F14, F24
- Nature : les deux
- Avantages : un seul mot-clé à apprendre pour un humain comme pour un agent ; le verbe impose la coordination nécessaire ; couvre les 24 familles par regroupement
- Limites : F16 (texte) et F17 (SVG) ne rentrent pas naturellement dans un verbe (neuvième verbe ou détour par `sequence`) ; `sequence` reprend seul toute la complexité de F11
- Conflits : M5-02 (la forme de config suit ce vocabulaire), M5-08 (les verbes d'instance s'appuient sur le handle)

### M5-02 — Une forme de configuration, trois syntaxes équivalentes
- Énoncé : un objet TS typé, un attribut HTML `data-motion="enter:fade-up reveal:once"` et une classe Tailwind se normalisent vers le même `MotionSpec` ; le parseur de l'attribut est exporté et exécutable au build pour valider les pages.
- Familles : F1, F2, F3, F4, F22, F23
- Nature : instance
- Avantages : les îles en HTML pur et les pages Astro sans JS de framework fonctionnent ; une seule doc et un seul modèle mental ; les fautes de syntaxe remontent au build, pas à l'écran
- Limites : grammaire d'attribut à maintenir ; les classes Tailwind ne portent pas de valeurs riches (fonctions, callbacks) ; risque de divergence entre grammaire et types TS sans test de parité
- Conflits : aucun connu (dépend de M5-01)

### M5-03 — Tokens en source TS unique, émis en CSS, types et thème Tailwind
- Énoncé : durées, easings et springs Material 3 sont déclarés une fois en TS ; le build émet des custom properties `--udx-motion-*` sur `:root`, des types littéraux et un bloc `@theme` Tailwind v4 ; un spring devient un `linear()` échantillonné à la compilation, sans solveur à l'exécution.
- Familles : F1, F2, F13, F23
- Nature : global
- Avantages : les custom properties traversent les îles sans contexte partagé ; springs utilisables dans des transitions CSS sans JS ; une seule retouche pour toute la marque
- Limites : `linear()` est une approximation à N points et ne conserve pas la vitesse lors d'une interruption ; vieux Chrome de `defaults` exige un repli ; les springs ne valent que pour des propriétés CSS
- Conflits : M5-04 (même source à synchroniser), M5-08 (la reprise par vitesse n'est pas faite par `linear()`)

### M5-04 — Plugin Tailwind v4 CSS-first, sans configuration JS
- Énoncé : les utilitaires sont déclarés en CSS (`@plugin`, `@utility`, `@custom-variant`) : `motion-enter-fade-up`, `motion-reveal-once`, `motion-state-open:` ; aucun `tailwind.config.js` ; le CSS produit ne contient que les classes détectées dans les sources.
- Familles : F1, F2, F3, F4, F20, F24
- Nature : global
- Avantages : cohérent avec Tailwind v4 et l'écosystème Udixio ; zéro JS pour tout ce qui s'exprime en CSS (transitions, keyframes, `animation-timeline`) ; élagage natif par détection des classes
- Limites : classes construites dynamiquement (`motion-${x}`) invisibles au scanner (`@source inline()` requis) ; `animation-trigger` et scroll-driven inégaux selon les navigateurs de `defaults` ; la réduction de mouvement doit être répliquée en CSS
- Conflits : M5-09 (règle de réduction à dupliquer en CSS et en runtime), M5-03 (tokens partagés)

### M5-05 — Extraction statique au build, runtime JS seulement si la page l'exige
- Énoncé : un plugin Vite/Astro lit les `data-motion` et classes des pages au build ; les animations exprimables en CSS sortent en CSS statique ; chaque page reçoit un drapeau qui décide du chargement du runtime JS et des seuls chunks de capacité utilisés.
- Familles : F4, F5, F7, F21, F22
- Nature : global
- Avantages : pages statiques sans JS d'animation ; chargement par page et par île (`client:visible` respecté) ; évite de payer animate (≈13 kB) ou layout (≈21 kB) hors des pages qui les utilisent
- Limites : l'analyse statique rate les usages construits à l'exécution ; deux chemins (CSS et JS) pour un même verbe à garder équivalents ; couplé à Vite et Astro et à leurs versions
- Conflits : M5-07 (le drapeau par page ne dispense pas du singleton inter-îles)

### M5-06 — Entrées par capacité, avec budget de taille publié
- Énoncé : `@udixio/motion` se découpe en sous-chemins par capacité (`/tokens`, `/state`, `/reveal`, `/scroll`, `/layout`, `/sequence`, `/gestures`, `/text`), tous `sideEffects: false` ; un test CI fige la taille min+gz de chaque entrée et la doc publie le tableau de coût.
- Familles : F19, F21, F22, F23
- Nature : global
- Avantages : coût lisible avant l'import ; tree-shaking vérifié en CI et non supposé ; les composants Udixio n'importent que la capacité qu'ils utilisent
- Limites : beaucoup de sous-chemins désorientent (atténué par M5-10) ; une entrée qui en tire une autre duplique du code si les versions divergent ; budgets à réviser à chaque montée d'anime.js
- Conflits : M5-07 (deux copies du runtime entre îles de versions différentes)

### M5-07 — Singleton inter-îles versionné sur globalThis
- Énoncé : le runtime global (scanner d'observateurs, file de layout) est enregistré sous `globalThis[Symbol.for('udixio.motion@1')]` ; une île qui le trouve réutilise l'instance ; une majeure différente coexiste sans la toucher ; chaque île s'inscrit et se désinscrit par compteur de références à l'unmount.
- Familles : F4, F5, F8, F21, F24
- Nature : global
- Avantages : une seule passe DOM quel que soit le nombre d'îles Astro ; aucun contexte partagé requis, la clé sert de contrat ; prépare F8 (`layoutId`) entre îles
- Limites : compteur de références à tenir (fuite si un unmount est manqué) ; deux majeures actives = deux scans ; état global à réinitialiser entre tests
- Conflits : M5-05 (chargement par page), M5-06 (copies multiples)

### M5-08 — Handle unique : même surface WAAPI ou anime.js, reprise par vitesse courante
- Énoncé : chaque animation retourne un `MotionHandle` (`play`, `pause`, `reverse`, `seek`, `cancel`, et `finished`, une promesse qui se résout en `'finished'` ou `'cancelled'` sans jamais rejeter) ; l'implémentation (WAAPI `Animation` ou anime.js) est interne ; une reprise lit valeur et vitesse courantes avant de créer la suivante.
- Familles : F3, F8, F9, F12, F13
- Nature : instance
- Avantages : un contrat de contrôle quel que soit le moteur ; `await` remplace les callbacks ; aucune promesse rejetée non gérée
- Limites : sémantiques différentes (inversion et `playbackRate` négatif, `finish` contre `complete`) à normaliser ; persistance des styles (`commitStyles`) à trancher ; vitesse conservée seulement pour les propriétés numériques
- Conflits : M5-03 (les springs CSS ne transmettent pas la vitesse), M5-01 (verbes d'instance)

### M5-09 — Réduction de mouvement classée par donnée, pas par effet
- Énoncé : chaque token et chaque verbe porte `intent: 'essential' | 'decorative'` ; sous `prefers-reduced-motion: reduce`, les décoratifs passent à durée nulle ou à un fondu seul, et les boucles s'arrêtent avec un contrôle pause exposé (WCAG 2.2.2) ; un seul prédicat régit la règle CSS et le runtime.
- Familles : F2, F3, F4, F20, F24
- Nature : les deux
- Avantages : classification faite une fois, appliquée partout ; F24 satisfait les exigences de pause sans logique par composant ; un lint peut imposer l'intention sur tout nouveau token
- Limites : décoratif contre essentiel est un jugement sujet à débat ; deux implémentations (CSS et JS) à garder identiques ; un fondu de remplacement peut rester trop fort pour certains utilisateurs
- Conflits : M5-04 (règle à répliquer en CSS), M5-03 (intention portée par les tokens)

### M5-10 — Manifeste machine généré pour agents et documentation
- Énoncé : le build produit `llms.txt` et `motion.manifest.json` à partir des types exportés et des tests : verbes, options, valeurs de tokens, familles couvertes, nature, coût ; les erreurs de dev citent l'identifiant de l'entrée du manifeste ; la doc humaine en est une vue.
- Familles : F21, F22, F23
- Nature : global
- Avantages : un agent apprend le vocabulaire sans lire le code ; une seule source pour la doc, les erreurs et l'agent ; les noms inconnus sont détectés et expliqués
- Limites : à régénérer et vérifier en CI sous peine de dérive ; un manifeste trop long consomme le budget de contexte d'un agent ; fige la surface publique à partir de sa première version
- Conflits : M5-01 et M5-06 (le manifeste décrit leurs choix, à synchroniser)
