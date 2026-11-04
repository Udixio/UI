# M1 — Choix de conception (moteur et rendu)

### M1-01 — Backend choisi par animation, natif d'abord
- Énoncé : chaque animation est résolue à la création vers un seul backend : WAAPI si toutes ses cibles sont compositables (transform, opacity, filter, clip-path) et qu'aucune contrainte JS (vitesse, ressort non CSS, interruption exacte) n'est demandée ; sinon moteur JS chargé à la demande. Le backend retenu est exposé (`backend`) et tracé en dev.
- Familles : F1, F2, F3, F7, F13, F17
- Nature : instance
- Avantages : entrées et hover sur le compositor ; anime.js chargé seulement si un cas l'exige ; moteur retenu lisible par un humain ou un agent
- Limites : deux moteurs donc deux jeux de comportements (fin, `fill`, événements) à aligner ; WAAPI ne transporte pas la vitesse ; double jeu de tests
- Conflits : M1-03, M1-05

### M1-02 — Ressort compilé en `linear()`
- Énoncé : un ressort (raideur, amortissement, masse, ou durée + rebond) est une paramétrisation unique, résolue à la création en table `linear()` de N points bornés (N fixe, erreur de tracé mesurée en test) pour WAAPI ; évaluation JS directe si `linear()` est absent ou si la cible n'est pas CSS. Cache par jeu de paramètres.
- Familles : F1, F13, F18
- Nature : les deux (cache global, table par instance)
- Avantages : tokens Material 3 exprimés une seule fois ; même courbe en CSS et en JS ; aucun calcul JS par frame quand le compositor prend le relais
- Limites : `linear()` absent des vieux Chrome de `defaults` (repli JS obligatoire) ; une table est une approximation, moins fidèle sur les overshoots courts ; coût de compilation à chaque nouveau jeu de paramètres
- Conflits : M1-01, M1-10

### M1-03 — Interruption par transfert de vitesse
- Énoncé : toute animation expose son état (valeur, vitesse) ; une nouvelle cible démarre avec la vitesse courante, jamais à 0 ni par saut. Vitesse exacte en JS, estimée en WAAPI (différence sur 2 à 3 frames échantillonnées).
- Familles : F2, F12, F13, F18
- Nature : instance
- Avantages : hover et tap rapides sans à-coup ; même règle pour le lâcher d'un geste (F18) ; une seule règle de reprise pour toutes les familles
- Limites : WAAPI n'expose pas la vitesse, l'estimation est bruitée ; état retenu par élément (mémoire, nettoyage au démontage) ; lectures de style à faire après les écritures groupées (M1-04)
- Conflits : M1-01

### M1-04 — Frame unique à phases lecture puis écriture
- Énoncé : un seul `requestAnimationFrame` par copie de la lib pour toutes les animations JS, exécuté en deux phases (lectures de mesure, puis écritures de style). Chaque abonné déclare sa phase ; la boucle s'arrête quand la file est vide.
- Familles : F7, F10, F14, F21
- Nature : global
- Avantages : pas de layout thrashing ; coût fixe quel que soit le nombre d'éléments ; pause unique sur onglet caché
- Limites : une tâche lente retarde toutes les animations JS de la page ; plusieurs copies (îles Astro) = plusieurs boucles sans registre partagé ; ne pilote pas WAAPI sauf lecture de `currentTime`
- Conflits : M1-07

### M1-05 — Séquence = donnée compilée en handle
- Énoncé : une séquence est un tableau de segments (offsets absolus ou relatifs à des labels) compilé une fois en un handle unique (play, pause, reverse, seek(t)). Chaque segment est un WAAPI piloté par `currentTime` ou un abonné du frame unique, selon M1-01.
- Familles : F10, F11, F12
- Nature : instance
- Avantages : seek et reverse exacts ; une seule source de vérité temporelle ; aucun `setTimeout`
- Limites : deux horloges (WAAPI et frame) dérivent, resynchronisation à chaque seek ; handle à détruire explicitement ; séquence traversant une île non sérialisable sans passer par un registre
- Conflits : M1-01, M1-04

### M1-06 — FLIP explicite en transform seul
- Énoncé : l'appelant prend la géométrie avant la mutation (`measure()`), l'inversion se fait en `translate()` + `scale()` et se joue en WAAPI. Aucune détection automatique des changements du DOM, aucun moteur layout.
- Familles : F7, F10
- Nature : instance
- Avantages : pas de moteur layout (≈21 kB évités si le besoin est simple) ; transform seul donc compositor ; mesure explicite, donc traçable
- Limites : scale déforme texte et border-radius (correction enfant requise) ; mutation à encadrer sans hook global (React, Angular et Svelte diffèrent) ; un scroll pendant le vol décale l'inversion
- Conflits : M1-07

### M1-07 — Registre d'identités sur `globalThis` versionné
- Énoncé : `data-layout-id` est résolu par un registre de nœuds stocké sous une clé versionnée de `globalThis`, lu par toute copie de la lib sans Provider. Un nœud qui sort est retenu jusqu'à l'arrivée de son homologue, avec purge temporisée.
- Familles : F3, F7, F8
- Nature : les deux (registre global, identité par élément)
- Avantages : traverse frameworks et îles Astro sans contexte partagé ; tolère une hydratation décalée ; même mécanisme pour sorties et entrées
- Limites : collisions d'identité sans espace de noms ; deux versions de registre incompatibles = nœuds invisibles ; purge temporisée = nœud fantôme si l'arrivée tarde
- Conflits : M1-04, M1-06

### M1-08 — Scroll natif sans polyfill, repli à l'état final
- Énoncé : les effets liés au scroll n'utilisent que `animation-timeline` natif. Sans support, l'élément reste à son état final (pas de polyfill, pas de JS par frame). La détection se fait une fois, est exposée (`supported`) et le repli est documenté.
- Familles : F4, F5
- Nature : les deux (détection globale, effet par instance)
- Avantages : zéro coût main thread ; compositor ; pas de polyfill qui casse `@layer`
- Limites : Firefox < 159 et vieux Chrome de `defaults` restent à l'état final (design requis) ; `view()` dépend du conteneur et de l'overflow, diagnostic difficile ; déclenchement à l'entrée (F4) impossible sans IntersectionObserver
- Conflits : aucun connu

### M1-09 — Valeur animable écrite directement dans le DOM
- Énoncé : une cellule animable porte valeur et vitesse, et le frame unique l'écrit dans une propriété ou une variable CSS (`setProperty`), sans passer par l'état du framework. `subscribe` existe pour les rares cas qui ont besoin de la valeur dans le rendu.
- Familles : F14, F15, F24
- Nature : instance
- Avantages : suivi du curseur et parallaxe sans re-rendu ; même cellule lisible depuis React, Angular ou Svelte ; coût nul pour l'arbre de composants
- Limites : écriture qui contourne le framework, collision possible avec un style inline qu'il gère ; lecture synchrone côté framework à documenter ; une API de plus à côté des signaux
- Conflits : M1-04

### M1-10 — Réduction de mouvement résolue par le moteur
- Énoncé : `prefers-reduced-motion` est résolu à la compilation par une seule fonction du moteur : transitions à durée 0 ou état final, ressorts en saut, boucles figées sur une frame neutre sauf alternative explicitement déclarée. Aucun composant n'interroge `matchMedia`.
- Familles : F2, F20, F24
- Nature : global
- Avantages : un seul point de vérité, testable unitairement ; applicable à toutes les familles sans code par composant ; même comportement sur toutes les îles
- Limites : une animation porteuse de sens (progression, curseur) a besoin d'une alternative, pas d'un figement ; préférence utilisateur hors système non couverte ; le saut des ressorts est une coupure visible
- Conflits : M1-02
