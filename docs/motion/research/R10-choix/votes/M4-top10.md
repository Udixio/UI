# M4 — Top 10
M5-07 — registre inter-îles versionné : seul moyen de partager boucle, identités et observateurs entre îles Astro sans contexte partagé.
M1-01 — backend choisi par animation, WAAPI d'abord : tient la préférence natif d'abord et l'état SSR en CSS, JS seulement si la vitesse est exigée.
M1-04 — frame unique lecture/écriture : coût fixe par page, pas de thrashing entre trois frameworks ; sert de scheduler au registre.
M5-08 — MotionHandle unique, `finished` sans rejet : un seul contrat `await` / ref / attachment pour React, Angular et Svelte.
M4-03 — nœud retenu jusqu'à `finished` : sortie compatible StrictMode, `animate.leave` et `out:`, sans clone ni fantôme.
M3-03 — sentinelle sans transformée : déclenchement à la vue qui ne se désarme pas, indispensable aux entrées de F4.
M5-09 — réduction classée par intention : règle unique qui satisfait WCAG 2.2.2 pour F24 sans logique par composant.
M5-04 — plugin Tailwind v4 CSS-first : préférence Tailwind du cadre, zéro JS pour l'essentiel, classes rendues en SSR = état final.
M5-01 — vocabulaire fermé de huit verbes : une seule façon d'écrire pour humain et agent ; renommer `enter`/`exit` (collision avec `animate.enter` et `in:`/`out:`).
M4-07 — valeurs réactives en signal ou store : seule option couvrant F14 et F15 sans re-rendu, compatible zoneless ; préférée à M1-09 (collisions de style inline).
Contradictions écartées : M4-09 contre M5-09 (#12) → M5-09 ; M1-09 contre M4-07 (#22) → M4-07 ; M5-05 contre M5-07 (#23) → M5-07 seul ; M3-04 et M5-02 contre M5-04 (#19, #20) → M5-04 seul.
Réserves : M5-08 contre M4-01 (#15) → forme du handle à aligner (ajouter `dispose` ou l'omettre), M4-01 non retenu ; M1-01 contre M2-04 (#10) → M2-04 écarté, donc F9 non couvert.
Dépendance et non-couverture : M3-03 suppose M3-01 ; F6 (seul M3-07), F16 (aucun), F19 (M5-06 recommandé en onzième) ne sont pas couverts.
