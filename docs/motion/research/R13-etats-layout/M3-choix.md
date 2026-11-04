# M3 — Choix de conception : détection des changements, layout, états, présence (R13)

Couverture : Q1 → L01–L05 ; Q2 → L06 ; Q3 → L07 ; Q4 → L08 ; Q5 → L09 ; Q6 → L10. « Avant » = géométrie stable lue en phase lecture de la frame précédente.

### M3-L01 — Déclencheur de layout = attribut de données, jamais la classe
- Énoncé : un changement de layout se déclenche sur un attribut `data-*` posé par l'auteur ou le composant (ex. `data-open`), jamais sur `class` : Tailwind traduit `data-[open]:justify-end` en sélecteur CSS, et le runtime ne lit que l'attribut. Observation par MutationObserver par racine de layout (`data-motion-scope`), `attributeFilter` sur une liste fermée tenue par le manifeste.
- Familles : F7, F2
- Nature : les deux (liste globale du manifeste, portée par racine)
- Avantages : aucun bruit des classes utilitaires ; coût proportionnel aux racines suivies, pas au document ; même signal en HTML, React, Angular, Svelte
- Limites : l'attribut duplique l'état affiché par la classe ; `attributeFilter` n'accepte pas de jokers, donc la liste doit suivre le manifeste
- Conflits : aucun connu (fournit le signal à L02)
- Cohérence : réutilise §8.0 bis (l'attribut nomme, Tailwind règle les états) et `data-motion` ; introduit `data-motion-scope` (racine de layout), justifié car mesurer les voisins exige une portée bornée (L02) ; `data-open` n'est pas préfixé car c'est un état de l'auteur, non une option de verbe : exception assumée

### M3-L02 — Valeur « avant » = dernière géométrie stable, bornée à la racine
- Énoncé : pour chaque élément d'une racine suivie, le runtime garde le rect lu en phase lecture de la frame précédente, après écritures. C'est la valeur « avant » du FLIP, sans aucune lecture dans le callback de mutation. Invalidée par un ResizeObserver sur la racine (changement de taille sans mutation : `md:`, container query) et par tout MutationObserver `childList` ou attribut de la racine. Le même cache sert au départ d'un nœud déjà retiré (L10) et au réordonnancement (L05).
- Familles : F7, F8, F10, F19
- Nature : global (cache et observateurs) ; instance (portée)
- Avantages : une seule source de vérité pour tous les environnements ; lecture groupée dans la frame unique (§8.0 #3) ; aucun point pré-mutation requis
- Limites : valeur périmée si un changement non observé déplace un élément hors racine ; une lecture de layout par frame et par élément suivi (coût à mesurer) ; toutes les lectures précèdent les écritures de la frame
- Conflits : aucun connu (base de L03, L05, L08, L10)
- Cohérence : réutilise la frame unique et ses phases lecture / écriture (§8.0 #3) ; l'écriture qui suit une invalidation ResizeObserver est différée à la frame suivante (pas de boucle) ; aucun verbe ni option nouvelle

### M3-L03 — Point de mesure par environnement, surface d'écriture inchangée
- Énoncé : la surface reste identique (§8.0 bis #3) ; seul le point où la géométrie « avant » est capturée varie. React : `useLayoutEffect` du commit précédent (la valeur stockée devient « avant ») ; Svelte : `$effect.pre`, avant mise à jour du DOM (à confirmer en spike) ; Angular : `ngDoCheck` de la directive hôte (à vérifier en spike), sinon L02 ; HTML pur et îles : `udixio.motion.set(el, attrs)`, qui mesure puis écrit ; changements déclenchés par l'utilisateur : capture native sur le document (`pointerdown`, `keydown`), avant les handlers des frameworks.
- Familles : F7, F8
- Nature : instance
- Avantages : pas de dépendance à `getSnapshotBeforeUpdate` (classes seulement) ; le chemin par défaut reste L02, le point d'ancrage n'est qu'un raffinement ; HTML pur obtient une écriture exacte quand elle passe par l'API
- Limites : trois chemins à tester ; une écriture externe (`setAttribute` d'un script tiers) retombe sur L02 et perd l'exactitude ; le point Angular reste à confirmer
- Conflits : L02 (repli)
- Cohérence : réutilise `useMotion`, `udxMotion`, `{@attach motion(spec)}`, `motion(el, spec)` (§8.0 bis #3) ; introduit `udixio.motion.set` : nouveauté justifiée par l'absence de point pré-mutation en HTML pur, à inscrire dans la surface d'écriture comme exception documentée

### M3-L04 — Changements purement CSS hors FLIP, contrat explicite
- Énoncé : un changement dû à `:hover`, `:focus` ou une media query n'est pas un layout Udixio : le runtime ne l'écoute pas et ne le joue pas. Les propriétés interpolables (`transform`, couleurs, `height: auto` via `interpolate-size` là où il existe) restent en transition CSS native. Pour un FLIP sur un état CSS, l'auteur expose l'état en attribut (L01), au prix d'une écoute pointer ou focus à borner. La sonde par propriété `@property` (technique Bramus) est opt-in seulement : bugs Safari < 18, Firefox et Chrome avant 148 sur les propriétés non enregistrées, conflit avec `transition-*` de Tailwind.
- Familles : F2, F7, F20
- Nature : instance
- Avantages : zéro écouteur par défaut ; cohérent avec §4.3 ; la sonde n'est payée que là où elle est demandée
- Limites : un `hover:` qui déplace un élément n'est jamais en FLIP sans attribut ; double source (CSS et attribut) à maintenir
- Conflits : aucun connu
- Cohérence : réutilise la règle §4.3 et l'attribut d'état de L01 ; aucun verbe ni option nouvelle ; la sonde est un mécanisme de détection, sans forme dans la grammaire

### M3-L05 — Réordonnancement reconnu par identité de nœud dans le lot
- Énoncé : React, Svelte et Angular déplacent les nœuds par retrait puis insertion. Le runtime reconnaît un déplacement quand un même nœud figure dans `removedNodes` et `addedNodes` d'un même lot de callbacks MutationObserver (WeakMap nœud → cache L02). Un retrait sans réinsertion est une sortie (L10) ; une insertion sans trace dans le cache est une arrivée (`appear`). Aucune clé de framework n'est lue.
- Familles : F10, F7
- Nature : global
- Avantages : identique en HTML, Astro, React, Angular, Svelte ; pas de clé à maintenir ; coût limité aux lots qui touchent une racine suivie
- Limites : un nœud recréé (nouvelle instance) n'est pas reconnu comme déplacé ; le découpage en lots dépend de la coalescence des microtâches ; un tri qui change la taille du voisin n'est couvert que si la racine est suivie
- Conflits : aucun connu (dépend de L02)
- Cohérence : réutilise le verbe `layout` (défaut `carry`, réduit instantané, R12 M5-choix) et `appear` ; aucune option nouvelle

### M3-L06 — Changement d'état non géométrique : `emphasize` sur `trigger="state"`, reprise `carry`
- Énoncé : rotation, couleur, échelle ou propriété personnalisée qui change avec un attribut d'état (L01) se déclare avec `emphasize` et `trigger="state"` (trigger déjà listé en §4.1). La reprise est `carry` par défaut : la vitesse de départ est estimée sur deux valeurs calculées lues en frame (`velocity.source: estimated`), ou exacte quand le moteur la fournit. Le ressort passe par anime.js ; en natif, une courbe `linear()` pré-calculée suffit quand la spec n'exige pas de reprise.
- Familles : F2, F13, F1
- Nature : les deux (détection globale par attribut ; reprise par instance)
- Avantages : aucun nouveau verbe ; un changement d'état en cours repart de la valeur et de la vitesse courantes ; le natif suffit sans reprise
- Limites : `emphasize` mêle états et attention (R12, à scinder si besoin) ; la vitesse estimée sur deux frames est bruitée ; une propriété non interpolable (`display`) sort de ce chemin
- Conflits : aucun connu (scission d'`emphasize` à trancher avec R12)
- Cohérence : réutilise `emphasize`, `trigger`, `carry` et `velocity.source` (§8.0 #4, §8.0 bis #4) ; aucune option nouvelle ; `transition` et `animate` restent non utilisés (noms réservés)

### M3-L07 — Panneau qui reste monté : mesure de la cible seulement
- Énoncé : pour un accordéon ou un disclosure, le runtime ne mesure que la hauteur cible (`scrollHeight` du contenu, lue en phase lecture après que L01 a signalé l'attribut). L'origine est 0 ou la hauteur du tween en cours, que le runtime possède déjà : aucune lecture pré-mutation. Le contenu garde sa boîte pendant la fermeture (`inert` et `aria-hidden` posés immédiatement, `display` retiré seulement à `finished`). Natif d'abord : `interpolate-size: allow-keywords` (Chromium) ; `::details-content` à vérifier (absent de R1) ; repli JS : tween de `height`.
- Familles : F7, F2, F3
- Nature : instance
- Avantages : pas de problème de « avant » quand la hauteur de départ est connue ; interruption propre (la hauteur courante est celle du tween) ; même mécanisme pour `details` natif et `div`
- Limites : un `hidden` ou `display:none` immédiat casse la mesure et la sortie ; le contenu fermé continue de coûter en layout ; `interpolate-size` absent de Firefox et Safari
- Conflits : aucun connu (repose sur L10 pour la présence)
- Cohérence : réutilise le verbe `layout` (défaut `carry`) et `inert` / `aria-hidden` de M4-03 ; aucun verbe nouveau ; exception : la hauteur cible est lue à la place de l'origine, à documenter comme cas particulier de `layout`

### M3-L08 — Élément partagé : `data-motion-shared="<clé>"`, unique par document
- Énoncé : l'identité s'écrit comme option (`data-motion-shared="<clé>"`) et s'inscrit dans un registre unique par document, rangé dans le runtime global (§8.0 #1) donc partagé entre îles. Une clé désigne au plus un élément vivant : en dev, erreur citant le manifeste ; en prod, le premier inscrit garde la clé et le suivant joue un `appear` simple. Homologue absent à l'arrivée : `appear` ; absent au départ : `disappear` retenu jusqu'à `finished` (L10), géométrie de départ tirée de L02.
- Familles : F8, F9
- Nature : les deux (registre global, inscription par instance)
- Avantages : une écriture pour composants et îles ; aucun contexte de framework ; erreur de clé dupliquée visible en dev
- Limites : clé dupliquée silencieuse en prod ; collisions entre îles indépendantes sur des clés génériques ; pas de partage entre documents (cross-document : L09)
- Conflits : L02 et L10 (départ)
- Cohérence : réutilise le verbe `layout` (élément partagé inclus, §8.1) et la grammaire `data-motion-<option>` ; aucune exception ; registre calqué sur le runtime global (§8.0 #1)

### M3-L09 — Transitions de page : natif d'abord, observation d'un outlet et non du document
- Énoncé : cross-document, `@view-transition { navigation: auto }` avec `pageswap` / `pagereveal` (Chromium, Safari 18.2+ ; Firefox absent). SPA et Astro ClientRouter passent par `startViewTransition` ou leurs événements (`astro:before-swap` / `astro:after-swap`, à vérifier). Le runtime n'écoute aucun routeur : il observe par MutationObserver `childList` le seul outlet déclaré `data-motion-outlet`. L'élément partagé de route s'écrit avec `layout` et L08.
- Familles : F9, F8
- Nature : les deux (événements globaux ; outlet par instance)
- Avantages : aucun adaptateur de routeur requis ; coût nul hors page à outlet ; le natif sert là où il existe
- Limites : Firefox sans transition cross-document, repli à définir (fondu de `appear`) ; `view-transition-*` est réservé (§8.1), les noms générés restent Udixio ; comportement Astro à vérifier
- Conflits : aucun connu
- Cohérence : réutilise `layout`, `appear`, `data-motion-shared` ; introduit `data-motion-outlet`, justifié par la portée bornée de l'observation (même raison que `data-motion-scope`, L01)

### M3-L10 — Présence : la sortie se déclare sur la racine retirée, index et état publiés
- Énoncé : le runtime ne peut ni lire ni retenir un nœud déjà retiré ; la sortie d'un sous-arbre se déclare donc sur sa racine : React par hook qui retarde le démontage, Angular `animate.leave` sur la racine, Svelte `out:`, HTML pur `udixio.motion.remove(el)` qui diffère `element.remove()` jusqu'à `finished`. Pendant la sortie : `inert` et `aria-hidden` immédiats, nœud gardé à son index DOM (les voisins ne sautent pas), et `data-motion-presence="entering | present | leaving"` publié. Les enfants ne sont animés qu'avec un stagger déclaré.
- Familles : F3, F10, F20
- Nature : instance (sortie) ; global (état publié)
- Avantages : une règle pour les quatre environnements ; retrait différé sans observateur sur le document ; état lisible en CSS et dans les tests
- Limites : en HTML pur, un `remove()` nu détruit l'effet ; retenir un nœud retiré en React est un état à gérer dans l'adaptateur ; rendu réduit de `disappear` : instantané (R12) ou fondu (§8.1 corrigé), à trancher
- Conflits : L02 (géométrie de départ) ; M4-03 (validé en R10, à respecter)
- Cohérence : réutilise le verbe `disappear` (restart, rendu réduit par défaut), `inert` / `aria-hidden` (M4-03) et la surface `udixio.motion` (§8.0 bis #3) ; introduit `data-motion-presence`, état publié et non option du verbe, justifié car l'état doit être lisible par CSS et tests sans lire le manifeste
