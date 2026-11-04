# M3 — Annotations sur les choix M1, M2, M4, M5 (R14)

Angle : runtime global, observateurs, valeurs, scopes, budgets, chargement. Verdict « valide » = compatible avec M3-R01 à M3-R10 ; « conteste » = désaccord de fond avec un choix M3 ; « neutre » = sans enjeu pour M3 (doublon ou hors domaine). Pas de nouveau choix.

## Annotations (40 choix)

- M1-R01 : valide — + chorégraphie compilée une fois, offsets absolus, handle unique / − `data-motion-part` unique par racine, segment dans une île sans registre non sérialisable / conflits: M2-R05, M5-R05 (syntaxe `at`), M5-R06 (`data-motion-step`) / cohérence: exception: `data-motion-part` nouveau attribut
- M1-R02 : valide — + délai en CSS ou WAAPI, aucun coût par frame, pas de setTimeout / − `sibling-index()` récent, ordre DOM différent de l'ordre visuel / conflits: M2-R06 (rang visuel mesuré) / cohérence: ok
- M1-R03 : conteste — + lâcher en ressort exact, clavier sur le même chemin layout / − `reorder` présenté comme verbe alors que M2-R01 et M5-R07 le sortent des verbes ; vitesse estimée par moindres carrés, autre méthode que M3-R09 / conflits: M2-R01, M5-R07, M2-R02, M3-R09 / cohérence: exception: `reorder` verbe de geste, contredit M2-R01
- M1-R04 : valide — + découpage après polices, source en `sr-only`, `aria-hidden` sur les morceaux, domaine fermé / − copie `sr-only` double le texte, `words` inadapté au CJK / conflits: M4-R03 (mécanisme framework), M2-R08, M5-R10 (`aria-label`) / cohérence: exception: copie `sr-only` déclarée
- M1-R05 : valide — + tracé sans mesure JS (`pathLength`), trajectoire native, morphing exact / − `stroke-dashoffset` peint sur le thread principal / conflits: M4-R09 (propriété possédée par le runtime) / cohérence: exception: WAAPI non compositable, déclarée
- M1-R06 : valide — + une source pour CSS, TS et Tailwind, ressorts exprimés une fois / − valeurs M3 à saisir depuis la source officielle / conflits: M5-R01, M5-R02 (doublons) / cohérence: ok
- M1-R07 : conteste — + cellule écrite par la frame, compteur formaté, SSR à la valeur finale / − écriture sur la racine invalide le style de tous les descendants / conflits: M3-R01 et M4-R05 (écriture sur les cibles ou la portée la plus petite) / cohérence: ok
- M1-R08 : valide — + compilation par breakpoint, un `matchMedia` par palier, `scope.dispose()` au démontage / − assimile `scope` à `inspect()` alors que ce sont deux notions (registre et diagnostic) / conflits: M3-R05, M3-R06, M2-R09 / cohérence: ok
- M1-R09 : valide — + noyau sans moteur, anime chargé à la demande, pause unique hors vue et hors onglet / − import retardé peut montrer l'état initial / conflits: M3-R04 et M2-R10 (déclencheur : `pointerenter` ou intersection contre idle) / cohérence: ok
- M1-R10 : valide — + un seul chemin de test, secondes et millisecondes unifiées / − douze fichiers à rebasculer avec test de parité (ressort Motion et ressort CSS ne sont pas identiques) / conflits: M2-R07, M4-R01 (même migration), M4-R02 / cohérence: ok
- M2-R01 : valide — + pas de huitième verbe, geste réutilisable, valeurs lisibles sans re-rendu / − une valeur écrite à chaque frame coûte une lecture et une écriture / conflits: M5-R07 (même primitive), M4-R08 / cohérence: exception: `data-motion-gesture` est une référence nouvelle, déclarée au manifeste
- M2-R02 : conteste — + reprise sans à-coup, anime calcule déjà la vitesse / − la vitesse vient d'anime `Draggable`, pas du pointeur ; deux sources de vitesse au lieu d'une / conflits: M1-R03, M3-R09 / cohérence: exception: un geste impose anime.js même si WAAPI est disponible
- M2-R03 : valide — + WCAG 2.5.7, 2.1.1 et 2.5.1 ; champ `alternative` obligatoire, erreur de build / − le déplacement clavier n'a pas d'animation sous réduction de mouvement / conflits: M4-R08 (qui gère les flèches), M5-R08 (même garde-fou) / cohérence: exception: `essential`, consignée au manifeste
- M2-R04 : valide — + une règle pour souris, tactile et clavier ; le tri reste une donnée / − `commit="live"` modifie le DOM pendant le geste (focus, sélection) / conflits: M1-R03 et M5-R07 (statut de `reorder`) / cohérence: exception: pas de `Reorder` de Motion, écarté pour son absence de clavier
- M2-R05 : conteste — + même syntaxe en TS et en HTML, fonctionne entre îles / − `at` numérique (`'+=0.1'`) contredit « jamais de millisecondes » de M1-R01 et les tokens de M5-R05 / conflits: M1-R01, M5-R05, M5-R06, M4-R07 / cohérence: exception: `data-motion-sequence` et `data-motion-step` nouveaux, non alignés sur `data-motion-part`
- M2-R06 : conteste — + plafond de durée, ordre suivi par l'utilisateur (grille, RTL), règle testable / − mesurer le rang visuel coûte une lecture de layout par liste, à chaque cascade / conflits: M1-R02, M4-R07 / cohérence: ok
- M2-R07 : valide — + une seule surface à tester, retrait des types Motion publics / − migration progressive, retrait de `transition` breaking (D2) / conflits: M1-R10, M4-R01, M4-R02 / cohérence: ok
- M2-R08 : conteste — + lecture non doublée, texte intact sans JavaScript, `Intl.Segmenter` pour les écritures non latines / − `aria-label` sur un conteneur générique n'est pas fiable (ARIA 1.2 interdit de nommer un élément `generic`, à vérifier) ; brouillage repoussé hors v1 / conflits: M1-R04, M3-R10, M4-R03, M4-R04, M5-R10 / cohérence: exception: écriture runtime d'`aria-label`, à inscrire au manifeste
- M2-R09 : valide — + invalidation par ResizeObserver, pas de FLIP parasite au redimensionnement, nettoyage groupé / − geste actif pendant un changement de breakpoint : règle à fixer / conflits: M1-R08, M3-R06 (même objet) / cohérence: ok
- M2-R10 : valide — + pas de `Draggable` sans geste, une copie par page entre îles / − premier tactile sans `pointerenter` paie la latence de chargement / conflits: M1-R09, M3-R04 (politique de préchargement) / cohérence: exception: déclencheur d'intention, déclaré
- M4-R01 : valide — + les composants sont le premier utilisateur de la surface, tests moquent `motion()` / − chaque `udx-*` devient une API publique à maintenir / conflits: M1-R10, M2-R07 (même migration) / cohérence: ok
- M4-R02 : valide — + une prop, une unité, parité React, Angular et Svelte / − rupture de toutes les liaisons, balayage obligatoire d'`apps/doc` / conflits: M2-R07 (`data-motion-<option>` contre prop `motion`), M1-R10 / cohérence: exception: prop `motion` au lieu de `transition`, déclarée
- M4-R03 : conteste — + le SSR voit les morceaux, pas de nœud intrus pour les lignes / − découpage fait par le framework, contre le « découpage après hydratation » retenu par M1-R04, M2-R08, M3-R10 / conflits: M1-R04, M2-R08, M3-R10, M5-R10 / cohérence: exception: copie `sr-only` (déclarée en M1-R04)
- M4-R04 : valide — + zéro re-rendu pendant le brouillage, texte final en `sr-only`, pas de région `aria-live` / − `textContent` efface une sélection en cours / conflits: M1-R04 (même brouillage), M2-R08 (brouillage hors v1) / cohérence: ok
- M4-R05 : valide — + canal CSS pour le continu, store pour le discret, même nom dans les cinq formes / − variable sur la racine de portée invalide les descendants / conflits: M1-R07 (placement), M3-R01 (cibles) / cohérence: ok
- M4-R06 : valide — + SSR à la valeur finale, `<data>` comme valeur machine, `Intl` identique serveur et client / − une locale différente entre serveur et client casse l'hydratation / conflits: M1-R07 (`data-motion-value` contre `<data>`), M3-R02 (même objet) / cohérence: ok
- M4-R07 : valide — + rang DOM lu sans layout, ordre de montage stable entre frameworks / − rang DOM ≠ rang visuel (`order`, `row-reverse`) / conflits: M2-R06 (rang visuel) / cohérence: ok
- M4-R08 : valide — + aucun re-rendu pendant le glissement, vitesse exacte côté JS / − vitesse sur 100 ms bruitée ; le runtime ne gère pas les flèches / conflits: M2-R03 (qui gère le clavier), M5-R07 / cohérence: ok
- M4-R09 : valide — + tracé sans JS et sans saut au SSR, seul le morphing charge anime / − `stroke-dashoffset` non compositable ; `morphTo` exige le même nombre de points / conflits: M1-R05 / cohérence: exception: propriété possédée par le runtime, nouvelle règle
- M4-R10 : valide — + import sans effet de bord (Astro, Angular SSR, SvelteKit), `motion(el, spec)` idempotent par élément, cleanup dans chaque forme / − `import()` retarde le premier frame ; une `key` React qui change crée une nouvelle portée / conflits: M3-R04, M3-R05, M1-R09 / cohérence: ok
- M5-R01 : neutre — + une valeur par fichier, lue par CSS, TS et Tailwind / − `var()` dans `@theme` à vérifier au build / conflits: M1-R06 (doublon) / cohérence: ok
- M5-R02 : valide — + ressort source, courbes legacy en repli déclaré / − valeurs à recouper sur la page M3 complète / conflits: M1-R06 (doublon) / cohérence: exception: repli dérivé au build, déclaré
- M5-R03 : valide — + `llms.txt` et manifeste produits au build, un seul contrat / − `llms.txt` grossit avec les fiches / conflits: aucun connu / cohérence: ok
- M5-R04 : valide — + un agent valide avant d'écrire, un seul jeu de codes d'erreur / − une définition construite à l'exécution échappe à la validation / conflits: aucun connu / cohérence: ok
- M5-R05 : valide — + `after` inconnu = erreur de type, aucun `setTimeout`, handle commun / − séquences longues difficiles à relire / conflits: M1-R01, M2-R05, M4-R07 (même objet) / cohérence: exception: `after` et `with`, nouveautés justifiées
- M5-R06 : valide — + même graphe dans les cinq formes, HTML en référence seule / − le HTML pur dépend d'une définition chargée / conflits: M2-R05 et M1-R01 (`data-motion-step` contre `data-motion-part`) / cohérence: exception: `data-motion-sequence` et `data-motion-step` sont des références
- M5-R07 : valide — + aucun verbe nouveau, `reorder` = geste + `layout` / − l'inertie demande un calcul par frame / conflits: M1-R03 (statut verbe), M2-R01 (même primitive) / cohérence: exception: `gesture` comme primitive, justifiée
- M5-R08 : valide — + passe par les garde-fous (S10), un agent ne peut pas l'oublier / − le lint vérifie la présence, pas le fonctionnement / conflits: M2-R03 (doublon), M4-R08 / cohérence: ok
- M5-R09 : valide — + même nom pour curseur, parallaxe et compteur, aucun re-rendu / − une valeur lue par beaucoup d'abonnés coûte à chaque frame / conflits: M1-R07, M3-R01, M4-R05 / cohérence: ok
- M5-R10 : conteste — + lecture du texte entier une fois, SSR sert le texte source / − `aria-label` sur le conteneur (même défaut que M2-R08), `split` ajouté comme option de `reveal` / conflits: M1-R04, M2-R08, M3-R10, M4-R03 / cohérence: exception: fragments en `stagger`, nouveauté à justifier

## Doublons à fusionner

- Texte découpé : garder M1-R04 ; fusionner M2-R08, M3-R10, M5-R10 et le brouillage de M4-R04 ; M4-R03 reste à trancher (rendu par le framework contre découpage après hydratation).
- Valeurs réactives : garder M1-R07 ; fusionner M3-R01, M4-R05, M5-R09 (placement sur les cibles à trancher, voir M1-R07).
- Compteurs : garder M4-R06 ; fusionner M3-R02 (et la partie compteur de M1-R07).
- Tokens de mouvement : garder M1-R06 ; fusionner M5-R01 et M5-R02.
- Chorégraphie : garder M1-R01 ; fusionner M5-R05 et M5-R06 ; retirer de M2-R05 la syntaxe `at` numérique ; rattacher M4-R07.
- Cascade de liste : garder M1-R02 ; fusionner M2-R06 (rang visuel en option).
- Gestes, définition : garder M2-R01 ; fusionner M5-R07 et M4-R08 (partie valeur de geste).
- Vitesse et relâchement : garder M1-R03 (sans le verbe `reorder`) ; fusionner M2-R02 et M3-R09.
- Alternative clavier : garder M2-R03 ; fusionner M5-R08 et la partie alternative de M4-R08.
- Reorder : garder M2-R04 ; fusionner la partie `reorder` de M1-R03 et M5-R07.
- Usage interne : garder M1-R10 ; fusionner M2-R07 et M4-R01.
- Chargement à la demande : garder M1-R09 ; fusionner M3-R04, M2-R10 et la partie `import()` de M4-R10.
- Responsive et portée : garder M1-R08 ; fusionner M2-R09, M3-R05, M3-R06 et la portée de M4-R10.
- SVG : garder M1-R05 ; fusionner M4-R09 (règle de propriété possédée par le runtime).
