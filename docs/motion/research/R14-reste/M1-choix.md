# M1 — Choix R14 (moteur et rendu)

Couverture : Q1 (R01, R02), Q2 (R03), Q3 (R04), Q4 (R05), Q5 (R07), Q6 (R08), Q7 (R10), Q8 (R06), Q9 et Q10 (R09). Vérifications web : `d` en CSS encore « Limited availability » (MDN), valeurs des ressorts M3 Expressive divergentes entre sources tierces.

### M1-R01 — Chorégraphie : séquence TS compilée une fois, pilotée par le handle unique
- Énoncé : `defineSequence(nom, segments)` ; un segment = `{ cible, motion, at }`, où `at` est un token de temps, un label ou `+=token` (jamais de millisecondes en dur) ; compilé une fois en offsets absolus ; HTML : `data-motion="<nom>"` sur la racine seule, enfants adressés par `data-motion-part="<nom>"` ; une sortie = un handle (M5-08).
- Questions : Q1 ; Familles : F11, F10, F12
- Nature : les deux (définition nommée dans le registre global, exécution par instance)
- Avantages : une définition, deux écritures (TS et attributs) ; seek et reverse exacts ; aucun sélecteur CSS dans la définition
- Limites : `data-motion-part` doit rester unique par racine ; un segment dont la cible est dans une île sans registre n'est pas sérialisable
- Conflits : prolonge M1-05 (R10, hors top 10) ; aucun autre connu
- Cohérence : grammaire `data-motion` + `data-motion-<option>` (R12 M5-V04) ; `part` est une nouveauté justifiée (adresser un enfant sans sélecteur, lint sur les noms) ; même handle qu'en 8.0

### M1-R02 — Décalage parent vers enfants résolu par `sibling-index()`, repli JS
- Énoncé : `data-motion-stagger="tight|normal|loose"` (token) sur la racine ; délai de l'enfant `i` = `calc(sibling-index() * <token>)` écrit en `animation-delay` quand le backend est CSS ou WAAPI ; calcul JS `i × token` seulement si `sibling-index()` est absent ; jamais de `setTimeout`.
- Questions : Q1, Q6 ; Familles : F10, F11
- Nature : instance
- Avantages : cascade sans JS quand le natif suffit, donc aucun coût par frame ; une seule formule pour liste, séquence et sortie de sous-arbre ; ordre DOM lu directement
- Limites : `sibling-index()` récent (Baseline depuis 2026-08-18 selon spec §5), repli obligatoire pour `defaults` ; ordre DOM différent de l'ordre visuel si `order` ou grille inversée ; une cascade inversée s'écrit explicitement
- Conflits : aucun connu (les segments de R01 peuvent réutiliser le même token)
- Cohérence : même token que `data-motion-stagger` de R13 M5-L07 et même repli que M1-04 ; aucune exception

### M1-R03 — Geste : vitesse estimée sur fenêtre glissante, lâcher en ressort, `reorder` seul verbe
- Énoncé : chaque geste fournit une vitesse (moindres carrés sur les 3 à 4 derniers échantillons de moins de 100 ms) passée au handle en `carry` ; le lâcher est un ressort initialisé avec cette vitesse ; `reorder` est le seul verbe de geste (résultat = ordre, layout) ; drag libre, swipe et inertie sont des actions TS `gesture(el, {axis, bounds, release})`, non déclaratives ; alternative obligatoire : commande clavier (flèches) et boutons, sinon erreur de build (WCAG 2.5.7 et 2.1.1).
- Questions : Q2 ; Familles : F18, F13, F10
- Nature : instance
- Avantages : lâcher sans à-coup, même règle que M1-03 ; `velocity.source: exact` puisque le ressort est JS ; le clavier emprunte le même chemin layout que le geste
- Limites : inertie par friction et ressort sont deux formules à unifier ; pointer events à tester sur tactile et stylet ; un geste ne se déclare pas en HTML
- Conflits : étend M1-03 (R10) ; aucun autre connu
- Cohérence : verbe `reorder` aligné sur M2-V05 ; `drag` réservé à l'action ; `carry` par défaut comme en R11 M5-S08 ; exception déclarée : le drag libre n'a pas de rendu réduit (pas de verbe)

### M1-R04 — Texte : découpage à la compilation, source accessible conservée, réflow contrôlé
- Énoncé : `data-motion-split="chars|words|lines"` (domaine fermé) découpe une fois côté client, après `document.fonts.ready` ; le texte source reste dans un `sr-only` et les parties reçoivent `aria-hidden="true"` (comportement d'anime `accessible` non retenu sans vérification du DOM produit) ; réflow des lignes recalculé par ResizeObserver dans la phase lecture de M1-04 ; brouillage écrit seulement dans les parties masquées ; SSR rend le texte brut, rendu réduit = texte final.
- Questions : Q3 ; Familles : F16, F20
- Nature : instance
- Avantages : un lecteur d'écran lit la phrase une fois ; pas de texte découpé visible avant hydratation ; lignes justes après chargement des polices et redimensionnement
- Limites : découpage en lignes coûteux (mesure) ; copier-coller peut doubler le texte selon le navigateur ; `words` inadapté au CJK ; éléments inline imbriqués non pris en charge
- Conflits : dépend de M1-04 (phases) ; aucun autre connu
- Cohérence : option `data-motion-split` nouvelle, domaine fermé (R12 M5-V03) ; même `data-motion="<nom>"` que les autres familles ; exception : le sr-only duplique le texte, déclarée

### M1-R05 — SVG : tracé et trajectoire en natif, morphing en JS par défaut
- Énoncé : tracé = `pathLength="1"` sur le path (normalisation SVG standard, sans `getTotalLength`) animé en WAAPI sur `stroke-dashoffset` ; trajectoire = `offset-path: path()` avec `offset-distance` en WAAPI ; morphing = `morphTo` d'anime par défaut ; `d` en CSS seulement en amélioration progressive derrière `@supports (d: path(""))`.
- Questions : Q4 ; Familles : F17, F2
- Nature : instance
- Avantages : tracé sans mesure JS ; trajectoire sans calcul par frame, orientation par `offset-rotate` ; morphing exact quand anime rééchantillonne les points
- Limites : `stroke-dashoffset` est peint sur le thread principal (un tracé, à mesurer) ; `offset-path` sans repli sur les anciens navigateurs (état final) ; `morphTo` coûteux sur de longs chemins
- Conflits : M1-01 (critère « compositable ») à élargir pour les one-shot, à trancher en R15
- Cohérence : tracé = preset nommé par effet (`draw`, R12 M5-V05) ; morph et trajectoire = actions TS, pas de verbe (R12 M3-V03) ; exception déclarée : WAAPI non compositable

### M1-R06 — Tokens de mouvement : une source de paramètres physiques, trois émissions
- Énoncé : une source JSON contient durées (échelle short, medium, long, extra-long), courbes M3 (standard, emphasized) et ressorts en raideur et amortissement par catégorie (spatial, effects) et par vitesse (fast, default, slow) ; le build émet CSS (`--udx-motion-*`, `linear()` pré-calculé en N points, cubic-bezier), TS (paramètres physiques et table) et Tailwind (`duration-udx-*`, `ease-udx-*`) ; la table `linear()` est dérivée, jamais source.
- Questions : Q8 ; Familles : F1, F13
- Nature : global (tokens) ; résolution par instance
- Avantages : un ressort exprimé une fois pour CSS, JS et reprise par vitesse ; remplace les valeurs codées dans chaque contrôleur (E1 : aucun token M3 existant) ; erreur de `linear()` mesurée en test
- Limites : valeurs M3 à saisir depuis la source officielle (les sources tierces divergent, p. ex. amortissement spatial default 0,8 ou 1,0) ; `linear()` absent des vieux Chrome de `defaults`, repli JS ; double émission Tailwind à tester
- Conflits : prolonge M1-02 (R10) ; aucun connu
- Cohérence : noms `--udx-motion-*` (R12 M5-V07) ; ms en interne, une seule unité à la sortie (E1 §2.4) ; même repli que M1-R09

### M1-R07 — Valeurs : cellule écrite par la frame dans une variable CSS, compteurs formatés
- Énoncé : `defineValue(nom, {from, to?, mapRange?, spring?})` crée une cellule (valeur, vitesse) écrite par la frame unique (phase écriture) dans `--udx-value-<nom>` sur la racine ; formes : `var()` en CSS, signal Angular, store Svelte, `useSyncExternalStore` React ; compteur = `Intl.NumberFormat` écrit en texte par `data-motion-value="<nom>"` ; SSR affiche la valeur finale.
- Questions : Q5 ; Familles : F14, F15
- Nature : les deux (cellules dans le registre global, écriture par instance)
- Avantages : curseur et parallaxe sans re-rendu ; même cellule dans les cinq formes ; rendu réduit = saut à la valeur
- Limites : écriture qui contourne le framework ; collision avec un style inline ; lecture côté framework en retard d'une frame
- Conflits : prolonge M1-09 (R10) ; s'appuie sur M5-S04 (R11, validé)
- Cohérence : `define*` comme `defineMotion` (R11) ; cellule DOM justifiée (coût nul pour l'arbre) ; exception déclarée : un compteur ne doit pas être `aria-live` par défaut

### M1-R08 — Responsive et scopes : compilation par breakpoint, scope comme unité de nettoyage
- Énoncé : une spec est compilée pour chaque breakpoint des tokens (`md:[--udx-motion-distance:2rem]`) ; un seul `matchMedia` par breakpoint dans le runtime global ; changement de breakpoint = recompilation du handle, pas de redémarrage ; `scope` regroupe les handles d'un sous-arbre, `scope.dispose()` au démontage de chaque framework.
- Questions : Q6 ; Familles : F19, F20
- Nature : les deux (listener global unique, scope par instance)
- Avantages : animation par breakpoint sans JS supplémentaire ; un nettoyage pour tout un sous-arbre ; container queries observées par ResizeObserver
- Limites : recompilation en pleine animation peut sauter ; un ResizeObserver par conteneur ; scope borné à une île
- Conflits : relié à M3-L02 (R13, invalidation de géométrie) ; aucun autre connu
- Cohérence : même grammaire que R12 ; `scope` est l'équivalent de `udixio.motion.inspect()` (R11 M5-S09) ; aucune exception

### M1-R09 — Performance : noyau sans moteur, moteur chargé par verbe, pause unique
- Énoncé : le paquet se découpe en noyau (résolution, WAAPI, tokens, sans moteur) et modules par verbe ; anime.js n'est importé qu'au premier backend JS demandé (`import()`), préchargé sur `pointerenter` ou intersection ; budgets gzip par module mesurés en CI, seuils fixés après mesure en S1 ; anime externalisé (aujourd'hui inliné dans `dist`, E1 §3) ; pause hors onglet et hors vue par la frame unique ; erreurs de compilation citent la fiche du manifeste (Q10).
- Questions : Q9, Q10 ; Familles : F21, F23
- Nature : global
- Avantages : une page sans backend JS ne charge pas anime (animate ~13 kB, layout ~21 kB min+gz selon R10) ; suppression du doublon dans `dist` ; pause uniforme
- Limites : import retardé = état initial visible si le rendu ne le masque pas ; deux copies d'anime sur des îles restent sans le registre (R10 M5-07) ; aucun chiffre de budget avant mesure
- Conflits : aucun connu (s'appuie sur M1-04 et M5-07)
- Cohérence : même `motion(el, spec)` noyau pour chaque framework (R11 M5-S07) ; pas de chargement propre à un framework ; aucune exception

### M1-R10 — Usage interne : les 19 contrôleurs passent par le chemin de résolution
- Énoncé : les 12 contrôleurs `motion` et les 7 `anime` de core passent par `motion(el, spec)` ; leurs `transition: Transition` deviennent des tokens et options fermées (M1-R06) ; migration par backend : tailles et fondus en WAAPI, springs avec reprise en ressort compilé ou JS selon `carry`, layout en anime Layout ; les `vi.mock('motion' | 'animejs')` remplacés par un faux backend qui respecte le handle.
- Questions : Q7 ; Familles : F22, F13
- Nature : instance (contrôleurs) ; global (contrat)
- Avantages : un seul chemin de test ; disparition des secondes mélangées aux millisecondes (E1) ; aucun contrôleur ne voit de moteur
- Limites : 12 fichiers à rebasculer avec test de parité (ressort Motion et ressort CSS ne sont pas identiques) ; breaking de l'API `Transition` (D2) ; mocks à réécrire dans 4 specs au moins
- Conflits : dépend de M1-R06 et de M5-S07 (R11) ; aucun autre connu
- Cohérence : `transition` disparaît de l'API publique au profit d'options fermées (R12 M5-V03) ; exception déclarée : le ressort du Button (`DEFAULT_BUTTON_SHAPE_TRANSITION`) reste un ressort, avec paramètres physiques
