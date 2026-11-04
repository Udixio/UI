# M4 — Choix de surface d'écriture (R11)

### M4-S01 — Forme par framework : une spec, quatre adaptateurs minces
- Énoncé : la surface est une seule spec sérialisable. React : `ref={motion(spec)}` (ref callback, cleanup retourné, React 19), sans composant wrapper ni hook de rendu. Angular : directive `udxMotion` avec input `spec`. Svelte : `{@attach motion(spec)}`. HTML / Astro : attribut `data-motion` qui référence une définition. Chaque adaptateur ne fait que brancher le cycle de vie sur le handle (M5-08) et la présence (M4-03).
- Familles : F2, F3, F4, F7, F8, F10
- Nature : instance
- Avantages : aucun élément DOM ajouté ; listes et conditionnels sans règles des hooks ; même spec partout, donc une seule doc
- Limites : ref callback à cleanup exige React 19 ; attachments Svelte 5 récent ; listes Angular à gérer avec `track` explicite ; quatre formes à expliquer, dont une seule est la référence
- Conflits : M5-02 (une forme de config, trois syntaxes) ; M5-01 (noms de verbes)

### M4-S02 — Vocabulaire sans homonyme natif
- Énoncé : les verbes d'intention n'empruntent pas le nom d'une API native. `enter` et `exit` sont remplacés par `appear` (montage ou entrée à la vue) et `dismiss` (sortie avec présence, M4-03). `state`, `reveal`, `track`, `layout`, `sequence`, `loop` sont conservés. Un nom natif (`animate.enter`, `in:`, `out:`) est refusé par le typage et par le lint.
- Familles : F2, F3, F4, F5, F7, F8, F10, F11, F24
- Nature : les deux (`state`, `reveal`, `loop` global ; `appear`, `dismiss`, `track`, `layout`, `sequence` instance)
- Avantages : plus de confusion avec `animate.enter/leave` ni `in:/out:` ; humain et agent distinguent le natif de Udixio ; noms courts
- Limites : `dismiss` moins immédiat que `exit` ; réécriture de la doc R10 ; F6, F16, F17, F18 ne sont pas portés par ces verbes
- Conflits : M5-01 (ce choix remplace ses noms d'entrée et de sortie)

### M4-S03 — Tailwind : couche CSS seule, jamais porteuse de présence
- Énoncé : Tailwind n'expose que les effets exprimables en CSS (`motion-reveal-once`, `motion-state-open:`, variants) déclarés en CSS-first (`@plugin`, `@utility`). Les classes ne déclarent ni présence, ni callback, ni inscription au runtime. Les valeurs arbitraires ne sont autorisées que sous forme de référence à un token (`motion-[var(--udx-motion-dur-md)]`). Toute animation qui exige le runtime passe par la spec.
- Familles : F1, F2, F4, F5, F20, F24
- Nature : global
- Avantages : préférence Tailwind respectée ; zéro JS pour l'état ; purge native ; frontière nette qui évite toute ambiguïté sur l'inscription
- Limites : classes construites dynamiquement invisibles au scanner (`@source inline()` requis) ; deux chemins (classe ou spec) pour une même intention ; réduction de mouvement à répliquer en CSS
- Conflits : M5-04 (même périmètre, précisé) ; M5-02 (les classes ne portent qu'un sous-ensemble de la grammaire)

### M4-S04 — Définitions nommées : animation ou valeur, déclarées une fois en TS
- Énoncé : `defineMotion('card-enter', {...})` et `defineValue('cursor-x', {...})` déclarent une définition typée, validée et sérialisable. Toute surface la référence par son nom : `data-motion="card-enter"`, `udxMotion="card-enter"`, `{@attach motion('card-enter')}`, `ref={motion('card-enter')}`. Une valeur animable (F14, F15) est lue en signal (Angular), en store (Svelte) ou par `useSyncExternalStore` (React), sans re-rendu.
- Familles : F1, F2, F3, F11, F14, F15, F22
- Nature : les deux (registre de définitions global, adossé à M5-07 ; lecture par instance)
- Avantages : une définition réutilisée par îles et frameworks ; le nom sert de doc et de contrat pour un agent ; F14 et F15 dans la même surface
- Limites : indirection nom vers définition à résoudre ; une définition doit être enregistrée avant l'hydratation de l'île qui s'en sert ; les animations purement inline disparaissent de la surface
- Conflits : M1-09 et M4-07 (écriture DOM directe contre signal, à trancher)

### M4-S05 — Tokens de mouvement : source de design unique, édition sans code
- Énoncé : durées, easings et springs Material 3 vivent dans un fichier de tokens TS qui émet des custom properties `--udx-motion-*`, des types littéraux et un thème Tailwind `@theme`. Une spec ne contient jamais de valeur numérique en dur, seulement une référence de token. L'intention (`essential` | `decorative`) est portée par le token, pas par le composant.
- Familles : F1, F2, F13, F18, F20
- Nature : global
- Avantages : le designer modifie un fichier, jamais un composant ; CSS, Tailwind et runtime lisent la même valeur ; un lint interdit les valeurs en dur
- Limites : les springs restent des approximations `linear()` (M1-02) ; un token mal classé fausse la réduction de mouvement ; passage par le build obligatoire
- Conflits : M5-03 (émission des tokens, déjà fusionnée dans M1-02) ; M5-09 (intention)

### M4-S06 — Vérification à trois étages, aucune erreur silencieuse
- Énoncé : (1) typage : `satisfies MotionSpec` et noms de définitions typés par une union générée ; (2) build : le parseur des attributs `data-motion` et des classes s'exécute sur les pages et échoue avec l'id de l'entrée de manifeste ; (3) dev : un avertissement runtime nomme la définition, le verbe et la cible. Un lint refuse tout verbe sans intention. En production, aucune erreur n'est avalée.
- Familles : F20, F21, F23
- Nature : global
- Avantages : fautes d'humain et d'agent remontées au build ; aucune erreur silencieuse ; cohérent avec le manifeste de R10
- Limites : l'union des noms impose une étape de build ; deux parseurs (attribut et TS) à garder identiques ; avertissements seulement en dev
- Conflits : M5-10 (manifeste, à synchroniser) ; M5-02 (grammaire à tester en parité)

### M4-S07 — Continuité déclarée : la spec dit si la vitesse compte
- Énoncé : chaque spec porte `continuity: 'velocity' | 'state'`, par défaut `state`. `velocity` force le moteur JS (M1-01) et la reprise exacte par vitesse (M5-08) ; `state` autorise WAAPI et une reprise à partir de la valeur rendue. Tension (a) résolue : WAAPI n'est jamais choisi quand la vitesse est promise par la spec.
- Familles : F2, F12, F13, F18
- Nature : instance
- Avantages : le compromis devient une option visible et testable ; l'auteur ne déduit plus la vitesse d'un nom ; pas de à-coup silencieux pour un geste déclaré `velocity`
- Limites : `velocity` coûte du JS par frame ; le défaut `state` peut produire un saut pour un geste mal déclaré ; deux comportements à tester
- Conflits : M1-02 (ressort en `linear()`, sans vitesse à la reprise) ; M2-04 (VT non interruptible)

### M4-S08 — Boucles déclarées, jamais lancées
- Énoncé : une spec `loop` (F24 : indicateur, pulsation) s'enregistre comme abonné de la frame unique (M1-04), avec une phase déclarée et un contrôle pause exposé. Aucun adaptateur ni composant n'appelle `requestAnimationFrame` ; la suspension hors-vue et onglet caché relève du runtime. Tension (b) résolue : une seule boucle par page, enregistrée dans le runtime global.
- Familles : F24, F14, F21
- Nature : les deux (abonnement global, contrôle par instance)
- Avantages : une boucle par page et mesurable ; un composant ne peut pas oublier de l'arrêter ; pause exposée pour WCAG 2.2.2
- Limites : une tâche lente retarde toutes les boucles ; les boucles CSS infinies (Tailwind) restent hors de ce chemin ; la phase déclarée doit être choisie par l'auteur
- Conflits : M1-04 (même frame, alignés) ; M3-09 (pause hors-vue, à reprendre dans le runtime)

### M4-S09 — HTML et Astro : attributs statiques, îles sans contexte, transition nommée
- Énoncé : une page statique porte `data-motion="card-enter"` et reçoit son rendu final. Une île reçoit sa spec par attribut sérialisé, sans contexte partagé, et s'enregistre au runtime global. Pour F9, `udx-shared="<clé>"` génère un `view-transition-name` stable (ou délègue à `transition:name` d'Astro), sans API propre. `client:*` est respecté.
- Familles : F4, F8, F9, F22
- Nature : les deux (attribut global, enregistrement par île)
- Avantages : pages sans JS d'animation si l'effet est CSS ; îles hydratées tard reçoivent l'état final (M4-03) ; F8 et F9 sans nouvelle API
- Limites : spec en attribut verbeuse ; VT limitée à Chromium, repli à l'état final ; décalage d'hydratation si l'attribut diffère entre serveur et client
- Conflits : M2-04 (VT native) ; M5-02 (grammaire d'attribut)

### M4-S10 — Composants Udixio internes : même surface, zéro API privée
- Énoncé : FAB, tabs, snackbar et text-field écrivent leurs animations avec les mêmes définitions nommées (`defineMotion`, espace de noms `udx-internal-*` réservé) et les mêmes adaptateurs. Aucune primitive interne n'est exportée hors de la surface publique ; un besoin de composant se déclare comme définition, jamais comme appel privé.
- Familles : F10, F19, F22
- Nature : les deux (usage par instance, définitions globales)
- Avantages : la surface est testée par nos propres composants avant les sites ; un défaut de surface apparaît d'abord en interne ; une seule façon d'écrire, y compris pour nous
- Limites : tout changement de surface oblige à retoucher les composants ; définitions internes à versionner strictement ; l'interdiction de contournement peut ralentir un besoin urgent
- Conflits : M5-06 (sous-chemins par capacité, à articuler avec l'espace de noms interne)
