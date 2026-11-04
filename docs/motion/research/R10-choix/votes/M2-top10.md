M5-07 — singleton versionné avec compteur : seul moyen de partager boucle et layoutId entre îles sans contexte partagé.
M1-04 — une lecture groupée puis une écriture par frame : socle anti-thrashing de tout FLIP et du suivi F14.
M2-03 — FLIP en transform seul, enfants corrigés par variables : 5/5 experts, compositor, texte net ; M2-09 exclu (contredit, cf. contradiction 21).
M4-03 — la présence retient le nœud jusqu'à finished : contrat simple et unique pour F3, F10, F11 ; M3-09 à caler sur ce contrat (contradiction 13).
M3-03 — sentinelle sans transform : seule façon robuste de déclencher une entrée translatée ; 5/5 experts.
M1-03 — reprise à la vitesse courante : condition de toute interruption sans saut (F2, F13, F18) ; couvre la limite WAAPI de M1-01.
M5-08 — handle unique avec finished sans rejet : même contrat de contrôle pour WAAPI et JS ; M4-01 à aligner (contradiction 15).
M5-09 — intention essential / decorative par token : réponse F20 par famille ; M4-09 exclu car blanket, contradictoire (contradiction 12) ; son store reste un détail d'implémentation.
M4-10 — scope par racine disposé au démontage et à astro:before-swap : fuites et transition:persist ; ordre dispose / sortie à fixer.
M1-01 — backend choisi par animation, natif d'abord : colle à la préférence native du cadre ; la vitesse WAAPI est couverte par M1-03.
