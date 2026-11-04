# R14 — Annotations de M2 sur les choix de M1, M3, M4, M5

Une ligne par choix des autres experts. Ids des rounds précédents préfixés (R10, R11, R12, R13). Position : valide, conteste ou neutre.

## M1 (moteur et rendu)

- M1-R01 : conteste — +compilation une fois en offsets, seek et reverse exacts / −HTML en `data-motion` racine et `data-motion-part`, `at` contre `after` / `with` de M5 / conflits: M5-R05, M5-R06, M4-R07, M2-R05 / cohérence: exception: noms d'attributs non alignés sur M5-R06
- M1-R02 : conteste — +natif d'abord, repli JS, pas de `setTimeout` / −délai calculé sur l'ordre DOM, pas sur le rang visuel (grille, RTL, `order`) / conflits: M2-R06, M4-R07, R13/M5-L07 / cohérence: exception: source d'ordre DOM, contraire à M2-R06
- M1-R03 : conteste — +vitesse et ressort JS, `velocity.source: exact`, clavier sur le même chemin layout / −`reorder` seul verbe et actions TS non déclaratives : un geste hors manifeste échappe à C5 et au lint (S10) ; deux algorithmes de vitesse / conflits: M2-R01, M2-R02, M2-R03, M3-R09, M5-R07, M5-R08 / cohérence: exception: un verbe de plus, contraire à R12 (sept verbes, M5-V08)
- M1-R04 : valide — +domaine fermé `chars | words | lines`, phase lecture pour le réflow, `fonts.ready` / −copie `sr-only` qui double le texte ; CJK mal servi par `words` / conflits: M3-R10, M4-R03, M5-R10, M2-R08 / cohérence: ok
- M1-R05 : valide — +tracé `pathLength="1"` natif, trajectoire `offset-path`, morphing en repli JS / −`stroke-dashoffset` peint sur le thread principal (M3-R08) ; `offset-path` sans repli ancien / conflits: M3-R08, M4-R09 / cohérence: ok
- M1-R06 : valide — +une source, trois émissions, ressort source et `linear()` dérivé / −source JSON contre TS (M5-R01) ; `duration-udx-*` contre alias `--duration-*` / conflits: M5-R01, M5-R02, M4-R02 / cohérence: ok sur `--udx-motion-*` ; noms d'échelle (`short` contre `short1`) à aligner sur M5-R02
- M1-R07 : conteste — +cellule écrite par la frame, cinq formes, rendu réduit = saut / −variable posée sur la racine invalide tous les descendants (M3-R01 : cibles seules) ; forme `from/to/spring` contre `source/range` (M5-R09) / conflits: M3-R01, M4-R05, M5-R09, M3-R02 / cohérence: exception: racine non justifiée
- M1-R08 : conteste — +compilation par palier, un `matchMedia` par palier, scope comme unité de nettoyage / −« pas de redémarrage » contredit M3-R06 (la reconstruction perd la position sans `carry`) ; `scope.dispose()` contre `revert()` (M3-R05) / conflits: M3-R05, M3-R06, M2-R09 / cohérence: ok
- M1-R09 : valide — +noyau sans moteur, anime chargé par `import()`, budgets en CI, pause unique / −aucun chiffre avant mesure ; import retardé = état initial visible ; anime encore inliné dans `dist` (E1) / conflits: M3-R04, M3-R03, M2-R10 / cohérence: ok ; déclencheurs de préchargement à unifier
- M1-R10 : valide — +les 19 contrôleurs passent par `motion(el, spec)`, faux backend qui respecte le handle / −12 fichiers à reprendre avec test de parité ; rupture D2 / conflits: M4-R01, M4-R02 / cohérence: ok ; exception du ressort Button déclarée

## M3 (runtime, observateurs, valeurs, performance)

- M3-R01 : valide — +écriture DOM sans re-rendu, sur les cibles seules, `transform` au compositeur / −un seuil franchi déclenche un re-rendu, à réserver aux états rares / conflits: M1-R07, M4-R05, M5-R09 / cohérence: ok (`data-motion-value` justifié)
- M3-R02 : valide — +valeur finale lisible sans JS, texte écrit par le runtime, pas d'`aria-live` / −saut à 0 au premier passage à résoudre (à mesurer) ; CSS n'interpole pas un nombre / conflits: M4-R06, M1-R07 / cohérence: ok (ms comme tokens, corrige E1 §2.4)
- M3-R03 : valide — +un `IntersectionObserver` par page, `pauseOnDocumentHidden`, `inspect()` donne la raison de pause / −une entrée qui pousse l'élément hors écran empêche son déclenchement (fait établi) / conflits: M1-R09, R13/M1-04, R11/M5-S09 / cohérence: ok ; `--udx-motion-index` à relier au rang de M2-R06
- M3-R04 : valide — +cache `globalThis` par majeure, un moteur par page, préchargement en trois temps / −HTML pur sans build : pas de `modulepreload` ; délai idle à fixer / conflits: M1-R09, M2-R10 (déclencheurs différents), R10/M5-07 / cohérence: ok (cache par majeure justifié)
- M3-R05 : valide — +registre par racine, élagage paresseux à la frame suivante, pas de `MutationObserver` sur le document / −une racine retirée puis rattachée n'est pas nettoyée (voulu) / conflits: M1-R08 (`dispose` contre `revert`), M4-R10 / cohérence: ok ; `revert()` est le nom d'anime
- M3-R06 : valide — +paliers lus dans le thème, reconstruction au seul changement de palier / −une valeur WAAPI figée jusqu'à reconstruction ; position perdue sans `carry` / conflits: M1-R08, M2-R09 / cohérence: exception: palier de conteneur hors Tailwind, déclarée
- M3-R07 : valide — +un jeton CSS lu une fois par racine, 17 copies de la détection supprimées / −`scale = 0` rend un fondu instantané, contraire au rendu réduit de R12 (`disappear` en fondu) ; Lenis sans garde / conflits: R12/M5-V02 / cohérence: exception: fondus à traiter à part dans `calc()`
- M3-R08 : valide — +lint de paint dans les boucles, avertissement dev, tracé SVG sans JS / −`allow-paint` est une échappatoire ; seuil provisoire / conflits: R11/M5-S10, R13/M5-L02, M1-R05 / cohérence: ok (exception spinner déclarée)
- M3-R09 : valide — +vitesse sur pointeurs coalescés, mesure côté pointeur, indépendante du moteur / −`getCoalescedEvents` sans `pointerId` ni `target`, support Safari à vérifier / conflits: M1-R03 (algorithme), M2-R02, M4-R08 / cohérence: ok ; clavier = action du handle, à réconcilier avec M2-R03
- M3-R10 : valide — +découpage après `fonts.ready` et visibilité, lignes recalculées seulement si leur nombre change, SSR progressif / −`fonts.onloadingdone` non couvert ; mesurer les lignes force un reflow / conflits: M1-R04, M4-R03, M5-R10 / cohérence: ok

## M4 (frameworks, îles, SSR)

- M4-R01 : valide — +les composants sont les premiers utilisateurs de la surface, lint sur `exports` / −chaque `udx-*` devient une API à maintenir ; 19 fichiers à migrer / conflits: M1-R10 / cohérence: ok (applique C11)
- M4-R02 : valide — +une prop `motion` unique, tokens, fin du type `Transition` / −noms de tokens inexistants (`'short2'`, `'spring-expressive'`) ; rupture de toutes les liaisons / conflits: M5-R01, M5-R02, M1-R06, M1-R10 / cohérence: ok sur les clés `data-motion-*` ; noms de tokens à aligner
- M4-R03 : conteste — +SSR et sans JS montrent le texte entier, le framework garde ses enfants / −rend les spans côté framework, contraire à M1-R04, M3-R10 et M5-R10 (découpage après hydratation) ; copie `sr-only` qui double le texte / conflits: M1-R04, M3-R10, M5-R10, M2-R08 / cohérence: ok
- M4-R04 : valide — +brouillage hors rendu, intermédiaires en `aria-hidden`, aucune région `aria-live` / −`textContent` efface la sélection ; traduction automatique perturbée / conflits: M1-R04, M2-R08 (mon choix exclut le brouillage, à corriger) / cohérence: ok
- M4-R05 : valide — +canal CSS pour le continu, store pour le discret / −variable sur la racine de portée (à réduire aux cibles, M3-R01) ; snapshot stable exigé par `useSyncExternalStore` / conflits: M1-R07, M3-R01 / cohérence: ok
- M4-R06 : valide — +le serveur rend la valeur finale formatée, animation après hydratation / −locale identique côté serveur et client requise ; le démarrage à 0 n'est évité qu'au serveur / conflits: M3-R02 / cohérence: ok
- M4-R07 : conteste — +même ordre en React, Angular, Svelte et HTML / −rang DOM différent du rang visuel (`order`, RTL) : M2-R06 retient le rang visuel pour les cascades, le rang DOM ne vaut que pour l'ordre d'une séquence / conflits: M1-R02, M2-R06, M3-R03 / cohérence: exception: rang DOM pour les séquences seulement
- M4-R08 : valide — +source de valeur, `carry`, vitesse exacte, `touch-action` imposé par le geste / −le clavier est confié au composant, alors que M2-R03 et M5-R08 le déclarent dans la définition ; vitesse sur 100 ms bruitée / conflits: M2-R01, M2-R03, M5-R07, M1-R03 / cohérence: ok (`data-motion-gesture` à aligner sur M5-R07)
- M4-R09 : valide — +tracé natif, seul le morphing charge anime, `pathLength` est un attribut SVG standard / −`stroke-dashoffset` non compositable ; un `d` rendu par le framework écrase le morphing (à vérifier) / conflits: M1-R05, M3-R08 / cohérence: ok
- M4-R10 : valide — +import sans effet de bord, portée idempotente, nettoyage par adaptateur / −`import()` retarde la première frame ; une `key` React qui change crée une nouvelle portée / conflits: M3-R05, M1-R08, M5-R06 / cohérence: ok

## M5 (API, DX, outillage)

- M5-R01 : valide — +une source TS, émission CSS, types et `@theme`, `--animate-*` retiré / −source TS contre JSON de M1-R06 ; alias `--duration-*` contre `duration-udx-*` / conflits: M1-R06, M4-R02, R11/M5-S04 / cohérence: ok
- M5-R02 : valide — +ressort source, `cubic-bezier` et `linear()` dérivés, repli legacy déclaré / −valeurs à recouper sur la page M3 complète ; courbe de `fab-motion.ts` absente des tokens / conflits: M1-R06, M5-R01 / cohérence: ok ; échelle `short1` à aligner sur `short` (M1-R06)
- M5-R03 : valide — +un manifeste produit au build (`llms.txt`, JSON), lu par types, lint et MCP / −`llms.txt` grossit avec les fiches ; contrat à versionner / conflits: R11/M5-S10, R13/M5-L09, R13/M5-L10 / cohérence: ok (`llms.txt` et `llms-full.txt` de Motion vérifiés dans R2)
- M5-R04 : valide — +trois outils MCP lus dans le manifeste ; `listComponents` et `getComponentDoc` existent dans `packages/mcp` (vérifié) / −une définition construite à l'exécution échappe à la validation / conflits: M5-R03, R13/M5-L10 / cohérence: ok
- M5-R05 : valide — +étapes nommées, `after` / `with`, décalage en token, handle unique / −séquences longues difficiles à relire ; décalage en tokens peu précis / conflits: M1-R01, M4-R07, M2-R05 (mon exemple `+=0.1` est en temps, à corriger) / cohérence: ok
- M5-R06 : valide — +même graphe dans les cinq formes, HTML référence seule / −HTML dépend d'une définition chargée / conflits: M1-R01 (attributs), M2-R05 / cohérence: ok ; noms d'attributs à unifier avec M1-R01
- M5-R07 : valide — +primitive `gesture` hors verbes, vitesse au handle, `carry` au relâchement / −l'inertie demande un calcul par frame ; sur tactile, `estimated` le plus souvent / conflits: M1-R03 (verbe `reorder`), M4-R08, M2-R01 / cohérence: exception: geste hors vocabulaire de verbes, déclarée (V08)
- M5-R08 : valide — +clavier obligatoire au build, passe par les quatre niveaux de S10 / −vérifie la présence, pas le fonctionnement ; exception décorative à déclarer / conflits: M2-R03, M1-R03, M4-R08 / cohérence: ok
- M5-R09 : valide — +même nom pour curseur, parallaxe et compteur ; source TS seule / −HTML ne lit qu'une valeur déjà enregistrée ; `range` à mettre en token / conflits: M1-R07 (forme différente), M3-R01, M4-R05 / cohérence: ok
- M5-R10 : conteste — +fragments en `stagger`, lignes recalculées par `ResizeObserver` / −`letters` contre `chars` (M1, M2, M4) ; `aria-label` sur un conteneur sans rôle est interdit par ARIA 1.2 ; SSR en texte source, contre M4-R03 / conflits: M1-R04, M4-R03, M2-R08, M3-R10 / cohérence: ok sur `data-motion-split` ; mot-clé fermé à aligner

## Doublons à fusionner

Groupe, puis id à garder (les autres ids du groupe sont à retirer ou à fondre dedans).

1. Séquences : M1-R01, M4-R07 (partie séquence), M5-R05, M5-R06, M2-R05 → garder M5-R05 (grammaire `after` / `with`) et M5-R06 (HTML), reprendre la compilation de M1-R01.
2. Cascade et rang : M1-R02, M4-R07 (partie cascade), M3-R03 (`--udx-motion-index`), M2-R06 → garder M2-R06 (rang visuel mesuré, plafond), repli JS de M1-R02.
3. Geste primitif : M2-R01, M4-R08, M5-R07, M1-R03 (partie verbe) → garder M5-R07 (`defineGesture`) et l'attribut `data-motion-gesture` de M4-R08 ; retirer le verbe `reorder` de M1-R03.
4. Vitesse au relâchement : M1-R03, M2-R02, M3-R09, M4-R08 → garder M3-R09 (mesure) et M2-R02 (ressort, exposition) ; un seul algorithme.
5. Alternative clavier : M1-R03, M2-R03, M4-R08, M5-R08, M3-R09 (partie) → garder M5-R08 (lint) et M2-R03 (contenu) ; implémentée par le runtime, pas par le composant.
6. Texte découpé : M1-R04, M3-R10, M4-R03, M4-R04, M5-R10, M2-R08 → garder M1-R04 (domaine fermé, `sr-only`), M3-R10 (visibilité, polices) et M4-R04 (brouillage) ; retirer M4-R03 (SSR) et M5-R10 (`aria-label`) ; trancher `chars` ou `letters`.
7. Valeurs réactives : M1-R07, M3-R01, M4-R05, M5-R09 → garder M3-R01 (cibles), M5-R09 (source TS) et M4-R05 (canal discret).
8. Compteurs : M3-R02, M4-R06 → garder M4-R06 et M3-R02 fusionnés.
9. Tokens : M1-R06, M5-R01, M5-R02, M4-R02 (noms) → garder M5-R02 (rôles, ressort source) et M1-R06 (émission, `linear()`) ; M5-R01 pour `@theme` ; M4-R02 garde la prop `motion`, ses noms de tokens à aligner.
10. Responsive : M1-R08, M3-R06, M2-R09 → garder M3-R06 (paliers) et M2-R09 (règles) ; M1-R08 retire sa phrase « pas de redémarrage ».
11. Scope et nettoyage : M1-R08, M3-R05, M4-R10 → garder M3-R05 (`revert()`).
12. Chargement : M1-R09, M3-R04, M2-R10, M4-R10 → garder M3-R04 (cache, préchargement) et M1-R09 (budgets) ; fusionner les déclencheurs (idle et intention).
13. Usage interne : M1-R10, M4-R01 → garder M4-R01 et M1-R10 (faux backend) ; la prop de M4-R02 s'y rattache.

Corrections à mes propres choix, signalées au greffier :
- M2-R08 : `aria-label` sur un élément sans rôle est interdit (ARIA 1.2) : retenir la copie `sr-only` de M1-R04 ; « brouillage hors v1 » contredit M1-R04 et M4-R04 : à retirer.
- M2-R05 : l'exemple `'+=0.1'` est en temps ; le remplacer par un token (M1-R01, M5-R05).
