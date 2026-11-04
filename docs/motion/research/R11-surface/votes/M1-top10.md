# M1 — Top 10 surface d'écriture (R11, étape 3)

M5-S01 — Attributs = références, objets = définitions : une seule grammaire d'attribut, aucune valeur libre, base de F1 à F4.
M5-S07 — Parité en cinq formes (`data-motion`, `useMotion`, `udxMotion`, attachment, noyau) : seul moyen de tenir les quatre environnements alignés.
M4-S04 — Définitions nommées typées : une spec réutilisée par îles et frameworks, seule surface de F14 et F15 (lecture par signal), variantes `at:` pour F19.
M5-S02 — Quinze verbes couvrant F1 à F24 : seul vocabulaire qui nomme toutes les familles ; `scroll` y reste pour F6 (contesté).
M5-S08 — Continuité `carry` ou `restart` avec source de vitesse visible : seul contrat de reprise sans dégradation silencieuse (F2, F12, F13, F18).
M5-S09 — Boucles et suivis abonnés à l'horloge partagée : une boucle par page, pause et réduction uniformes (F5, F14, F21, F24).
M5-S10 — Garde-fous à quatre niveaux depuis une source unique : seule réponse à l'exigence de vérification du cadre (F21, F22, F23).
M5-S04 — Tailwind limité aux tokens et aux états : seule place de Tailwind compatible avec les acquis, consensus 5 sur 5.
M2-S01 — `layout(el, mutate)` explicite : seule entrée de F7, avec l'appel oublié détecté par M5-S10.
M1-S10 — VT nommée au premier attach, jamais en vol : seule couverture de F8 et F9.

Contradictions retenues : M1-S10 ↔ M5-S08 (VT non interruptible : `carry` refusé pendant une VT, à expliciter). Écartés pour éviter les contradictions 9, 10, 13, 15 et 17 : M2-S03, M4-S02, M3-S01, M1-S07, M4-S09. M5-S02 ↔ M3-S02 non retenu : F6 garde le verbe `scroll`.
Non couverts ou faibles : F10 et F11 sans mécanisme de liste ni de présence retenu (M2-S04, M3-S09 écartés) ; F16 et F17 seulement par des verbes ; F18 sans primitive de réordonnancement ; F19 partiel.
