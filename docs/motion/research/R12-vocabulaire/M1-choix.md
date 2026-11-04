# M1 — Choix de conception : vocabulaire (moteur et rendu)

### M1-V01 — Chaque verbe déclare sa classe de moteur
- Énoncé : chaque verbe appartient à une classe de moteur fixe publiée dans le manifeste : `css` (`state`, `appear`, `disappear`, `reveal`, `draw`, `loop` sans vitesse), `waapi` (`layout`, `tween` numérique), `js` (`drag`, `follow`, `morph`, `split` animé), `scroll` (`scrub`, timeline native). L'auteur n'a pas à connaître le moteur ; une option (`continuity`) peut faire monter la classe, jamais la baisser.
- Familles : F1 à F24
- Nature : global
- Avantages : coût prévisible par nom ; un agent sait quel verbe charge du JS sans lire le code ; le build peut refuser une option qui ferait descendre la classe
- Limites : une classe par verbe reste une approximation (un `state` peut monter en `waapi`) ; la table doit suivre les moteurs ; le manifeste doit publier aussi la classe effective
- Conflits : M5-S08, M1-01

### M1-V02 — `carry` garde la position, la vitesse n'est exigée que pour un ressort
- Énoncé : `carry` signifie continuité de la valeur rendue : WAAPI repart de la valeur courante (retarget natif). La vitesse, donc le moteur JS, n'est exigée que si l'animation est un ressort, ou si le verbe est `drag` ou `follow`. Le handle expose `velocity.source` dans ces cas, et `position` sinon.
- Familles : F2, F7, F12, F13, F18
- Nature : instance
- Avantages : `state` et `layout` restent natifs en `carry` ; le coût JS n'apparaît qu'avec le ressort ; supprime l'équivalence implicite « carry = physique »
- Limites : deux niveaux de continuité à expliquer ; une transition non ressort peut avoir une vitesse visuelle différente ; l'estimation WAAPI reste bruitée
- Conflits : M5-S08 (carry force le JS), M1-03, M1-02

### M1-V03 — Table de reprise par défaut, par verbe
- Énoncé : chaque verbe a un défaut de reprise fixe dans le manifeste, écrit seulement pour le changer. `restart` pour `appear`, `disappear`, `reveal`, `tween`, `page`, `split`, `draw`, `morph`, `sequence`, `loop` ; `carry` pour `state`, `layout`, `scrub`, et `drag` ou `follow` avec vitesse (M1-V02).
- Familles : F2, F3, F7, F10, F12, F13, F14, F18
- Nature : global
- Avantages : la plupart des écritures ne portent aucune option de reprise ; le défaut suit la physique réelle du verbe ; un agent devine le défaut sans table externe
- Limites : `disappear` pendant un `appear` en `restart` peut sauter (à tester avec M4-03) ; `sequence` en `restart` coupe la cascade au milieu ; défauts à reconfirmer par moteur
- Conflits : M5-S08 (défaut par verbe, amendé), M4-03

### M1-V04 — Rendu réduit par verbe, deux valeurs fermées
- Énoncé : sous `prefers-reduced-motion`, chaque verbe a un rendu réduit fixe parmi `fade` (opacité seule, durée courte) et `instant` (état final immédiat). `loop` devient une frame neutre avec pause exposée ; `scrub` et `follow` deviennent `instant` ; `drag` garde le retour d'état sans inertie. Le choix est publié dans le manifeste, jamais écrit par l'auteur.
- Familles : F2, F3, F4, F5, F14, F18, F20, F24
- Nature : global
- Avantages : une valeur par verbe ; `fade` ne coûte aucun JS ; le lint (M5-S10) peut vérifier la présence de la valeur
- Limites : `fade` peut rester trop fort pour certains utilisateurs ; `instant` supprime l'indication de changement pour `reveal` (à compenser par l'état final) ; `follow` en `instant` peut masquer une position
- Conflits : M5-S09, M5-S04

### M1-V05 — Ressorts et courbes : tokens d'option, jamais des verbes
- Énoncé : une courbe (`ease`) ou un ressort (`spring`) est une option dont la valeur est un token nommé du designer (`snappy`, `gentle`, `standard`). Aucun verbe ne porte un nom de physique. Un token de ressort garde ses paramètres physiques (raideur, amortissement, masse) : compilés en `linear()` pour CSS, utilisés tels quels par le moteur JS.
- Familles : F1, F13, F18
- Nature : global
- Avantages : le verbe reste stable quand le ressort change de moteur ; le designer règle la physique sans toucher au code ; une seule source pour CSS et JS
- Limites : `linear()` absent des vieux Chrome de `defaults` (repli JS) ; deux représentations du même token à tester ; la table `linear()` ne transporte pas la vitesse
- Conflits : M5-S05 (compile tous les ressorts au build, retire les paramètres JS), M1-02

### M1-V06 — Trois verbes de mouvement continu : `reveal`, `scrub`, `follow`
- Énoncé : `reveal` = déclenchement à la vue (observateur global) ; `scrub` = progression liée à la position de défilement (timeline native, instance) ; `follow` = valeur qui suit une source continue (curseur, parallaxe), abonné nommé du runtime (M5-S09). `follow` n'est jamais utilisé pour le défilement. Trois moteurs distincts, donc trois noms distincts.
- Familles : F4, F5, F14
- Nature : les deux (`reveal` global ; `scrub` et `follow` par instance)
- Avantages : chaque nom correspond à un moteur et à une nature ; lève le `follow` ambigu de R11 ; le typage refuse `scrub` avec seuil et `reveal` avec `range`
- Limites : trois mots à apprendre ; `scrub` hors Chromium repose sur un repli nommé ; `follow` et `scrub` restent proches pour un débutant
- Conflits : M5-S02 (`follow` absorbe `scrub`), M3-S01

### M1-V07 — Sortie : `disappear` déclare la présence, `data-presence` reste une sortie
- Énoncé : l'auteur écrit `disappear` pour retirer un élément. Le runtime retient le nœud jusqu'à `finished` (M4-03) et publie `data-presence="exiting"` pendant la sortie, en lecture seule pour le CSS. `dismiss` n'existe pas, et `data-presence` n'est jamais écrit par l'auteur.
- Familles : F3, F10, F11
- Nature : instance
- Avantages : un seul mot pour écrire la sortie, un seul état pour la styler ; pas de collision avec `exit` ni `out:` ; la présence reste un contrat de cycle de vie
- Limites : deux noms pour une même sortie (verbe et état) à expliquer ; `disappear` pendant un `appear` relève de M1-V03 ; le nœud retenu doit être libéré en fin de sortie
- Conflits : M2-S03 (présence comme état seul), M4-S02

### M1-V08 — Sortir `scroll` et `tween` du vocabulaire
- Énoncé : `scroll` n'est plus un verbe : le défilement programmé est une action `scrollTo` qui renvoie un handle (M3-S02). `tween` n'est plus un verbe : c'est une option numérique interne (`to:`) de `state` et de `count`. Le vocabulaire passe de quinze à quatorze verbes : `state`, `appear`, `disappear`, `reveal`, `scrub`, `follow`, `layout`, `sequence`, `loop`, `split`, `draw`, `morph`, `drag`, `page`.
- Familles : F6, F15
- Nature : les deux (`state`, `page` global ; les autres par instance)
- Avantages : un défilement n'est pas un effet d'élément ; `tween` n'a pas de moteur propre (il dépend de M1-V01) ; le plafond baisse sans perdre de famille
- Limites : `tween` perd son nom pour un débutant qui compte ; `scrollTo` n'a pas d'attribut HTML défini ; deux entrées à documenter (action et verbe)
- Conflits : M5-S02 (amendé), M3-S02

### M1-V09 — Options à domaine fermé, aucun nombre littéral
- Énoncé : chaque option a un domaine fermé publié, rempli uniquement par des tokens : `rhythm: tight|snug|medium|loose|wide`, `duration: short|medium|long`, `threshold: touch|quarter|most`, `distance`, `direction`, `group`. Un nombre littéral est refusé au build. Les options qui changent le moteur (`duration`, `ease`, `spring`, `threshold`) ne prennent jamais de valeur libre, pour que le moteur soit choisi par le nom.
- Familles : F1, F4, F7, F10, F13, F23
- Nature : global
- Avantages : un agent ne peut pas inventer une valeur ; le moteur est lisible dans le nom, donc publiable ; changer une valeur est une retouche de token
- Limites : un domaine fermé peut manquer un besoin réel ; ajouter une valeur est un changement de version ; la liste est à tenir avec le designer (M3)
- Conflits : M3-S06 (cohérent), M4-S05

### M1-V10 — Grammaire HTML : un attribut par option, référence seule
- Énoncé : une animation s'écrit `data-motion="reveal"` ou `data-motion="card-enter"` (référence), et chaque option a son propre attribut `data-motion-<option>` (`data-motion-rhythm="snug"`). La liste des attributs observés est fermée et générée depuis le manifeste ; le runtime s'abonne par `attributeFilter` à cette seule liste.
- Familles : F1, F2, F3, F4, F22, F23
- Nature : les deux (liste d'observation globale ; valeurs par élément)
- Avantages : pas de parseur de chaîne à l'exécution ; `attributeFilter` évite de réagir aux attributs étrangers ; le build vérifie chaque attribut contre le manifeste
- Limites : plusieurs attributs par élément, plus verbeux ; une option inconnue doit échouer au build ; l'ordre des attributs ne doit jamais compter
- Conflits : M5-S01 (cohérent), M4-S09 (attributs verbeux)
