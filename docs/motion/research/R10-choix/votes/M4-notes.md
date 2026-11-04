M5-07 : 9 — cœur de l'hypothèse îles : sans registre versionné, deux îles hydratées à des moments différents ne partagent ni boucle, ni identité, ni observateur ; limite (compteur de références) gérable.
M1-04 : 8 — frame unique lecture/écriture : coût fixe par page pour toutes les familles JS ; la limite « une copie = une boucle » est résolue par M5-07.
M4-03 : 8 — sans nœud retenu jusqu'à `finished`, aucune sortie propre (F3, F10, F11) ; coût réel côté React (enfants retenus hors source de vérité), mais indispensable.
M5-08 : 8 — contrat `finished` sans rejet commun aux trois frameworks et aux deux moteurs ; écart de forme de handle avec M4-01 à trancher, sinon bloquant pour les adaptateurs.
M5-09 : 8 — réduction de mouvement exigée (F20) ; la classification par intention est la seule règle qui tient WCAG 2.2.2 sans logique par composant, malgré le jugement subjectif.
M1-01 : 7 — décide quel moteur anime chaque animation et applique la préférence natif d'abord ; deux moteurs à aligner, et contradictions ouvertes avec la vitesse (#8, #10).
M3-03 : 7 — corrige le piège d'auto-désarmement de F4 ; dépend de M3-01 et ajoute un nœud à produire identique en SSR.
M5-01 : 7 — vocabulaire unique pour humain et agent, aucun autre choix ne donne une seule façon d'écrire ; ne couvre ni F16 ni F17 et `enter`/`exit` entrent en collision avec les API natives.
M4-10 : 7 — nettoyage garanti par racine (retour d'effet React, DestroyRef, astro:before-swap) ; sans lui les fuites d'îles et d'effets sont la règle.
M5-04 : 7 — respecte la préférence Tailwind et l'objectif zéro JS ; limité par les classes dynamiques et par l'impossibilité d'inscrire un élément `udx-view`.
M1-03 : 6 — la reprise par vitesse rend les interruptions propres ; estimation WAAPI bruitée et vitesse absente des springs CSS.
M1-02 : 6 — un seul calcul de ressort pour tokens et CSS ; table approximative, repli JS obligatoire sur vieux Chrome, reprise en vol sans vitesse.
M2-03 : 6 — FLIP au compositeur sans relayout, enfants corrigés par variables ; box-shadow faux pendant le scale et réécriture de style du parent qui efface les variables.
M3-01 : 6 — observateur partagé utile à F4 et F21 et prérequis de M3-03 ; un singleton par couple marge/seuil fragile entre îles sans registre.
M4-01 : 6 — noyau pur testable en Node, adaptateurs fins, idiomatique par framework ; trois surfaces à aligner et handle divergent de M5-08.
M4-07 : 5 — seul choix couvrant F14 et F15 sans re-rendu côté adaptateur ; risque de tearing React, signal inerte sans lecture, et conflit ouvert avec M1-09.
M2-04 : 5 — seul choix pour F9 et les navigations Astro natives ; Chromium seul, non interruptible, et contradiction directe avec le retarget.
M3-06 : 4 — repli JS opt-in conforme à « ne charger que ce qui est utilisé » ; effet absent sur vieux Chrome et cas d'usage étroit.
