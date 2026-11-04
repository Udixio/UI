# M1 — Top 10 (étape 3)

M1-01 — Routage natif ou JS explicite par animation : c'est la colonne vertébrale, et elle tranche WAAPI contre JS pour tous les autres choix.
M1-02 — Ressort en `linear()` compilé : couvre F1, F13 et F18 sans JS par frame ; la contradiction avec M5-08 sur la vitesse est levée par le routage de M1-01.
M1-03 — Reprise par transfert de vitesse : consensus 4 sur 4, base de F12, F13 et F18 ; M2-04 est exclu car sa VT n'est pas interruptible.
M1-04 — Frame unique à phases lecture puis écriture : consensus 4 sur 5, coût fixe par page et prérequis du partage entre îles.
M5-07 — Singleton inter-îles versionné sur `globalThis` : seule clé retenue, les trois clés concurrentes (M2-01, M4-05, M1-07) sont fusionnées.
M5-08 — Handle unique avec `finished` qui ne rejette jamais : contrat de contrôle prérequis de F12 et de l'interruption.
M4-03 — Présence jusqu'à `finished` : règle observable unique pour F3, F10 et F11.
M5-09 — Réduction de mouvement classée par intention : retient M5-09 et non le blanket de M4-09 (contradiction n° 12).
M3-03 — Sentinelle sans transformée : évite l'auto-désarmement de F4, consensus 5 sur 5.
M3-06 — Repli scroll statique par défaut, JS nommé : pas de polyfill, zéro coût sur navigateurs à timeline ; couvre F5.

Contradictions : seule M1-02 ↔ M5-08 (vitesse) est gardée, levée par le routage de M1-01 ; les paires M2-04 ↔ M2-08, M4-09 ↔ M5-09, M3-09 ↔ M4-03 sont évitées en ne retenant qu'un côté.
Non couverts par ce top 10 : F6 (M3-07), F9 (M2-04), F14 et F15 (M4-07), F16, F19 (M4-10), F22 (M5-06), F23 (M5-10).
