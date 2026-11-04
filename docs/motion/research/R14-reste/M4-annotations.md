# M4 — Annotations des choix R14 (M1, M2, M3, M5)

Lecture croisée par M4 (frameworks, îles, SSR). Vérifié dans le dépôt : anime.js 4.5.0 `splitText` avec `accessible` (copie sr-only, `aria-hidden` sur les fragments, insertion de nœuds dans l'élément). Les faits non revérifiés sont marqués « (à vérifier) ».

- M1-R01 : valide — +une définition, deux écritures ; seek et reverse exacts / −attribut `part` différent de `step` (M2-R05, M5-R06) ; syntaxe de temps à unifier / conflits: M2-R05, M5-R05, M5-R06, M4-R07 / cohérence: exception: `part` à remplacer par `step`
- M1-R02 : conteste — +cascade sans JS quand le natif suffit / −`sibling-index()` suit l'ordre DOM, pas l'ordre visuel ; support récent (à vérifier) / conflits: M2-R06, M3-R03, M4-R07 / cohérence: exception: source de rang DOM, contraire à M2-R06
- M1-R03 : conteste — +lâcher sans à-coup ; clavier sur le même chemin layout / −« reorder seul verbe » contredit M2-R01 et M5-R07 ; moindres carrés en double avec M3-R09 / conflits: M2-R01, M2-R04, M3-R09, M5-R07 / cohérence: exception: `reorder` présenté comme verbe
- M1-R04 : valide — +sr-only et `aria-hidden`, même schéma qu'anime `accessible` ; polices et réflow traités / −découpage côté client après hydratation incompatible avec des enfants gérés par React ; brouillage inclus en v1 / conflits: M2-R08, M3-R10, M5-R10, M4-R03, M4-R04 / cohérence: ok (copie sr-only déclarée)
- M1-R05 : valide — +tracé et trajectoire sans calcul JS par frame ; `pathLength` est un attribut SVG standard / −`stroke-dashoffset` peint sur le thread principal ; `offset-path` sans repli / conflits: M3-R08, M4-R09 / cohérence: exception: WAAPI non compositable, déclarée
- M1-R06 : conteste — +un ressort exprimé une fois pour CSS, JS et reprise / −source JSON contre `defineTokens` TS (M5-R01) ; `duration-udx-*` contre l'alias `--duration-*` / conflits: M5-R01, M5-R02 / cohérence: exception: utilitaires `duration-udx-*` hors préfixe `--udx-motion-*`
- M1-R07 : valide — +cellule partagée par les cinq formes, sans re-rendu / −placement sur la racine contre les cibles (M3-R01) ; nom `--udx-value-<nom>` contre `--udx-<nom>` / conflits: M3-R01, M4-R05, M5-R09 / cohérence: ok
- M1-R08 : conteste — +compilation par palier, un seul `matchMedia` / −« pas de redémarrage » contredit la reconstruction de M3-R06 ; `dispose()` contre `revert()` (M3-R05) / conflits: M2-R09, M3-R05, M3-R06 / cohérence: exception: nom `dispose`
- M1-R09 : neutre — +budgets par module mesurés en CI ; anime externalisé (confirmé par E1) / −préchargement sur intersection seulement, sans idle ; pause déjà couverte par M3-R03 / conflits: M2-R10, M3-R03, M3-R04 / cohérence: ok
- M1-R10 : valide — +19 contrôleurs sur un seul chemin ; test de parité des ressorts / −12 fichiers à rebasculer ; rupture D2 / conflits: M2-R07, M4-R02 (nom de la prop) / cohérence: exception: ressort du Button déclaré
- M2-R01 : valide — +pas de huitième verbe ; définition nommée / −valeur écrite à chaque frame / conflits: M1-R03, M4-R08, M5-R07 / cohérence: exception: source sans verbe, déclarée au manifeste
- M2-R02 : valide — +reprise à la vitesse du doigt via anime ; `velocity.source` explicite / −suivi du doigt coûte du JS ; estimation sur appareils lents / conflits: M1-R03, M3-R09 / cohérence: exception: anime imposé même si WAAPI est disponible, déclarée
- M2-R03 : valide — +WCAG 2.5.7, 2.1.1 et 2.5.1 couverts ; `aria-grabbed` évité (ARIA 1.1) / −2.5.8 reste à la charge de l'auteur ; deux chemins à tester / conflits: M5-R08 (nom du champ), M3-R09 (alternative comme action du handle) / cohérence: exception: `essential` consigné au manifeste
- M2-R04 : valide — +seuil de position, pas de tri à la seule vitesse ; `commit` séparé de l'affichage / −DOM modifié pendant le geste (focus) ; grilles 2D exclues / conflits: M1-R03 (reorder verbe), M5-R07 / cohérence: ok
- M2-R05 : neutre — +même syntaxe en TS et en HTML ; fonctionne entre îles / −syntaxe `'<'` et `+=` absente de M5-R05 ; étapes conditionnelles fragiles / conflits: M1-R01, M5-R05, M5-R06 / cohérence: ok (`data-motion-step` retenu)
- M2-R06 : valide — +rang visuel et plafond de durée ; `sibling-index()` écarté comme source / −une lecture par liste ; RTL à trancher / conflits: M1-R02, M3-R03, M4-R07 / cohérence: ok (token de plafond justifié)
- M2-R07 : valide — +exemples concrets par composant ; retire les types Motion publics / −doublon de M1-R10 ; migration progressive / conflits: M1-R10, M4-R02 / cohérence: ok
- M2-R08 : conteste — +lecture une fois, texte intact sans JS / −`aria-label` sur un conteneur générique (ARIA 1.2 interdit de nommer un générique, à vérifier) ; mutation DOM dans des éléments React / conflits: M1-R04, M3-R10, M5-R10, M4-R03 / cohérence: exception: `aria-label` écrit par le runtime, à inscrire au manifeste
- M2-R09 : valide — +pas de FLIP entre breakpoints ; invalidation par ResizeObserver / −geste actif pendant un changement de palier à régler / conflits: M1-R08, M3-R06 / cohérence: ok
- M2-R10 : neutre — +charge au premier signal d'intention / −« jamais au chargement » contredit le préchargement idle de M3-R04 ; tactile sans `pointerenter` / conflits: M1-R09, M3-R04 / cohérence: ok
- M3-R01 : valide — +écriture directe, zéro re-rendu ; variable posée sur les cibles seules / −un seuil franchi déclenche un re-rendu, à réserver aux états rares / conflits: M1-R07, M4-R05, M5-R09 / cohérence: ok
- M3-R02 : valide — +valeur finale en HTML, lisible sans JS ; pas d'`aria-live` / −état initial à 0 avant démarrage (à mesurer) / conflits: M1-R07, M4-R06 / cohérence: ok (millisecondes, comme les tokens)
- M3-R03 : valide — +un observateur par page ; onglet caché sans frame ; `inspect()` donne la raison de pause / −un élément poussé hors écran ne se déclenche pas (fait établi) / conflits: M1-R02 (index), M1-R09 (pause) / cohérence: exception: `reveal` avec `once` se désabonne
- M3-R04 : valide — +une copie d'anime par page ; verbe absent = zéro octet / −HTML pur sans `modulepreload` ; délai idle à fixer / conflits: M1-R09, M2-R10, M4-R10 / cohérence: ok
- M3-R05 : valide — +registre par racine ; élagage à la frame suivante / −élagage paresseux ; `revert` différent de `dispose` (M1-R08) / conflits: M1-R08, M4-R10 / cohérence: ok
- M3-R06 : valide — +paliers identiques à Tailwind ; reconstruction seulement au changement de palier / −valeur WAAPI figée jusqu'à reconstruction (à tester) / conflits: M1-R08, M2-R09 / cohérence: exception: palier de conteneur hors Tailwind, déclaré
- M3-R07 : conteste — +jeton unique, lu une fois par racine / −`scale` à 0 rend `disappear` instantané, contraire au fondu de §8.1 et de M5-V02 / conflits: M5-V02 (§8.1 #5) / cohérence: ok
- M3-R08 : valide — +budget visible et lint de paint / −`allow-paint` est une échappatoire / conflits: M1-R05, M5-L02 / cohérence: exception: spinner circulaire, déclaré
- M3-R09 : valide — +vitesse mesurée côté pointeur, indépendante du moteur / −support de `getCoalescedEvents` à vérifier ; événements coalescés sans `target` / conflits: M1-R03, M2-R02 / cohérence: exception: clavier = action du handle
- M3-R10 : conteste — +découpage après `document.fonts.ready`, réflow à la largeur / −insère des nœuds dans un élément géré par React ; `fonts.onloadingdone` à ajouter / conflits: M1-R04, M4-R03, M5-R10 / cohérence: ok
- M5-R01 : valide — +une valeur, trois émissions ; `--animate-*` retiré / −`var()` dans `@theme` à vérifier (Tailwind v4) / conflits: M1-R06, M5-R02 / cohérence: ok
- M5-R02 : valide — +courbes M3 exactes ; `medium2` = 300 ms, comme `fab-motion.ts` / −valeurs à recouper sur la page M3 complète / conflits: M1-R06 / cohérence: ok
- M5-R03 : valide — +un contrat lu par agents et humains / −grossit avec les fiches / conflits: aucun / cohérence: ok
- M5-R04 : valide — +valider avant d'écrire, sans build / −définitions construites à l'exécution non validées / conflits: M5-R03 / cohérence: ok
- M5-R05 : neutre — +`after` inconnu = erreur de type / −syntaxe différente de `at` (M1-R01) et de `'<'` (M2-R05) / conflits: M1-R01, M2-R05 / cohérence: ok
- M5-R06 : valide — +même graphe dans les cinq formes / −HTML dépend d'une définition chargée / conflits: M1-R01 (`part`) / cohérence: exception: références seules, déclarées
- M5-R07 : neutre — +aucun verbe nouveau ; vitesse transmise au handle / −inertie calculée à chaque frame / conflits: M1-R03, M2-R01 / cohérence: ok
- M5-R08 : neutre — +garde-fou à quatre niveaux / −champ `keyboard` contre `alternative` (M2-R03) ; présence seulement, pas le fonctionnement / conflits: M2-R03 / cohérence: ok
- M5-R09 : neutre — +même nom partout / −`source: pointer.x` contre `source: 'pointer', axis` (M3-R01) / conflits: M1-R07, M3-R01 / cohérence: ok
- M5-R10 : conteste — +lecture entière une fois / −`letters` contre `chars` (M1-R04, M2-R08) ; une seule fonction DOM pour les cinq formes, React compris / conflits: M1-R04, M2-R08, M4-R03 / cohérence: ok

## Doublons à fusionner

- Séquences : garder M1-R01 ; fusionner M2-R05, M5-R05, M5-R06 (et M4-R07 pour le rang)
- Cascade et stagger : garder M2-R06 ; fusionner M1-R02, M3-R03 (index), M4-R07
- Gestes (définition, relâchement, vitesse) : garder M2-R01, M2-R02, M3-R09 ; fusionner M1-R03, M5-R07, M4-R08
- Reorder : garder M2-R04 ; fusionner M5-R07 (volet reorder) ; M1-R03 rejeté sur ce point
- Alternative clavier : garder M2-R03 ; fusionner M5-R08, M1-R03
- Tokens : garder M5-R01 et M5-R02 ; fusionner M1-R06
- Texte : garder M1-R04 ; fusionner M2-R08, M3-R10, M5-R10, M4-R03, M4-R04
- Valeurs réactives : garder M1-R07 ; fusionner M3-R01, M5-R09, M4-R05
- Compteurs : garder M3-R02 ; fusionner M1-R07 (volet compteur), M4-R06
- SVG : garder M1-R05 ; fusionner M4-R09 (apporte : le runtime possède `d`)
- Usage interne : garder M1-R10 ; fusionner M2-R07, M4-R01, M4-R02
- Responsive : garder M3-R06 ; fusionner M2-R09, M1-R08 (volet breakpoint)
- Scopes : garder M3-R05 ; fusionner M1-R08 (volet scope), M4-R10 (volet nettoyage)
- Pause et visibilité : garder M3-R03 ; fusionner M1-R09 (volet pause)
- Chargement : garder M3-R04 ; fusionner M1-R09 (volet budgets), M2-R10, M4-R10 (volet import)
- Outillage : aucun doublon (M5-R03 et M5-R04 se complètent)

## Conflits à arbitrer (par ordre d'importance)

1. Source du rang de cascade : visuel (M2-R06), DOM (M1-R02, M4-R07), index écrit par le runtime (M3-R03).
2. Attribut enfant de séquence : `part` (M1-R01) ou `step` (M2-R05, M5-R06) ; syntaxe de temps `at`, `after` ou `'<'`.
3. Reorder : geste (M2-R04, M5-R07) ou verbe (M1-R03).
4. Placement des valeurs : racine avec `--udx-value-<nom>` (M1-R07) ou cibles avec `--udx-<nom>` (M3-R01).
5. Découpage du texte dans React : runtime (M1-R04, M3-R10, M5-R10) ou rendu par le framework (M4-R03).
6. Prop de transition : options fermées (M1-R10), `data-motion-<option>` (M2-R07), prop `motion` (M4-R02).
7. Rendu réduit : `scale` à 0 (M3-R07) contre fondu de `disappear` (§8.1, M5-V02).
8. Préchargement au repos (M3-R04) contre « jamais au chargement » (M2-R10).
9. Noms d'API : `dispose()` (M1-R08) contre `revert()` (M3-R05) ; `keyboard` (M5-R08) contre `alternative` (M2-R03) ; `source` seul (M5-R09) contre `source` + `axis` (M3-R01).
