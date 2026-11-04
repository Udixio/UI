# M3 — Top 10 (registre consolidé)

M1-01 — backend natif d'abord par animation : fonde le choix WAAPI / JS que le cadre exige (natif quand il existe) et que tous les autres moteurs supposent.
M1-04 — frame unique lecture puis écriture : seule boucle JS de la page, sans thrashing ; elle se range dans le singleton M5-07.
M5-07 — singleton versionné sur globalThis : seul contrat inter-îles Astro sans contexte ; doublons M1-07, M2-01, M4-05 absorbés, compteur de références à tenir.
M3-01 — observateur de visibilité partagé : état publié, base de F4 et F21 ; intègre la règle sentinelle de M3-03 (observer une sentinelle, pas la cible animée).
M3-06 — scroll-linked natif, repli statique, JS nommé : couvre les vieux navigateurs de `defaults` sans polyfill global ni listener par défaut ; remplace M1-08.
M4-03 — présence jusqu'à `finished` : seule règle de sortie observable pour F3, F10, F11 ; s'appuie sur le statut de M5-08.
M2-03 — FLIP en transform seul avec correction d'échelle : F7 et F8 sans relayout ; M1-06 absorbé.
M5-08 — MotionHandle unique, `finished` sans rejet : contrat de contrôle identique WAAPI / JS, base de F12 et de la reprise de M1-03.
M5-01 — huit verbes fermés, nature déclarée par verbe : seul choix qui porte la distinction global / instance du cadre dans l'API ; la distinction scrub / once de M3-05 y est à absorber (`track` / `reveal`).
M5-09 — réduction de mouvement classée par intention : F20 traité par donnée, un seul prédicat pour CSS et runtime ; retenu contre M4-09 (store « blanket », contradiction 12).

Écartés : M3-03 (absorbé par M3-01), M3-09 (onglet caché couvert par M1-04, hors-vue à rattacher à M3-01), M1-08 (contredit M3-06), M4-09 (contredit M5-09), M3-04 (contredit M5-04 et M5-02, contesté par M1 et M4), M5-04 (surface Tailwind, remplaçable sans toucher au noyau ; préférence du cadre marquée contestable).
Contradictions ouvertes parmi les dix : M5-08 contre M1-01 (vitesse estimée en WAAPI, à documenter comme approximation) ; M5-01 contre M4 (`enter` / `exit` en collision avec `animate.enter` d'Angular et `in:` / `out:` de Svelte, à trancher).
