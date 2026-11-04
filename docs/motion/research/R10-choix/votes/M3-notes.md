M3-01 : 9 — observateur partagé qui porte F4, F21 et F24 ; limite : une instance par couple marge/seuil et un singleton qui touche toutes les îles.
M5-07 : 9 — seul contrat inter-îles sans contexte ; limites : compteur de références (fuite si unmount manqué) et contradiction 23 avec le chargement par page à arbitrer.
M4-03 : 8 — seule règle de sortie observable (retiré = sortie terminée) ; limite : React doit retenir des enfants hors de la source de vérité.
M5-08 : 8 — contrat de contrôle identique WAAPI / JS, `finished` sans rejet ; limites : vitesse seulement pour le numérique, contradictions 6 à 8 sur les springs CSS et l'estimation WAAPI.
M1-04 : 8 — boucle JS unique à phases déclarées, sans thrashing ; limites : une tâche lente retarde toute la page, et la boucle doit vivre dans le singleton.
M1-01 : 7 — décision de moteur natif d'abord, exigée par le cadre ; limites : deux jeux de comportements à aligner et vitesse en interruption contradictoire.
M3-03 : 7 — règle qui résout le piège du cadre (entrée translatée hors écran) ; limites : nœud de plus à produire au SSR, et conflit avec M3-02 et M4-04 à trancher.
M5-09 : 7 — classification par intention, un seul prédicat pour CSS et runtime (F20) ; limites : décoratif contre essentiel reste un jugement, et contradiction 12 avec M4-09.
M2-03 : 7 — FLIP transform seul avec correction des enfants, sans relayout (F7, F8) ; limite : `box-shadow` et `border-width` faux pendant le scale.
M4-10 : 6 — dispose par racine qui retire les abonnements de vue et de frame ; limites : coût par composant et ordre dispose / sortie non tranché.
M3-06 : 6 — couvre les vieux navigateurs de `defaults` sans polyfill ni listener par défaut ; limite : l'effet disparaît sur vieux Chrome.
M4-01 : 6 — noyau sans framework, adaptateurs fins, testable en Node ; limite : la forme du handle diverge de M5-08 (contradiction 15 non résolue).
M1-03 : 6 — reprise à la vitesse courante, utile à un `repeat` ; limites : estimation WAAPI bruitée et exclusion du `scrub`.
M1-02 : 5 — springs compilés en `linear()` pour les tokens F1 ; limites : absent des vieux Chrome de `defaults` et approximation qui ne conserve pas la vitesse.
M5-04 : 5 — Tailwind CSS-first avec élagage natif ; limites : classes dynamiques invisibles au scanner, et surface remplaçable sans toucher au noyau.
M5-01 : 4 — huit verbes avec nature déclarée, utile à la distinction global / instance ; limites : F16 et F17 sans verbe, collisions avec `animate.enter` et `in:` / `out:`.
M2-04 : 4 — VT native pour l'élément partagé et les navigations Astro ; limites : Chromium seul, non interruptible, en contradiction avec M1-03.
M4-07 : 3 — valeurs animées en signal sans re-rendu ; limites : tearing en React et contradiction non résolue avec M1-09 et M3-08.
