# R10 — Registre de choix de conception pour @udixio/motion

Consolidation neutre de `M1-choix.md` à `M5-choix.md` (50 choix) et de `M1-annotations.md` à `M5-annotations.md` (5 × 40 annotations). Le fond n'est ni ajouté, ni retiré, ni reformulé ; les seuls textes produits sont les libellés de section, les résumés de variantes des groupes fusionnés et l'énoncé des décisions de groupe.

**Bilan** : 38 choix conservés (12 ids gardés + 26 non fusionnés), 12 groupes de doublons retenus (12 ids fusionnés), 3 doublons proposés non retenus, 23 contradictions (17 ouvertes, 6 couvertes par une fusion retenue).

**Règles appliquées**
- Groupe de doublons : retenu si au moins 2 experts l'ont proposé dans leur section « Doublons à fusionner ». Id gardé : majorité des experts proposeurs ; égalité : id le plus anciennement numéroté (ordre M1 < M2 < … < M5), signalée.
- Énoncé / Familles / Nature : repris tels quels du choix gardé.
- Avantages / Limites : texte original du choix, suivi des points ajoutés en annotation, préfixés par l'expert (`[Mx]`).
- Conflits : union dédupliquée (champ d'origine + champs « conflits: » des annotations), hors id du bloc et ids fusionnés dans ce bloc.
- Verdicts : annotations reçues par l'id conservé (une par expert autre que l'auteur, soit 4 par choix). Le décompte d'un id fusionné figure dans sa ligne « variantes ».
- Section 3 : paires dont l'annotation énonce explicitement une incompatibilité (« contredit », « contre », « ne transporte pas », « à trancher », etc.). Les simples champs « conflits: » ne sont pas listés là ; ils figurent dans le champ Conflits de chaque bloc.
- Tag `[fusionne : … · Gx]` : ids fusionnés dans ce bloc et groupe d'origine ; « (égalité) » ou « (proposé) » signalent une décision particulière.

---

## 1. Groupes de doublons

### 1.1 Groupes retenus (12)

1. **G1 — Registre inter-îles versionné sur `globalThis`.** Proposé par M1 (deux variantes), M2, M3, M4, M5 (5 experts). Garder **M5-07** : M2, M3, M4 et M1 (variante runtime), soit 4 voix. Autres ids gardés proposés : M2-01 (M1, variante layoutId), M4-05 (M5). Fusionnés : M1-07, M2-01, M4-05.
2. **G2 — Scheduler lecture/écriture par page.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M1-04** : M2, M3, M4, M5 (4 voix) ; M2-02 : M1 (1 voix). Fusionné : M2-02. Proposé par M3 seul et non retenu : M3-08 (rAF de repli).
3. **G3 — FLIP en transform seul.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M2-03** (5 voix sur 5). Fusionné : M1-06.
4. **G4 — Sortie : nœud réel retenu jusqu'à `finished`.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M4-03** : M1, M2, M3, M5 (4 voix) ; M2-05 : M4 (1 voix). Fusionné : M2-05.
5. **G5 — Déclenchement à la vue par sentinelle.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M3-03** (5 voix : M1, M2, M4 seuls ; M3 et M5 le gardent aussi avec M3-01). Fusionné : M4-06 (M3 le répartit entre M3-02 et M3-09). M3-01 n'est fusionné par personne : M1 et M4 le disent « distinct » ; M3 et M5 le gardent à côté de M3-03.
6. **G6 — Pause hors-vue.** Proposé par M1 et M5 (2 experts) ; M3 répartit aussi la clause de pause de M4-06 vers M3-09. Garder **M3-09** (2 voix sur 2). Fusionnés : clause de pause de M4-06 (M1), partie « onglet caché » de M1-04 (M5). M4-06 est déjà fusionné en G5 ; M1-04 reste retenu en G2.
7. **G7 — Réduction de mouvement.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M4-09** : M1, M2, M5 (3 voix) ; M5-09 : M3, M4 (2 voix). Fusionné : M1-10 (M1, M2, M3, M5 ; M4 le juge « conflit de fond, pas doublon »). Fusion partielle de M5-09 (champ `intent` : M2 ; classification : M5) non retenue à la majorité : M1, M3 et M4 le gardent séparé.
8. **G8 — Handle et statut `finished`.** Proposé par M1, M2, M3, M4, M5 (5). Garder **M5-08** : M1, M2, M3, M4 (4 voix) ; M4-01 : M5 (1 voix). Fusionné : statut de M4-08 (M1, M2, M3, M4). M4-01 non fusionné à la majorité : aligné sur M5-08 (M1, M2), gardé comme id (M5), listé dans le groupe (M3). M1-05 non fusionné à la majorité : implémentation (M2), partie handle (M4), séparé (M1, M3, M5).
9. **G9 — Séquence compilée.** Proposé par M1 et M5 (2). Garder **M1-05** (M1) ou **M4-08** (M5) : **égalité 1–1**, tranchée par ordre de numérotation en faveur de M1-05. Fusionné : M4-08 (M5 ; M1 ne garde à M4-08 que la liaison framework). Recouvre G8 sur M4-08.
10. **G10 — Reprise depuis la vitesse ou la position rendue.** Proposé par M1, M4, M5 (3). Garder **M1-03** (3 voix sur 3). Fusionnés : M2-08 (M1, M4 ; M5 le garde limité au layout) ; clause de reprise de M5-08 (M1, M5).
11. **G11 — Ressort en `linear()`.** Proposé par M1, M2, M3, M4, M5 (5 ; M2 signale « à trancher » et donne son avis pour M5-03). Garder **M1-02** : M1, M3, M5 (3 voix) ; M5-03 : M4 et l'avis de M2 (2). Fusionné partiellement : M5-03 (M1, M3, M5 : seule l'émission des tokens reste, le calcul est retiré vers M1-02).
12. **G12 — Premier affichage.** Proposé par M3 (garder M3-02, absorber M4-04) et M5 (garder M4-04, M3-02 reformulé) (2). Garder **M3-02** : **égalité 1–1**, tranchée par ordre de numérotation en faveur de M3-02. Fusionné : M4-04.

### 1.2 Doublons proposés, non retenus (3)

- **R1 — Repli scroll sans timeline native** : garder M3-06, fusionner M1-08. Proposé par M1 seul. *doublon proposé, non retenu*. M1-08 et M3-06 restent deux choix distincts.
- **R2 — Écriture directe de valeur dans le DOM** : garder M1-09, fusionner M3-08. Proposé par M3 seul. M1 et M2 signalent le chevauchement de M1-09 avec M4-07 et le laissent non fusionné (« à arbitrer ensemble »). *doublon proposé, non retenu*.
- **R3 — Scope de cycle de vie** : garder M4-10, fusionner M2-07. Proposé par M3 seul. M4 le note « recouvrement partiel, non fusionné » ; M1 le note « pas des doublons, nom à désambiguïser ». *doublon proposé, non retenu*.

### 1.3 Recouvrements entre groupes retenus

- **M4-08** apparaît dans G8 (statut, fusionné dans M5-08) et dans G9 (séquence, fusionné dans M1-05 par égalité). Les deux fusions sont reportées telles quelles dans les blocs M5-08 et M1-05.
- **M5-08** garde son id en G8 ; sa clause de reprise est proposée vers M1-03 (G10).
- **M1-04** garde son id en G2 ; sa partie « onglet caché » est proposée vers M3-09 (G6, M5 seul).
- **M4-06** est fusionné en G5 ; sa clause de pause (G6) et sa règle d'hydratation (G12) sont aussi proposées ailleurs.
- **M3-08** : rAF de repli proposé vers M1-04 (M3 seul, voir G2) ; fusion vers M1-09 (R2, non retenue).
- **M5-09** : fusion partielle proposée (M2, M5), non retenue (voir G7).

---

## 2. Registre

Choix conservés : 38. Chaque bloc suit l'ordre de numérotation M1 à M5. Les ids fusionnés n'ont pas de bloc propre : ils apparaissent dans la ligne « variantes » de leur id gardé.

### M1-01 — Backend choisi par animation, natif d'abord [fusionne : —]
- Énoncé / Familles / Nature : chaque animation est résolue à la création vers un seul backend : WAAPI si toutes ses cibles sont compositables (transform, opacity, filter, clip-path) et qu'aucune contrainte JS (vitesse, ressort non CSS, interruption exacte) n'est demandée ; sinon moteur JS chargé à la demande. Le backend retenu est exposé (`backend`) et tracé en dev. — Familles : F1, F2, F3, F7, F13, F17 — Nature : instance
- Avantages : entrées et hover sur le compositor ; anime.js chargé seulement si un cas l'exige ; moteur retenu lisible par un humain ou un agent ; [M2] FLIP en transform sur le compositor quand rien ne demande la vitesse ; [M3] backend exposé et tracé, le choix WAAPI / JS devient vérifiable en dev ; [M4] état initial SSR en CSS/WAAPI, sans JS de framework pour les îles HTML ; [M5] backend retenu exposé et tracé en dev, diagnostic lisible
- Limites : deux moteurs donc deux jeux de comportements (fin, `fill`, événements) à aligner ; WAAPI ne transporte pas la vitesse ; double jeu de tests ; [M2] une interruption en vol sur WAAPI n'expose pas la vitesse exigee par M2-08 ; [M3] les fins d'animation (`finished`, `fill`) diffèrent entre WAAPI et JS, à aligner pour un repli de M3-06 ; [M4] handle à recréer si le backend change en cours de vie d'un composant ; [M5] deux moteurs : la règle de choix doit être documentée pour qu'un agent la devine
- Conflits : M1-03, M1-05, M2-04, M2-08
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-02 — Ressort compilé en `linear()` [fusionne : M5-03 · G11]
- Énoncé / Familles / Nature : un ressort (raideur, amortissement, masse, ou durée + rebond) est une paramétrisation unique, résolue à la création en table `linear()` de N points bornés (N fixe, erreur de tracé mesurée en test) pour WAAPI ; évaluation JS directe si `linear()` est absent ou si la cible n'est pas CSS. Cache par jeu de paramètres. — Familles : F1, F13, F18 — Nature : les deux (cache global, table par instance)
- variantes :
  - M5-03 : tokens déclarés une fois en TS, émis au build (custom properties `--udx-motion-*`, types, `@theme` Tailwind) ; le spring devient un `linear()` échantillonné à la compilation (build). Seule l'émission est retenue ; le calcul du ressort est retiré vers M1-02. Verdicts de M5-03 : valide 2 (M3, M4) · neutre 1 · conteste 1 (M1).
- Avantages : tokens Material 3 exprimés une seule fois ; même courbe en CSS et en JS ; aucun calcul JS par frame quand le compositor prend le relais ; [M2] ressort de layout sans JS par frame quand `linear()` existe ; [M3] table `linear()` bornée et mise en cache, un ressort se calcule une fois ; [M4] même courbe en CSS et en JS, rendu SSR possible en CSS pur ; [M5] table `linear()` unique, lisible comme token
- Limites : `linear()` absent des vieux Chrome de `defaults` (repli JS obligatoire) ; une table est une approximation, moins fidèle sur les overshoots courts ; coût de compilation à chaque nouveau jeu de paramètres ; [M2] table figee : une reprise en vol ne transporte pas la vitesse du ressort ; [M3] repli JS obligatoire sur vieux Chrome de `defaults` : un ressort d'entrée déclenché par M3-01 n'est pas garanti natif ; [M4] cache de compilation dupliqué par copie de module dans les îles ; [M5] où la table est calculée (création ou build) reste ouvert
- Conflits : M1-01, M1-10, M2-08, M5-04, M5-08
- Verdicts : valide 2 (M4, M5) · neutre 2 · conteste 0

### M1-03 — Interruption par transfert de vitesse [fusionne : M2-08 · G10]
- Énoncé / Familles / Nature : toute animation expose son état (valeur, vitesse) ; une nouvelle cible démarre avec la vitesse courante, jamais à 0 ni par saut. Vitesse exacte en JS, estimée en WAAPI (différence sur 2 à 3 frames échantillonnées). — Familles : F2, F12, F13, F18 — Nature : instance
- variantes :
  - M2-08 : retarget du layout depuis la position rendue (lue sur l'`Animation` WAAPI ou la valeur courante), sans retour à la rect initiale ; M5 garde M2-08 limité au layout. Verdicts de M2-08 : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0.
- Avantages : hover et tap rapides sans à-coup ; même règle pour le lâcher d'un geste (F18) ; une seule règle de reprise pour toutes les familles ; [M2] reprise FLIP et presence sans saut a la vitesse courante, base de M2-08 ; [M3] reprise à la vitesse courante utile à un `repeat` de M3-05 (sortie puis retour à la vue sans à-coup) ; [M4] une règle de reprise commune aux trois adaptateurs (re-rendu rapide, remontage) ; [M5] règle de reprise unique, testable et documentable
- Limites : WAAPI n'expose pas la vitesse, l'estimation est bruitée ; état retenu par élément (mémoire, nettoyage au démontage) ; lectures de style à faire après les écritures groupées (M1-04) ; [M2] vitesse WAAPI estimee sur 2 a 3 frames, bruitee sur les inversions courtes ; [M3] un `scrub` (M3-05) n'a pas de vitesse à transférer, la règle ne couvre que les déclenchements ; [M4] état de vitesse par élément à libérer au démontage ; [M5] estimation WAAPI bruitée, à présenter comme approximation
- Conflits : M1-01, M2-04
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-04 — Frame unique à phases lecture puis écriture [fusionne : M2-02 · G2]
- Énoncé / Familles / Nature : un seul `requestAnimationFrame` par copie de la lib pour toutes les animations JS, exécuté en deux phases (lectures de mesure, puis écritures de style). Chaque abonné déclare sa phase ; la boucle s'arrête quand la file est vide. — Familles : F7, F10, F14, F21 — Nature : global
- variantes :
  - M2-02 : même principe (une lecture groupée puis une écriture groupée par frame, une boucle rAF par page) ; partage entre îles via le registre de M2-01 ; ne déclare pas de phase par abonné. Verdicts de M2-02 : valide 3 (M1, M3, M4) · neutre 1 · conteste 0.
- Avantages : pas de layout thrashing ; coût fixe quel que soit le nombre d'éléments ; pause unique sur onglet caché ; [M2] phases lecture puis ecriture declarees par abonne, la version la plus complete de M2-02 ; [M3] phase d'écriture unique où la variable `--udx-progress` de M3-08 peut s'écrire sans second rAF ; [M4] aucun thrashing entre composants de frameworks différents ; [M5] une boucle par copie, API de phase explicite pour les abonnés
- Limites : une tâche lente retarde toutes les animations JS de la page ; plusieurs copies (îles Astro) = plusieurs boucles sans registre partagé ; ne pilote pas WAAPI sauf lecture de `currentTime` ; [M2] une copie de la lib = une boucle de plus sans registre partage (voir M4-05) ; [M3] une passe JS lente sur défilement retarde toutes les animations de la page ; une copie du paquet = une boucle ; [M4] une copie par île = une boucle, sauf registre partagé (M4-05) ; [M5] une tâche lente retarde tout ; la pause d'onglet relève de M3-09
- Conflits : M1-07, M2-04, M3-08
- Verdicts : valide 4 (M2, M3, M4, M5) · neutre 0 · conteste 0

### M1-05 — Séquence = donnée compilée en handle [fusionne : M4-08 · G9 (égalité)]
- Énoncé / Familles / Nature : une séquence est un tableau de segments (offsets absolus ou relatifs à des labels) compilé une fois en un handle unique (play, pause, reverse, seek(t)). Chaque segment est un WAAPI piloté par `currentTime` ou un abonné du frame unique, selon M1-01. — Familles : F10, F11, F12 — Nature : instance
- variantes :
  - M4-08 : séquence pilotée par handle lié à l'instance, avec statut explicite `completed` / `cancelled` (proposé vers M5-08, G8) et liaison framework (ref React, `DestroyRef` Angular, valeur d'attachment Svelte). M1 ne garde à M4-08 que la liaison framework ; M5 propose M1-05 fusionné dans M4-08 (égalité, tranchée par ordre de numérotation). Verdicts de M4-08 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
- Avantages : seek et reverse exacts ; une seule source de vérité temporelle ; aucun `setTimeout` ; [M2] seek et reverse exacts pour une chorégraphie de sortie ; [M3] handle `seek(t)` réutilisable par un repli JS de scrub (M3-06) au lieu d'un listener propre ; [M4] handle unique sur ref React, DestroyRef Angular et attachment Svelte ; [M5] seek(t) et reverse exacts, testables sans DOM
- Limites : deux horloges (WAAPI et frame) dérivent, resynchronisation à chaque seek ; handle à détruire explicitement ; séquence traversant une île non sérialisable sans passer par un registre ; [M2] deux horloges WAAPI et frame a resynchroniser ; handle a detruire ; [M3] deux horloges (WAAPI et frame) dérivent, resynchronisation à chaque seek ; [M4] séquence traversant une île non sérialisable sans registre ; [M5] deux horloges à resynchroniser ; doublon de M4-08
- Conflits : M1-01, M1-04, M4-03, M5-08
- Verdicts : valide 1 (M4) · neutre 3 · conteste 0

### M1-08 — Scroll natif sans polyfill, repli à l'état final [fusionne : —]
- Énoncé / Familles / Nature : les effets liés au scroll n'utilisent que `animation-timeline` natif. Sans support, l'élément reste à son état final (pas de polyfill, pas de JS par frame). La détection se fait une fois, est exposée (`supported`) et le repli est documenté. — Familles : F4, F5 — Nature : les deux (détection globale, effet par instance)
- Avantages : zéro coût main thread ; compositor ; pas de polyfill qui casse `@layer` ; [M2] zero JS par frame et zero polyfill pour le lie au scroll ; [M3] confirme la règle du cadre : pas de polyfill, zéro JS par frame quand `animation-timeline` existe ; [M4] rien à hydrater, état final dans le HTML sans JS ; [M5] zéro JS, pas de polyfill, cohérent avec l'exclusion du polyfill global
- Limites : Firefox < 159 et vieux Chrome de `defaults` restent à l'état final (design requis) ; `view()` dépend du conteneur et de l'overflow, diagnostic difficile ; déclenchement à l'entrée (F4) impossible sans IntersectionObserver ; [M2] sans support, l'element reste a l'etat final : les etats de presence doivent le prevoir ; [M3] état final sans JS hors Firefox 159 et vieux Chrome : « une fois à l'entrée » (F4) n'est pas couvert sans IntersectionObserver ; [M4] Firefox < 159 et vieux Chrome restent à l'état final ; [M5] état final sans alternative ; diagnostic de `view()` difficile
- Conflits : M3-05, M3-06, M3-08
- Verdicts : valide 3 (M3, M4, M5) · neutre 1 · conteste 0

### M1-09 — Valeur animable écrite directement dans le DOM [fusionne : —]
- Énoncé / Familles / Nature : une cellule animable porte valeur et vitesse, et le frame unique l'écrit dans une propriété ou une variable CSS (`setProperty`), sans passer par l'état du framework. `subscribe` existe pour les rares cas qui ont besoin de la valeur dans le rendu. — Familles : F14, F15, F24 — Nature : instance
- Avantages : suivi du curseur et parallaxe sans re-rendu ; même cellule lisible depuis React, Angular ou Svelte ; coût nul pour l'arbre de composants ; [M2] ecriture directe de valeur dans le DOM, utile aux positions de FLIP continu sans re-rendu ; [M3] valeur écrite en variable CSS dans la frame, lue par le CSS sans JS de rendu (mécanisme de M3-08) ; [M4] suivi sans re-rendu, identique depuis les trois frameworks ; [M5] même cellule lisible depuis les trois frameworks
- Limites : écriture qui contourne le framework, collision possible avec un style inline qu'il gère ; lecture synchrone côté framework à documenter ; une API de plus à côté des signaux ; [M2] contourne le framework ; collision avec un style inline gere par le composant ; [M3] écriture hors framework, collision possible avec un style inline géré par React ou Angular ; [M4] écrit un style inline que React ou Svelte réécrivent au rendu, anticipé ni par le SSR ni par l'hydratation ; [M5] contourne le typage CSS sauf si les noms sont typés ; deuxième chemin pour F14
- Conflits : M1-04, M3-08, M4-07
- Verdicts : valide 1 (M3) · neutre 2 · conteste 1 (M4)

### M2-03 — FLIP en transform seul + correction d'échelle par variables CSS [fusionne : M1-06 · G3]
- Énoncé / Familles / Nature : position et taille s'inversent uniquement par `transform` (translate + scale) ; les enfants reçoivent `--m-sx` / `--m-sy` (inverse de l'échelle du parent) pour rester nets et proportionnés ; `border-radius` corrigé de la même façon. — Familles : F7, F8 — Nature : instance
- variantes :
  - M1-06 : `measure()` explicite avant mutation, inversion en `translate()` + `scale()` jouée en WAAPI, sans détection automatique du DOM ni moteur layout ; pas de correction des enfants prévue. Verdicts de M1-06 : valide 3 (M2, M3, M4) · neutre 1 · conteste 0.
- Avantages : compositeur seul, aucun relayout pendant l'animation ; texte et images non déformés ; même logique qu'anime.js Layout et Motion ; [M1] transform seul, enfants corrigés par variables : pas de relayout ; [M3] correction d'échelle des enfants par variables CSS, compatible avec un repli de M3-06 sans JS ; [M4] variables CSS traversent les îles, enfants compensés sans JS ; [M5] `--m-sx` / `--m-sy` deviennent une API publique à typer et documenter
- Limites : enfants ayant leur propre `transform` à compenser ; `box-shadow` et `border-width` faux pendant le scale ; correction à recalculer si le parent se redimensionne en cours ; [M1] box-shadow et border-width faux pendant le scale ; [M3] `box-shadow` faux pendant le scale, visible sur les cartes révélées au défilement ; [M4] un composant qui réécrit le style inline du parent efface --m-sx ; [M5] box-shadow et border-width faux pendant le scale
- Conflits : M1-07, M2-09
- Verdicts : valide 4 (M1, M3, M4, M5) · neutre 0 · conteste 0

### M2-04 — Natif d'abord : View Transitions pour l'élément partagé [fusionne : —]
- Énoncé / Familles / Nature : quand `document.startViewTransition` existe, `view-transition-name` (généré par le composant) porte l'identité d'une paire ; le FLIP JS n'est qu'un repli, jamais exécuté en plus de la VT. — Familles : F8, F9 — Nature : global (la VT est un état du document)
- Avantages : zéro JS par frame ; navigations cross-document natives (Astro) ; snapshots gérés par le navigateur ; [M1] zéro JS par frame quand la VT existe ; [M3] élément partagé natif : aucun observateur ni rAF côté page ; [M4] navigations cross-document Astro gérées par le navigateur (astro:after-swap) ; [M5] zéro JS par frame, navigation cross-document Astro
- Limites : un seul nom actif par élément et une seule VT à la fois ; non interruptible proprement ; `element.startViewTransition()` Chromium seul, repli obligatoire ailleurs ; [M1] une seule VT active, non interruptible en vol : la reprise doit être refusée, pas simulée ; [M3] une VT en cours et un défilement programmé se disputent la capture de l'écran (à tester) ; [M4] une île hydratée pendant une VT rate la transition ; Chromium seul ; [M5] Chromium seul pour `startViewTransition` ; collisions de `view-transition-name` non contrôlées
- Conflits : M2-02, M2-08
- Verdicts : valide 3 (M3, M4, M5) · neutre 0 · conteste 1 (M1)

### M2-06 — Sortie de liste hors flux à la dernière rect [fusionne : —]
- Énoncé / Familles / Nature : lors d'une suppression, le nœud est figé en `position:absolute` à sa dernière rect mesurée dans son conteneur pendant sa sortie, afin que les voisins se réorganisent (FLIP) tout de suite. — Familles : F10, F7, F3 — Nature : instance (portée par le conteneur de liste)
- Avantages : les voisins glissent sans attendre la fin de la sortie ; même chemin pour retrait et réordonnancement ; [M1] voisins glissent avant la fin de la sortie ; [M3] voisins réorganisés tout de suite, utile quand le contenu sous le pli bouge ; [M4] voisins réorganisés sans attendre la fin de sortie ; [M5] les voisins glissent sans attendre la fin de la sortie
- Limites : le nœud perd sa largeur sous contraintes flex/grid ; conteneur à `position: relative` requis ; une mesure préalable par suppression ; [M1] largeur perdue sous flex et grid, mesure préalable par suppression ; [M3] en conteneur à `overflow` défilant, la rect figée devient fausse si le conteneur défile pendant la sortie ; [M4] position absolue réécrite par le framework au re-rendu du conteneur ; mesure fausse en SSR sans layout ; [M5] usage avancé (flex et grid) : à ne pas activer par défaut
- Conflits : M2-05
- Verdicts : valide 0 · neutre 3 · conteste 1 (M4)

### M2-07 — Portée de layout déclarée et bornée [fusionne : —]
- Énoncé / Familles / Nature : `data-layout-scope` (ou composant équivalent) borne mesure, retarget, nettoyage et résolution des `layoutId` ; une paire ne se résout qu'à l'intérieur de sa portée, qui est un état d'instance et non une liste globale. — Familles : F19, F7, F20 — Nature : instance
- Avantages : nettoyage groupé au démontage du scope ; collisions de clés cantonnées ; même modèle que `LayoutGroup` (Motion) et `createScope` (anime.js v4) ; [M1] borne mesure, retarget et nettoyage ; collisions cantonnées ; [M3] même principe que M3-10 (portée bornée contre les collisions entre îles) ; [M4] cohérent avec une portée de cycle de vie (M4-10) ; [M5] portée explicite, lisible par un agent et testable par comptage de scopes
- Limites : une paire inter-îles devient impossible hors portée ; un scope mal placé isole silencieusement ; un scope par ligne de liste multiplie les observateurs ; [M1] un scope mal placé isole sans erreur ; un scope par ligne multiplie les observateurs ; [M3] une paire hors portée devient impossible, donc pas de `layoutId` inter-îles par défaut ; [M4] une paire inter-îles devient impossible hors portée, ce qui contredit M2-01 pour les îles ; [M5] une paire inter-îles devient impossible hors portée
- Conflits : M2-01, M4-10
- Verdicts : valide 3 (M1, M3, M5) · neutre 1 · conteste 0

### M2-09 — Tailles `auto` : natif puis mesure-puis-tween [fusionne : —]
- Énoncé / Familles / Nature : hauteur et largeur `auto` animées par `interpolate-size: allow-keywords` (et `@starting-style` pour l'entrée) ; repli : mesure de la taille cible puis tween de `height` en px, avec une seule règle de détection de support partagée. — Familles : F2, F7, F3 — Nature : les deux (règle CSS globale, mesure par instance)
- Avantages : natif sans JS là où il existe ; texte net, pas de scale ; repli unique et testable ; [M1] taille animée sans scale : texte net ; [M3] hauteur `auto` native par `interpolate-size`, sans scale, pour les sections révélées par M3-02 ; [M4] hauteur auto dont la cible est déjà dans le HTML SSR, sans scale ; [M5] taille native sans JS quand `interpolate-size` existe
- Limites : `interpolate-size` Chromium seul ; le repli relayout à chaque image ; une taille mesurée devient fausse si le contenu change en cours ; [M1] le repli relayout à chaque image ; taille fausse si le contenu change ; [M3] repli relayout à chaque image ; mesure périmée si le contenu change pendant le reveal ; [M4] mesure fausse si le contenu change en cours d'animation ; [M5] Chromium seul ; repli relayout à chaque image
- Conflits : M2-03
- Verdicts : valide 2 (M4, M5) · neutre 2 · conteste 0

### M2-10 — Réordonnancement par geste : fantôme et voisins en FLIP [fusionne : —]
- Énoncé / Familles / Nature : pendant un drag, le nœud suit le pointeur en `transform` (fantôme) ; chaque franchissement de seuil change l'index logique et ne déclenche le FLIP que des voisins ; au lâcher, le nœud est repositionné en FLIP depuis sa position visuelle. — Familles : F18, F7, F10 — Nature : instance
- Avantages : le geste reste sur le pointeur, sans relayout ; même chemin que le réordonnancement de F10 ; seuil d'échange réglable ; [M1] geste en transform, sans relayout ; [M3] voisins en FLIP pendant un drag, sans relayout du nœud suivi ; [M4] un seul chemin FLIP pour geste et liste ; [M5] geste fluide sans relayout
- Limites : mesures des voisins figées au début du geste (scroll pendant le drag = faux) ; `touch-action` et pointer events à gérer par chaque framework ; clavier non traité ici ; [M1] voisins mesurés une fois au départ : scroll pendant le drag donne des valeurs fausses ; [M3] mesures figées au début du geste ; un défilement natif pendant le drag les rend fausses, aucun écouteur de défilement n'est prévu ; [M4] pointer events et capture câblés différemment par React, Angular et Svelte ; [M5] clavier explicitement non traité : bloque F20 pour toute la bibliothèque
- Conflits : M2-08
- Verdicts : valide 0 · neutre 3 · conteste 1 (M5)

### M3-01 — Observateur de visibilité partagé par document [fusionne : —]
- Énoncé / Familles / Nature : un seul IntersectionObserver par document et par couple (marge, seuil), créé à la première inscription ; il écrit `data-udx-view` (in / out) sur chaque cible inscrite, référencée par une WeakMap élément → rappels. Il ne joue aucune animation : il publie un état que le CSS ou le moteur consomment. — Familles : F3, F4, F21 — Nature : global
- Avantages : coût constant par seuil quel que soit le nombre d'éléments ; aucun observateur par composant ; état lisible en CSS, en DOM et dans les tests ; [M1] coût constant par seuil, état publié et non animation ; [M2] etat in / out publie sur l'element, lisible par une sortie qui attend un etat ; [M4] un observateur par document ; les nœuds rendus par un framework n'exigent aucune hydratation supplémentaire ; [M5] état `data-udx-view` observable en CSS, DOM et tests
- Limites : une instance par couple (marge, seuil) ; un bug dans le singleton touche toutes les îles de la page ; l'écriture d'attributs doit être groupée par frame ; [M1] un bug du singleton touche toutes les îles ; [M2] un observateur par couple marge/seuil : un singleton par document reste fragile entre iles ; [M4] une copie par île sans registre = plusieurs observateurs ; [M5] un bug du singleton touche toutes les îles de la page
- Conflits : M3-10, M4-06
- Verdicts : valide 4 (M1, M2, M4, M5) · neutre 0 · conteste 0

### M3-02 — Masquage initial seulement après inscription effective [fusionne : M4-04 · G12 (égalité)]
- Énoncé / Familles / Nature : aucun état « avant entrée » n'est posé en CSS statique ; le runtime l'applique au moment où l'élément est inscrit (`data-udx-view="pending"`), et seulement si l'inscription réussit. Sans JS, ou si le script échoue, le contenu reste visible. — Familles : F3, F4 — Nature : les deux
- variantes :
  - M4-04 : état final dans le HTML sans JS, entrée définie en CSS (`@starting-style` ou classe posée après montage), aucun style calculé par JS au rendu serveur. M3-02 retient l'état d'entrée posé par le runtime à l'inscription. Verdicts de M4-04 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
- Avantages : pas de contenu invisible sans JS (défaut d'AOS évité) ; une île hydratée tard n'a pas à masquer le reste de la page ; [M1] contenu visible sans JS, pas de masquage orphelin ; [M2] aucun contenu cache sans JS, principe defendable pour l'hydratation tardive ; [M4] aligné sur M4-04 : aucun masquage statique, le SSR montre le contenu ; [M5] aucun contenu caché sans JS
- Limites : un élément sous le pli peut clignoter avant son inscription ; atténuation possible par un marqueur `js` posé par un script inline d'une ligne, dont le coût est à accepter ; [M1] clignotement avant inscription ; pose l'état d'entrée en JS, contre M4-04 en CSS ; [M2] un etat « pending » pose au montage cree un saut visible sur une entree de presence (contredit M4-04) ; [M4] clignotement possible pour un élément sous le pli avant inscription ; [M5] deuxième mécanisme de premier affichage avec M4-04 ; masque avant inscription
- Conflits : M3-01, M4-06
- Verdicts : valide 1 (M4) · neutre 0 · conteste 3 (M1, M2, M5)

### M3-03 — Sentinelle sans transformée pour le déclenchement [fusionne : M4-06 · G5]
- Énoncé / Familles / Nature : le déclenchement observe un nœud sans `transform` (boîte de hauteur nulle, ou le wrapper de M3-04), jamais la cible animée ; la cible reçoit l'état, la sentinelle fournit la géométrie. Une entrée qui translate hors écran ne peut plus empêcher sa propre intersection. — Familles : F3, F4 — Nature : instance
- variantes :
  - M4-06 : déclenchement sur sentinelle non animée (même principe) ; ajoute la règle « pas de rattrapage » (élément déjà visible à l'hydratation affiché à son état final) et la pause hors écran par le même observateur (répartie en G6 et G12). Verdicts de M4-06 : valide 0 · neutre 2 · conteste 2 (M2, M3).
- Avantages : entrées décalées (translate, scale) déclenchables sans marge corrigée à la main ; même mécanisme pour `once` et `repeat` ; [M1] une transformée n'empêche plus l'intersection ; [M2] sentinelle sans transform pour declencher une entree ou sortie decalee sans se desarmer ; [M4] évite le piège d'auto-désarmement traité en M4-06 ; [M5] les transformées ne faussent plus la géométrie de déclenchement
- Limites : un nœud de plus dans le DOM, que le SSR et l'hydratation doivent produire ; sur grille ou flex, une sentinelle de hauteur nulle peut modifier la mise en page (à tester) ; [M1] un nœud de plus à produire au SSR ; à tester en grille ou flex ; [M2] un noeud de plus a produire au SSR ; sentinelle de hauteur nulle peut alterer une grille ; [M4] sentinelle à rendre identique en SSR et en client (décalage si elle est ajoutée par JS) ; [M5] nœud supplémentaire à produire en SSR ; doublon de M4-06
- Conflits : M3-01, M3-02, M3-09, M4-04
- Verdicts : valide 4 (M1, M2, M4, M5) · neutre 0 · conteste 0

### M3-04 — Inscription par cycle de vie d'élément, sans scan [fusionne : —]
- Énoncé / Familles / Nature : un élément qui demande un déclencheur ou un suivi s'inscrit par son propre cycle de vie (élément personnalisé `udx-view`, sans shadow DOM, connectedCallback / disconnectedCallback) ; aucun `querySelectorAll` au démarrage, aucun MutationObserver sur `document`. — Familles : F4, F19, F21 — Nature : les deux (définition globale, inscription par instance)
- Avantages : le retrait DOM libère l'inscription sans observateur ; même écriture dans React, Angular, Svelte et HTML / Astro ; coût nul sur une page qui n'en contient pas ; [M1] retrait DOM libère l'inscription sans observateur ; [M2] inscription par cycle de vie, libere l'observateur au retrait du noeud ; [M4] cycle de vie natif : le retrait libère l'inscription ; [M5] inscription par cycle de vie, sans scan, identique dans les trois frameworks
- Limites : l'élément doit être défini avant la première peinture, sinon M3-02 ne tient pas ; hydratation React et Angular à tester avec des balises personnalisées ; une simple classe Tailwind ne peut pas inscrire un élément, ce qui va contre la préférence Tailwind du cadre ; [M1] impose un élément personnalisé ; une classe Tailwind ne peut pas inscrire ; [M2] l'element doit etre defini avant la peinture ; une classe Tailwind ne peut pas inscrire ; [M4] React 19 et Angular transmettent mal les propriétés aux éléments personnalisés ; l'élément doit être défini avant peinture ; [M5] une classe Tailwind ne peut pas inscrire : contraint M5-02 et M5-04
- Conflits : M3-02, M5-02, M5-04, R8, R2
- Verdicts : valide 1 (M5) · neutre 1 · conteste 2 (M1, M4)

### M3-05 — Progression et déclenchement, deux intentions distinctes [fusionne : —]
- Énoncé / Familles / Nature : `scrub` (la valeur suit la position de défilement, `animation-timeline: view()` ou `scroll()`) et `once` (l'animation se joue au franchissement d'un seuil, `animation-trigger` puis M3-01) ne partagent ni nom ni attribut ; une même intention ne change pas de nature selon le navigateur. — Familles : F4, F5 — Nature : instance
- Avantages : chaque intention a son repli logique (état final pour `once`, position neutre pour `scrub`) ; le typage refuse « scrub avec seuil » ; [M1] chaque intention a son repli logique, typage refuse le mélange ; [M2] distinction scrub / once nette, hors de mon perimetre ; [M4] frontière typée, un agent ne peut pas écrire « scrub avec seuil » ; [M5] deux intentions, deux noms : le typage peut interdire scrub avec seuil
- Limites : deux notions à apprendre au lieu d'un « révéler au défilement » ; hors Chromium, `once` repose sur IntersectionObserver ; [M1] deux notions à apprendre ; hors Chromium, `once` passe par IntersectionObserver ; [M2] hors Chromium, `once` repose sur IntersectionObserver ; [M4] deux notions à apprendre à la place de « révéler au défilement » ; [M5] noms à aligner sur M5-01 (`reveal`, `track`) ; deux notions à documenter
- Conflits : M5-01, R9 J4, R9 J2
- Verdicts : valide 3 (M1, M4, M5) · neutre 1 · conteste 0

### M3-06 — Repli scroll-linked statique par défaut, JS nommé [fusionne : —]
- Énoncé / Familles / Nature : sans timeline native, un `scrub` reste à sa position neutre ou finale, sans JS ; le repli JS (listener passif + anime.js onScroll) n'est chargé que si l'auteur le nomme (`fallback: 'js'`) et si la page contient au moins un tel nœud. — Familles : F5, F20, F21 — Nature : les deux (politique de chargement globale, repli par instance)
- Avantages : zéro JS et zéro listener sur les navigateurs à timeline ; pas de polyfill global (exclu par le cadre) ; le coût du repli se lit dans le code de la page ; [M1] zéro JS et zéro listener sur navigateurs à timeline ; [M2] zero listener sur les navigateurs a timeline ; [M4] zéro listener sur les navigateurs à timeline ; une île sans scroll n'en charge aucun ; [M5] repli JS opt-in, coût lisible dans la page
- Limites : sur les vieux Chrome de `defaults`, l'effet disparaît au lieu d'être approché ; l'auteur doit choisir le repli, ce qui ajoute un point de décision ; [M1] vieux Chrome de `defaults` : l'effet disparaît au lieu d'être approché ; [M2] sans JS, l'effet disparait ; aucun repli de layout n'est prevu ; [M4] en île tardive, le listener du repli doit s'ajouter après le chargement ; [M5] sur vieux Chrome l'effet disparaît, à documenter
- Conflits : M1-08, M3-08
- Verdicts : valide 3 (M1, M4, M5) · neutre 1 · conteste 0

### M3-07 — Défilement natif, jamais détourné [fusionne : —]
- Énoncé / Familles / Nature : aucun lissage de molette ni interception du scroll ; un défilement programmé passe par `scrollTo({ behavior })` ou `scroll-behavior: smooth`, et seul un tween JS à courbe ou durée imposée est permis ; `prefers-reduced-motion` force l'instantané. — Familles : F6, F20 — Nature : instance
- Avantages : restauration de position, trackpads, ancres et clavier restent natifs ; aucune boucle rAF permanente ; aucune bibliothèque de lissage à charger ; [M1] natif préservé, aucune boucle rAF permanente ; [M2] scroll natif intact : ancres et restauration de position restent valables pour les listes ; [M4] restauration de position et ClientRouter Astro respectés ; [M5] API native, aucune bibliothèque de lissage à charger
- Limites : la durée du `smooth` natif n'est pas réglable et varie selon le navigateur ; pas d'inertie « à la ScrollSmoother » ; [M1] durée du smooth natif non réglable ; [M2] un scroll programme en cours de FLIP decale la mesure (voir M2-06, M2-10) ; [M4] durée du smooth natif non réglable ; [M5] durée du `smooth` natif non réglable
- Conflits : —
- Verdicts : valide 4 (M1, M2, M4, M5) · neutre 0 · conteste 0

### M3-08 — Progression en propriété CSS, un seul listener de repli [fusionne : —]
- Énoncé / Familles / Nature : une valeur liée au défilement (parallaxe, progression, F14) s'exprime comme propriété personnalisée (`--udx-progress`) alimentée par la timeline ; si M3-06 autorise le repli JS, un unique listener passif par document, cadencé par rAF, écrit cette propriété pour tous les éléments inscrits, lectures groupées avant écritures ; il est retiré quand le nombre d'inscrits tombe à zéro. — Familles : F5, F14 — Nature : global
- Avantages : une passe par frame quel que soit le nombre d'éléments ; le CSS consomme la valeur (`calc`, `transform`, couleur) sans JS ; jamais de listener par élément ; [M1] une passe par frame quel que soit le nombre d'éléments ; [M2] progression en propriete CSS, une passe par frame pour le suivi ; [M4] un listener par document, cadencé par rAF ; [M5] une propriété CSS consommable par `calc` et `transform`
- Limites : animer une propriété personnalisée par timeline exige `@property` (support à vérifier) ; le repli écrit des styles, donc recalcul sur grands DOM ; [M1] `@property` requis ; le repli écrit des styles ; chevauche M1-09 ; [M2] le repli ecrit des styles et recalcule sur grand DOM ; ordre lecture/ecriture a aligner ; [M4] une copie par île = un listener par île sans registre (M5-07) ; [M5] listener par document et `@property` requis : contredit M1-08 sur le JS par frame
- Conflits : M1-08, M2-02, M3-06, M5-07
- Verdicts : valide 1 (M4) · neutre 2 · conteste 1 (M5)

### M3-09 — Pause hors-vue et onglet caché, reprise sans saut [fusionne : — · G6 (proposé)]
- Énoncé / Familles / Nature : les boucles (F24) et les tweens JS sont suspendus par deux signaux partagés, `visibilitychange` (un listener par document) et l'état `data-udx-view` de M3-01 ; à la reprise, le temps écoulé est recalé pour éviter le saut. Les animations CSS et WAAPI sont mises en pause (`animation-play-state`, `pause()`), jamais retirées. — Familles : F24, F21, F12 — Nature : global
- Avantages : un indicateur ou une pulsation hors écran coûte zéro ; pas de rattrapage brutal au retour sur l'onglet ; un seul listener pour toute la page ; [M1] pause hors-vue à coût nul, un seul listener ; [M2] pause hors-vue et onglet cache, reprise sans saut ; un FLIP en vol doit etre recale au retour ; [M4] pause partagée (visibilité, hors-vue) et reprise sans saut ; [M5] un seul `visibilitychange`, zéro coût hors écran
- Limites : une présence en cours hors écran est figée, donc sa promesse de fin est retardée ; l'option de pause sur onglet caché d'anime.js v4 (à vérifier) ne couvre pas le hors-vue ; [M1] une présence figée retarde sa promesse de fin ; [M2] une presence figee hors ecran retarde sa promesse `finished` ; [M4] une présence figée hors écran retarde sa promesse de fin, donc le contrat finished de M4-03 ; [M5] une présence figée retarde sa promesse de fin : à exposer par `finished`
- Conflits : M1-04, M3-01, M4-03
- Verdicts : valide 3 (M1, M2, M5) · neutre 0 · conteste 1 (M4)

### M3-10 — Timelines et noms d'animation scopés par île [fusionne : —]
- Énoncé / Familles / Nature : les timelines nommées (`--udx-card-view`) et les `animation-name` générés sont déclarés dans un `timeline-scope` propre à chaque île ou composant, jamais dans `:root`, parce que les îles Astro partagent un seul espace de noms CSS. — Familles : F5, F19 — Nature : instance
- Avantages : deux îles au même composant ne se marchent pas dessus ; un nom de timeline n'est jamais résolu vers l'île voisine ; [M1] une île ne résout jamais le nom d'une voisine ; [M2] timelines CSS scopees par ile : une sortie ne resout pas vers le noeud voisin ; [M4] deux îles au même composant ne se marchent pas dessus, en accord avec le partage d'espace CSS d'Astro ; [M5] deux îles au même composant ne collisionnent pas
- Limites : une règle de scope de plus par île ; les noms doivent être générés au build (plugin Tailwind) ou à l'inscription ; [M1] une règle de scope de plus, noms générés au build ; [M2] une regle de scope de plus par ile ; le mot « scope » designe ici autre chose qu'en M4-10 ; [M4] une règle de scope par île, noms générés au build ; [M5] règle de scope en plus, noms à générer au build
- Conflits : M3-01, M4-10, M5-03
- Verdicts : valide 3 (M2, M4, M5) · neutre 1 · conteste 0

### M4-01 — Noyau pur sans framework, adaptateurs fins [fusionne : —]
- Énoncé / Familles / Nature : `@udixio/motion` exporte un noyau sans import de framework (fonctions qui prennent un élément et des options, et renvoient un handle `{ finished, cancel, dispose }`). Chaque adaptateur n'ajoute que la traduction de cycle de vie : ref callback et hook React, directive Angular avec `DestroyRef`, attachment Svelte (`{@attach}`), attributs `data-*` pour les îles HTML. — Familles : F1, F2, F3, F7, F12, F22 — Nature : instance
- Avantages : logique testable en Node sans DOM ; chaque adaptateur reste idiomatique ; le même noyau sert les sites sans framework ; [M1] logique testable en Node sans DOM ; [M2] noyau pur testable en Node : FLIP et presence se testent sans DOM ; [M3] noyau testable en Node, handle `{ finished, cancel, dispose }` cohérent avec M5-08 ; [M5] noyau sans framework, testable en Node, même contrat partout
- Limites : trois surfaces d'API à garder alignées ; la sémantique d'erreur est à répéter dans chaque adaptateur ; le réactif (F14) demande un pont supplémentaire ; [M1] trois surfaces à aligner ; la forme du handle diverge de M5-08 ; [M2] le handle `{finished, cancel, dispose}` diverge de M5-08 (pas de `dispose` la-bas) ; [M3] trois surfaces à garder alignées ; le noyau n'expose aucun point d'inscription pour les îles de vue ; [M5] trois adaptateurs à aligner ; sémantique d'erreur répétée
- Conflits : M5-08
- Verdicts : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0

### M4-02 — Animations de cycle de vie idempotentes [fusionne : —]
- Énoncé / Familles / Nature : une animation démarrée à l'attachement est identifiée par son élément et son paramétrage. Un second démarrage (double montage StrictMode de React 19, réattachement Svelte, reconnexion Angular après déplacement) reprend ou annule le handle existant au lieu de le dupliquer ; le démontage annule et ne laisse aucun effet en vol. — Familles : F2, F3, F7, F13, F19 — Nature : instance
- Avantages : pas de double tween en développement ; comportement identique entre frameworks ; tests monter / démonter / remonter simples ; [M1] idempotence sous StrictMode et réattachement ; [M2] idempotence du demarrage : un FLIP ne se double pas apres un montage StrictMode ; [M3] idempotence qui évite de dupliquer l'inscription de vue (M3-04) au remontage ; [M5] idempotence : StrictMode et réattachement sans double tween
- Limites : un registre par élément (WeakMap) suppose une seule copie du module ; reprendre à mi-course peut figer une valeur si le paramétrage a changé entre-temps ; [M1] un WeakMap par copie de module casse l'idempotence entre îles ; [M2] un WeakMap par copie de module casse entre iles ; [M3] un WeakMap par copie de module casse l'idempotence entre îles ; [M5] WeakMap suppose une seule copie du module
- Conflits : M3-04, M4-05
- Verdicts : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0

### M4-03 — Présence : le nœud reste jusqu'à `finished` [fusionne : M2-05 · G4]
- Énoncé / Familles / Nature : une sortie (F3) garde le nœud dans le DOM, avec `inert` et `aria-hidden` posés, jusqu'à la résolution de `finished` ; seul ensuite le retrait a lieu. React : l'état « en sortie » retient les enfants dans un hook dédié. Angular : le retrait est retardé par le même contrat (`animate.leave` pour une animation CSS, promesse pour un tween JS). Svelte : `out:` natif, mêmes attributs. Règle observable unique : retiré = sortie terminée. — Familles : F3, F10, F11 — Nature : instance
- variantes :
  - M2-05 : sortie par désarmement différé du nœud réel : nœud marqué `inert` et `aria-hidden` pendant la sortie, retiré à la fin d'animation, sans clone. Verdicts de M2-05 : valide 3 (M1, M3, M4) · neutre 1 · conteste 0.
- Avantages : sortie correcte après un remontage ; accessibilité pendant la sortie traitée au même endroit ; `out:` et `animate.leave` restent utilisés quand ils suffisent ; [M1] règle observable unique : retiré = sortie terminée ; [M2] presence : noeud retenu jusqu'a `finished`, regle observable simple ; c'est la sortie defendue ici (absorbe M2-05) ; [M3] contrat « retiré = sortie terminée », réutilisable pour une sortie signalée par M3-01 ; [M5] sortie gérée au même endroit, accessibilité pendant la sortie
- Limites : React doit garder des enfants hors de la source de vérité, donc gérer clés et ordre ; si le parent se démonte pendant la sortie, le nœud retenu doit être retiré sans attendre ; une sortie mal terminée laisse un élément fantôme ; [M1] un parent démonté doit retirer le nœud retenu sans attendre ; [M2] React doit retenir des enfants hors de la source de verite ; cles et ordre a gerer ; [M3] React doit retenir des enfants hors de la source de vérité ; un nœud fantôme si le dispose arrive pendant la sortie ; [M5] mécanisme différent par framework ; React gère clés et ordre
- Conflits : M1-07, M2-06, M3-09, M4-10
- Verdicts : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0

### M4-07 — Valeurs animées en signal, store ou hook, sans re-rendu [fusionne : —]
- Énoncé / Familles / Nature : une valeur animée (F14, F15) est un objet à lecture réactive. Angular : `signal` écrit depuis la boucle d'animation, sans `markForCheck`, en zoneless. Svelte : état `$state` ou store. React : `useSyncExternalStore`. Le noyau écrit, l'adaptateur lit ; un composant ne re-rend que s'il lit la valeur dans son rendu. — Familles : F13, F14, F15 — Nature : instance
- Avantages : 60 fps sans cycle de détection de changements ; compatible zoneless ; pas de state React pour du mouvement continu ; [M1] 60 fps sans cycle de détection de changements ; [M2] valeurs continues sans re-rendu, compatible avec un FLIP continu ; [M3] valeur animée en signal lu par le rendu, sans cycle de détection ; [M5] signal ou store sans re-rendu, lecture typée par adaptateur
- Limites : en React, un store externe lu pendant le rendu peut produire du tearing, donc préférer l'écriture DOM directe pour les styles ; un signal Angular écrit sans lecture dans un template ou un effet est inerte ; ce choix ne doit pas casser le rendu serveur (M4-04) ; [M1] tearing possible en React si lu au rendu ; signal inerte sans lecture ; [M2] en React, un store lu pendant le rendu peut produire du tearing ; l'ecriture DOM reste preferable ; [M3] écrire un signal à chaque image pour un défilement relance le graphe réactif ; M3-08 écrit une propriété CSS sans état ; [M5] deux chemins pour F14 avec M1-09, à trancher
- Conflits : M1-09, M3-08
- Verdicts : valide 2 (M1, M3) · neutre 2 · conteste 0

### M4-09 — Préférence de mouvement : un store, consommé par chaque adaptateur [fusionne : M1-10 · G7]
- Énoncé / Familles / Nature : `prefers-reduced-motion` est lu par un store global qui écoute `matchMedia` ; chaque adaptateur s'y abonne. En réduit : durées nulles pour F2, F3 et F7, boucles (F24) et inertie (F18) arrêtées, états finaux posés immédiatement, `finished` résolu tout de suite. Le rendu serveur ne connaît pas la préférence, mais il ne rend que l'état final (M4-04) : rien à corriger. — Familles : F2, F3, F7, F20, F24 — Nature : les deux (store global ; effet par instance)
- variantes :
  - M1-10 : un point unique pour `prefers-reduced-motion`, résolu à la compilation par une fonction du moteur (durées nulles, ressorts en saut, boucles figées) ; aucun composant n'interroge `matchMedia`. Verdicts de M1-10 : valide 1 (M3) · neutre 1 · conteste 2 (M4, M5).
- Avantages : un seul point de vérité, y compris entre îles via M4-05 ; réaction au changement de préférence sans rechargement ; [M1] un seul point de vérité, relayé entre îles ; [M2] store unique de preference, consomme par chaque adaptateur, y compris le layout ; [M3] store unique, lisible aussi par un observateur de visibilité (M3-01) ; [M5] une seule lecture de `matchMedia` pour toutes les îles
- Limites : sans registre partagé, chaque île lit `matchMedia` elle-même ; le mode réduit ne doit pas supprimer les retours d'état (focus, erreur, `data-state`) ; les animations de focus restent à conserver ; [M1] chaque île lit `matchMedia` sans registre partagé ; [M2] chaque ile lit matchMedia sans M4-05 ; ne pas supprimer les retours d'etat ; [M3] chaque île lit `matchMedia` sans registre ; les effets de défilement ne sont pas classés ; [M5] blanket : durées nulles sans distinction essentiel et décoratif (contredit M5-09)
- Conflits : M1-02, M5-09
- Verdicts : valide 3 (M1, M2, M5) · neutre 1 · conteste 0

### M4-10 — Scope de nettoyage lié au cycle de vie du framework [fusionne : —]
- Énoncé / Familles / Nature : chaque racine (composant ou île) crée un `scope` qui collecte les animations, observateurs et écouteurs qu'elle démarre. `scope.dispose()` arrête tout, et le framework l'appelle au démontage : retour d'effet React, `DestroyRef` Angular, teardown Svelte, `astro:before-swap` ou `pagehide` pour les îles. Un scope par racine, jamais un scope global. — Familles : F3, F8, F19, F21 — Nature : instance
- Avantages : fuite impossible par oubli ; un seul appel pour tout nettoyer ; tests de fuite simples (compter les scopes vivants) ; [M1] fuite impossible par oubli, un seul appel de nettoyage ; [M2] dispose au demontage et a `astro:before-swap` : FLIP et observateurs nettoyes sans fuite ; [M3] scope par racine : un `dispose` retire les abonnements de vue et de frame ; [M5] fuites détectables en comptant les scopes vivants
- Limites : un scope par composant coûte cher si les composants sont nombreux (mutualiser par racine) ; `transition:persist` d'Astro garde une île vivante, son scope ne doit donc pas être disposé au swap ; l'ordre entre dispose et sortie en cours doit être fixé ; [M1] `transition:persist` garde l'île vivante : ne pas disposer au swap ; [M2] un scope par composant coute si nombreux ; ordre dispose / sortie a fixer (voir M2-05) ; [M3] l'observateur partagé (M3-01) ne doit pas être déconnecté, seul le désabonnement est permis ; `transition:persist` d'Astro garde une île vivante ; [M5] coût par composant à mutualiser par racine ; ordre dispose et sortie à fixer
- Conflits : M2-07, M4-02, M4-03
- Verdicts : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0

### M5-01 — Vocabulaire fermé de huit verbes d'intention [fusionne : —]
- Énoncé / Familles / Nature : toute animation s'écrit avec un des huit verbes `enter`, `exit`, `state`, `reveal`, `track`, `layout`, `sequence`, `loop`, décrits par ce qu'ils obtiennent et jamais par le moteur ; tout autre nom est refusé. Chaque verbe déclare sa nature : `state`, `reveal`, `loop` restent globaux ; `enter`, `exit`, `layout`, `sequence`, `track` exigent une instance. — Familles : F2, F3, F4, F5, F7, F8, F10, F11, F14, F24 — Nature : les deux
- Avantages : un seul mot-clé à apprendre pour un humain comme pour un agent ; le verbe impose la coordination nécessaire ; couvre les 24 familles par regroupement ; [M1] un seul mot-clé pour humain et agent, verbe impose la coordination ; [M2] les verbes `layout`, `enter`, `exit`, `track` nomment la coordination necessaire ; [M3] les verbes `state`, `reveal`, `loop` restent globaux, ce qui colle à la distinction F4 / F5 / F24 ; [M4] vocabulaire court, décrit par résultat, lisible par un agent
- Limites : F16 (texte) et F17 (SVG) ne rentrent pas naturellement dans un verbe (neuvième verbe ou détour par `sequence`) ; `sequence` reprend seul toute la complexité de F11 ; [M1] F16 et F17 ne rentrent pas ; `sequence` porte seul F11 ; [M2] aucun verbe pour F16 et F17 ; `sequence` porte seul la complexite de F11 ; [M3] aucun verbe distinct entre progression (scrub) et déclenchement (once) ; [M4] enter et exit entrent en collision avec animate.enter/leave d'Angular et in:/out: de Svelte
- Conflits : M3-05, M5-02, M5-08
- Verdicts : valide 1 (M2) · neutre 2 · conteste 1 (M4)

### M5-02 — Une forme de configuration, trois syntaxes équivalentes [fusionne : —]
- Énoncé / Familles / Nature : un objet TS typé, un attribut HTML `data-motion="enter:fade-up reveal:once"` et une classe Tailwind se normalisent vers le même `MotionSpec` ; le parseur de l'attribut est exporté et exécutable au build pour valider les pages. — Familles : F1, F2, F3, F4, F22, F23 — Nature : instance
- Avantages : les îles en HTML pur et les pages Astro sans JS de framework fonctionnent ; une seule doc et un seul modèle mental ; les fautes de syntaxe remontent au build, pas à l'écran ; [M1] parseur exécutable au build, fautes remontées tôt ; [M2] `data-motion` permet entrees et presence dans les iles HTML pur ; [M3] `data-motion` parsable au build, `enter` et `reveal` sans JS ; [M4] HTML pur et pages Astro sans framework couverts par la même grammaire
- Limites : grammaire d'attribut à maintenir ; les classes Tailwind ne portent pas de valeurs riches (fonctions, callbacks) ; risque de divergence entre grammaire et types TS sans test de parité ; [M1] grammaire à maintenir ; pas de valeurs riches en classe ; [M2] grammaire d'attribut a maintenir ; une classe Tailwind ne porte ni portee ni callbacks de presence ; [M3] aucune place pour `fallback` ni `on: view` : le repli de M3-06 doit entrer dans la grammaire ; [M4] l'attribut doit être identique au SSR et au client, sinon mismatch d'hydratation
- Conflits : M2-01, M3-04, M5-01
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 · conteste 0

### M5-04 — Plugin Tailwind v4 CSS-first, sans configuration JS [fusionne : —]
- Énoncé / Familles / Nature : les utilitaires sont déclarés en CSS (`@plugin`, `@utility`, `@custom-variant`) : `motion-enter-fade-up`, `motion-reveal-once`, `motion-state-open:` ; aucun `tailwind.config.js` ; le CSS produit ne contient que les classes détectées dans les sources. — Familles : F1, F2, F3, F4, F20, F24 — Nature : global
- Avantages : cohérent avec Tailwind v4 et l'écosystème Udixio ; zéro JS pour tout ce qui s'exprime en CSS (transitions, keyframes, `animation-timeline`) ; élagage natif par détection des classes ; [M1] zéro JS pour tout ce qui est CSS, élagage natif ; [M2] `motion-enter-…` en CSS pur pour les entrees de presence ; [M3] `motion-reveal-once` en CSS seul pour `animation-trigger` (Chromium), zéro JS ; [M4] classes rendues en SSR = état final ; plugin CSS-first sans JS
- Limites : classes construites dynamiquement (`motion-${x}`) invisibles au scanner (`@source inline()` requis) ; `animation-trigger` et scroll-driven inégaux selon les navigateurs de `defaults` ; la réduction de mouvement doit être répliquée en CSS ; [M1] classes construites dynamiquement invisibles au scanner ; [M2] sortie vers `display:none` non transitionnee sous Firefox (faits etablis) : la presence reste en JS ; [M3] une déclaration non supportée est jetée au parsing : le repli IntersectionObserver de M3-05 doit exister côté CSS aussi ; [M4] réduction à répliquer en CSS, classes dynamiques invisibles au scanner
- Conflits : M3-04, M4-03, M5-03, M5-09
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 · conteste 0

### M5-05 — Extraction statique au build, runtime JS seulement si la page l'exige [fusionne : —]
- Énoncé / Familles / Nature : un plugin Vite/Astro lit les `data-motion` et classes des pages au build ; les animations exprimables en CSS sortent en CSS statique ; chaque page reçoit un drapeau qui décide du chargement du runtime JS et des seuls chunks de capacité utilisés. — Familles : F4, F5, F7, F21, F22 — Nature : global
- Avantages : pages statiques sans JS d'animation ; chargement par page et par île (`client:visible` respecté) ; évite de payer animate (≈13 kB) ou layout (≈21 kB) hors des pages qui les utilisent ; [M1] pages statiques sans JS d'animation, chargement par île ; [M2] chargement par page : pas de chunk layout sur une page sans FLIP ; [M3] drapeau par page : aucun runtime de vue (M3-01) sur une page sans `once` ni `scrub` ; [M4] chargement par page et par île, respecte client:visible
- Limites : l'analyse statique rate les usages construits à l'exécution ; deux chemins (CSS et JS) pour un même verbe à garder équivalents ; couplé à Vite et Astro et à leurs versions ; [M1] analyse statique rate les usages dynamiques ; [M2] l'analyse statique rate les `layoutId` construits a l'execution ; [M3] une progression construite à l'exécution n'est pas détectée et n'est pas inscrite ; [M4] usages construits à l'exécution (props de framework) invisibles à l'analyse statique
- Conflits : M5-07
- Verdicts : valide 3 (M1, M3, M4) · neutre 1 · conteste 0

### M5-06 — Entrées par capacité, avec budget de taille publié [fusionne : —]
- Énoncé / Familles / Nature : `@udixio/motion` se découpe en sous-chemins par capacité (`/tokens`, `/state`, `/reveal`, `/scroll`, `/layout`, `/sequence`, `/gestures`, `/text`), tous `sideEffects: false` ; un test CI fige la taille min+gz de chaque entrée et la doc publie le tableau de coût. — Familles : F19, F21, F22, F23 — Nature : global
- Avantages : coût lisible avant l'import ; tree-shaking vérifié en CI et non supposé ; les composants Udixio n'importent que la capacité qu'ils utilisent ; [M1] coût lisible et tree-shaking vérifié en CI ; [M2] entree `/layout` separee avec taille publiee (≈21 kB) ; [M3] sous-chemins `/scroll` et `/reveal` séparés : un site sans défilement n'embarque pas M3-01 ; [M4] une île n'importe que sa capacité ; coût lisible avant import
- Limites : beaucoup de sous-chemins désorientent (atténué par M5-10) ; une entrée qui en tire une autre duplique du code si les versions divergent ; budgets à réviser à chaque montée d'anime.js ; [M1] sous-chemins nombreux ; une entrée qui en tire une autre duplique du code ; [M2] FLIP et presence partagent un cycle de mesure : le scheduler doit vivre dans un chemin commun ; [M3] `/reveal` et `/scroll` partagent l'observateur : duplication si les versions divergent ; [M4] deux copies de versions différentes entre îles dupliquent du code
- Conflits : M2-02, M5-07
- Verdicts : valide 2 (M1, M4) · neutre 2 · conteste 0

### M5-07 — Singleton inter-îles versionné sur globalThis [fusionne : M1-07, M2-01, M4-05 · G1]
- Énoncé / Familles / Nature : le runtime global (scanner d'observateurs, file de layout) est enregistré sous `globalThis[Symbol.for('udixio.motion@1')]` ; une île qui le trouve réutilise l'instance ; une majeure différente coexiste sans la toucher ; chaque île s'inscrit et se désinscrit par compteur de références à l'unmount. — Familles : F4, F5, F8, F21, F24 — Nature : global
- variantes :
  - M1-07 : registre de nœuds pour `data-layout-id` (nœud qui sort retenu jusqu'à son homologue, purge temporisée), clé versionnée sur `globalThis`. Verdicts de M1-07 : valide 3 (M2, M3, M4) · neutre 0 · conteste 1 (M5).
  - M2-01 : résolution des paires `data-layout-id` par un registre unique par page attaché à `globalThis` sous `Symbol.for('udixio.motion.layout@1')`, règle d'unicité des clés, purge au démontage. Verdicts de M2-01 : valide 3 (M1, M3, M4) · neutre 0 · conteste 1 (M5).
  - M4-05 : registre versionné sous `Symbol.for('udixio.motion')` avec version majeure ; dégradation vers un noyau local avec avertissement en dev si la version est incompatible ; annulation des handles au `astro:after-swap`. Verdicts de M4-05 : valide 3 (M2, M3, M5) · neutre 0 · conteste 1 (M1).
- Avantages : une seule passe DOM quel que soit le nombre d'îles Astro ; aucun contexte partagé requis, la clé sert de contrat ; prépare F8 (`layoutId`) entre îles ; [M1] une passe DOM quel que soit le nombre d'îles ; [M2] singleton versionne avec compteur de references : une seule boucle de layout entre iles ; [M3] singleton versionné unique pour scanner et observateurs : une passe DOM par page ; [M4] contrat unique entre îles, compteur de références couvre le démontage
- Limites : compteur de références à tenir (fuite si un unmount est manqué) ; deux majeures actives = deux scans ; état global à réinitialiser entre tests ; [M1] compteur de références : fuite si un unmount est manqué ; [M2] compteur a tenir, fuite si un unmount manque ; deux majeures = deux scans ; [M3] compteur de références : une fuite si un unmount est manqué ; à relier à M4-10 ; [M4] compteur à tenir : un unmount manqué fuit, et avec transition:persist le swap ne doit pas être lu comme un démontage
- Conflits : M1-04, M1-06, M2-05, M2-07, M4-02, M5-05, M5-06
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-08 — Handle unique : même surface WAAPI ou anime.js, reprise par vitesse courante [fusionne : M4-08 · G8]
- Énoncé / Familles / Nature : chaque animation retourne un `MotionHandle` (`play`, `pause`, `reverse`, `seek`, `cancel`, et `finished`, une promesse qui se résout en `'finished'` ou `'cancelled'` sans jamais rejeter) ; l'implémentation (WAAPI `Animation` ou anime.js) est interne ; une reprise lit valeur et vitesse courantes avant de créer la suivante. — Familles : F3, F8, F9, F12, F13 — Nature : instance
- variantes :
  - M4-08 : séquence TS pilotée par handle lié à l'instance ; `finished` résolu avec un statut explicite `completed` / `cancelled` (sans rejet, y compris au démontage) ; liaison framework (ref React, `DestroyRef` Angular, valeur d'attachment Svelte). Seul le statut est proposé vers M5-08 (G8). Verdicts de M4-08 : valide 4 (M1, M2, M3, M5) · neutre 0 · conteste 0.
- Avantages : un contrat de contrôle quel que soit le moteur ; `await` remplace les callbacks ; aucune promesse rejetée non gérée ; [M1] contrat de contrôle identique, `finished` sans rejet ; [M2] handle commun ; la reprise lit valeur et vitesse courantes, coeur de M2-08 ; [M3] `finished` ne rejette jamais, contrat de contrôle unique ; [M4] await identique dans les trois frameworks, aucune promesse rejetée
- Limites : sémantiques différentes (inversion et `playbackRate` négatif, `finish` contre `complete`) à normaliser ; persistance des styles (`commitStyles`) à trancher ; vitesse conservée seulement pour les propriétés numériques ; [M1] vitesse conservée seulement pour le numérique ; `commitStyles` à trancher ; [M2] vitesse conservee seulement pour les proprietes numeriques ; `commitStyles` a trancher pour les sorties ; [M3] vitesse conservée seulement pour les propriétés numériques : une reprise de M3-05 sur une propriété non numérique saute ; [M4] reprise par vitesse non transmise pour les springs CSS
- Conflits : M1-05, M4-01, M4-03, M5-01, M5-03
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-09 — Réduction de mouvement classée par donnée, pas par effet [fusionne : —]
- Énoncé / Familles / Nature : chaque token et chaque verbe porte `intent: 'essential' | 'decorative'` ; sous `prefers-reduced-motion: reduce`, les décoratifs passent à durée nulle ou à un fondu seul, et les boucles s'arrêtent avec un contrôle pause exposé (WCAG 2.2.2) ; un seul prédicat régit la règle CSS et le runtime. — Familles : F2, F3, F4, F20, F24 — Nature : les deux
- Avantages : classification faite une fois, appliquée partout ; F24 satisfait les exigences de pause sans logique par composant ; un lint peut imposer l'intention sur tout nouveau token ; [M1] classification faite une fois, lint possible ; [M2] intention `essential` / `decorative` par token : le mouvement decoratif peut etre fige, l'essentiel (retour de focus) garde ; [M3] intention par donnée : une règle unique pour les effets de défilement (`scrub` décoratif = position neutre) ; [M4] classification unique, pause WCAG 2.2.2 exposée
- Limites : décoratif contre essentiel est un jugement sujet à débat ; deux implémentations (CSS et JS) à garder identiques ; un fondu de remplacement peut rester trop fort pour certains utilisateurs ; [M1] décoratif contre essentiel reste subjectif ; deux implémentations à garder identiques ; [M2] jugement sujet a debat ; deux implementations a garder identiques ; [M3] décoratif contre essentiel reste un jugement ; deux implémentations à garder identiques ; [M4] jugement décoratif/essentiel sujet à débat ; deux implémentations à garder identiques
- Conflits : M1-10, M4-09, M5-03, M5-04
- Verdicts : valide 4 (M1, M2, M3, M4) · neutre 0 · conteste 0

### M5-10 — Manifeste machine généré pour agents et documentation [fusionne : —]
- Énoncé / Familles / Nature : le build produit `llms.txt` et `motion.manifest.json` à partir des types exportés et des tests : verbes, options, valeurs de tokens, familles couvertes, nature, coût ; les erreurs de dev citent l'identifiant de l'entrée du manifeste ; la doc humaine en est une vue. — Familles : F21, F22, F23 — Nature : global
- Avantages : un agent apprend le vocabulaire sans lire le code ; une seule source pour la doc, les erreurs et l'agent ; les noms inconnus sont détectés et expliqués ; [M1] un agent apprend le vocabulaire sans lire le code ; [M2] manifeste qui decrit les verbes layout et presence pour les agents ; [M3] la nature (global / instance) et le repli d'une option de vue deviennent lisibles par un agent ; [M4] agents et docs lisent la même source ; les erreurs de dev citent l'id
- Limites : à régénérer et vérifier en CI sous peine de dérive ; un manifeste trop long consomme le budget de contexte d'un agent ; fige la surface publique à partir de sa première version ; [M1] dérive si non régénéré en CI ; manifeste long pour le contexte ; [M2] regeneration en CI, derive si non verifiee ; [M3] manifeste régénéré en CI, et trop long il consomme le budget d'un agent ; [M4] manifeste à ne pas embarquer dans le bundle client ; à régénérer en CI
- Conflits : M5-01, M5-06
- Verdicts : valide 0 · neutre 4 · conteste 0

---

## 3. Contradictions ouvertes

23 paires désignées comme contradictoires par une annotation. 6 sont couvertes par une fusion retenue (les deux ids sont résolus dans le même bloc, ou l'un des deux est fusionné dans l'autre) ; 17 restent ouvertes.

1. **M3-02 ↔ M4-04** — (M1, M2) état « pending » posé en JS à l'inscription, contre l'état d'entrée en CSS de M4-04. *couverte : G12.*
2. **M2-01 ↔ M4-05** — (M1, M5) clés `Symbol.for` distinctes (`udixio.motion.layout@1` contre `udixio.motion`) pour un même registre : « deux registres pour un rôle ». *couverte : G1.*
3. **M2-01 ↔ M5-07** — (M1) clé `udixio.motion.layout@1` contre `udixio.motion@1`, pour un même registre. *couverte : G1.*
4. **M4-05 ↔ M5-07** — (M1) clé `udixio.motion` contre `udixio.motion@1`, pour un même registre. *couverte : G1.*
5. **M1-02 ↔ M5-03** — (M1, M2) table `linear()` calculée au build (M5-03) contre à la création (M1-02) ; « se contredisent ». *couverte : G11 (fusion partielle).*
6. **M5-03 ↔ M5-08** — (M1, M3, M4) `linear()` ne conserve pas la vitesse ; la reprise à vitesse courante de M5-08 n'est pas transmise pour les springs CSS. *ouverte.*
7. **M5-03 ↔ M2-08** — (M2) « pas de vitesse à la reprise (M2-08) ». *ouverte.*
8. **M1-01 ↔ M2-08** — (M2) WAAPI n'expose pas la vitesse « exigée par M2-08 » en cas d'interruption en vol. *ouverte.*
9. **M1-02 ↔ M2-08** — (M2) table figée : une reprise en vol ne transporte pas la vitesse du ressort. *ouverte.*
10. **M2-04 ↔ M2-08** — (M1, M3) VT native non interruptible en vol (« la reprise doit être refusée, pas simulée ») contre retarget depuis la position rendue. *ouverte.*
11. **M1-10 ↔ M4-09** — (M4, M5) réduction résolue à la compilation (M1-10), jugée impossible pour une préférence lue à l'exécution, sans réaction au changement (M4-09). *couverte : G7 (M1-10 fusionné dans M4-09) ; M4 conteste cette fusion.*
12. **M4-09 ↔ M5-09** — (M5) store « blanket » (durées nulles sans distinction essentiel / décoratif) contredit la classification par intention de M5-09. *ouverte (M5-09 non fusionné).*
13. **M3-09 ↔ M4-03** — (M4) présence figée hors écran retarde la promesse de fin, « donc le contrat `finished` de M4-03 ». *ouverte.*
14. **M4-06 ↔ M3-01** — (M2) « un seul IntersectionObserver par page » contredit M3-01 (un par couple marge/seuil). *ouverte (M4-06 fusionné dans M3-03 ; M3-01 non traité).*
15. **M4-01 ↔ M5-08** — (M1, M2) la forme du handle `{finished, cancel, dispose}` diverge de M5-08. *ouverte (M4-01 non fusionné ; alignement proposé).*
16. **M4-02 ↔ M4-05** — (M1, M2, M3) un WeakMap par copie de module « casse l'idempotence entre îles ». *ouverte (M4-05 fusionné dans M5-07 ; M4-02 non traité).*
17. **M2-07 ↔ M2-01** — (M4) une paire inter-îles devient impossible hors portée, « ce qui contredit M2-01 pour les îles ». *ouverte.*
18. **M3-08 ↔ M1-08** — (M5) listener par document et `@property` requis : « contredit M1-08 sur le JS par frame ». *ouverte (R1 et R2 non retenus).*
19. **M3-04 ↔ M5-04** — (M1 « ne peut pas » ; M5 « contraint ») une classe Tailwind ne peut pas inscrire un élément `udx-view`, contrairement au plugin Tailwind CSS-first. *ouverte.*
20. **M3-04 ↔ M5-02** — (M1 « ne peut pas » ; M5 « contraint ») même constat pour la grammaire `data-motion` avec classes Tailwind. *ouverte.*
21. **M2-09 ↔ M2-03** — (M3) « taille contre scale » : hauteur animée par taille réelle contre correction par `scale`. *ouverte.*
22. **M1-09 ↔ M4-07** — (M2, M5) deux chemins pour F14 (écriture DOM contre valeur réactive), « à trancher ». *ouverte (chevauchement non fusionné).*
23. **M5-05 ↔ M5-07** — (M3) « chargement par page contre singleton ». *ouverte.*
