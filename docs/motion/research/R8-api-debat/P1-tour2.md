# P1, tour 2 : réponses, cas-test, concessions, réaction à R0

## 1. Réponses aux questions

### À P2

**Q1 (stagger sur 12 items, `layoutId` entre composants).** Une seule classe pour les 12 items : `<li class="motion-list-item">`. L'index n'entre pas dans la classe : la boucle pose une variable (`style="--udx-i: {i}"` en React, `[style.--udx-i]="$index"` en Angular, `style:--udx-i={i}` en Svelte), et la classe lit `calc(var(--udx-i) * 60ms)`. Ma prémisse est donc différente de la tienne : il n'y a pas une classe par item. Pour l'élément partagé entre deux composants, `[view-transition-name:hero]` est posé des deux côtés. L'identité est le nom, pas l'instance, et le navigateur apparie. Sans View Transitions, l'appariement passe par `data-udx-shared="hero"`, requêté dans le document au moment du snapshot (voir §2).

**Q2 (`motion-${name}` dynamique).** Personne ne crée cette classe, et c'est voulu. Une référence doit être littérale ou issue d'un ensemble fermé. `cond ? 'motion-a' : 'motion-b'` est accepté : les deux littéraux sont vus, les deux CSS et les deux chunks sont produits. `'motion-' + name` est une erreur de build, sauf si `name` est un type union fermé, auquel cas le scanner énumère ses membres. Le runtime ne décide jamais du chargement : le chunk est fixé au build.

**Q3 (`md:` ou `data-[state=open]:` sur une motion JS).** La source de vérité est l'état (attribut, media query, pseudo-classe), pas le CSS. La classe ne fait que déclarer la correspondance état vers nom : `md:[--udx-motion:spring-x]` pose la variable, et le core lit la valeur calculée. Chemins : attribut vers `MutationObserver` (un par élément concerné) ; breakpoint vers `matchMedia` (un par breakpoint utilisé, lu dans le thème) ; `:hover` vers `pointerenter`/`pointerleave`. Coût : un observateur par élément conditionnel, un listener par breakpoint de la page, une lecture de style seulement au changement. Ce coût est accepté dans les deux positions. La différence : P2 a deux sources (`md:` en CSS pour le natif, `matchMedia` en prop pour le JS), P1 n'en a qu'une.

### À P3

**Q1 (classe vers module au build).** La même clé `card-reveal` produit la classe (plugin Tailwind) et la référence de module (plugin AOT). Le mapping est fixé au build à partir des clés, sans registre runtime. Le scanner lit aussi les références littérales dans les props, attributs et directives, et les classes composées sont traitées par la règle de Q2 ci-dessus.

**Q2 (faute de nom).** L'erreur vient du scanner, au build. Tailwind seul ne signale rien : une classe inconnue n'est pas émise, donc no-op silencieux, justement le problème à corriger. Pour un agent qui n'exécute pas d'IDE, C1 est satisfait par le build, pas par l'IDE ; l'autocomplétion n'est qu'un bonus. Concession : sans ce scanner, C1 échoue sur les classes.

**Q3 (T2 et T3 : la classe reste-t-elle la forme unique ?).** Non. T2 (sortie différée) et T3 (identité de nœud, mesure avant mutation) ne sont pas des formes de classe. La frontière est précisée au §4 (prédicat scindé).

## 2. Cas-test qui fait échouer P2 : T4 (élément partagé entre deux îles)

Scénario : un bouton de l'île React fait passer le « hero » dans l'île Svelte, même page, sans navigation.

Avec les formes de P2 :
- React `layoutId="hero"` vit dans l'arbre de l'île A et ne voit pas l'île B.
- Svelte `animate:flip` est scopé à son `{#each}` keyé et ne voit pas l'île A.
- `view-transition-name` fonctionne, mais P2 dit que la lib ne l'enveloppe pas et que le routeur s'en charge. `ClientRouter` ne couvre que la navigation, et ce scénario n'en est pas une.
- Reste le FLIP entre îles, que P2 résout par `globalThis[Symbol.for('udx.motion')]`.

Verdict : P2 viole C7 tel que P3 l'écrit (« aucun contexte, provider ou registre global partagé requis »). Son idiomatie s'arrête à la frontière de l'île, justement là où le cas exige une chaîne de nom. P2 finit avec une API de chaîne en plus de ses formes idiomatiques.

Démonstration P1 :

```html
<!-- île React --> <div class="[view-transition-name:hero]" data-udx-shared="hero">…</div>
<!-- île Svelte --> <div class="[view-transition-name:hero]" data-udx-shared="hero">…</div>
```

Le changement d'état passe par `transition(() => setState())`, une fonction du core qui appelle `document.startViewTransition` quand c'est supporté : le navigateur garde le snapshot. Sans support, le core prend un snapshot FLIP par `querySelectorAll('[data-udx-shared="hero"]')` avant mutation. Le DOM sert de registre : pas de global, pas de provider. Le snapshot de repli vit dans un module ESM singleton (même graphe de modules par page), pas dans `window`. Deux copies du paquet sur une même page casseraient ce singleton : contrainte à documenter.

Second signal, moins décisif : T5 (contrôle) demande quatre écritures selon les frameworks (ref React, `viewChild`, controller `$state` Svelte, `motion.get(el)` en HTML). C1 échoue aussi là.

## 3. Ce que je concède à P2

1. **Présence React.** Un wrapper (`<Motion.div presence>`) est la forme juste. Ma primitive `exitMotion` universelle (W4) est fausse : elle ne sert que là où le framework n'a pas de sortie native.
2. **Délégation au natif.** `animate.enter/leave`, `animate:flip`, `transition:`, `ClientRouter`, `withViewTransitions()` ne doivent pas être réimplémentés. Je retire `exitMotion` pour Angular et Svelte.
3. **Contrôle impératif.** Le handle idiomatique (ref, `viewChild`, `attach`) vaut mieux que `motion.play(el, name)` que je proposais (W5). Le vocabulaire (méthodes, noms) reste commun.
4. **Index de boucle.** P2 a raison : l'index appartient à la boucle. Mon régime A disait « index posé par la liste », je le précise ici.
5. **Règle de partage de P2.** Cœur si agnostique, adaptateur si le framework possède le cycle de vie, jamais de réimplémentation d'une primitive native : je l'adopte, à condition de la fonder sur une propriété de la spec (cycle ou moteur), pas sur la nature de la famille.
6. **Motion riche.** Séquences et timelines relèvent de la définition TS (régime D). Je l'avais écrit (W3), P2 le confirme.
7. **Îles HTML sans démontage.** La présence y reste une limite. Elle touche les deux positions.
8. **Nommage.** J'adopte `--udx-i` de P2 à la place de `--motion-i`.

## 4. Réaction à R0 et à l'architecture C/D

**Accord sur C/D comme cible** : D est C plus une compilation AOT, c'est mon propre schéma en trois paliers. Je rejette A comme architecture de référence : elle échoue T2, T3, T5 et T6 et ne sait pas dire quand la classe ne suffit pas. Je rejette B comme architecture de référence : quatre écritures de contrôle (C1) et trois surfaces à synchroniser (C4).

Amendements précis :

- **R0.3 : scinder le prédicat en deux.** Le texte actuel mélange deux questions. (a) *Cycle* : sortie avec démontage, identité de nœud, mesure avant mutation, contrôle impératif, entrée continue du pointeur. Dans ce cas, l'encodage framework est obligatoire. (b) *Moteur* : ressort, déclenchement à la vue, valeurs réactives via variables, compteurs. Dans ce cas, classe ou attribut sont admissibles et le chunk JS se charge au besoin. Sans cette scission, T6 et T7 se contredisent dans le tableau attendu, puisqu'un ressort seul ne dépend pas du cycle de vie.
- **R0.3bis : asymétrie.** L'encodage framework est toujours légal ; seul l'encodage classe est restreint. L'erreur de build ne frappe que la classe sur une spec à cycle.
- **R0.4 : liste fermée.** La vérification porte sur des propriétés de la spec (`exit`, `identity`, `measure`, `control`, `continuousInput`), pas sur un jugement de complexité.
- **Tableau attendu, amendé.** T1 et T7 (y compris en variante JS) en classe ; T2, T3, T5 et T6 en framework ; T4 en nom partagé dans le DOM (`data-udx-shared`, `view-transition-name`), pas en registre.
- **R0.6 : chargement.** Accepté, avec une règle : une définition égale un module. Le plugin AOT génère ce module par nom (module virtuel), donc le chargement ne dépend pas d'un barrel. Réponse à P2 Q3 : l'unité est la définition nommée ; le composant n'en est qu'un consommateur. Un barrel ne pose pas de problème tant que la référence est littérale.
- **Architecture D, coût.** Le plugin AOT se réduit à (1) un scanner partagé, écrit et testé une seule fois, et (2) un adaptateur fin par bundler qui traduit les modules virtuels et les `import()`. Le CSS vient du plugin Tailwind, déjà commun. Le coût réel est la matrice de tests par bundler, plus que le code.

## 5. Désaccords qui subsistent

- Classe pour une motion JS conditionnelle : P2 la refuse, je la tiens. Tranché par R0.3 scindé.
- Forme de la présence React : je suis P2 (wrapper).
- Îles : DOM comme registre (moi) contre global (P2). Je propose le DOM.
