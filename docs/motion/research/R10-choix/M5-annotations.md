# M5 — Annotations des choix M1 à M4 (API, DX, outillage)

## M1 — moteur et rendu

- M1-01 : valide — +backend retenu exposé et tracé en dev, diagnostic lisible / −deux moteurs : la règle de choix doit être documentée pour qu'un agent la devine / conflits: M1-03, M1-05
- M1-02 : valide — +table `linear()` unique, lisible comme token / −où la table est calculée (création ou build) reste ouvert / conflits: M1-10, M5-03
- M1-03 : valide — +règle de reprise unique, testable et documentable / −estimation WAAPI bruitée, à présenter comme approximation / conflits: M1-01
- M1-04 : valide — +une boucle par copie, API de phase explicite pour les abonnés / −une tâche lente retarde tout ; la pause d'onglet relève de M3-09 / conflits: M1-07
- M1-05 : neutre — +seek(t) et reverse exacts, testables sans DOM / −deux horloges à resynchroniser ; doublon de M4-08 / conflits: M1-01, M1-04
- M1-06 : neutre — +`measure()` explicite, traçable / −scale déforme ; recouvre M2-03 / conflits: M1-07
- M1-07 : conteste — +résolution inter-îles sans Provider / −clé versionnée différente de M2-01 et M4-05 : trois registres pour un rôle / conflits: M1-04, M1-06
- M1-08 : valide — +zéro JS, pas de polyfill, cohérent avec l'exclusion du polyfill global / −état final sans alternative ; diagnostic de `view()` difficile / conflits: M3-06, M3-08
- M1-09 : neutre — +même cellule lisible depuis les trois frameworks / −contourne le typage CSS sauf si les noms sont typés ; deuxième chemin pour F14 / conflits: M1-04, M4-07
- M1-10 : conteste — +un point unique de test / −« résolue à la compilation » est impossible pour une préférence utilisateur lue à l'exécution / conflits: M1-02, M4-09, M5-09

## M2 — layout et éléments partagés

- M2-01 : conteste — +résolution inter-îles par le DOM, visible en SSR / −clé `udixio.motion.layout@1` distincte de `udixio.motion` (M4-05) : deux registres pour un rôle / conflits: M2-07, M4-05
- M2-02 : neutre — +une lecture groupée puis une écriture groupée par frame / −doublon de M1-04, avec le partage inter-îles de M4-05 / conflits: M2-04
- M2-03 : valide — +`--m-sx` / `--m-sy` deviennent une API publique à typer et documenter / −box-shadow et border-width faux pendant le scale / conflits: M2-09
- M2-04 : valide — +zéro JS par frame, navigation cross-document Astro / −Chromium seul pour `startViewTransition` ; collisions de `view-transition-name` non contrôlées / conflits: M2-02, M2-08
- M2-05 : neutre — +état, focus et refs préservés pendant la sortie / −doublon de M4-03 / conflits: M2-06
- M2-06 : neutre — +les voisins glissent sans attendre la fin de la sortie / −usage avancé (flex et grid) : à ne pas activer par défaut / conflits: M2-05
- M2-07 : valide — +portée explicite, lisible par un agent et testable par comptage de scopes / −une paire inter-îles devient impossible hors portée / conflits: M2-01
- M2-08 : valide — +API identique pour FLIP et paires partagées, sans saut / −recoupe M1-03 ; lecture de style coûteuse / conflits: M2-04
- M2-09 : valide — +taille native sans JS quand `interpolate-size` existe / −Chromium seul ; repli relayout à chaque image / conflits: M2-03
- M2-10 : conteste — +geste fluide sans relayout / −clavier explicitement non traité : bloque F20 pour toute la bibliothèque / conflits: M2-08

## M3 — scroll, déclencheurs, runtime global

- M3-01 : valide — +état `data-udx-view` observable en CSS, DOM et tests / −un bug du singleton touche toutes les îles de la page / conflits: M3-10
- M3-02 : conteste — +aucun contenu caché sans JS / −deuxième mécanisme de premier affichage avec M4-04 ; masque avant inscription / conflits: M4-04, M4-06
- M3-03 : valide — +les transformées ne faussent plus la géométrie de déclenchement / −nœud supplémentaire à produire en SSR ; doublon de M4-06 / conflits: —
- M3-04 : valide — +inscription par cycle de vie, sans scan, identique dans les trois frameworks / −une classe Tailwind ne peut pas inscrire : contraint M5-02 et M5-04 / conflits: M5-02, M5-04
- M3-05 : valide — +deux intentions, deux noms : le typage peut interdire scrub avec seuil / −noms à aligner sur M5-01 (`reveal`, `track`) ; deux notions à documenter / conflits: M5-01, R9 J4
- M3-06 : valide — +repli JS opt-in, coût lisible dans la page / −sur vieux Chrome l'effet disparaît, à documenter / conflits: M1-08, M3-08
- M3-07 : valide — +API native, aucune bibliothèque de lissage à charger / −durée du `smooth` natif non réglable / conflits: —
- M3-08 : conteste — +une propriété CSS consommable par `calc` et `transform` / −listener par document et `@property` requis : contredit M1-08 sur le JS par frame / conflits: M1-08, M3-06
- M3-09 : valide — +un seul `visibilitychange`, zéro coût hors écran / −une présence figée retarde sa promesse de fin : à exposer par `finished` / conflits: M1-04, M3-01
- M3-10 : valide — +deux îles au même composant ne collisionnent pas / −règle de scope en plus, noms à générer au build / conflits: M3-01

## M4 — intégration aux frameworks

- M4-01 : valide — +noyau sans framework, testable en Node, même contrat partout / −trois adaptateurs à aligner ; sémantique d'erreur répétée / conflits: M5-08
- M4-02 : valide — +idempotence : StrictMode et réattachement sans double tween / −WeakMap suppose une seule copie du module / conflits: M4-05
- M4-03 : valide — +sortie gérée au même endroit, accessibilité pendant la sortie / −mécanisme différent par framework ; React gère clés et ordre / conflits: M4-10
- M4-04 : valide — +état final en HTML, zéro saut à l'hydratation / −`@starting-style` absent de vieux Chrome : deux chemins à tester / conflits: M3-02, M4-06
- M4-05 : valide — +registre unique par page, `layoutId` entre îles / −clé et version à unifier avec M1-07, M2-01, M5-07 ; état global difficile à tester / conflits: M4-02
- M4-06 : neutre — +contourne l'auto-désarmement grâce à la sentinelle / −doublon de M3-03 et M3-01 ; frontière floue sans bord distinct / conflits: M4-04
- M4-07 : neutre — +signal ou store sans re-rendu, lecture typée par adaptateur / −deux chemins pour F14 avec M1-09, à trancher / conflits: M1-09
- M4-08 : valide — +statut explicite, `await` identique, séquence testable sans DOM / −statut obligatoire ; un handle ne survit pas au remontage / conflits: —
- M4-09 : valide — +une seule lecture de `matchMedia` pour toutes les îles / −blanket : durées nulles sans distinction essentiel et décoratif (contredit M5-09) / conflits: M1-10, M5-09
- M4-10 : valide — +fuites détectables en comptant les scopes vivants / −coût par composant à mutualiser par racine ; ordre dispose et sortie à fixer / conflits: M4-02, M4-03

## Doublons à fusionner

- Registre `globalThis` versionné : M1-07, M2-01, M4-05, M5-07 → garder M4-05, une seule clé `Symbol.for('udixio.motion@1')`
- Frame et scheduler lecture/écriture : M1-04, M2-02 → garder M1-04, avec le partage inter-îles de M4-05
- Observateurs de vue : M3-01, M3-03, M4-06 → garder M3-01 (observateur) et M3-03 (sentinelle), M4-06 absorbé
- Présence à la sortie : M2-05, M4-03 → garder M4-03
- Séquences : M1-05, M4-08 → garder M4-08
- Handle d'animation : M4-01, M5-08 → garder M4-01 comme noyau, avec la surface étendue de M5-08
- FLIP en transform : M1-06, M2-03 → garder M2-03, `measure()` de M1-06 en sous-étape
- Reprise par vitesse ou position : M1-03, M2-08, M5-08 → garder M1-03, M2-08 limité au layout
- Réduction de mouvement : M1-10, M4-09, M5-09 → garder M4-09, classification de M5-09, M1-10 retiré
- Pause onglet caché : M1-04 (partie), M3-09 → garder M3-09
- Premier affichage : M3-02, M4-04, M4-06 → garder M4-04, M3-02 reformulé
- Linéarisation du ressort : M1-02, M5-03 (partie) → garder M1-02, M5-03 retire le calcul du ressort
