# @udixio/motion — étape 4 : valeurs, compteurs, séquences — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trois familles restantes du cœur : une **valeur** continue (pointeur, défilement, état, temps) écrite en variable CSS sur les éléments abonnés et lissée par un ressort ; un **compteur** qui anime le texte d'un nombre ; une **séquence** qui orchestre plusieurs groupes d'enfants avec un seul handle.

**Architecture:** `defineValue(name, spec)` et `defineSequence(name, spec)` rejoignent `defineMotion` (définitions nommées, validées en développement, partagées par page). Une valeur est une liaison par élément (`data-motion-value="<nom>"`, `value(el, nom)`) qui produit un nombre, le lisse (ressort analytique ou intégré par frame, avec vitesse), et l'écrit en `--udx-motion-value-<nom>` sur l'élément — jamais sur la racine (I26). Les mises à jour passent par la frame unique du runtime (`runtime.subscribe`), seulement pendant le mouvement. Un compteur est une valeur de source `state` dont la cible est l'attribut `value` d'un `<data>` et dont la sortie est aussi le texte formaté (`Intl.NumberFormat`). Une séquence calcule le délai de chaque élément de chaque étape et lance toutes les animations WAAPI d'un coup ; un handle composé les pilote.

**Tech Stack:** TypeScript, WAAPI, `Intl.NumberFormat`, Vitest navigateur (trois navigateurs).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.2.2 (`defineValue`, `defineSequence`), §8.2.5 (`ValueSpec`, `SequenceSpec`), §8.1 quater I06, I15, I26, §8.1 ter Q5, §8.4 F11, F14, F15, §8.3.3 (frame unique, abonnés nommés).

## Global Constraints

- Variable écrite : `--udx-motion-value-<nom>` (espace `--udx-motion-*`, I07), sur l'élément lié seulement.
- Source `pointer` : position du pointeur relative à la boîte de l'élément (0 → 1 par axe), ramenée au milieu de `range` quand le pointeur sort. Source `scroll` : progression du défilement du document (0 → 1 par axe). Source `state` : cible donnée par l'auteur (`binding.set(n)`, ou l'attribut `value` de l'élément s'il en a un). Source `time` : progression 0 → 1 en boucle sur une période (`timing`, courbe), pause hors vue.
- `range: [min, max]` (défaut `[0, 1]`) ; `spring` (défaut `spring.default.spatial` ; `none` pour aucun lissage).
- Mouvement réduit : pas de lissage (valeur posée tout de suite) ; `time` figé au début de `range`.
- Aucun travail par frame au repos : l'abonnement au runtime n'existe que pendant un mouvement (et pour `time`, tant que l'élément est visible).
- Compteurs : `format: 'integer' | 'decimal' | 'percent' | 'currency'` (+ `currency` ISO 4217 pour `currency`) ; langue = attribut `lang` le plus proche ; le texte rendu par le serveur reste la valeur finale ; hors vue à la liaison → compte depuis le début de `range` à l'entrée dans la vue ; dans la vue à la liaison → rien ; changement de `value` → compte vers la nouvelle valeur.
- Séquences : `steps` ordonnés ; `at` = nom d'une étape (démarre avec elle) ou `+=tight|normal|loose` (démarre ce délai après le début de l'étape précédente) ; sans `at`, après la fin de l'étape précédente ; `stagger` par étape ; déclencheur `verb: 'appear' | 'reveal'` de la séquence (défaut `appear`).
- Charge machine : un fichier de test à la fois ; trois navigateurs ; vérifier la charge.

## Review Focus

1. **Pointeur qui sort brusquement** : la valeur revient au milieu sans saut. → test Task 1.
2. **Compteur dont la valeur change pendant qu'il compte** : il repart de sa valeur affichée, sans saut. → test Task 2.
3. **Langue et format** (`fr` : espace insécable, virgule) : texte correct à l'arrivée. → test Task 2.
4. **Séquence interrompue** (`cancel`, retrait de la racine) : aucune animation ne reste. → test Task 3.
5. **Valeur au repos** : aucun abonnement au runtime. → test Task 1.

### Task 1 : valeurs
### Task 2 : compteurs
### Task 3 : séquences
### Task 4 : adaptateurs
### Task 5 : démo et README
### Task 6 (contrôleur) : vérification et spec
