# R18 — Décision proposée pour le calibrage

Statut : **choix opérationnels provisoires**, de faible confiance et à calibrer visuellement. Ils sont fondés sur les rapports [M1](M1-engine.md) à [M5](M5-api.md), leur [synthèse](06-synthese.md) et l'analyse du [banc](banc.html), non sur une validation perceptive. Aucun navigateur n'était disponible dans l'environnement de cette évaluation : le banc n'a pas été observé en mouvement. Les sources primaires et leurs limites figurent dans les rapports ; les chiffres ci-dessous ne sont pas des prescriptions Material 3.

| Point | Choix proposé | Motif principal | Confiance |
|---|---|---|---|
| P1 | `spring.default.spatial` pour un retour générique vers une cible ; `fast` ou `slow` explicitement par composant | Repli plus retenu que `fast` en Expressive et adapté à des surfaces différentes | Moyenne pour le rôle ; faible pour le ressenti |
| P2 | `sm` 8, `md` 24, `lg` 64 px CSS ; `md` par défaut | Maintenir l'échelle existante faute de preuve comparative pour changer 64 en 48 | Faible |
| P3 | `tight` 20, `normal` 50, `loose` 100 ms ; délai de départ plafonné individuellement à 400 ms | Pas ordinaire de 50 ms documenté ailleurs ; préserver la décision M2-R06 validée en R14 | Faible pour les chiffres et le plafond |

## P1 — Ressort de relâchement

Choisir `default.spatial` comme repli d'un **retour vers une cible**, en respectant le schéma global Standard ou Expressive. En Expressive, R17 relève `default` à amortissement 0,8 et raideur 380, contre 0,6 et 800 pour `fast`. Cela motive un compromis moins rebondissant à vitesse initiale nulle, mais ne démontre pas un meilleur ressenti ni ne borne le dépassement avec vitesse initiale. Un contrôle compact peut choisir `fast`, une surface plein écran `slow` ; cette décision appartient au composant, sans seuil automatique de taille. Le choix `fast` universel avantagerait la vivacité des petits contrôles mais extrapolerait leur comportement aux panneaux ; le choix systématique par taille introduirait des seuils non établis.

Préserver la position et, lorsqu'elle est disponible, la vitesse au raccord et à l'interruption, après conversion selon les unités du moteur ; traiter séparément une distance restante nulle. La cible et les bornes restent propres au composant. Une inertie libre suivie éventuellement d'un ressort n'est pas équivalente à ce retour. En mouvement réduit, conserver le suivi directement contrôlé et les alternatives d'interaction, puis appliquer immédiatement la cible sans rebond non essentiel.

## P2 — Distances

Conserver 8 / 24 / 64 px CSS comme amplitudes de départ : `sm` discret, `md` courant, `lg` accent explicite. L'alternative 8 / 24 / 48 réduit l'amplitude maximale, mais les rapports ne fournissent pas de comparaison perceptive permettant de préférer 48 à 64. Le maintien évite donc un changement arbitraire ; il ne prouve pas que 64 est optimal. Aucune amplitude ne doit être déduite automatiquement de la taille de la surface. Une entrée entièrement depuis un bord exige une distance calculée selon la géométrie, non nécessairement `lg`.

La distance seule ne rend pas un mouvement accessible. Supprimer les translations non essentielles selon la politique de mouvement réduit ; ne pas substituer simplement 8 px. [WCAG 2.2 2.3.3](https://www.w3.org/TR/WCAG22/#animation-from-interactions) est un critère AAA concernant la désactivation des animations de mouvement non essentielles déclenchées par interaction ; il ne définit aucun seuil sûr en pixels.

## P3 — Cascade et budget

Choisir 20 / 50 / 100 ms : 20 pour les séquences denses, 50 comme défaut et 100 pour les petits groupes expressifs. Les exemples Carbon à 20 ms et Motion à 50 ou 100 ms, ainsi que le défaut Atlassian à 50 ms cités par M1 et M2, établissent des précédents, pas une validation de cette échelle. L'échelle actuelle 30 / 60 / 120 conserve un précédent Udixio et offre davantage de séparation ; elle prolonge aussi la cascade, sans preuve que cette séparation supplémentaire soit utile. Les deux restent à comparer dans des contenus réels.

Interpréter **400 ms comme le plafond des délais de départ**, délai initial exclu. Pour un rang visuel normalisé `r` depuis zéro, appliquer `min(r × pasToken, 400 ms)` ; les derniers éléments atteignant le plafond démarrent ensemble. Pour une origine centrale, les éléments équidistants partagent le même rang. Pour 10 éléments, origine premier, pas 50 ms : les rangs 8 et 9 partent à 400 ms et, pour une durée de 300 ms, la dernière fin intervient **700 ms** après le premier départ. Un délai initial s'ajoute à ces temps. La compression uniforme envisagée en R18 est écartée : elle modifierait le pas de tous les départs et contredirait le plafonnement individuel M2-R06 déjà validé en R14.

La **dernière fin n'est pas bornée** par ce plafond de départ. Un budget de fin serait une contrainte distincte : avec des enfants de 300 ms et sans délai initial, seuls 100 ms resteraient pour les départs dans un budget total de 400 ms. Si un budget de fin ne peut contenir durée et délai initial, adapter la durée ou synchroniser les éléments ; le plafonnement des seuls départs ne peut garantir ce budget. Ne pas retarder l'accès au contenu ou au focus pour la chorégraphie ; en mouvement réduit, supprimer les délais décoratifs et présenter immédiatement le rendu réduit.

## Ce que le banc démontre et ce qui reste à valider

Le code du banc compare deux solutions de ressort à masse 1 avec vitesses prédéfinies, quatre distances sur 300 ms et six pas de cascade. Il calcule les délais théoriques pour 1, 4, 10 ou 50 éléments, trois origines et des plafonds de départ ou de fin. Ces calculs rendent les conséquences des budgets examinables ; ils ne mesurent ni les temps réellement rendus ni une préférence humaine. Les surfaces du banc changent la taille d'un objet dans une piste, pas le comportement d'un vrai contrôle ou panneau. Le relancement repart du début ; il ne teste ni geste réel, ni inertie, ni conservation de vitesse à l'interruption. Les animations de distance et cascade utilisent des conditions de laboratoire, et non nécessairement les moteurs de production. Le banc prévoit une prise en compte de `prefers-reduced-motion`, mais son fonctionnement n'a pas été vérifié ici dans un navigateur.

Avant de considérer ces choix comme validés, comparer sur composants et appareils réels :

1. `fast` et `default` sur contrôle, carte et sheet, avec vitesses nulle, faible, forte et inversée, changements de cible, interruption et bornes ; distinguer snap et inertie.
2. 8 / 24 / 48 / 64 px avec contenus réels, petits écrans et zoom, puis mouvement réduit et absence de JavaScript.
3. Les deux échelles de stagger pour 1, 4, 10 et 50 éléments, origines premier / dernier / centre ; relever les départs et fins réellement rendus, l'ordre visuel et la disponibilité immédiate du contenu et du focus.
4. Vérifier les navigateurs pris en charge, un appareil modeste, clavier et lecteur d'écran ; recueillir les retours de personnes sensibles au mouvement. Une démonstration ou préférence individuelle ne suffit pas à établir une conformité d'accessibilité ou une validation utilisateur générale.
