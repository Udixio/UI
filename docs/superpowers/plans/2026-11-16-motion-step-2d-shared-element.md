# @udixio/motion — étape 2d : élément partagé — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deux éléments qui portent la même identité (une vignette et sa carte de détail) se transforment l'un en l'autre : quand le second apparaît à la place du premier, il part de la boîte du premier et rejoint la sienne.

**Architecture:** L'identité est une clé (`shared`) portée par une liaison de layout. Le runtime de page (partagé entre copies du paquet et entre îles) mémorise, par clé, la dernière boîte vue du porteur et l'instant où il a disparu. Quand un autre élément de même clé arrive (première mesure, ou retour à l'affichage) et que le porteur précédent n'est plus vivant, le moteur de layout planifie un vol depuis la boîte mémorisée (FLIP, §8.1 quinquies S2 : FLIP = rendu sûr). Pas de View Transitions dans cette étape ; pas de rétention du nœud sortant (seule sa boîte est retenue, 600 ms).

**Tech Stack:** TypeScript, WAAPI, Vitest navigateur (trois navigateurs), Astro (démo).

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.1 quater I09, I17, §8.1 quinquies (I17, hydratation tardive), §8.2.2 (`defineShared`), §8.2.3 (`shared`), §8.3.7–§8.3.10 (moteur de layout).

## Global Constraints

- `shared` est une option du verbe `layout` (I09). Clé : chaîne kebab-case ; par définition (`shared` dans la spec) ou par élément (`data-motion-shared`, option `shared` des liaisons et adaptateurs) ; la valeur par élément l'emporte.
- Unicité : un seul porteur vivant par clé. Vivant = connecté, non `exiting`, affiché. Un second élément vivant de même clé ne se transforme pas ; erreur en développement, une fois par clé (I17, `first-live`).
- Rétention : la boîte du porteur disparu reste valable 600 ms.
- Pendant la transformation, le contenu de l'élément est mis à l'échelle avec lui (pas de projection du contenu : le contenu des deux porteurs diffère) ; les coins arrondis restent corrigés.
- Mouvement réduit et `--udx-motion: none` : aucune transformation.
- La forme du runtime change : la clé de préversion du runtime est incrémentée.
- Aucune régression au banc d'essai pour les éléments sans clé (10 %).
- Charge machine : un fichier de test à la fois ; trois navigateurs pour le moteur.

## Review Focus

1. **Échange dans la même tâche, dans les deux ordres** (le nouveau lié avant ou après la destruction de l'ancien). → test Task 1.
2. **Aller puis retour** (A → B, puis B → A). → test Task 1.
3. **Deux porteurs vivants** : pas de transformation, une erreur de développement. → test Task 1.
4. **Arrivée tardive** (plus de 600 ms après la disparition) : apparition ordinaire. → test Task 1.
5. **Deux copies du paquet / deux îles** : la mémoire est dans le runtime de page. → test Task 1 (deux runtimes ne sont pas simulables : vérifier que la mémoire vit bien sur l'objet runtime partagé).

### Task 1 : mémoire partagée et arrivée dans le moteur

- [ ] Registre (`remember`, `forget`, `recall`), clé de runtime, manifeste (`shared`), `defineShared`, option `shared` des liaisons, arrivée dans le moteur ; tests ; commit `feat(motion): morph between elements that share an identity`.

### Task 2 : HTML, adaptateurs, démo, documentation

- [ ] `data-motion-shared`, option `shared` des trois adaptateurs, démo « Shared element », README ; commit `feat(motion): share an identity from HTML and the framework adapters`.

### Task 3 (contrôleur) : vérification

- [ ] Démo au navigateur, banc d'essai, suites complètes, tailles, doc construite sur trois navigateurs, spec §8.3.11, journal.
