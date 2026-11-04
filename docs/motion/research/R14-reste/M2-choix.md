# R14 — Choix de M2 (gestes, listes, chorégraphie, usage interne)

Couverture : Q2 → R01 à R04 ; Q1 → R05, R06 ; Q7 → R07 ; Q3 → R08 ; Q6 → R09 ; Q9 → R10 ; Q5 partielle via R01 ; Q8 partielle via R06. Non traités par M2 : Q4 (SVG), Q10 (outillage IA), à confier à M1 et M5.

Faits vérifiés localement (node_modules, 2026-11-04) : anime.js 4.5.0 `Draggable` expose `velocity`, `releaseStiffness/Damping/Mass`, `releaseEase`, `snap`, `container`, `dragThreshold`, `onGrab/onDrag/onRelease/onSettle`, et aucune gestion clavier. Motion 12.43 `Reorder` n'a ni `keydown`, ni `tabindex`, ni `aria` dans son code, et décide l'échange avec la vitesse (`checkReorder`).

### M2-R01 — Geste = source de valeurs, sans verbe
- Énoncé : un geste (drag, lancer, swipe, reorder) n'est pas un verbe. Il se déclare `defineGesture('nom', { axes, bornes, snap, relâchement, alternative })` et s'applique par `data-motion-gesture="<nom>"` sur la cible. Il publie `x`, `y`, `vitesse` via `defineValue` (lisibles sans re-rendu, M4-S04). La réaction visuelle reste un verbe (`layout`, `emphasize`) ou une valeur lue par CSS (`--udx-drag-x`).
- Questions : Q2, Q5 ; Familles : F18, F14, F13
- Nature : les deux (définition globale, état de geste par cible)
- Avantages : pas de huitième verbe ; même grammaire que le reste ; un geste réutilisable par carousel, side-sheet, liste ; les agents voient une définition nommée
- Limites : une valeur écrite à chaque frame coûte une lecture et une écriture (M1-04) ; la valeur de geste ne doit pas persister au-delà du relâchement
- Conflits : aucun connu (précise M5-S04 et la règle « l'attribut nomme, Tailwind règle » de §8.0 bis)
- Cohérence : réutilise `defineValue` (M4-S04), `data-motion-<option>` (`data-motion-gesture`), `--udx-motion-*` ; nouveauté : une source sans verbe, justifiée car un geste n'est pas un état (même logique que R13/M2-L03 « un changement d'état est son propre déclencheur ») ; exception à déclarer au manifeste

### M2-R02 — Relâchement : ressort initialisé par la vitesse, exposée au handle
- Énoncé : au relâchement, la cible reprend par un ressort initialisé avec la vitesse du doigt (`carry` par défaut pour un geste, §8.0 bis #4). Le handle expose `velocity: { x, y, source: exact | estimated | unavailable }` et les événements `grab`, `drag`, `release`, `settle` ; `finished` ne rejette jamais (M5-08). Un geste avec `carry` passe par anime.js, car WAAPI ne reprend pas à une vitesse donnée (tension §8.0 a).
- Questions : Q2 ; Familles : F13, F18, F12
- Nature : instance
- Avantages : reprise sans à-coup au relâchement ; anime.js calcule déjà la vitesse (`velocityStack`, `velocityMultiplier`, `minVelocity/maxVelocity`) ; `exact` quand la vitesse est calculée, sans estimation
- Limites : le suivi du doigt garde un coût JS pendant le geste ; la vitesse est estimée sur quelques échantillons, donc `estimated` sur appareils lents ; le ressort anime.js ne se traduit pas en `linear()` sans perte (R13/M1-L05)
- Conflits : R13/M1-L05 (ressort par paramètres physiques), R11/M5-S08 (`carry` / `restart`)
- Cohérence : réutilise `carry`, handle unique (M5-08), `velocity.source` (M5-S08) ; aucune nouveauté de grammaire ; exception : un geste impose anime.js même si WAAPI est disponible, déclarée dans le manifeste

### M2-R03 — Alternative clavier et à un seul pointeur, obligatoire et typée
- Énoncé : tout geste qui déplace une cible doit fournir un champ `alternative` dans `defineGesture`. Flèches : un pas (token `step`) ; Maj + flèche : grand pas ; Début / Fin : bornes. Liste réordonnable : Espace saisit, flèches déplacent, Espace ou Entrée dépose, Échap annule (saisie / déplacement / dépôt, sans `aria-grabbed`, déprécié depuis ARIA 1.1). Un geste sans alternative est une erreur de type et de build ; `essential` est la seule exception, consignée au manifeste.
- Questions : Q2 ; Familles : F18, F10, F20
- Nature : instance (état clavier par cible) ; règle globale (type et lint)
- Avantages : conforme à WCAG 2.5.7 (AA, WCAG 2.2), 2.1.1 et 2.5.1 ; Motion `Reorder` n'a aucun chemin clavier, donc pas de référence à copier ; l'alternative donne aux agents un chemin testable
- Limites : le déplacement clavier suit la même grammaire, mais sans animation sous réduction de mouvement ; la poignée de glissement doit faire 24 px au moins (WCAG 2.5.8), à la charge de l'auteur ; deux chemins à tester
- Conflits : aucun connu (complète R13/M5-L02, lint des combinaisons verbe / déclencheur)
- Cohérence : réutilise `data-motion-<option>`, la règle de réduction par verbe (§8.1 #5) et l'erreur de build du manifeste (M5-S10) ; nouveauté : champ `alternative` obligatoire, justifié par WCAG 2.5.7 ; exception : `essential`, consignée au manifeste

### M2-R04 — Drag-to-reorder : `layout` sur la liste, échange au franchissement du milieu
- Énoncé : la liste porte `data-motion="layout"`, identité par nœud (R13/M3-L05). L'élément glissé suit le geste (R01) ; les frères se décalent en FLIP à chaque franchissement du centre d'un voisin. La vitesse n'échange que si elle dépasse un seuil (`velocityMultiplier`), jamais à la place de la position. `commit="live"` (défaut) réordonne le DOM pendant le geste ; `commit="release"` garde l'ordre affiché puis appelle `onReorder` une seule fois. Défilement automatique de bord via `scrollThreshold` / `scrollSpeed`.
- Questions : Q2, Q7 ; Familles : F18, F7, F10
- Nature : les deux (geste et `layout` par instance ; le tri est une donnée)
- Avantages : une règle pour souris, tactile et clavier (R03) ; le tri reste un changement de données, donc testable ; évite le tri intempestif qu'un seuil purement vitesse peut provoquer (Motion `checkReorder`, vérifié)
- Limites : `commit="live"` modifie le DOM pendant le geste (focus, sélection de texte) ; une liste dans un conteneur défilant doit gérer l'auto-scroll ; les grilles 2D ne sont pas couvertes
- Conflits : R13/M3-L02 (géométrie avant mutation), R13/M2-L10 (sortie en popLayout)
- Cohérence : réutilise `layout`, `carry`, `defineGesture`, identité par nœud ; nouveauté : `commit`, option de données et non visuelle, justifiée par la séparation affichage / donnée ; exception : pas de Motion `Reorder`, écarté pour son absence de clavier et son critère de vitesse

### M2-R05 — Séquence nommée : `defineSequence`, temps relatifs, propagation par le DOM
- Énoncé : une chorégraphie est une définition nommée `defineSequence('nom', [{ cible, verbe, at }, …])`. `at` accepte une étiquette et un décalage relatif (`'<'`, `'+=0.1'`, `'étiquette + 0.1'`), jamais un temps absolu seul. En HTML, le parent porte `data-motion-sequence="<nom>"`, chaque enfant `data-motion-step="<étiquette>"` ; le runtime propage départ et délais par le DOM, sans contexte de framework (C6). Le handle unique (M5-08) pilote toute la séquence.
- Questions : Q1 ; Familles : F11, F12, F3
- Nature : les deux (définition globale ; séquence instanciée par racine)
- Avantages : même syntaxe en TS et en HTML ; fonctionne entre îles Astro ; un seul handle pour `seek` et `reverse` ; la timeline anime.js existe déjà (non exposée publiquement, E1)
- Limites : un enfant ajouté pendant la séquence n'y figure pas ; les temps relatifs dérivent si une étape est conditionnelle ; la propagation suppose un parent monté avant ses enfants
- Conflits : R13/M2-L08 (sortie de sous-arbre), aucun connu sur le reste
- Cohérence : réutilise `data-motion` et `data-motion-<option>`, `defineMotion` (M4-S04), handle unique (M5-08), `stagger` en token ; nouveauté : `data-motion-sequence` et `data-motion-step`, justifiés par la propagation sans contexte (C6) ; exception : la timeline anime.js reste un canal d'échappatoire non portable (§4.6)

### M2-R06 — Cascade de liste : rang visuel mesuré, plafond de durée
- Énoncé : le délai d'un élément de cascade (apparition, sortie, réordonnancement) dépend de son rang visuel, mesuré en phase de lecture (M1-04), et non de son index DOM. `data-motion-stagger="tight | normal | loose"` (token R12). Le délai total est plafonné par `--udx-motion-stagger-max` (valeur initiale à valider, 400 ms proposés) : au-delà, les derniers éléments partent ensemble. Sous réduction de mouvement, pas de cascade. `sibling-index()` n'est pas la source de vérité : absent de Chrome 109, Firefox ESR 153 et iOS 18, soit ~3,6 % de `defaults` (R1).
- Questions : Q1, Q8 ; Familles : F10, F3, F11
- Nature : instance (rang par liste) ; token global
- Avantages : une liste de 200 éléments ne dure pas 20 s ; l'ordre suivi est celui que voit l'utilisateur (grille, réordonnancement, RTL) ; le plafond est une règle, donc testable
- Limites : mesurer le rang coûte une lecture par liste ; un plafond trop bas rend les petites listes inégales ; en RTL, rang visuel et rang logique diffèrent (à trancher)
- Conflits : aucun connu (précise R13/M5-L07, stagger de sortie)
- Cohérence : réutilise `stagger` (token R12), `appear`, `disappear`, `layout` et la convention `--udx-motion-*` ; nouveauté : un token de plafond, exposé comme les autres tokens de rythme

### M2-R07 — Migration interne : seule la surface publique, carousel, side-sheet, tabs en exemples
- Énoncé : chaque contrôleur Udixio devient une définition nommée de la surface publique (`defineMotion`, `defineGesture`, `data-motion`), sans type ni constante de Motion. `Transition` et `DEFAULT_CAROUSEL_TRANSITION` sortent de l'API. Carousel : progression pilotée par `scrub` sur le défilement natif (§4.7) et valeur lissée par `defineValue`. Side-sheet : `layout` sur la largeur `auto`, `appear` / `disappear`. Tabs : indicateur en `layout` partagé (`data-motion-shared`, R13/M5-L05), panneau en `appear` avec `start` / `end` selon le sens de l'index ; défilement doux des onglets déplacé dans le core (React seul aujourd'hui, E1). FAB, snackbar, progress : même règle.
- Questions : Q7 ; Familles : F22, F2, F3, F5, F7, F13
- Nature : instance (contrôleurs) ; global (la règle)
- Avantages : une seule surface à tester (C8) ; retire les types Motion publics (E1 : 5 interfaces, 2 constantes) ; parité entre adaptateurs par construction
- Limites : migration progressive ; retirer les props `transition: Transition` est un breaking change (D2, C15) ; la reprise par vitesse de la forme Button n'a pas d'équivalent WAAPI (R02)
- Conflits : R11/M5-S07 (même surface dans chaque environnement) ; aucun connu sur le reste
- Cohérence : réutilise `data-motion`, `carry`, `defineValue`, `data-motion-shared` ; aucune nouveauté de grammaire ; exception : les props `transition` disparaissent au profit de `data-motion-<option>` ou d'un nom de définition, à consigner au journal (D2)

### M2-R08 — Texte découpé sans lecture doublée, découpage après hydratation
- Énoncé : `data-motion-split="words | chars | lines"` sur un élément dont le texte source reste dans le DOM. Le runtime crée des segments `aria-hidden="true"` et pose `aria-label` (texte d'origine) sur le conteneur. Le découpage a lieu côté client après hydratation : en SSR le texte reste intact, sans découpage serveur. Au redimensionnement, `lines` est redécoupé (mesure, R13/M3-L02) ; `words` et `chars` ne bougent pas. Brouillage hors v1 : l'annonce reste `aria-label`, figée.
- Questions : Q3 ; Familles : F16, F10, F7
- Nature : instance
- Avantages : un lecteur d'écran annonce une phrase, pas des lettres ; texte HTML intact sans JavaScript ; le reflow est géré pour `lines`
- Limites : `lines` exige une mesure et un redécoupage au reflow ; `chars` est faux pour les écritures à ligatures et certaines écritures non latines (segmentation par `Intl.Segmenter`, support `defaults` à vérifier)
- Conflits : aucun connu
- Cohérence : réutilise `data-motion-<option>`, `stagger` en token, la réduction par verbe (texte affiché d'un bloc) ; nouveauté : le runtime écrit `aria-label` sur un élément auteur, justifiée par WCAG 1.3.1 ; à inscrire au manifeste comme écriture runtime, à côté de `data-presence` (R13/M2-L09)

### M2-R09 — Responsive : mesure et bornes recalculées, pas de FLIP entre breakpoints
- Énoncé : un changement de géométrie venu d'une media query ou d'une container query ne déclenche jamais `layout` (R13/M2-L02). Le runtime invalide la mesure par ResizeObserver et recalcule bornes et snaps des gestes ; ResizeObserver ne voit ni position ni transform, la position est donc relue à l'invalidation. Un breakpoint qui change la durée ou la distance passe par des tokens posés par Tailwind (`md:[--udx-motion-distance:2rem]`, §8.0 bis), pas par deux définitions. La portée (scope) par racine libère gestes, séquences et boucles d'un seul coup.
- Questions : Q6 ; Familles : F19, F18, F7
- Nature : les deux (invalidation globale ; portée par racine)
- Avantages : un seul code pour tous les breakpoints ; pas de FLIP parasite au redimensionnement ; nettoyage groupé simple
- Limites : un geste actif pendant un changement de breakpoint doit être annulé ou repris (règle à fixer) ; les container queries ne se voient que sur la taille, pas sur la position
- Conflits : R13/M2-L02 (pas de `layout` sur état CSS), R13/M3-L02 (invalidation)
- Cohérence : réutilise les tokens Tailwind (§8.0 bis), `layout` sans nouveauté, handle unique (M5-08) ; aucune exception

### M2-R10 — Geste et liste chargés au premier signal d'intention
- Énoncé : le module geste (et la liste qui en dépend) n'est chargé que si une cible porte `data-motion-gesture` ou `data-motion="layout"`. Il se charge au premier signal d'intention (`pointerenter`, `focusin`, entrée dans la vue), jamais au chargement de la page. L'import passe par le runtime global (R10/M5-07), qui ne charge qu'une fois par page, toutes îles confondues. Taille par module à mesurer ; seul le poids est bloquant (§11).
- Questions : Q9 ; Familles : F21, F18, F7
- Nature : global (chargement partagé)
- Avantages : une page sans geste ne charge pas anime.js `Draggable` ; un premier geste sans attente si l'intention est détectée ; une seule copie entre îles
- Limites : un premier tactile sans `pointerenter` paie une latence de chargement ; anime.js est inliné dans `dist` de core (E1), donc le découpage suppose de l'en sortir ; tailles à mesurer, aucune donnée encore
- Conflits : dépend de R10/M5-07 (runtime global) ; aucun conflit connu
- Cohérence : réutilise le runtime global (M5-07) et le chargement à la demande d'anime.js (R10/M1-01) ; nouveauté : déclencheur d'intention, exception à « chargé au montage » ; cohérent avec la préférence « ne charger que ce qui est utilisé » (cadre R10)
