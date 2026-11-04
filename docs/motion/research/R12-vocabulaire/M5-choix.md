# M5 — Choix de conception : vocabulaire (R12)

### M5-V01 — Sept verbes d'intention fermés
- Énoncé : sept verbes au plus, chacun désigne un résultat : `appear` (entrer), `disappear` (sortir, retenu jusqu'à `finished`), `emphasize` (accentuer un état ou attirer l'attention), `reveal` (révéler à la vue), `scrub` (lier à la position de défilement), `loop` (boucler), `layout` (partager une géométrie). Les valeurs continues ne sont pas des verbes (`defineValue`, F14 et F15). Remplace M5-S02 (quinze verbes, noté 3,0 à 6,0).
- Familles : F2, F3, F4, F5, F7, F8, F24 (F16 à F18 en R14)
- Nature : les deux (`reveal` et `loop` globaux ; les autres par instance)
- Avantages : sept mots à apprendre au lieu de quinze ; noms convergents (`scrub` chez GSAP, `layout` chez Motion et anime.js, `appear` et `disappear` en paire) ; aucun homonyme natif retenu par V07
- Limites : `emphasize` couvre à la fois les états (F2) et l'attention, à scinder si les besoins divergent ; `layout` recouvre F7 et F8, à détailler en R13 ; F16 à F18 restent hors verbes jusqu'en R14
- Conflits : M5-S02 (remplacé), M3-S01 (`scrub` contre `follow`), M2-S03 (`disappear` contre l'état `data-presence`), M4-S02 (`dismiss`)

### M5-V02 — Défaut de reprise et de réduction par verbe, dans le manifeste
- Énoncé : chaque verbe porte son défaut, écrit une fois dans le manifeste : `appear` : restart, réduit en fondu seul ; `disappear` : restart, réduit instantané ; `emphasize` : restart, réduit statique ; `reveal` : restart, réduit instantané ; `scrub` : sans reprise (position), réduit à la position neutre ; `loop` : sans reprise, réduit en pause contrôlable ; `layout` : carry, réduit instantané. Un auteur n'écrit le défaut que pour le changer.
- Familles : F2, F3, F4, F5, F13, F20, F24
- Nature : global (table du manifeste)
- Avantages : les cas courants ne demandent aucune décision de reprise ; la réduction de mouvement est tranchée par verbe, pas par composant (F20) ; la table est testable et lisible par un agent
- Limites : sept défauts à justifier et à réviser ; `layout` en carry force le moteur JS et son coût ; `loop` réduit en pause impose un choix d'accessibilité que l'auteur ne peut pas désactiver sans le déclarer
- Conflits : M5-S08 (reprise `carry` et `restart`), M3-S03 (pause obligatoire), M5-S09 (boucles en abonnés)

### M5-V03 — Options fermées, valeurs = noms de tokens ou mots-clés, jamais de nombre
- Énoncé : options à mots-clés fermés : `trigger` (load, view, state), `repeat` (once, always), `direction` (up, down, left, right), `axis`, `range`, `group`. Options à token : `delay`, `stagger`, `duration`, `easing`, `distance`, `threshold`, `margin`. Aucun nombre ni unité dans un attribut ou dans un nom de token ; les tokens de durée sont en millisecondes.
- Familles : F1, F4, F5, F10, F11, F20
- Nature : global
- Avantages : une durée ou un seuil se change dans les tokens, jamais dans le HTML (règle de M3-S06) ; un agent ne peut pas écrire `0.37` ni `300ms` ; une seule unité évite le piège secondes contre millisecondes relevé en R2 §17
- Limites : liste fermée à faire évoluer par version ; `direction`, `axis` et `range` ne sont pas personnalisables ; un besoin rare exige une définition TS
- Conflits : M3-S06 (seuils en tokens, à unifier avec ce tableau), M4-S05 (source des tokens), M5-S05 (émission des tokens)

### M5-V04 — Grammaire HTML : une référence, des options en attributs séparés
- Énoncé : `data-motion="<référence>"` porte une seule référence, preset livré ou définition TS ; chaque option s'écrit dans son propre attribut `data-motion-<option>="<token ou mot-clé>"` ; aucune chaîne composite (`"fade delay:md"`) ; le verbe n'est jamais écrit en HTML, il est porté par le preset. Tout attribut inconnu échoue au build.
- Familles : F1, F3, F4, F22, F23
- Nature : instance
- Avantages : `[data-motion]` et `[data-motion-*]` restent interrogeables, observables avec `attributeFilter` et analysables sans parseur de chaîne ; une option fausse échoue par son nom d'attribut ; compatible avec « référence seulement » (M5-S01)
- Limites : beaucoup d'attributs sur un élément très animé ; un même effet peut s'écrire en preset ou en définition ; une page HTML pure ne peut pas porter une option hors liste
- Conflits : M5-S01 (règle des références, à étendre aux options), M2-S02 (identité en donnée), M2-S03 (état `data-presence`)

### M5-V05 — Dix presets livrés, nommés par effet
- Énoncé : `fade`, `slide`, `scale`, `collapse`, `press`, `pulse`, `shake`, `spin`, `shimmer`, `blink`. Chacun porte un verbe par défaut : `fade`, `slide`, `scale`, `collapse` en `appear` et `disappear` (`slide` en `reveal` avec `trigger="view"`) ; `press`, `pulse`, `shake` en `emphasize` ; `spin`, `shimmer`, `blink` en `loop`. La direction est une option (`direction`), jamais une partie du nom.
- Familles : F2, F3, F4, F24
- Nature : global
- Avantages : convergence forte (`fade`, `slide`, `scale`, `spin` chez Tailwind, Motion, AOS et Rombo) ; pas de `fade-up` ni de `slide-down` qui mélangent effet et direction ; dix noms couvrent les cas simples sans `defineMotion`
- Limites : `collapse` exige la mesure de la taille (F2) ; `pulse` et `spin` coïncident avec les classes cœur de Tailwind, sans collision en attribut mais source de confusion pour un agent ; dix presets à maintenir face aux effets réels
- Conflits : M4-S04 (presets livrés comme définitions), M2-S03 (présence), M5-S04 (Tailwind)

### M5-V06 — Langue et casse : anglais, kebab-case en HTML, camelCase en TS
- Énoncé : noms en anglais, sans abréviation, au singulier ; kebab-case dans HTML et CSS (`data-motion-stagger`, `collapse`) ; camelCase en TS (`defineMotion`, `udxMotion`, `useMotion`). Les mots `down` et `up` ne sont jamais un nom de verbe ou de preset, seulement une valeur de `direction`. La documentation reste en français.
- Familles : F22, F23
- Nature : global
- Avantages : un seul sens par mot, ce qui évite le `down` d'AOS contre celui de tw-animate relevé en R2 §17 ; le kebab-case est cohérent avec les attributs HTML insensibles à la casse ; un agent qui connaît Tailwind ou AOS retrouve les formes
- Limites : l'anglais demande un effort de traduction aux équipes francophones ; la correspondance mécanique entre kebab-case HTML et camelCase TS doit être documentée ; interdire `down` comme nom contredit des usages existants
- Conflits : M5-S07 (formes par framework), M4-S04 (noms des définitions)

### M5-V07 — Politique de réserve : noms natifs et noms cœur de Tailwind
- Énoncé : le manifeste liste les noms réservés (`enter`, `exit`, `in`, `out`, `transition`, `animate`, `initial`, `old`, `new`, `view-transition-*`, `AnimatePresence`) ; un verbe, un preset ou une option qui en reprend un est refusé au build, sauf exception justifiée dans le manifeste. Les tokens du plugin sont en `--udx-motion-*` et ne redéfinissent jamais `--animate-*`, dont les noms cœur (`spin`, `pulse`, `ping`, `bounce`) ne doivent pas être écrasés.
- Familles : F3, F9, F22, F23
- Nature : global
- Avantages : pas de collision silencieuse ni avec les frameworks ni avec les variables cœur de Tailwind ; une seule liste pour le lint, les types et la doc ; chaque exception est tracée
- Limites : liste à suivre à chaque version de framework ; `initial` et `new` sont des mots courants qui gênent le choix de noms ; une exception mal justifiée ouvre la porte aux homonymes
- Conflits : M5-S03 (noms réservés, repris ici), M5-S04 (tokens Tailwind), M4-S02 (noms sans homonyme)

### M5-V08 — Actions et primitives hors vocabulaire
- Énoncé : `scrollTo(cible, options)` est une action qui renvoie un handle ; `reorder` est une primitive de geste (M2-S05) ; la transition de page relève de `layout` avec l'option `shared` (R13), et non d'un verbe `page`. `drag`, `scroll`, `page` et `follow` sortent du vocabulaire de M5-S02 ; `follow` est remplacé par `defineValue`.
- Familles : F6, F9, F14, F18
- Nature : instance
- Avantages : un défilement ou un geste n'est pas un effet d'élément, donc pas de verbe ; retire les conflits ouverts sur `drag`, `scroll` et `follow` ; le handle reste commun à toute la surface
- Limites : F9 n'a plus de nom propre dans le vocabulaire et dépend de la doc ; `scrollTo` et `reorder` ont une grammaire de fonction, non d'attribut, ce qui pèse sur le HTML pur ; F18 est traité en R14, la décision est provisoire
- Conflits : M3-S02 (`scrollTo`), M2-S05 (`reorder`), M1-S09 (`drag`), M5-S02 (remplacé)

### M5-V09 — Liste fermée et versionnée, entrée par fiche
- Énoncé : un verbe ou un preset n'entre dans le vocabulaire que s'il déclare une famille, un défaut de reprise et de réduction (M5-V02), aucun nom réservé (M5-V07) et un test de couverture. Ajouter un preset est une version mineure ; ajouter ou retirer un verbe est une version majeure ; chaque entrée a une fiche dans le manifeste.
- Familles : F21, F22, F23
- Nature : global
- Avantages : le vocabulaire ne dérive pas en silence ; une fiche courte remplace les débats d'avis ; l'agent sait quelle version du vocabulaire il lit
- Limites : une règle de plus à appliquer en revue ; un besoin urgent attend la prochaine version ; les fiches demandent une maintenance documentaire
- Conflits : M5-S10 (manifeste), M5-S02 (plafond remplacé)

### M5-V10 — Alias de diagnostic pour les agents, jamais d'alias silencieux
- Énoncé : le manifeste déclare des alias de diagnostic : `enter` vers `appear`, `exit` vers `disappear`, `fade-in` vers `fade`, `fade-up` vers `slide` avec `direction="up"`, et les anciens noms d'easing d'anime.js v3 vers leur token. Le build et le lint échouent et citent le nom canonique ; un alias n'est jamais accepté en silence. `llms.txt` liste les noms à ne pas écrire.
- Familles : F22, F23
- Nature : global
- Avantages : les échecs silencieux, les plus coûteux selon R2 §16.3, deviennent des erreurs visibles ; un agent formé sur Motion, AOS ou anime.js v3 reçoit la forme correcte ; la table est testable
- Limites : la table vieillit avec les données d'entraînement des modèles ; un alias mal pointé induit un faux diagnostic ; `fade-up` vers `slide` plus `direction` n'est pas une correspondance biunivoque
- Conflits : M5-S10 (manifeste et lint), M5-V07 (noms réservés)
