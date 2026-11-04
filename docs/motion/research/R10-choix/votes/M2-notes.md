M5-07 : 9 — singleton versionné : sans lui, chaque île crée sa boucle et son scan ; le compteur de références reste un risque de fuite à tester.
M1-04 : 8 — frame lecture/écriture : indispensable au FLIP sans thrashing ; retenu de préférence à M2-02, mais une copie par île reste une boucle sans registre.
M4-03 : 9 — présence jusqu'à finished : contrat de sortie unique pour F3, F10, F11 ; conflits ouverts avec M3-09 (pause hors-vue) et M4-10 (ordre dispose / sortie).
M5-08 : 7 — handle unique avec finished sans rejet : contrat nécessaire, mais forme contestée (M4-01 diverge) et vitesse non transmise aux springs CSS.
M5-09 : 6 — intention essential / decorative par token : exigence F20 réelle, mais jugement subjectif et contradiction ouverte avec le store blanket de M4-09.
M1-01 : 6 — backend par animation, natif d'abord : aligne la préférence native du cadre, mais deux moteurs à tester et WAAPI ne transporte pas la vitesse.
M3-03 : 7 — sentinelle sans transform : seule solution propre pour déclencher une entrée translatée (F4) ; coût d'un nœud de plus au SSR.
M2-03 : 9 — FLIP transform seul avec correction d'enfants : fondation du layout (F7, F8), compositor, texte net ; limites connues (box-shadow, transforms enfants).
M4-10 : 8 — scope par racine disposé au démontage et à astro:before-swap : évite les fuites et tient compte de transition:persist ; ordre avec les sorties à fixer.
M1-03 : 7 — transfert de vitesse à l'interruption : condition de F2, F13, F18 ; l'estimation WAAPI est bruitée et dépend de M1-01.
M1-02 : 4 — ressort en linear() : approximation sans vitesse à la reprise, repli JS obligatoire sur vieux Chrome, contradiction de compilation avec M5-03.
M3-06 : 5 — repli scroll-linked statique par défaut : respecte le « pas de polyfill », mais l'effet disparaît sur vieux Chrome et ajoute un point de décision.
M5-01 : 4 — huit verbes d'intention : vocabulaire utile aux agents, mais collisions avec animate.enter / leave et Svelte in: / out:, F16 et F17 non couverts.
M5-04 : 4 — plugin Tailwind v4 CSS-first : répond à la préférence Tailwind, mais contredit M3-04 (une classe ne peut pas inscrire) et exige la réduction de mouvement en CSS.
M4-07 : 3 — valeurs animées en signal ou store : utile à F14, mais tearing possible en React et chevauchement non tranché avec M1-09.
M3-01 : 5 — observateur de visibilité partagé : publie un état hors-vue utile à la pause et à la présence, mais un singleton par couple marge/seuil contredit M4-06.
M4-01 : 6 — noyau pur sans framework et adaptateurs fins : indispensable au multi-framework et testable en Node ; trois surfaces à aligner et handle à unifier avec M5-08.
M2-04 : 5 — View Transitions natives pour l'élément partagé : zéro JS et navigation cross-document Astro, mais Chromium seul pour le scoped et non interruptible, donc incompatible avec M1-03.
