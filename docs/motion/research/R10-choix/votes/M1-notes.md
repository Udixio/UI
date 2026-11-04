M1-04 : 9 — une seule boucle par page, phases lecture puis écriture : coût fixe et prérequis du partage entre îles, consensus 4 sur 5 ; risque : une tâche lente retarde tout.
M5-07 : 9 — singleton versionné, seule clé retenue : une passe DOM quel que soit le nombre d'îles ; risque : compteur de références à tenir.
M1-01 : 9 — routage natif ou JS explicite et exposé en dev : point d'appui de tous les autres choix ; risque : deux moteurs à aligner.
M1-03 : 8 — reprise par transfert de vitesse, consensus 4 sur 4 : évite les à-coups sur interactions rapides ; risque : vitesse WAAPI estimée et bruitée.
M4-03 : 8 — présence jusqu'à `finished` : indispensable pour F3, F10 et F11 ; risque : React doit retenir les enfants, fantômes si démontage pendant la sortie.
M5-08 : 8 — handle unique, `finished` sans rejet : contrat de contrôle nécessaire ; risque : vitesse perdue hors propriétés numériques, `commitStyles` à trancher.
M2-03 : 7 — FLIP en transform avec correction d'enfants : indispensable au layout ; risque : `box-shadow` faux pendant le scale, contesté par M2-09.
M5-09 : 7 — intention essentiel ou décoratif, bon cadre WCAG 2.2.2 ; risque : classification subjective, deux implémentations à garder identiques.
M4-01 : 7 — noyau sans framework testable en Node : architecture saine ; risque : trois surfaces d'API à aligner, handle à aligner sur M5-08.
M3-03 : 7 — sentinelle sans transformée : supprime l'auto-désarmement de F4 ; risque : nœud supplémentaire, à tester en grille.
M3-01 : 6 — un observateur par document et par couple : coût constant ; risque : un bug du singleton touche toutes les îles.
M4-10 : 6 — scope de nettoyage par racine : évite les fuites ; risque : `transition:persist` d'Astro et ordre dispose et sortie à fixer.
M1-02 : 6 — ressort en `linear()` compilé : utile pour F1 et F13 ; risque : approximation, absent des vieux Chrome, vitesse non transportée.
M3-06 : 5 — repli scroll statique par défaut, JS nommé : zéro JS sur navigateurs récents ; risque : l'effet disparaît sur vieux Chrome.
M5-04 : 5 — plugin Tailwind CSS-first, cohérent avec la préférence du cadre ; risque : classes dynamiques invisibles au scanner, `animation-trigger` inégal.
M4-07 : 5 — valeurs en signal sans re-rendu, couvre F14 et F15 ; risque : tearing en React et conflit non tranché avec M1-09.
M2-04 : 4 — View Transitions natives pour la navigation, utile à F9 ; risque : non interruptible, contredit la reprise par vitesse.
M5-01 : 4 — vocabulaire fermé de huit verbes, bon pour un agent ; risque : F16 et F17 hors verbes, collisions avec les noms Angular et Svelte.
