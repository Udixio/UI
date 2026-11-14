# R18 — M2 : gestes, distances et cascades

Recherche du 5 novembre 2026. Les valeurs ci-dessous sont des propositions de conception à confronter à des prototypes, pas des résultats de tests utilisateurs. Les sources liées sont primaires ; les chiffres Udixio qui ne figurent pas dans ces sources sont explicitement des déductions.

| Point | Proposition | Confiance |
|---|---|---|
| P1 | `spring.default.spatial` par défaut pour le relâchement ; `fast` ou `slow` explicitement selon le contexte | Moyenne pour le choix du token, élevée pour la conservation de vitesse |
| P2 | Conserver 8 / 24 / 64 px comme amplitudes facultatives `sm` / `md` / `lg` | Faible : échelle de travail, non validée empiriquement |
| P3 | 30 / **50** / 100 ms ; plafond de **400 ms sur le dernier départ** | Moyenne pour 50 ms, faible pour les autres chiffres et le plafond |

## P1 — Ressort au relâchement

**Faits.** [M3 Motion](https://m3.material.io/styles/motion/overview/how-it-works) recommande la vitesse `default` pour la plupart des animations, `fast` pour les petits composants et `slow` pour les changements plein écran ; la même page indique aussi que les composants M3 utilisent deux tokens expressifs `fast`. Ces règles décrivent le mouvement en général et les composants M3, pas un défaut spécifique à tous les gestes. Dans les valeurs consignées par R17, `default.spatial` expressif est à damping ratio 0,8 / stiffness 380, contre 0,6 / 800 pour `fast` ; en schéma standard, respectivement 0,9 / 700 et 0,9 / 1400. Le schéma reste global.

[Apple, Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) recommande la réponse continue, l'interruption et la projection de la position à partir de la vitesse pour choisir une destination de geste. [Apple, initialVelocity](https://developer.apple.com/documentation/uikit/uispringtimingparameters/initialvelocity) documente l'initialisation d'un ressort par la vitesse pour assurer une transition fluide. Ces sources ne prescrivent pas les valeurs M3. La vitesse initiale doit être convertie selon les unités et conventions du moteur ; une vitesse mesurée n'est pas nécessairement une vitesse physiquement exacte.

**Déduction / décision proposée.** Choisir `spring.default.spatial` comme repli explicite pour un geste sans réglage : il suit la recommandation générale M3 et est moins rebondissant en Expressive que `fast`, utile pour une feuille ou une carte. Garder `fast` pour un petit contrôle et `slow` pour une surface plein écran, au choix de l'auteur du composant ; ne pas classifier automatiquement par taille mesurée, car les frontières, le contexte et la distance parcourue restent indéfinis. Ce choix ne prouve pas que `default` est universellement meilleur : le traitement tactile et le ressenti doivent être comparés à `fast` sur un petit élément et une feuille.

Conserver la position et, si disponible, la vitesse au relâchement et lors d'une interruption ; une nouvelle prise de contrôle doit pouvoir interrompre le ressort. Destination, bornes et éventuel rebond doivent rester adaptés au composant : préserver la vitesse ne suffit pas à choisir un point d'accrochage. En réduction de mouvement, appliquer directement la destination sans animation de relâchement, tout en conservant le suivi contrôlé par l'utilisateur et la fonctionnalité.

## P2 — Distances

**Faits.** M3 n'établit pas ici d'échelle de distances générique. [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) relie la durée au changement de distance ou de taille ; cela ne valide aucun déplacement en pixels. [WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) est de niveau AAA et demande que les animations de mouvement non essentielles déclenchées par interaction puissent être désactivées ; il ne fixe aucun seuil de distance « sûr ».

**Déduction / décision proposée.** Maintenir `sm: 8px`, `md: 24px`, `lg: 64px` comme trois amplitudes de départ, cohérentes et faciles à comparer, respectivement pour une indication discrète, une entrée ordinaire et une entrée plus marquée. Aucun chiffre ne découle des sources ; `lg` ne doit pas devenir le déplacement automatique de toute grande surface. Ce sont des pixels CSS, et non des pixels physiques ; éviter de les interpréter comme un pourcentage d'écran. Un panneau qui doit partir totalement hors écran nécessite une distance liée à sa géométrie, indépendante de ces tokens d'accent. Adapter direction et amplitude au contexte, y compris RTL, et supprimer la translation non essentielle en réduction de mouvement. La petite amplitude n'est pas une alternative à cette suppression.

## P3 — Cascade

**Faits.** [Atlassian Staggered entrance](https://atlassian.design/components/motion/staggered-entrance/code) documente `delayStep` à 50 ms par défaut pour les groupes d'une entrée. [Motion](https://motion.dev/docs/animate-view) illustre également un pas de 50 ms ; sa [documentation stagger](https://motion.dev/docs/stagger) montre aussi 100 ms. Ce sont un défaut de composant et des exemples, pas des seuils perceptifs validés ni une règle universelle de plafond.

**Déduction / décision proposée.** Adopter `tight: 30ms`, `normal: 50ms`, `loose: 100ms` : 50 ms reprend le défaut documenté d'Atlassian et un exemple Motion ; 30 et 100 ms constituent des variantes exploratoires, 100 ms figurant également dans un exemple Motion. Conserver 400 ms comme budget provisoire de démarrage, sans le présenter comme une exigence issue de ces sources. Pour le rang de cascade `i` à partir de zéro, `delay(i) = min(i × step, 400ms)` : tous les éléments après le plafond démarrent ensemble, conformément à R14 M2-R06. Par exemple, pour 10 éléments à 50 ms, le dernier commence à 400 ms ; la durée totale visible est ce délai **plus** la durée de son animation, pas 400 ms. Une cascade plafonnée peut produire un regroupement final visible : à évaluer contre une compression des délais sur des listes longues, sans changer silencieusement la règle.

Sous réduction de mouvement, supprimer le décalage et afficher les éléments simultanément selon le rendu réduit du verbe. Ne pas retarder l'accès au contenu ou au focus pour l'effet ; tester chargement, ajout, retrait et réordonnancement avec clavier et lecteur d'écran. Le rang visuel proposé en R14 doit être évalué en grille, RTL et contenu dynamique ; la cohérence avec l'ordre de lecture importe plus qu'un effet de vague.

## Validation recommandée

Comparer sur appareils tactiles et souris : petit contrôle, carte glissée et feuille, vitesses de relâchement faibles et fortes, interruption et bornes ; observer dépassement et temps de stabilisation des deux ressorts. Comparer les trois distances sur contenu réel et petits écrans, avec mode réduit. Tester des listes de 3, 8, 10 et 30 éléments aux trois pas, y compris focus immédiat, temps du dernier départ et regroupement au plafond. Ces essais restent nécessaires avant de lever les marqueurs provisoires ; ils ne sont pas réalisés dans cette recherche.
