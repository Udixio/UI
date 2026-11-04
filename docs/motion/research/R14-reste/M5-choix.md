# M5 — Choix R14 : tokens, outillage, séquences, gestes, texte

Spécialité : API, DX, outillage. Questions couvertes : Q1, Q2, Q3, Q5, Q8, Q10.
Hors spécialité, laissées à M1–M4 : Q4 (SVG), Q6 (responsive), Q7 (usage interne), Q9 (performance).
Faits vérifiés : spec web M3 (recherche : ressorts = système courant, legacy non maintenu, `medium2` = 300 ms, `emphasized-decelerate` 0.05/0.7/0.1/1), `fab-motion.ts` (`cubic-bezier(0,0,0.58,1)`), `animation.ts` (`--anim-ease` in/out), `packages/mcp` (`listComponents`, `getComponentDoc`), R2 (llms.txt de Motion et GSAP).

### M5-R01 — Tokens : une source TS, trois émissions
- Énoncé : tokens déclarés une fois en TS (`defineTokens`, sous-chemin `/tokens`), émis au build en `--udx-motion-<rôle>-<nom>` (ex. `--udx-motion-duration-medium2`), en types TS et en `@theme` Tailwind (`--duration-*`, `--ease-*` alias). `--animate-*` et `--anim-*` ne sont plus émis.
- Questions : Q8 ; Familles : F1, F13, F20
- Nature : global
- Avantages : une valeur de marque = un fichier ; CSS, TS et Tailwind lisent la même valeur ; migration nommée de `--anim-*`
- Limites : `var()` dans `@theme` à vérifier au build (Tailwind v4) ; type TS à aligner sur l'émission CSS
- Conflits : M5-S04 (`--animate-*` dans `@theme`, à corriger), M5-V07 (préfixe `--udx-motion-*`), M5-S05 (émission une fois)
- Cohérence : nom `--udx-motion-*` (V07), tokens par rôle (S05). Nouveauté : alias `--duration-*` / `--ease-*`, justifié car les utilitaires Tailwind doivent exister sans second jeu de valeurs.

### M5-R02 — Tokens de rôle : ressort source, courbe M3 en repli
- Énoncé : `duration` (short1–4 à extra-long1–4, en ms dans la source seulement), `ease` (standard, standard-decelerate / -accelerate, emphasized, emphasized-decelerate / -accelerate), `spring` (spatial et effects × fast / default / slow). Le ressort est la source ; `cubic-bezier` ou `linear()` sont dérivés au build, jamais écrits à la main. Les courbes legacy (`0.2,0,0,1` ; `0.05,0.7,0.1,1` ; `0.3,0,0.8,0.15`) sont le repli déclaré.
- Questions : Q8 ; Familles : F1, F2, F13
- Nature : global
- Avantages : aligné sur M3 Expressive ; `medium2` = 300 ms = durée actuelle de `fab-motion.ts` ; une table pour CSS et JS
- Limites : valeurs à recouper sur la page M3 complète (extraits seulement) ; la courbe de `fab-motion.ts` n'est dans aucun token M3 (à migrer) ; `--anim-ease` (in / out / in-out) sont des courbes CSS génériques
- Conflits : M5-R01 (émission), R10 M1-02 (`linear()` compilé), M5-S05 (ressort compilé), M5-V03 (token en option)
- Cohérence : options `duration` / `easing` / `spring` = noms de tokens (V03), défaut par verbe (V02). Nouveauté : repli dérivé au build, justifié par `carry` (qui a besoin d'une vitesse) et par les navigateurs sans `linear()`.

### M5-R03 — Manifeste machine : `llms.txt` et JSON produits au build
- Énoncé : le build émet `llms.txt` et `motion.manifest.json` depuis types et tests : verbes, options, tokens, presets, défauts par verbe, table verbe × option (L09), une fiche par cas (L10). Types, lint, MCP et doc lisent ce seul fichier.
- Questions : Q10 ; Familles : F22, F23
- Nature : global
- Avantages : agents et humains lisent le même contrat ; Motion publie `llms.txt` et `llms-full.txt`, anime.js non (R2) ; une régression du manifeste casse un test
- Limites : `llms.txt` grossit avec les fiches ; le manifeste est un contrat versionné à tenir à jour
- Conflits : M5-S10 (manifeste), M5-V09 (liste fermée), M5-L10 (fiches)
- Cohérence : même manifeste pour les cinq formes (S07). Aucune exception.

### M5-R04 — Outils MCP `@udixio/mcp` : recette et validation motion
- Énoncé : `@udixio/mcp` (outils existants `listComponents`, `getComponentDoc`) reçoit trois outils lus dans le manifeste : `listMotionVerbs`, `getMotionRecipe(cas, forme)`, `validateMotionSpec(spec, forme)`. Ils renvoient les codes d'erreur du build et du runtime dev.
- Questions : Q10 ; Familles : F23
- Nature : global
- Avantages : un agent valide avant d'écrire, sans build ; un seul jeu de codes pour quatre sorties
- Limites : une définition construite à l'exécution échappe à la validation ; surface MCP à maintenir
- Conflits : M5-L10 (erreurs), M5-S10 (garde-fous), M5-R03 (manifeste)
- Cohérence : même forme (S07), mêmes codes (L10). Nouveauté : outils de validation et de recette, justifiés car un agent corrige mieux une erreur qu'il peut tester.

### M5-R05 — Séquence en TS : étapes nommées, relations `after` et `with`
- Énoncé : `defineSequence('card-intro', [{ step: 'title', motion: 'card-enter' }, { step: 'body', motion: 'card-enter', after: 'title', offset: 'short2' }])`. Les étapes se réfèrent par nom ; le décalage est un token de durée, jamais des millisecondes. Un handle unique (S08) est renvoyé.
- Questions : Q1 ; Familles : F10, F11, F12
- Nature : instance (définition globale par nom)
- Avantages : `after` inconnu = erreur de type ; aucun `setTimeout` ; `play`, `pause`, `seek` identiques aux autres animations
- Limites : séquences longues difficiles à relire ; `offset` en tokens limite la précision fine
- Conflits : M5-V03 (options en tokens), M5-S08 (handle), M5-L09 (table verbe × option)
- Cohérence : référence par nom (S01), handle (S08), `stagger` en token (V03). Nouveauté : `after` / `with`, justifiés car une séquence sans relation nommée n'est pas vérifiable.

### M5-R06 — Séquence dans les cinq formes : HTML référence seulement
- Énoncé : HTML écrit `<ul data-motion-sequence="card-intro">` et chaque étape `data-motion-step="title"` ; ordre et décalage restent dans la définition TS. React `useSequence(cardIntro)` ; Angular `udxSequence` ; Svelte `{@attach sequence(cardIntro)}` ; noyau `sequence(el, cardIntro)`.
- Questions : Q1 ; Familles : F10, F11
- Nature : les deux
- Avantages : même graphe dans les cinq formes ; HTML sans JS hors définition ; `data-motion-step` lisible par `attributeFilter`
- Limites : HTML pur dépend d'une définition chargée ; une étape absente du DOM n'est signalée qu'au lint
- Conflits : M5-R05 (définition), M5-V04 (grammaire), M5-S07 (même surface)
- Cohérence : grammaire `data-motion-<option>` (V04). Exception déclarée : `data-motion-sequence` et `data-motion-step` sont des références (S01), jamais des valeurs libres.

### M5-R07 — Geste : primitive d'action, vitesse au handle
- Énoncé : `drag`, `swipe` et `reorder` sont des primitives `gesture` hors vocabulaire de verbes (V08) : `defineGesture('sheet-drag', { axis: 'y', bounds: [0, 1], release: 'snap' })`. Le handle expose `velocity` au relâchement (`source: exact` au pointeur, `estimated` sinon) ; le relâchement lance `carry` vers le repos.
- Questions : Q2 ; Familles : F8, F13, F18
- Nature : instance
- Avantages : aucun verbe nouveau ; vitesse explicite et honnête (S08) ; `reorder` = geste + `layout` (L01), sans FLIP écrit à la main
- Limites : l'inertie demande un calcul par frame (R10 M1-04) ; sur tactile, `velocity.source` reste souvent `estimated`
- Conflits : M5-V08 (actions hors vocabulaire), M5-S08 (carry, velocity.source), R10 M1-04 (frame unique), M5-L01 (layout)
- Cohérence : handle commun (S08), `carry` au relâchement (V02). Nouveauté : `gesture` comme primitive, justifiée car un geste n'est pas un état d'élément.

### M5-R08 — Alternative clavier obligatoire pour tout geste déplaçant
- Énoncé : tout `defineGesture` qui déplace un élément déclare `keyboard` : une alternative à un seul pointeur (boutons « monter / descendre », ou `ArrowUp` / `ArrowDown` sur le handle `step`). Son absence est une erreur de build et de type (S10), citant WCAG 2.2 SC 2.5.7 (mouvements de glissement, AA). Même règle pour `reorder`.
- Questions : Q2 ; Familles : F18, F20, F22
- Nature : global
- Avantages : passe par les quatre niveaux de garde-fou (S10) ; un agent ne peut pas l'oublier ; slider, carousel et side-sheet ont déjà un chemin clavier à reprendre
- Limites : le lint vérifie la présence, pas le fonctionnement (test requis) ; exception à déclarer pour un geste purement décoratif
- Conflits : M5-L02 (lint), M5-S10 (garde-fous), M5-R07 (geste)
- Cohérence : même format d'erreur que L10. Nouveauté : contrôle de présence d'une alternative, justifié par WCAG.

### M5-R09 — Valeurs réactives : `defineValue` lu sans re-rendu
- Énoncé : `defineValue('cursor-x', { source: 'pointer.x', range: [0, 1] })` ; lecture par signal Angular, store Svelte, `useSyncExternalStore` React ; HTML écrit `data-motion-value="cursor-x"` (référence seule, S01). La source n'existe qu'en TS.
- Questions : Q5 ; Familles : F14, F15
- Nature : les deux (registre global par nom, lecture par instance)
- Avantages : même nom pour curseur, parallaxe et compteur ; aucun re-rendu React ni recalcul Angular
- Limites : une valeur continue lue par beaucoup d'abonnés coûte en frame (R10 M1-04) ; HTML ne lit qu'une valeur déjà enregistrée
- Conflits : M5-S04 (valeurs nommées), M5-V03 (`range` en token), M4-S04 (définitions nommées)
- Cohérence : nommée (S04), référence seule en HTML (S01). Nouveauté : `source` réservé au TS, justifié car HTML ne peut pas écrire une source libre.

### M5-R10 — Texte : `split` option de `reveal`, accessibilité native
- Énoncé : `<h2 data-motion="title-reveal" data-motion-split="words">`, avec `split` = `letters | words | lines` (mots-clés fermés). Le runtime pose `aria-label` sur le conteneur et `aria-hidden` sur les fragments, puis restitue le texte source à l'arrêt. Les cinq formes passent par une seule fonction `splitText`.
- Questions : Q3 ; Familles : F4, F16
- Nature : instance
- Avantages : lecteurs d'écran lisent le texte entier une fois ; SSR sert le texte source avant hydratation ; `lines` recalculé sur ResizeObserver au reflow
- Limites : `lines` dépend de la largeur et doit être recalculé ; le découpage gêne la sélection et la recherche navigateur
- Conflits : M5-V03 (options fermées), M5-L07 (enfants en `stagger`), M5-V04 (grammaire)
- Cohérence : option `data-motion-split` (V04), fragments en `stagger` (V03). Nouveauté : `split` mot-clé fermé, justifié par la limite de V03 (pas de chaîne libre).
