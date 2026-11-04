# M1 — Annotations des choix M2 à M5 (moteur et rendu)

## Annotations

- M2-01 : valide — +résolution inter-îles par symbole versionné, sans contexte partagé / −deux copies sans version = deux registres ; clés en collision ; conflits: M2-07
- M2-02 : valide — +une lecture groupée puis une écriture, coût fixe par frame / −une instance lente retarde toutes les autres ; conflits: M2-04
- M2-03 : valide — +transform seul, enfants corrigés par variables : pas de relayout / −box-shadow et border-width faux pendant le scale ; conflits: M2-09
- M2-04 : conteste — +zéro JS par frame quand la VT existe / −une seule VT active, non interruptible en vol : la reprise doit être refusée, pas simulée ; conflits: M2-02, M2-08
- M2-05 : valide — +le nœud réel garde focus et refs / −reste dans le flux pendant la sortie ; conflits: M2-06
- M2-06 : neutre — +voisins glissent avant la fin de la sortie / −largeur perdue sous flex et grid, mesure préalable par suppression ; conflits: M2-05
- M2-07 : valide — +borne mesure, retarget et nettoyage ; collisions cantonnées / −un scope mal placé isole sans erreur ; un scope par ligne multiplie les observateurs ; conflits: M2-01
- M2-08 : valide — +reprise depuis la transformation rendue, sans saut / −lire la position force un recalcul de style ; conflits: M2-04
- M2-09 : neutre — +taille animée sans scale : texte net / −le repli relayout à chaque image ; taille fausse si le contenu change ; conflits: M2-03
- M2-10 : neutre — +geste en transform, sans relayout / −voisins mesurés une fois au départ : scroll pendant le drag donne des valeurs fausses ; conflits: M2-08
- M3-01 : valide — +coût constant par seuil, état publié et non animation / −un bug du singleton touche toutes les îles ; conflits: —
- M3-02 : conteste — +contenu visible sans JS, pas de masquage orphelin / −clignotement avant inscription ; pose l'état d'entrée en JS, contre M4-04 en CSS ; conflits: M4-04
- M3-03 : valide — +une transformée n'empêche plus l'intersection / −un nœud de plus à produire au SSR ; à tester en grille ou flex ; conflits: —
- M3-04 : conteste — +retrait DOM libère l'inscription sans observateur / −impose un élément personnalisé ; une classe Tailwind ne peut pas inscrire ; conflits: M5-02, M5-04
- M3-05 : valide — +chaque intention a son repli logique, typage refuse le mélange / −deux notions à apprendre ; hors Chromium, `once` passe par IntersectionObserver ; conflits: M5-01
- M3-06 : valide — +zéro JS et zéro listener sur navigateurs à timeline / −vieux Chrome de `defaults` : l'effet disparaît au lieu d'être approché ; conflits: —
- M3-07 : valide — +natif préservé, aucune boucle rAF permanente / −durée du smooth natif non réglable ; conflits: —
- M3-08 : neutre — +une passe par frame quel que soit le nombre d'éléments / −`@property` requis ; le repli écrit des styles ; chevauche M1-09 ; conflits: M3-06
- M3-09 : valide — +pause hors-vue à coût nul, un seul listener / −une présence figée retarde sa promesse de fin ; conflits: M3-01
- M3-10 : neutre — +une île ne résout jamais le nom d'une voisine / −une règle de scope de plus, noms générés au build ; conflits: M5-03
- M4-01 : valide — +logique testable en Node sans DOM / −trois surfaces à aligner ; la forme du handle diverge de M5-08 ; conflits: M5-08
- M4-02 : valide — +idempotence sous StrictMode et réattachement / −un WeakMap par copie de module casse l'idempotence entre îles ; conflits: M4-05
- M4-03 : valide — +règle observable unique : retiré = sortie terminée / −un parent démonté doit retirer le nœud retenu sans attendre ; conflits: M4-10
- M4-04 : valide — +aucun flash ni décalage à l'hydratation / −@starting-style absent de vieux Chrome : deux chemins à tester ; conflits: M3-02, M4-06
- M4-05 : conteste — +layoutId et boucle partagés entre îles / −trois clés `Symbol.for` différentes pour un même registre (M2-01, M4-05, M5-07) ; conflits: M4-02, M5-07
- M4-06 : neutre — +contourne l'auto-désarmement, pas de rattrapage brutal / −sentinelle à ajouter au DOM ; stagger délicat sur plusieurs sentinelles ; conflits: M4-04
- M4-07 : valide — +60 fps sans cycle de détection de changements / −tearing possible en React si lu au rendu ; signal inerte sans lecture ; conflits: M1-09 (chevauchement)
- M4-08 : valide — +statut explicite, aucun rejet au démontage / −statut obligatoire ; handle non recréé au remontage ; conflits: M5-08 (doublon)
- M4-09 : valide — +un seul point de vérité, relayé entre îles / −chaque île lit `matchMedia` sans registre partagé ; conflits: M5-09 (complémentaire, pas opposé)
- M4-10 : valide — +fuite impossible par oubli, un seul appel de nettoyage / −`transition:persist` garde l'île vivante : ne pas disposer au swap ; conflits: M4-03, M4-02
- M5-01 : neutre — +un seul mot-clé pour humain et agent, verbe impose la coordination / −F16 et F17 ne rentrent pas ; `sequence` porte seul F11 ; conflits: M3-05
- M5-02 : valide — +parseur exécutable au build, fautes remontées tôt / −grammaire à maintenir ; pas de valeurs riches en classe ; conflits: M3-04
- M5-03 : conteste — +springs en `linear()` sans solveur à l'exécution / −compilé au build, contre runtime en M1-02 ; ne conserve pas la vitesse ; conflits: M1-02, M5-08
- M5-04 : valide — +zéro JS pour tout ce qui est CSS, élagage natif / −classes construites dynamiquement invisibles au scanner ; conflits: M5-09, M3-04
- M5-05 : valide — +pages statiques sans JS d'animation, chargement par île / −analyse statique rate les usages dynamiques ; conflits: M5-07
- M5-06 : valide — +coût lisible et tree-shaking vérifié en CI / −sous-chemins nombreux ; une entrée qui en tire une autre duplique du code ; conflits: M5-07
- M5-07 : valide — +une passe DOM quel que soit le nombre d'îles / −compteur de références : fuite si un unmount est manqué ; conflits: M4-05, M5-05
- M5-08 : valide — +contrat de contrôle identique, `finished` sans rejet / −vitesse conservée seulement pour le numérique ; `commitStyles` à trancher ; conflits: M5-03, M4-01
- M5-09 : valide — +classification faite une fois, lint possible / −décoratif contre essentiel reste subjectif ; deux implémentations à garder identiques ; conflits: M5-04
- M5-10 : neutre — +un agent apprend le vocabulaire sans lire le code / −dérive si non régénéré en CI ; manifeste long pour le contexte ; conflits: M5-01, M5-06

## Doublons à fusionner

- Identité layoutId sur registre global : garder M2-01 ; fusionner M1-07.
- Runtime singleton inter-îles : garder M5-07 ; fusionner M4-05 (une seule clé `Symbol.for` à retenir, les trois actuelles sont à unifier).
- Scheduler lecture/écriture par page : garder M2-02 ; fusionner M1-04.
- FLIP en transform seul : garder M2-03 ; fusionner M1-06.
- Reprise depuis la vitesse ou la position rendue : garder M1-03 ; fusionner M2-08 et la clause de reprise de M5-08.
- Sortie qui reste jusqu'à `finished` : garder M4-03 ; fusionner M2-05 (inert et aria-hidden).
- Repli scroll sans timeline native : garder M3-06 ; fusionner M1-08.
- Sentinelle de déclenchement : garder M3-03 ; fusionner M4-06 (règle d'hydratation). M3-01 reste distinct (observateur partagé).
- Pause hors-vue : garder M3-09 ; reprendre la clause de pause de M4-06.
- Réduction de mouvement en store : garder M4-09 ; fusionner M1-10. M5-09 reste séparé (classification par intention).
- Handle et statut `finished` : garder M5-08 ; fusionner le statut de M4-08. M4-01 garde l'adaptateur mais aligne sa forme sur M5-08.
- Séquence compilée : garder M1-05 ; M4-08 ne garde que la liaison framework.
- Ressort en `linear()` : garder M1-02 pour la compilation ; M5-03 ne garde que l'émission des tokens.
- Nom « scope » utilisé deux fois : M2-07 (portée de layout) et M4-10 (nettoyage). Ce ne sont pas des doublons, mais le nom est à désambiguïser.
- Écriture directe dans le DOM : M1-09, M4-07 et M3-08 se chevauchent. Non fusionnés, à arbitrer ensemble.
