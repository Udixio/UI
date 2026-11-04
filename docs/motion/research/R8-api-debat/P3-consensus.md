# P3 — Consensus R8 (v2, arbitrage après amendements)

Statut : v2. Intègre les amendements de P2 (P2-tour3.md, amendements 1 à 7). P1 n'a pas remis de tour 3 (refus de mandat, voir §4) ; son avis sur (a), (b) et R5 est repris. Références : P1-tour2.md (« P1 § »), P2-tour2.md (« P2 § »), P2-tour3.md (« P2-t3 »).

## 1. Architecture retenue et règle de partage

**Architecture : C** (un nom, plusieurs encodages, forme déduite de la spec), avec **D** (compilation) en optimisation **optionnelle** (voir §3b). Rejetés comme architectures : A (classes pures, échoue T2, T3, T5, T6) et B (idiomatique seule : dérive, C1). B est conservé comme encodage.

Règle de partage finale :

- **R1 Définir une fois.** Une définition = nom + `MotionSpec` typé + entrée du registre fermé `MotionName`. Aucune syntaxe ne définit une animation.
- **R2 Référencer par encodage.** Classe, `data-udx-motion`, prop React, directive Angular, attache Svelte. Tous résolvent la même clé typée. L'identité partagée passe par `data-udx-shared` (R8).
- **R3 Prédicat de cycle.** Vrai si la spec requiert `exit`, `identity`, `measure`, `control` ou `continuousInput`, ou un état non portable en attributs ou variables CSS. Si vrai, l'encodage framework est obligatoire. Liste fermée, pas de seuil de complexité.
- **R4 Prédicat de moteur.** Ressort, déclenchement à la vue, valeurs réactives par variables CSS, compteurs, boucles. Si R3 est faux, classe ou attribut sont admissibles ; le chunk JS se charge au besoin.
- **R5 Asymétrie.** L'encodage framework est toujours légal. Si R3 est vrai, la classe **et** l'attribut `data-udx-motion` sont interdits ; en HTML, la spec à cycle passe par un appel d'API du core (`exit(el)`, `layout(el)`, `drag(el, name)`). Vérifié au build par le plugin Tailwind pour les classes, qui doit échouer explicitement sur un candidat `motion-*` inconnu (et non omettre son CSS) ; sinon par la suite de conformité.
- **R6 Forme ≠ moteur.** Une bascule native vers JS ne change jamais l'écriture.
- **R7 Chargement.** Une définition égale un module, donc un chunk par nom **ayant une part JS**. Un nom purement natif (scrub, bascule d'état) n'émet que du CSS, aucun module vide. Le runtime ne choisit que parmi les noms du registre fermé ; un nom hors ensemble est une erreur visible. Le module d'une définition n'est chargé que par son site de référence.
- **R8 Îles.** L'identité partagée est un nom dans le DOM (`data-udx-shared`, `view-transition-name`). Jamais de contexte ni de global. Le snapshot de repli est un module ESM singleton (limite documentée : deux copies du paquet sur une page).
- **R9 État, pas CSS.** Un variant Tailwind déclare la correspondance état vers nom via une variable CSS (`md:[--udx-motion:…]`). Le core lit la valeur calculée. **Un observateur par type de variante :** `md:` par `matchMedia` (aucun attribut ne change, le `MutationObserver` ne le voit pas) ; `data-[…]:` par `MutationObserver` ; `hover:` par `pointerenter` / `pointerleave`, avec divergence documentée sur tactile (`pointerenter` se déclenche au toucher, `:hover` reste souvent actif).
- **R10 Bundler optionnel.** Le plugin Tailwind Udixio reste requis (décision utilisateur). Aucun plugin de bundler n'est requis. Tout test de conformité passe avec et sans plugin de bundler.

## 2. Tableau T1–T8

Forme d'écriture par environnement, puis régime de chargement.

| Cas | HTML / Astro | React | Angular | Svelte | Chargement |
|---|---|---|---|---|---|
| T1 carte à la vue | `card-reveal-once` : `data-state` posé par IO partagé + transition CSS. `card-reveal-scrub` : classe `motion-card-reveal-scrub` (`view()` natif, réversible) | `<Motion.div animation="card-reveal-once">` ou className | `udxMotion="card-reveal-once"` ou classe | `{@attach motion('card-reveal-once')}` ou classe | once : IO partagé, pas de chunk propre si transition CSS pure ; scrub : 0 JS, 0 chunk |
| T2 dialog qui sort | `exit(el)` (API core), `allow-discrete` natif | `<Motion.div presence>` (wrapper ; seul cas où `exitMotion` sert) | `animate.leave` natif via `udxMotion` | `transition:` natif, délégué | chunk préchargé à l'ouverture ; sortie native sans JS si supporté |
| T3 liste réordonnée, layout | `layout(el)` (core), `data-key` | `<Motion.ul layout>` + `key` (mécanisme ouvert, §5) | `udxMotion="list-layout"` + `@for … track` | `animate:flip` natif sur `{#each}` keyé, ou attache | chunk layout (~21 kB) seulement si une liste le référence |
| T4 élément partagé entre îles | `data-udx-shared="hero"` + `[view-transition-name:hero]` | `<Motion.div shared="hero">` | `udxShared="hero"` | `{@attach shared('hero')}` | 0 JS si View Transitions ; sinon FLIP par `querySelectorAll`, chunk à la demande |
| T5 séquence pilotée par bouton | handle DOM `motion.get(el)` | ref + handle de contrôle | `viewChild` + méthodes | attache retournant un contrôleur `$state` | chunk de la timeline (définition TS, régime D) |
| T6 drag avec physique | `drag(el, name)` (core) | `<Motion.div drag="card-physics">` | directive `udxDrag` | `{@attach drag('card-physics')}` | core physique chargé au premier `pointerdown` |
| T7 variants Tailwind | classe `md:[--udx-motion:…]` (natif en CSS) | même className | même classe | même classe | un observateur par type de variante (R9) ; chunk seulement si la variable désigne un nom JS |
| T8 nom venu de données | `data-udx-motion={p.motion}` (`z.enum`) | `animation={p.motion}` typé `MotionName` | `[udxMotion]="p.motion"` | `{@attach motion(p.motion)}` | runtime choisit parmi les chunks produits ; hors ensemble = erreur visible |

## 3. Résolutions

### (a) T8 : le runtime choisit un chunk parmi ceux produits au build : accepté, sous conditions

Un runtime qui sélectionne dans un ensemble fermé de chunks produits au build ne fait pas de chargement dynamique de code arbitraire. C6 tient : un chunk par nom ayant une part JS, seuls les noms référencés sont chargés. C1 tient : un nom hors ensemble échoue visiblement.

Conditions :
1. `MotionName` est une union fermée (union TS, ou `z.enum` du schéma de contenu).
2. Le build émet un chunk par nom de cet ensemble ayant une part JS (R7).
3. Une source non fermée (CMS sans schéma) ne peut pas alimenter `data-udx-motion` ; elle passe par la validation du schéma au build.
4. Le scanner de P1 (W1) reste valable : `'motion-' + name` non typé est refusé.

La clause « le runtime ne décide jamais du chargement » de P1 est remplacée par R7.

### (b) Plugin de bundler : optionnel, jamais requis pour la correction

1. Le primitif portable est `import()`, natif dans Vite, l'esbuild d'Angular CLI, Astro et Next. `import.meta.glob` est propre à Vite : il ne peut être qu'une optimisation, pas le chemin nominal.
2. Le registre fermé s'écrit à la main, une ligne par nom (`'card-reveal-once': () => import('./motions/card-reveal-once')`), typé `satisfies Record<MotionName, Loader>` : `tsc` signale tout nom ajouté à l'union sans loader, la dérive est attrapée sans plugin. Un script CLI optionnel, qui n'est pas un plugin de bundler, peut générer ce registre depuis les `defineMotion`.
3. Le plugin de bundler n'apporte que des optimisations : CSS émis par page, préchargement, scanner de références littérales, erreurs de build précoces.
4. Requis, il ferait de chaque bundler un chemin de correction à tester (matrice Vite, Angular, Astro, Next). On l'évite.
5. CSS sans plugin : deux options à mesurer sur un jeu réel avant de trancher. (i) Un fichier CSS unique listant tous les noms du registre : borné, mais chargé sur toutes les pages. (ii) Un script CLI optionnel qui scanne les sources pour les noms littéraux et n'émet que ceux-là : C6 mieux servi, au prix d'un scan textuel. (i) est le repli, (ii) est facultatif.

Test de R10 : la suite de conformité passe avec et sans plugin. Les seules différences admises sont la taille CSS par page et le préchargement.

## 4. Points d'accord

**P1 (P1-tour2.md, avis transmis par message après son refus de tour 3) accepte :**
- (a) T8 : formulation de P2 acceptable ; la clause « le runtime ne décide jamais » est remplacée ;
- (b) plugin optionnel, à condition que la suite de conformité passe avec et sans ; plugin Tailwind requis ;
- R5 faisable : le plugin échoue explicitement sur un candidat inconnu.
- Antérieurement (P1-tour2.md) : présence React par wrapper (§3.1-3.2), handle impératif (§3.3), `--udx-i` (§3.4, §3.8), R0 scindé et liste fermée (§4), architectures C et D (§4), une définition égale un module (§4), identité par le DOM (§4).

**P2 (P2-tour2.md et P2-tour3.md) :**
- accord (P2-t3) sur T8 (a) et (b), R1, R3, R4, R6, R8, R10, et sur les lignes T2, T4, T5, T6, T8 ;
- amendements 1 à 7 intégrés : T1 once/scrub corrigé (1) ; R5 étendu aux attributs (2) ; R7 sans chunk pour le natif pur (3) ; `satisfies Record` (4) ; T3 React ouvert avec ses deux options (5) ; un observateur par type de variante (6) ; CSS sans plugin à mesurer (7) ;
- antérieurement (P2-tour2.md) : classe primaire du régime natif (§3.1), DOM comme registre, `globalThis` retiré (§3.3), `exitMotion` réservé à React (§3.4), handle impératif (§3.5), scanner étendu (§3.6), R0 scindé (§4), C et D cibles (§4).

## 5. Points ouverts

- **T3 React (mécanisme) :** non acté. (i) rect mémorisé au commit précédent, invalidé au resize et au scroll ; (ii) capture dans le setter quand le réordonnancement vient d'un événement utilisateur. Une liste réordonnée à partir de données distantes relève de (i), avec sa limite documentée. Lié à W7.
- **W7 (capture avant mutation) :** Svelte a `$effect.pre` ; React n'a pas de point pré-mutation hors `getSnapshotBeforeUpdate` ; Angular à vérifier.
- **R5 côté Tailwind :** faisabilité acceptée par P1 sur le principe ; à valider contre l'API réelle du plugin à l'implémentation.
- **CSS sans plugin (amendement 7) :** mesurer les options (i) et (ii).
- **`animationcancel` :** n'est plus bloquant. Repli : `MutationObserver` et `pointerenter`, déjà prévus à R9.
- **Hover tactile :** divergence `pointerenter` / `:hover` à documenter (R9).
- **Présence dans les îles HTML sans démontage :** limite acceptée (P1 §3.7), à documenter.
- **Svelte et `<div>` nu :** `animation=` sur un élément HTML passe sans erreur (P2 §1, Q2). Lint de paquet à prévoir : un `.svelte` n'importe que `@udixio/motion/svelte`.
