# M1 — Annotations des choix M2 à M5 (R12, vocabulaire)

## Annotations

- M2-V01 : conteste — +nom convergent chez Motion et anime.js (`layout`), aucun homonyme natif / −le défaut `carry` impose le JS pour tout layout, contraire à M1-V02 / conflits: M1-V02, M1-V03
- M2-V02 : valide — +`shared` dit l'intention et `restart` est honnête sur une VT / −deux verbes proches (`layout`, `shared`) ; contredit M5-V08 qui en fait une option de `layout` / conflits: M5-V08, M5-V01
- M2-V03 : conteste — +verbes `appear` et `disappear` symétriques, sans homonyme / −état non public empêche de styler la sortie en CSS, contredit M4-V03, M3-V09 et M1-V07 / conflits: M4-V03, M3-V09, M1-V07
- M2-V04 : valide — +nom convergent (GSAP, anime.js, Motion), option de conteneur et non verbe / −ne couvre pas une séquence ; faux sur liste virtualisée / conflits: M3-V08
- M2-V05 : valide — +`drag` évité (événement DOM), `reorder` dit le résultat / −aucun nom pour le déplacement libre ; le défaut `carry` demande la vitesse / conflits: —
- M2-V06 : conteste — +table unique écrite une fois dans le manifeste / −`appear` et `disappear` en `carry` contredisent M5-V02 et M1-V03 ; coût JS à chaque présence / conflits: M5-V02, M1-V03
- M2-V07 : valide — +`measure` et `correct` disent ce qui est mesuré et ce qui est corrigé ; valeurs fermées / −`measure: size` rare ; ne couvre pas `box-shadow` / conflits: —
- M2-V08 : conteste — +noms par sens du mouvement, résout le `down` relevé en R2 / −la direction dans le nom contredit M3-V10, M5-V05 et M3-V06 / conflits: M5-V05, M3-V10, M3-V06
- M2-V09 : neutre — +identité sérialisable au SSR, `data-motion-shared` reste une référence / −une valeur libre de nom de partage contredit le « tokens seulement » de M5-V03 et M5-V04 / conflits: M5-V04, M5-V03, M2-V02
- M2-V10 : valide — +une seule langue pour humains et agents, casse vérifiable par lint / −l'anglais demande un effort, `layout` et `shared` intraduisibles / conflits: — (doublon de M5-V06)
- M3-V01 : valide — +nom court, sans homonyme natif, même mot que le mécanisme du runtime / −ne dit pas le sens du mouvement (cf. M3-V06) / conflits: —
- M3-V02 : valide — +mots CSS natifs (`entry`, `exit`, `cover`, `contain`), `range` fermé / −`scrub` peu connu hors GSAP / conflits: —
- M3-V03 : valide — +action au sens natif, pas de seizième verbe / −impossible en HTML pur sans JS / conflits: —
- M3-V04 : valide — +WCAG 2.2.2 devient une donnée vérifiée, `essential` rend l'exception explicite / −pas de boucle finie ; défaut `restart` contredit M5-V02 / conflits: M5-V02
- M3-V05 : neutre — +seuils nommés en mots, aucun nombre littéral / −mots différents de M3-S06 (R11) et de M5-V03, non unifiés / conflits: M3-S06, M5-V03
- M3-V06 : conteste — +lève l'ambiguïté du `down`, convention d'origine de tw-animate / −`from` contredit `direction` de M5-V03 et les `up` ou `down` de M4-V08 et M5-V06 / conflits: M5-V03, M4-V08, M5-V06
- M3-V07 : neutre — +chaque option s'observe seule par `attributeFilter`, valeurs fermées / −autorise le verbe dans `data-motion`, contraire à M5-V04 / conflits: M5-V04
- M3-V08 : conteste — +`stagger` est le mot de Motion, GSAP et anime.js / −tokens `tight…wide` divergent de `fast|normal|slow` de M2-V04 / conflits: M2-V04
- M3-V09 : valide — +séparation nette entre ce que l'auteur déclare et ce que le runtime observe / −état posé par JS absent au rendu serveur / conflits: M2-V03
- M3-V10 : valide — +aucun nom porte une direction, peu de noms à retenir / −`rise` moins parlant qu'un nom de direction ; doublon de M5-V05 / conflits: M2-V08
- M4-V01 : valide — +une seule source pour les quatre environnements, testable par collision / −liste à réviser à chaque majeure / conflits: —
- M4-V02 : conteste — +évite des renommages inutiles (`loop` reste naturel) / −règle conditionnelle inutile si le verbe est une valeur de `data-motion` ; lint plus complexe / conflits: M5-V07, M5-V04
- M4-V03 : valide — +état stylable et observable, rendu réduit décidé par le verbe / −le fondu réduit de `disappear` contredit M5-V02 (instantané) / conflits: M5-V02, M2-V03
- M4-V04 : conteste — +trois noms décrivent le mécanisme, aucun homonyme natif / −`follow` contredit M5-V01 et M5-V08, qui le retirent / conflits: M5-V01, M5-V08
- M4-V05 : valide — +pas de collision avec les fonctions CSS `scroll()` et `view()` / −F6 sans verbe, couverture par la doc / conflits: —
- M4-V06 : conteste — +préfixe `view-transition` interdit, nom généré par le runtime / −le verbe `page` contredit M5-V08 et M5-V01 / conflits: M5-V08, M5-V01
- M4-V07 : valide — +noms de Svelte et CSS, valeurs en tokens, aucun mot-clé de boucle détourné / −`ease` plus court et connu de Motion, renommage à prévoir / conflits: —
- M4-V08 : neutre — +directions logiques, `start` et `end` valent en RTL / −`up` et `down` restent physiques ; `left` et `right` contredits par M5-V03 / conflits: M5-V03, M3-V06
- M4-V09 : conteste — +le nom dit le verbe et la variante, l'espace `udx-` évite les collisions / −`fade-up` met la direction dans le nom, contredit M3-V10 et M5-V05 / conflits: M5-V05, M3-V10, M5-V10
- M4-V10 : valide — +un attribut par option, chacun observable seul / −verbeux ; casse par couche à faire respecter / conflits: M5-V04
- M5-V01 : valide — +sept verbes au lieu de quinze, noms convergents / −contredit M1-V06 et M1-V08 (`follow`, `page`), M4-V04 et M2-V02 / conflits: M1-V06, M1-V08, M2-V02, M4-V04, M2-V03
- M5-V02 : valide — +les cas courants ne demandent aucune décision de reprise, réduction tranchée par verbe / −`loop` sans reprise contredit M3-V04 ; `layout` en `carry` force le JS / conflits: M3-V04, M2-V06, M1-V03
- M5-V03 : valide — +une durée ou un seuil se change dans les tokens, jamais dans le HTML / −liste fermée à faire évoluer par version / conflits: M3-V05, M3-V06, M4-V08
- M5-V04 : valide — +`[data-motion-*]` observable par `attributeFilter`, pas de parseur de chaîne / −beaucoup d'attributs sur un élément très animé / conflits: M3-V07, M2-V09
- M5-V05 : valide — +convergence forte (`fade`, `slide`, `scale`, `spin`), direction en option / −`collapse` exige la mesure ; `pulse` et `spin` proches des noms cœur de Tailwind / conflits: M2-V08, M3-V10, M4-V09
- M5-V06 : valide — +un seul sens par mot, évite le `down` d'AOS contre celui de tw-animate / −l'anglais demande un effort de traduction aux équipes francophones / conflits: M4-V08
- M5-V07 : valide — +liste unique pour lint, types et doc, chaque exception tracée / −liste à suivre à chaque version de framework / conflits: M4-V02
- M5-V08 : valide — +défilement et geste ne sont pas des effets d'élément, donc pas de verbe / −F9 sans nom propre ; `scrollTo` et `reorder` ont une grammaire de fonction / conflits: M1-V06, M1-V08, M2-V02, M4-V06
- M5-V09 : valide — +une fiche courte par entrée, version majeure pour tout retrait / −une règle de plus à appliquer en revue / conflits: —
- M5-V10 : valide — +les échecs silencieux deviennent des erreurs visibles, citant le nom canonique / −la table vieillit ; `fade-up` vers `slide` n'est pas biunivoque / conflits: M4-V09

## Doublons à fusionner

- Présence (`appear`, `disappear`, état `data-presence`) : garder M4-V03 ; fusionner M2-V03 (noms seulement, son état non public est rejeté).
- Verbe `shared` : garder M2-V02 ; fusionner M4-V06 (préfixe `view-transition` retenu, verbe `page` rejeté).
- Verbe `layout` : garder M2-V01 ; fusionner la partie `layout` de M5-V01.
- Reveal : garder M3-V01 ; fusionner la partie `reveal` de M4-V04 et de M5-V01.
- Scrub : garder M3-V02 ; fusionner la partie `scrub` de M5-V01.
- Défilement programmé (action `scrollTo`) : garder M3-V03 ; fusionner M4-V05 (pas de verbe `scroll`) et la partie `scrollTo` de M5-V08.
- Cascade (`stagger`) : garder M2-V04 ; fusionner M3-V08 après arbitrage des tokens (`fast|normal|slow` ou `tight…wide`).
- Grammaire HTML (options en attributs séparés) : garder M5-V04 ; fusionner M3-V07 (sauf le rejet du verbe écrit en HTML) et M4-V10 (casse, à déplacer dans la langue).
- Langue et casse : garder M5-V06 ; fusionner M2-V10 et la règle de casse de M4-V10.
- Réserve de noms : garder M5-V07 ; fusionner M4-V01.
- Presets livrés : garder M5-V05 ; fusionner M3-V10 (noms `rise`, `parallax` à reprendre si utiles).
- Options fermées et tokens : garder M5-V03 ; fusionner M4-V07 (noms `duration`, `delay`, `easing`). M3-V05 (seuils) reste à fusionner après arbitrage des mots.
- Défauts de reprise par verbe : garder M5-V02 ; fusionner M2-V06 (rejeté pour `appear` et `disappear`) et M1-V03 (défaut de `loop` à aligner).
- Directions : garder M3-V06 pour la convention d'origine ; fusionner la valeur `start` et `end` de M4-V08. `direction` de M5-V03 est à renommer en `from`.
- Non fusionnés, contradictions ouvertes : `follow` (M4-V04, M1-V06 contre M5-V01, M5-V08) ; `page` (M4-V06, M1-V08 contre M5-V08) ; état `data-presence` public ou non (M2-V03 contre M4-V03, M3-V09).
