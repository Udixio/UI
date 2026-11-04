# M4 — Choix d'intégration aux frameworks

### M4-01 — Noyau pur sans framework, adaptateurs fins
- Énoncé : `@udixio/motion` exporte un noyau sans import de framework (fonctions qui prennent un élément et des options, et renvoient un handle `{ finished, cancel, dispose }`). Chaque adaptateur n'ajoute que la traduction de cycle de vie : ref callback et hook React, directive Angular avec `DestroyRef`, attachment Svelte (`{@attach}`), attributs `data-*` pour les îles HTML.
- Familles : F1, F2, F3, F7, F12, F22
- Nature : instance
- Avantages : logique testable en Node sans DOM ; chaque adaptateur reste idiomatique ; le même noyau sert les sites sans framework
- Limites : trois surfaces d'API à garder alignées ; la sémantique d'erreur est à répéter dans chaque adaptateur ; le réactif (F14) demande un pont supplémentaire
- Conflits : aucun connu

### M4-02 — Animations de cycle de vie idempotentes
- Énoncé : une animation démarrée à l'attachement est identifiée par son élément et son paramétrage. Un second démarrage (double montage StrictMode de React 19, réattachement Svelte, reconnexion Angular après déplacement) reprend ou annule le handle existant au lieu de le dupliquer ; le démontage annule et ne laisse aucun effet en vol.
- Familles : F2, F3, F7, F13, F19
- Nature : instance
- Avantages : pas de double tween en développement ; comportement identique entre frameworks ; tests monter / démonter / remonter simples
- Limites : un registre par élément (WeakMap) suppose une seule copie du module ; reprendre à mi-course peut figer une valeur si le paramétrage a changé entre-temps
- Conflits : M4-05 (plusieurs copies du module dans les îles Astro)

### M4-03 — Présence : le nœud reste jusqu'à `finished`
- Énoncé : une sortie (F3) garde le nœud dans le DOM, avec `inert` et `aria-hidden` posés, jusqu'à la résolution de `finished` ; seul ensuite le retrait a lieu. React : l'état « en sortie » retient les enfants dans un hook dédié. Angular : le retrait est retardé par le même contrat (`animate.leave` pour une animation CSS, promesse pour un tween JS). Svelte : `out:` natif, mêmes attributs. Règle observable unique : retiré = sortie terminée.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : sortie correcte après un remontage ; accessibilité pendant la sortie traitée au même endroit ; `out:` et `animate.leave` restent utilisés quand ils suffisent
- Limites : React doit garder des enfants hors de la source de vérité, donc gérer clés et ordre ; si le parent se démonte pendant la sortie, le nœud retenu doit être retiré sans attendre ; une sortie mal terminée laisse un élément fantôme
- Conflits : M4-10 (sortie en cours au dispose : finie ou annulée ?)

### M4-04 — Rendu serveur : état final dans le HTML, entrée en CSS
- Énoncé : le HTML produit sans JavaScript montre l'état final (opacité pleine, pas de transform inline), donc aucun saut à l'hydratation. L'état d'entrée est défini en CSS : `@starting-style` quand le navigateur le supporte, sinon une classe posée par l'adaptateur après montage. Le wrapper ne pose jamais de style calculé par JS pendant le rendu serveur.
- Familles : F2, F3, F4, F20
- Nature : les deux (règle CSS globale ; déclenchement par instance)
- Avantages : pas de flash ni de décalage d'hydratation ; contenu lisible sans JS ; entrée native gratuite là où `@starting-style` existe
- Limites : `@starting-style` absent de vieux Chrome de `defaults`, donc fallback JS obligatoire et deux chemins à tester ; les tokens F1 doivent être lisibles en CSS pur
- Conflits : M4-06 (même frontière : le premier affichage)

### M4-05 — Îles Astro : registre versionné sur `globalThis`
- Énoncé : un registre partagé par page est stocké sous `Symbol.for('udixio.motion')` avec un numéro de version majeure. Chaque île, qui embarque sa propre copie de module, s'y raccroche pour partager la boucle d'animation, la résolution des `layoutId` (F8) et la préférence de mouvement. Une version incompatible dégrade vers un noyau local avec avertissement en développement. Lors d'un `astro:after-swap`, les handles des éléments retirés sont annulés ; le registre reste.
- Familles : F8, F9, F21, F22
- Nature : les deux (registre global ; identité et handles par instance)
- Avantages : `layoutId` entre deux îles hydratées à des moments différents ; une seule boucle rAF par page ; aucun contexte framework à partager
- Limites : état global partagé, isolation et tests plus difficiles ; compatibilité de version à maintenir entre îles ; dégradation silencieuse si l'avertissement est ignoré
- Conflits : M4-02 (un WeakMap par copie de module casse l'idempotence entre îles)

### M4-06 — Déclenchement à la vue sur sentinelle, sans rattrapage
- Énoncé : l'observateur de vue (F4) porte sur un élément sentinelle non animé, jamais sur l'élément transformé, car une entrée qui pousse son élément hors écran se désarme elle-même. Un élément déjà visible à l'hydratation s'affiche directement à son état final ; ce qui a été franchi avant l'hydratation n'est pas rejoué. Le même observateur met en pause les boucles (F24) hors écran.
- Familles : F4, F21, F24
- Nature : les deux (observateur partagé ; sentinelle et seuil par instance)
- Avantages : contourne le piège d'auto-désarmement ; pas d'entrée rétroactive brutale dans les îles `client:visible` ; un seul IntersectionObserver par page
- Limites : sentinelle à ajouter au DOM (ou pseudo-élément) ; frontière floue pour un élément sans bord distinct ; ordonnancer un stagger (F10) sur plusieurs sentinelles reste délicat
- Conflits : M4-04 (même frontière de premier affichage, à garder cohérente)

### M4-07 — Valeurs animées en signal, store ou hook, sans re-rendu
- Énoncé : une valeur animée (F14, F15) est un objet à lecture réactive. Angular : `signal` écrit depuis la boucle d'animation, sans `markForCheck`, en zoneless. Svelte : état `$state` ou store. React : `useSyncExternalStore`. Le noyau écrit, l'adaptateur lit ; un composant ne re-rend que s'il lit la valeur dans son rendu.
- Familles : F13, F14, F15
- Nature : instance
- Avantages : 60 fps sans cycle de détection de changements ; compatible zoneless ; pas de state React pour du mouvement continu
- Limites : en React, un store externe lu pendant le rendu peut produire du tearing, donc préférer l'écriture DOM directe pour les styles ; un signal Angular écrit sans lecture dans un template ou un effet est inerte ; ce choix ne doit pas casser le rendu serveur (M4-04)
- Conflits : aucun connu

### M4-08 — Séquences et timelines : handle unique, annulation par statut
- Énoncé : une séquence (F11, F12) est construite en TypeScript pur et pilotée par un handle (`play`, `pause`, `reverse`, `seek`) lié à l'instance. `finished` se résout avec un statut explicite (`completed` ou `cancelled`) au lieu de rejeter, y compris au démontage. Le framework ne manipule qu'un handle : ref React, champ lié à `DestroyRef` en Angular, valeur retournée par l'attachment en Svelte.
- Familles : F10, F11, F12, F13
- Nature : instance
- Avantages : aucun rejet non géré au démontage ; `await` simple dans les trois frameworks ; séquences testables sans DOM
- Limites : un statut explicite est obligatoire, sinon une erreur de logique se confond avec une annulation ; un handle ne survit pas à un remontage, la séquence est recréée ; `reverse` d'une séquence à décalages relatifs exige une règle de réflexion
- Conflits : aucun connu (repose sur le contrat `finished` de M4-03)

### M4-09 — Préférence de mouvement : un store, consommé par chaque adaptateur
- Énoncé : `prefers-reduced-motion` est lu par un store global qui écoute `matchMedia` ; chaque adaptateur s'y abonne. En réduit : durées nulles pour F2, F3 et F7, boucles (F24) et inertie (F18) arrêtées, états finaux posés immédiatement, `finished` résolu tout de suite. Le rendu serveur ne connaît pas la préférence, mais il ne rend que l'état final (M4-04) : rien à corriger.
- Familles : F2, F3, F7, F20, F24
- Nature : les deux (store global ; effet par instance)
- Avantages : un seul point de vérité, y compris entre îles via M4-05 ; réaction au changement de préférence sans rechargement
- Limites : sans registre partagé, chaque île lit `matchMedia` elle-même ; le mode réduit ne doit pas supprimer les retours d'état (focus, erreur, `data-state`) ; les animations de focus restent à conserver
- Conflits : aucun connu

### M4-10 — Scope de nettoyage lié au cycle de vie du framework
- Énoncé : chaque racine (composant ou île) crée un `scope` qui collecte les animations, observateurs et écouteurs qu'elle démarre. `scope.dispose()` arrête tout, et le framework l'appelle au démontage : retour d'effet React, `DestroyRef` Angular, teardown Svelte, `astro:before-swap` ou `pagehide` pour les îles. Un scope par racine, jamais un scope global.
- Familles : F3, F8, F19, F21
- Nature : instance
- Avantages : fuite impossible par oubli ; un seul appel pour tout nettoyer ; tests de fuite simples (compter les scopes vivants)
- Limites : un scope par composant coûte cher si les composants sont nombreux (mutualiser par racine) ; `transition:persist` d'Astro garde une île vivante, son scope ne doit donc pas être disposé au swap ; l'ordre entre dispose et sortie en cours doit être fixé
- Conflits : M4-03 (une sortie en cours est-elle terminée ou annulée au dispose ?) ; M4-02 (même objectif, à articuler)
