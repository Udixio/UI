# M5 — Annotations sur les choix R14 (M1 à M4)

Verdicts : « valide » = cohérent avec les choix M5 (R01–R10) et la spec §8.0–8.1 bis ; « conteste » = conflit à arbitrer, pas un rejet ; « neutre » = sans enjeu propre pour l'API. Les ids M5 cités sont ceux de `M5-choix.md`.

## M1 (moteur et rendu)

- M1-R01 : valide — + une définition, deux écritures ; seek et reverse exacts / − `part` unique par racine ; cible en île sans registre non sérialisable / conflits: M2-R05, M4-R07, M5-R05, M5-R06 (attribut racine, `at` contre `after`/`with`) / cohérence: exception: `data-motion="<nom>"` sur la racine et `data-motion-part`, à aligner sur M2-R05
- M1-R02 : conteste — + cascade native sans JS quand le navigateur l'accepte / − `sibling-index()` suit l'ordre DOM, pas l'ordre visuel ; Baseline annoncée 2026-08-18 contre absence signalée en M2-R06 à réconcilier / conflits: M2-R06, M4-R07 / cohérence: ok (token `stagger` partagé)
- M1-R03 : conteste — + vitesse exacte car le ressort est en JS ; clavier sur le même chemin de layout / − fait de `reorder` un verbe, contre V08 et M2-R01 ; geste « non déclaratif » contredit M2-R01 et M4-R08 / conflits: M2-R01, M2-R02, M4-R08, M5-R07 / cohérence: exception: drag libre sans rendu réduit (déclarée)
- M1-R04 : valide — + le lecteur lit la phrase une fois ; pas de texte découpé avant hydratation / − copie `sr-only` qui double le texte ; `words` inadapté au CJK / conflits: M2-R08 (`aria-label` contre `sr-only`), M3-R10, M4-R03, M5-R10 (`chars` contre `letters`) / cohérence: exception: copie `sr-only` (déclarée)
- M1-R05 : conteste — + tracé sans mesure JS (`pathLength`) ; trajectoire sans calcul par frame / − affirme que `morphTo` rééchantillonne, M4-R09 exige le même nombre de points : contradiction factuelle / conflits: M4-R09, M3-R08 (`stroke-dashoffset` sur le thread principal) / cohérence: exception: WAAPI non compositable (déclarée)
- M1-R06 : valide — + un ressort exprimé une fois pour CSS, JS et reprise / − valeurs M3 à saisir, sources tierces divergentes ; `linear()` absent des vieux Chrome / conflits: M5-R01 (préfixe Tailwind `duration-udx-*` contre alias `--duration-*`), M5-R02 (repli legacy à ajouter) / cohérence: ok (`--udx-motion-*`, V07)
- M1-R07 : conteste — + cellule partagée, zéro re-rendu ; compteur formaté / − écrit sur la racine, donc invalide les descendants ; préfixe `--udx-value-<nom>` contre `--udx-<nom>` / conflits: M3-R01, M4-R05, M5-R09 / cohérence: exception: compteur non `aria-live` (déclarée)
- M1-R08 : conteste — + animation par breakpoint sans JS supplémentaire ; scope pour nettoyage groupé / − recompile en pleine animation, peut sauter ; `dispose()` contre `revert()` / conflits: M3-R05, M3-R06 (reconstruction au palier contre compilation), M2-R09 / cohérence: ok
- M1-R09 : valide — + une page sans backend JS ne charge pas anime ; pause uniforme / − import retardé = état initial visible ; préchargement sur `pointerenter` contre idle (M3-R04) / conflits: M3-R04, M2-R10 / cohérence: ok
- M1-R10 : valide — + un seul chemin de test ; fin du mélange secondes et millisecondes / − 12 fichiers à rebasculer ; rupture du type `Transition` / conflits: M2-R07, M4-R01 (même périmètre), M4-R02 / cohérence: exception: ressort du Button gardé avec paramètres physiques (déclarée)

## M2 (gestes, listes, chorégraphie, usage interne)

- M2-R01 : valide — + pas de huitième verbe ; définition nommée réutilisable / − valeur écrite à chaque frame ; valeur qui ne survit pas au relâchement / conflits: M1-R03, M4-R08 (geste = `defineValue` contre `defineGesture`), M5-R07 / cohérence: exception: source sans verbe, déclarée au manifeste
- M2-R02 : valide — + reprise sans à-coup ; anime calcule déjà la vitesse / − suivi du doigt coûte du JS ; `estimated` sur appareils lents / conflits: M1-R03, M3-R09, M4-R08 (trois fenêtres de vitesse différentes), M5-R07 / cohérence: exception: un geste impose anime même si WAAPI existe (déclarée)
- M2-R03 : valide — + WCAG 2.5.7, 2.1.1 et 2.5.1 ; alternative typée et obligatoire / − deux chemins à tester ; poignée 24 px à la charge de l'auteur / conflits: M5-R08 (exception `essential` contre « décoratif »), M3-R09 (alternative vue comme action du handle) / cohérence: exception: `essential` consigné au manifeste
- M2-R04 : valide — + tri = donnée, donc testable ; seuil de position et de vitesse / − `commit="live"` modifie le DOM pendant le geste ; grilles 2D non couvertes / conflits: M1-R03 (`reorder` verbe) / cohérence: exception: option `commit` nouvelle, à inscrire au V03
- M2-R05 : valide — + même syntaxe en TS et en HTML ; fonctionne entre îles ; un seul handle / − enfant ajouté pendant la séquence non couvert ; temps relatifs qui dérivent / conflits: M1-R01, M4-R07, M5-R05 (`at` contre `after`/`with`), M5-R06 / cohérence: exception: timeline anime non portable (§4.6)
- M2-R06 : valide — + suit le rang visuel, donc grilles et RTL ; plafond de durée testable / − mesurer le rang coûte une lecture par liste ; RTL à trancher / conflits: M1-R02, M4-R07 (rang DOM), M3-R03 (`--udx-motion-index`) / cohérence: exception: token nouveau `--udx-motion-stagger-max`, à inscrire au manifeste
- M2-R07 : valide — + une seule surface à tester ; retire les types Motion publics / − migration progressive ; retrait de `transition` = breaking D2 / conflits: M1-R10, M4-R01, M4-R02 / cohérence: exception: props `transition` remplacées par `data-motion-<option>` ou un nom (D2)
- M2-R08 : valide — + le lecteur annonce une phrase, pas des lettres ; HTML intact sans JS ; reflow pour `lines` / − `lines` exige une mesure ; `chars` faux pour les ligatures / conflits: M1-R04, M3-R10, M4-R03 (copie `sr-only` contre `aria-label` ; pré-découpe SSR contre découpage après hydratation), M4-R04 (brouillage hors v1 contre prévu) / cohérence: exception: `aria-label` écrit par le runtime sur un élément auteur (à inscrire, comme `data-presence`)
- M2-R09 : valide — + pas de FLIP parasite au redimensionnement ; nettoyage groupé / − geste actif pendant un changement de breakpoint à fixer ; les container queries ne voient pas la position / conflits: M1-R08, M3-R06 / cohérence: ok
- M2-R10 : valide — + une page sans geste ne charge pas `Draggable` ; une copie entre îles / − premier tactile sans `pointerenter` paie la latence ; anime inliné dans `dist` / conflits: M1-R09, M3-R04 / cohérence: exception: déclencheur d'intention, au lieu de « chargé au montage » (déclarée)

## M3 (runtime, observateurs, valeurs, performance)

- M3-R01 : valide — + zéro re-rendu par frame dans les cinq formes ; `transform` reste au compositeur / − variable sur la racine invalide les descendants, donc écrire sur les cibles ; seuil franchi = re-rendu / conflits: M1-R07, M4-R05 (racine contre cibles), M5-R09 (`source`, `range`) / cohérence: exception: `data-motion-value`, référence seule, à inscrire
- M3-R02 : valide — + pas de re-rendu ; lisible et accessible sans JS / − CSS n'interpole pas un nombre ; valeur finale visible avant le départ / conflits: M4-R06, M1-R07 / cohérence: ok (durées en ms, corrige E1 §2.4)
- M3-R03 : valide — + un seul observateur par page ; onglet caché = zéro frame ; raison de pause lisible / − entrée qui pousse l'élément hors écran ; pas de rattrapage au retour de visibilité / conflits: M2-R06, M4-R07, M1-R02 (index de cascade) / cohérence: exception: `reveal` avec `once` se désabonne (déclarée)
- M3-R04 : valide — + une copie d'anime par page ; verbe absent = aucun octet / − HTML pur sans build : pas de `modulepreload` ; délai d'idle à fixer / conflits: M1-R09, M2-R10, M4-R10 (préchargement) / cohérence: exception: cache par majeure, coexistence déclarée (M5-S06)
- M3-R05 : valide — + pas de fuite dans les îles Astro ; un seul point de nettoyage / − élagage paresseux ; scope retiré pendant onglet caché élagué au retour / conflits: M1-R08 (`dispose()` contre `revert()`), M4-R10 (cleanup renvoyé) / cohérence: exception: registre étendu à WAAPI et observateurs (à vérifier en S1)
- M3-R06 : valide — + pas de reconstruction pendant un redimensionnement ; paliers identiques à Tailwind / − valeur figée dans un keyframe WAAPI ; reconstruction perd la position sauf `carry` / conflits: M1-R08, M2-R09 / cohérence: exception: palier de conteneur par `ResizeObserver`, hors Tailwind (déclarée)
- M3-R07 : conteste — + une source pour CSS et JS ; aucune garde par composant / − `--udx-motion-scale` à 0 rend `disappear` instantané, contraire au fondu acté en §8.1 ; `SmoothScroll` sans garde / conflits: M5-V02 (rendu réduit par verbe), M1-R03 (drag sans rendu réduit) / cohérence: exception: jeton CSS unique, nouveauté déclarée
- M3-R08 : valide — + budget visible et testable ; tracé SVG sans JS / − `allow-paint` est une échappatoire ; seuil provisoire / conflits: M1-R05, M4-R09 (`stroke-dashoffset` non compositable), M5-L02 / cohérence: exception: spinner circulaire via `allow-paint` (déclarée)
- M3-R09 : conteste — + vitesse pointeur indépendante du moteur ; un écouteur par racine / − alternative clavier vue comme action du handle, contraire à M2-R03 et M5-R08 (déclarée dans le geste, erreur de build) ; `getCoalescedEvents` non Baseline / conflits: M2-R02, M1-R03, M4-R08, M5-R08 / cohérence: exception: clavier = action (contestée)
- M3-R10 : valide — + pas de découpage faux après chargement de police ; recalcul borné à la largeur / − `fonts.ready` ne couvre pas une police tardive ; seuil de mots à fixer / conflits: M1-R04, M2-R08, M4-R03 (`sr-only` contre `aria-label`) / cohérence: exception: découpage ponctuel, sans abonné (déclarée)

## M4 (frameworks, îles, SSR)

- M4-R01 : valide — + les composants sont le premier utilisateur de la surface ; lint interdit tout chemin hors `exports` / − chaque `udx-*` devient une API publique ; 19 fichiers à migrer / conflits: M1-R10, M2-R07 (même périmètre) / cohérence: ok (C11)
- M4-R02 : valide — + une prop, une unité ; parité React, Angular, Svelte / − rupture de toutes les liaisons ; `apps/doc` non typée, balayage grep obligatoire / conflits: M1-R10, M2-R07, M5-R02 (`spring-expressive` ne suit pas les rôles spatial et effects) / cohérence: exception: prop `motion` sur les composants, distincte de `useMotion(spec)`
- M4-R03 : conteste — + SSR et sans JS voient le texte entier ; pas de nœud intrus pour les lignes / − pré-découpe au build ou dans le JSX contredit M2-R08 (texte intact, découpage après hydratation) et le `splitText` unique (M5-R10) ; `data-motion-line` hors liste fermée / conflits: M2-R08, M1-R04, M3-R10, M5-R10 / cohérence: exception: `data-motion-line` à inscrire au V03
- M4-R04 : valide — + zéro re-rendu pendant l'animation ; un lecteur n'entend pas vingt états / − `textContent` efface une sélection en cours ; traduction perturbée / conflits: M2-R08 (brouillage hors v1), M4-R03 / cohérence: ok (réduit = état final, F20)
- M4-R05 : valide — + le continu ne déclenche aucun rendu ; même nom de valeur dans les cinq formes / − variable sur la racine invalide les descendants (portée minimale) ; snapshot stable obligatoire / conflits: M1-R07, M3-R01 (racine contre cibles) / cohérence: exception: deux canaux, continu en CSS et discret en store (déclarée)
- M4-R06 : valide — + crawlers, impression et lecteurs lisent le bon chiffre ; `<data>` porte la valeur machine / − locale différente entre serveur et client casse l'hydratation ; compteur à 0 avant hydratation / conflits: M3-R02, M1-R07 / cohérence: ok (`reveal` et valeur finale réduite, comme F4 et F20)
- M4-R07 : conteste — + même ordre dans React, Angular, Svelte et HTML ; un enfant rendu dans une autre île reste ordonné / − le rang DOM diverge du rang visuel (`order`, RTL) et de la lecture ; enfant ajouté pendant la séquence / conflits: M2-R06 (rang visuel), M1-R02 (`sibling-index()`), M2-R05, M5-R05 / cohérence: exception: rang DOM comme source, contraire à M2-R06 pour la cascade
- M4-R08 : conteste — + aucun re-rendu pendant le glissement ; vitesse exacte au relâchement / − geste = `defineValue` sans `defineGesture` ni `alternative` ; `data-motion-gesture` en HTML, refusé par M1-R03 ; le runtime ne gère pas les flèches, exigées par M2-R03 et M5-R08 / conflits: M2-R01, M2-R03, M1-R03, M5-R07, M5-R08 / cohérence: exception: `data-motion-gesture` nouvelle option à inscrire
- M4-R09 : conteste — + tracé sans JS et sans saut au SSR ; seul le morphing charge anime / − `morphTo` exige le même nombre de points, M1-R05 affirme le rééchantillonnage : à trancher ; `d` écrasé par un rendu de framework (à vérifier) / conflits: M1-R05, M3-R08 / cohérence: ok (mêmes verbes, aucune option nouvelle)
- M4-R10 : valide — + une île `client:visible` n'embarque anime qu'à l'hydratation ; StrictMode ne double pas l'animation / − `import()` retarde le premier frame ; le bundle de core inline anime / conflits: M3-R04, M1-R09, M3-R05 (`WeakMap` contre registre) / cohérence: ok

## Doublons à fusionner (groupe → id à garder)

- Séquences : M1-R01, M4-R07, M5-R05, M5-R06 → garder M2-R05 ; arbitrer `at` contre `after`/`with`
- Rang de cascade : M1-R02, M4-R07 → garder M2-R06 (rang visuel) ; `sibling-index()` en repli de M1-R02
- Vitesse et relâchement : M1-R03, M3-R09, M4-R08, M5-R07 → garder M2-R02 ; ajouter l'échantillonnage pointeur de M3-R09
- Modèle du geste : M1-R03, M4-R08, M5-R07 → garder M2-R01 (`defineGesture`, sans verbe)
- Alternative clavier : M1-R03, M3-R09, M5-R08 → garder M2-R03
- Texte : M1-R04, M3-R10, M4-R03, M4-R04, M5-R10 → garder M2-R08 ; trancher `sr-only` contre `aria-label` et le brouillage en v1
- Valeurs continues : M1-R07, M3-R01, M4-R05, M5-R09 → garder M3-R01 (écriture sur les cibles) ; M4-R05 pour le canal discret
- Compteurs : M1-R07 (partie compteur), M3-R02, M4-R06 → garder M4-R06
- Responsive et scopes : M1-R08, M2-R09 → garder M3-R06 ; scope : garder M3-R05 (`revert()`)
- Chargement à la demande : M1-R09, M2-R10, M4-R10 → garder M3-R04
- Usage interne : M1-R10, M2-R07 → garder M4-R01 ; retrait de `transition` : M2-R07, M4-R02 → garder M4-R02
- SVG : M1-R05, M4-R09 → garder M1-R05 ; trancher le rééchantillonnage de `morphTo`, garder la règle de propriété de M4-R09
- Tokens : M1-R06, M5-R01, M5-R02 → garder M1-R06 ; y reporter le repli legacy (M5-R02) et l'espace de noms (M5-R01)
