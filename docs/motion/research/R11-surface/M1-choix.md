# M1 — Choix de conception : surface d'écriture (moteur et rendu)

### M1-S01 — Continuité de vitesse promise par la spec, moteur routé dessous
- Énoncé : la spec peut demander `continuity: 'velocity'` ; cette option route l'animation vers le moteur JS (M1-01) et interdit à la compilation toute écriture native (classe ou attribut CSS) pour elle. Sans option, la garantie est `'value'` et l'écriture ne change pas. La garantie effective est publiée dans le manifeste.
- Familles : F2, F12, F13, F18
- Nature : instance
- Avantages : résout la tension (a) sans deux écritures ; la reprise à la vitesse courante est exacte quand elle est demandée ; la garantie est vérifiable au build
- Limites : le même verbe change de moteur, donc de coût, selon une option ; WAAPI ne transporte pas la vitesse, sa reprise reste par valeur ; l'auteur doit lire la garantie qu'il obtient
- Conflits : M1-S02, M1-S04, M1-S10

### M1-S02 — Ressort défini en paramètres physiques dans les tokens, compilé selon l'usage
- Énoncé : les tokens de ressort (`snappy`, `gentle`, `bouncy`, réglés par M3) sont des paramètres physiques (raideur, amortissement, masse). Le build les compile en `linear()` pour les usages sans vitesse et les garde tels quels pour le moteur JS. L'auteur ne choisit jamais la représentation.
- Familles : F1, F13
- Nature : global
- Avantages : un token, deux représentations générées ; le designer règle des paramètres physiques et non des courbes ; tranche le désaccord de R10 entre calcul au build et calcul à l'exécution
- Limites : deux représentations à garder égales (test d'écart de tracé) ; `linear()` absent des vieux Chrome de `defaults`, repli JS ; N points fixe, l'overshoot court reste approché
- Conflits : M5-03 (calcul au build, à retirer), M1-S01

### M1-S03 — Enregistrement déclaratif dans le runtime unique, aucune boucle écrite par l'auteur
- Énoncé : une spec se déclare auprès du runtime global (M5-07), qui lui attribue une phase lecture ou écriture dans la frame unique (M1-04). Aucun code d'animation n'appelle `requestAnimationFrame`. Les enregistrements faits avant le chargement du runtime sont mis en file sous le même `globalThis` et rejoués à son arrivée.
- Familles : F4, F5, F10, F21, F24
- Nature : les deux (runtime global, inscription par instance)
- Avantages : une boucle par page, y compris pour les îles chargées tard ; pause d'onglet et nettoyage au niveau du runtime ; aucun piège de frame pour l'auteur
- Limites : une spec lourde retarde toutes les autres ; la file avant chargement doit être bornée, sinon elle fuit ; l'ordre de rejeu entre îles n'est pas garanti sans phase explicite
- Conflits : M3-08, M5-05

### M1-S04 — Classes Tailwind réservées aux specs à palier statique, refus au build sinon
- Énoncé : une classe `motion-*` n'existe que pour une spec résolue entièrement en CSS (sans vitesse, compteur, valeur réactive, présence JS ni boucle déclarée au runtime). Le plugin consulte le registre fermé et refuse au build toute classe dont la spec exige du JS. Les variants d'état passent par une variable CSS (R9).
- Familles : F1, F2, F3, F4, F5, F24
- Nature : global
- Avantages : zéro JS pour ces specs ; le CSS produit se limite aux classes détectées ; répond à la note basse de M5-04 en le restreignant au palier CSS
- Limites : `motion-${x}` dynamique invisible au scanner (`@source inline()` requis) ; `animation-trigger` Chromium seul, repli IntersectionObserver ailleurs ; le plugin dépend du registre, donc s'y couple
- Conflits : M5-04, M3-04

### M1-S05 — Vérification moteur au build : un prédicat unique fixe les encodages admis
- Énoncé : un compilateur de spec évalue pour chaque nom du registre le prédicat de cycle (R3) et le prédicat moteur (R4), et produit la liste des encodages admis (classe, attribut, prop, directive). Un encodage hors liste échoue au build et dans `motion check` en CI, sans plugin. La même liste alimente le manifeste.
- Familles : F3, F4, F7, F10, F11, F23
- Nature : global
- Avantages : une règle pour tous les environnements ; un agent voit l'erreur avant l'exécution ; la suite de conformité passe avec et sans plugin (R10)
- Limites : le prédicat doit suivre chaque nouveau moteur ; un prédicat trop large fait de faux refus ; sans plugin, les classes ne sont vérifiées que par le scanner
- Conflits : M1-S04, M5-02

### M1-S06 — Défilement : scrub natif, défilement programmé sans lissage, tween sur token seulement
- Énoncé : `scrub` est une spec à `animation-timeline` ; `scrollTo` reste natif (`scroll-behavior`). Une spec de défilement programmé ne peut être qu'un tween sur un token nommé de durée ou de courbe, jamais un lissage de molette. Le repli JS du scrub n'existe que si l'auteur écrit `fallback: 'js'` (M3-06).
- Familles : F5, F6, F20
- Nature : instance
- Avantages : restauration de position, ancres et trackpads restés natifs ; aucune boucle permanente ; la surface n'offre aucun moyen de détourner le scroll
- Limites : durée du `smooth` natif non réglable ; sans timeline, le scrub reste à son état neutre (design requis) ; pas d'inertie à la ScrollSmoother
- Conflits : aucun connu

### M1-S07 — Valeurs réactives : cellule écrite en phase write, vers variable CSS ou texte
- Énoncé : une valeur continue (curseur, parallaxe, compteur) est une cellule (valeur, vitesse) écrite par la frame unique, soit dans une variable CSS (F14), soit dans le texte d'un compteur (F15). La surface n'expose aucun signal ; l'adaptateur n'a qu'une lecture optionnelle pour les rares rendus qui dépendent de la valeur.
- Familles : F14, F15
- Nature : instance
- Avantages : zéro re-rendu, identique en HTML, React, Angular et Svelte ; le texte rendu côté serveur est déjà la cible finale du compteur
- Limites : écriture qui contourne le framework, collision possible avec un style inline qu'il gère ; un nœud texte réécrit par le framework casse le compteur ; la lecture réactive reste à définir
- Conflits : M4-07, M1-09

### M1-S08 — Texte et SVG : découpage et tracé préparés au rendu, morphing seul en JS
- Énoncé : `split` découpe le texte au rendu serveur (un span `aria-hidden` par unité, conteneur en `aria-label` avec le texte complet). Le tracé SVG se fait par `pathLength="1"` et `stroke-dashoffset` en CSS. Le morphing et la trajectoire sont un chunk JS chargé à l'appel. Le découpage côté client n'est permis qu'avant la première peinture.
- Familles : F16, F17
- Nature : instance
- Avantages : aucune mutation de DOM après peinture pour le texte statique ; tracé natif sans JS ; le chunk JS n'existe que pour le morphing
- Limites : DOM plus lourde (un span par unité) ; le serveur et le client doivent produire la même découpe ; le morphing exige des chemins de même structure
- Conflits : aucun connu

### M1-S09 — Geste fournisseur de vitesse : le relâchement passe (valeur, vitesse) au handle
- Énoncé : pendant le geste, la position suit le pointeur en `transform` sans animation. Au relâchement, la surface transmet (valeur, vitesse échantillonnée) à un handle existant (M5-08), qui reprend le ressort depuis cette vitesse. Aucun verbe `drag` n'est exposé en v1.
- Familles : F18, F13, F10
- Nature : instance
- Avantages : une seule règle de reprise pour geste et animation (M1-03) ; pas de moteur de geste à maintenir en v1 ; `touch-action` reste piloté par l'adaptateur
- Limites : vitesse estimée sur quelques échantillons, bruitée ; pointer events câblés différemment par framework ; clavier non traité ici
- Conflits : aucun connu (contredit « gestes hors v1 » de J4, à trancher)

### M1-S10 — View Transitions : nommage au premier attach, jamais en vol, repli FLIP
- Énoncé : le runtime pose `view-transition-name` au premier attach d'un élément `shared`, pour les navigations same-document et cross-document Astro, quand `startViewTransition` existe. Une VT en cours refuse la suivante, sans simulation de reprise. Hors VT, le partage est un FLIP (M2-03). L'auteur n'écrit jamais le nom.
- Familles : F8, F9
- Nature : global (état du document)
- Avantages : zéro JS par frame pour la navigation ; snapshots gérés par le navigateur ; le refus évite un état mixte
- Limites : une VT à la fois, non interruptible ; `startViewTransition` Chromium seul, donc deux chemins ; collisions de `view-transition-name` si deux îles nomment pareil
- Conflits : M1-03, M1-S01

Non couverts par M1 : F19, F22, F23 (traités par M2 à M5). Le vocabulaire (M5-01, note 4,8) n'est pas tranché ici ; M1-S05 fournit seulement l'erreur au build.
