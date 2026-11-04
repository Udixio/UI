# M2 — Choix de vocabulaire : layout, partage, présence, listes, réordonnancement

### M2-V01 — Verbe `layout` nommé par le résultat, défaut `carry`
- Énoncé : le verbe qui fait changer la mise en page d'un élément s'écrit `layout` (`data-motion="layout"`, `layout(el, mutate)`), jamais `flip`, `morph` ou `measure` ; il ne nomme pas le mécanisme FLIP. Son défaut de reprise est `carry` : une mise en page interrompue repart de la position rendue.
- Familles : F7, F10
- Nature : instance
- Avantages : nom présent chez Motion (`layout`) et anime.js (`createLayout`), Svelte nomme le même effet `animate:flip` (mécanisme) ; aucun homonyme natif ; `carry` évite un saut sur réordonnancement interrompu
- Limites : « layout » est ambigu avec la mise en page CSS (`display`, `grid`) ; le défaut `carry` impose le backend JS (M5-S08) ; un débutant peut attendre un verbe de geste
- Conflits : M2-V02 (même famille, deux mécanismes), M5-S02 (verbe `layout` déjà présent, à conserver)

### M2-V02 — Verbe `shared` pour l'élément partagé, distinct de `layout`
- Énoncé : un élément qui traverse une navigation ou deux îles s'écrit `shared` avec un nom de partage (`data-motion-shared="card-hero"`, M2-V09) ; `layout` reste réservé au déplacement dans un même document. Le défaut de reprise de `shared` est `restart`, car une transition de vue n'est pas interruptible.
- Familles : F8, F9
- Nature : les deux (identité globale, verbe par instance)
- Avantages : le verbe dit l'intention (« partagé ») et non l'API (`layoutId`, `view-transition-name`) ; deux mécanismes (FLIP, VT) sous un seul mot ; `restart` est honnête sur la VT
- Limites : deux verbes proches (`layout`, `shared`) à expliquer ; `shared` ne dit pas quelle technique est choisie (à documenter dans le manifeste) ; le nom doit être unique dans sa portée
- Conflits : M2-V01 (frontière des deux verbes), M1-S10 (VT à nommer automatiquement)

### M2-V03 — Présence : verbes `appear` et `disappear`, état interne non exposé
- Énoncé : l'entrée et la sortie s'écrivent `appear` et `disappear` ; l'état `data-presence` de M2-S03 reste un détail d'implémentation du runtime et n'est pas un vocabulaire public. Aucun nom `enter`, `exit`, `leave`, `dismiss`, `remove`.
- Familles : F3, F10, F11
- Nature : instance (retenue par le scope, M4-10)
- Avantages : deux mots symétriques et sans homonyme (`exit` et `leave` sont natifs Motion et Angular) ; `remove` aurait été confondu avec le retrait DOM ; l'état reste libre de changer sans casser l'API
- Limites : `disappear` moins court que `exit` pour un débutant ; un agent doit savoir que l'état `data-presence` n'est pas un contrat ; le retrait réel reste dépendant de `finished`
- Conflits : M2-S03 (état public contre verbe, à trancher ici en faveur du verbe), M5-S02 (`disappear` déjà présent, retenu), M4-S02 (`dismiss` à abandonner)

### M2-V04 — `stagger` en option de conteneur, pas en verbe
- Énoncé : le décalage d'une liste est une option `stagger` posée sur le conteneur, en millisecondes ou en token fermé (`stagger: "fast" | "normal" | "slow"`), avec `from: "first" | "last" | "center"`. Ce n'est jamais un verbe.
- Familles : F10, F11
- Nature : instance (conteneur)
- Avantages : nom convergent (GSAP `stagger`, anime.js `stagger`, Motion `staggerChildren`) ; une option ne double pas le verbe de l'enfant ; `from` évite le sens de lecture implicite
- Limites : `stagger` n'exprime pas une séquence complète (rôle de `sequence`) ; le token reste à régler par le designer (M3) ; sur une liste virtualisée, le calcul par index est faux
- Conflits : M3-S09 (cascade de groupe, à caler sur cette option), M2-S04 (clé de liste)

### M2-V05 — `reorder` comme verbe de geste, `drag` réservé au déplacement libre
- Énoncé : le geste de réordonnancement s'écrit `reorder` (défaut `carry`, option `axis`) ; `drag` n'est pas un verbe de v1. Le déplacement libre sans réordonnancement, s'il existe un jour, prendra un autre nom.
- Familles : F18, F10
- Nature : instance
- Avantages : `drag` est déjà un nom d'événement DOM (`dragstart`, `drag`) : homonyme évité ; `reorder` dit le résultat pour la liste ; cohérent avec M1-S09 (pas de moteur de geste en v1)
- Limites : aucun nom pour le déplacement libre ; `reorder` ne couvre pas un geste de type « swipe » ; le clavier doit exister sous ce même verbe (F20)
- Conflits : M5-S02 (verbe `drag` à retirer), M2-S05 (primitive de geste), M1-S09 (absorbée)

### M2-V06 — Défauts de reprise du couple layout / présence
- Énoncé : `layout`, `appear` et `disappear` ont pour défaut `carry` ; `shared` a pour défaut `restart`. Le manifeste écrit ces défauts une fois ; l'auteur n'écrit `continuity` que pour changer le défaut.
- Familles : F7, F3, F8, F13
- Nature : global (table du manifeste)
- Avantages : un ressort de présence réapparaissant sur une sortie en cours se poursuit (pas de saut) ; un élément partagé à la VT ne tente pas une reprise impossible ; la table est lisible par un agent
- Limites : `carry` fait basculer en JS (M5-S08) pour toutes les présences, donc coût par défaut ; un `disappear` interrompu par `appear` doit inverser la trajectoire, règle à écrire
- Conflits : M5-S08 (défaut par verbe, retenu ici), M1-S10 (`shared` non interruptible)

### M2-V07 — Options de mesure et de correction : `measure` et `correct`, pas `scale`
- Énoncé : le layout se règle par `measure: "position" | "size" | "both"` (défaut `both`) et `correct: "children" | "radius" | "none"` (défaut `children`) ; le mot `scale` n'est pas une option, car il désigne à la fois une animation et une correction.
- Familles : F7, F8, F14
- Nature : instance
- Avantages : deux noms qui disent ce qui est mesuré et ce qui est corrigé ; `scale` ne se confond plus avec la propriété d'animation (`scale`, `zoom`) ; valeurs fermées, testables
- Limites : `measure: "size"` seul reste rare et source d'erreurs ; `correct` ne couvre pas `box-shadow` ni `border-width` (limites de M2-S01) ; deux options à apprendre
- Conflits : M2-S01 (correction d'enfants), M2-03 (FLIP transform)

### M2-V08 — Presets de présence nommés par le sens du mouvement
- Énoncé : les presets livrés s'appellent `fade`, `rise` (vient du bas), `drop` (vient du haut), `grow`, `shrink`, `sink` (sort vers le bas) et `lift` (sort vers le haut) ; `appear` et `disappear` partagent les mêmes noms. Les noms d'origine (`slide-in-from-top`, `from-*`) sont refusés.
- Familles : F3, F4
- Nature : global (presets livrés)
- Avantages : résout la divergence « down » de R2 (AOS mesure le sens du mouvement, tw-animate l'origine) ; un même mot pour l'entrée et la sortie ; un agent ne choisit pas entre deux sens
- Limites : `rise` et `sink` sont contre-intuitifs pour qui pense « origine » ; la direction horizontale (`left` / `right`) n'est pas couverte ; à documenter avec un schéma
- Conflits : M5-S06 (définitions nommées, presets M3), M3-S01 (`reveal` utilise ces presets)

### M2-V09 — Grammaire HTML : `data-motion-shared` comme nom de partage
- Énoncé : le partage s'écrit `data-motion-shared="<nom>"` : un nom de référence, jamais une valeur libre. `data-motion` désigne toujours une définition ou un verbe ; les options passent par la définition, pas par des attributs supplémentaires.
- Familles : F8, F9, F22
- Nature : les deux (attribut par élément, nom global)
- Avantages : compatible avec « attribut = référence » (R11) ; l'identité est sérialisable au SSR et visible dans les îles HTML ; un attribut séparé évite de mêler verbe et identité
- Limites : un second attribut à maintenir ; la portée du nom reste à régler (M2-S07 de R11, `data-layout-scope`) ; le nom doit être unique dans la page
- Conflits : M2-S02 (`data-layout-id` nommé autrement ici), M5-S01 (règle de référence, à respecter), M1-S10 (nom automatique)

### M2-V10 — Langue et casse du vocabulaire
- Énoncé : les noms sont en anglais ; les verbes à l'infinitif (`layout`, `shared`, `appear`, `reorder`) ; les options en nom (`stagger`, `measure`, `correct`) ; les valeurs fermées et les attributs en kebab-case (`data-motion-shared`) ; TypeScript en camelCase (`layoutId`, `defineMotion`). Aucun nom qui reprend un événement DOM ou une API native (`drag`, `exit`, `leave`, `flip`, `animate`).
- Familles : F23, F22
- Nature : global
- Avantages : une seule langue pour humains et agents ; pas de traduction à maintenir ; un lint peut vérifier la casse ; cohérent avec les noms convergents de R2
- Limites : un public francophone doit apprendre des mots anglais ; `layout` et `shared` ne sont pas traduisibles sans perte ; la règle de casse est à imposer à tous les adaptateurs
- Conflits : M4-S02 (noms sans homonyme natif, convergent), M5-S03 (liste des noms réservés)
