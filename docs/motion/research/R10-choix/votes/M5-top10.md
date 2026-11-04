# M5 — Top 10 (étape 3)
M5-07 — Registre `globalThis` unique (4 voix) : seul moyen de partager boucle et `layoutId` entre îles Astro sans contexte partagé.
M1-04 — Frame unique lecture puis écriture (4 voix) : coût fixe par page, requis par F7, F10, F14 et F21.
M4-01 — Noyau sans framework, adaptateurs fins : logique testable en Node, trois surfaces idiomatiques.
M5-08 — Handle unique, `finished` sans rejet : même contrôle WAAPI ou JS pour F12/F13, un `await` partout.
M1-02 — Ressort en `linear()` et tokens émis une fois : seule couverture de F1 dans ce top.
M2-03 — FLIP en transform seul, correction par variables (5 voix sur 5) : F7 et F8 sans relayout.
M4-03 — Présence jusqu'à `finished` : F3 suit une règle observable unique dans React, Angular et Svelte.
M3-03 — Sentinelle sans transformée : résout le désarmement de F4 ; suppose M3-01, non retenu.
M5-09 — Réduction de mouvement par intention : préféré à M4-09, dont le mode « blanket » est contredit ; le store de M4-09 en est l'implémentation.
M2-04 — View Transitions natives : seule voie retenue pour F9 (Astro), zéro JS par frame.
Tensions : M1-02 ne transporte pas la vitesse (contredit M5-08) ; M2-04 n'est pas interruptible, le handle doit renvoyer `cancelled` ; M4-01 doit aligner son handle sur M5-08.
