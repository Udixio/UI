# R8 — Débat théorique : forme de l'API de @udixio/motion

## Question unique à trancher

**Quelle forme doit prendre l'API publique de `@udixio/motion`, et comment ne
charger que la logique réellement utilisée ?** Classes Tailwind, composants /
directives par framework, ou hybride — et si hybride, avec quelle règle de
partage précise ?

## Contexte (faits établis, ne pas re-vérifier)

- Udixio UI : lib de composants Material 3 multi-framework (React, Angular,
  Svelte), un `core` agnostique + adaptateurs idiomatiques. Utilisée aussi dans
  Astro (îles : pas de contexte React partagé entre îles).
- **Tailwind est un prérequis** de tout l'écosystème Udixio (décidé).
- **anime.js v4 est le seul moteur JS** ; le natif (CSS, WAAPI, View
  Transitions, scroll-driven) est utilisé d'abord, anime.js en fallback ou là
  où le natif n'existe pas (décidé).
- Un modèle commun agnostique (`MotionSpec`, calqué sur Web Animations) est
  réalisé par des « providers » ; les syntaxes ne sont que des façons
  d'écrire ce modèle.
- Le wrapper doit couvrir à terme 24 familles : tokens, transitions d'état,
  présence (entrée/sortie au montage/démontage), déclenchement à la vue, lié au
  scroll, scroll piloté, layout (FLIP), élément partagé (`layoutId`), View
  Transitions, listes/stagger, chorégraphie/séquences, contrôle
  (play/pause/seek), interruption/physique, valeurs réactives (curseur,
  parallaxe), compteurs, texte, SVG, gestes/drag, responsive, accessibilité
  (reduced motion), boucles, perf, usage interne, outillage IA.
- Exigences utilisateur : intuitif pour n'importe quel agent IA (une seule
  façon d'écrire, erreurs visibles), Tailwind-friendly (variants `hover:`,
  `md:`, `data-[…]:` doivent pouvoir conditionner une animation), pas de
  CSS-in-JS, compatible îles Astro, natif d'abord, typage réel.
- Remarques de l'utilisateur à prendre au sérieux :
  - « en Tailwind, le motion riche devient très verbeux et sans vrai
    typage/vérification » ;
  - « chaque framework doit tirer avantage de ses forces (ex. directives
    d'attribut Angular) et ne pas être pénalisé par les limites des autres » ;
  - « si tout passe par des classes, comment faire du lazy loading ? un
    `motion.section` ne charge que sa propre logique ».
- Pistes évoquées (NON décidées) : animations nommées définies en TS
  (`defineMotions({ 'card-reveal': {...} })`) puis appliquées en classe
  (`motion-card-reveal`) ou via la forme du framework (React
  `<Motion.section animation="card-reveal">` + `<Presence>`, Angular
  `udxMotion="card-reveal"`, Svelte `{@attach motion('card-reveal')}`).
- Faits techniques utiles : sans support natif, une déclaration CSS inconnue
  est jetée au parsing (le JS ne peut lire que des copies en variables CSS) ;
  Tailwind ne génère le CSS que des classes trouvées dans les sources ;
  Motion a dû créer `m` + `LazyMotion` car `motion.div` embarquait trop ;
  anime.js v4 est modulaire (animate ≈ 13 kB, layout ≈ 21 kB min+gz) ; une
  partie des effets (fondu, scroll-driven, `@starting-style`) n'exige aucun JS
  quand le natif est supporté ; une animation d'entrée qui pousse l'élément
  hors écran peut empêcher son propre déclenchement IntersectionObserver.

## Règles du débat

- **Théorie et conception uniquement.** Pas d'audit de dépendances, pas
  d'inventaire du code, pas de recherche web sauf pour vérifier UN fait précis
  dont dépend un argument.
- Arguments concrets : scénarios d'usage, exemples de code courts, cas qui
  cassent.
- Fichiers : chacun n'écrit QUE son propre fichier dans ce dossier.
- Concision : 120 lignes maximum par fichier et par tour.
- Aucune commande git.
