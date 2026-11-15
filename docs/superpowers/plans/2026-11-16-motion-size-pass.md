# @udixio/motion — passe sur le poids — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ramener l'entrée principale de `@udixio/motion` près de son poids d'avant le layout (12,7 kB gzip) : un site qui n'utilise pas d'animation de layout ne charge pas le moteur de layout, et la validation des définitions ne part pas en production.

**Architecture:** (1) Le moteur de layout (`layout.ts`, `layout/*`, `flip.ts`, `project.ts`, `spring.ts`) devient une entrée publique à part, `@udixio/motion/layout`, que l'entrée principale charge par import dynamique à la première liaison de layout (`loadLayoutEngine()` permet de la précharger). (2) La validation contre le manifeste ne s'exécute que hors production (`process.env.NODE_ENV`), ce qui laisse les bundlers l'éliminer.

**Tech Stack:** TypeScript, Vite (mode bibliothèque, ES + CJS), size-limit, Vitest navigateur.

**Spec:** `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` — §8.1 ter Q9 (chargement par verbe), §8.3.9 (point ouvert « poids »).

## Global Constraints

- Rien d'internal-only : tout ce qui quitte l'entrée principale est exporté par `@udixio/motion/layout`.
- Comportement inchangé une fois le moteur chargé. Avant son chargement, une liaison de layout existe mais ne suit rien ; le premier changement qui survient avant la fin du chargement n'est pas animé (documenté).
- Aucune régression au banc d'essai (10 %).
- Charge machine : un fichier de test à la fois, tests navigateur sur Chromium puis Firefox puis WebKit.

## Review Focus

1. Page à froid : liaison de layout, changement immédiat (non animé), puis changement après chargement (animé). → test Task 1.
2. Liaison détruite avant la fin du chargement : aucun suivi n'est créé. → test Task 1.
3. Sortie hors flux sans aucun layout sur la page : pas d'erreur, moteur jamais chargé. → test Task 1.
4. Build CJS et ESM : l'import dynamique produit un morceau séparé, chargé à la demande. → vérification Task 1.
5. Définition invalide en développement : toujours refusée ; en production : non validée. → test Task 2.

### Task 1 : moteur de layout à la demande

- [ ] Entrée `./layout`, chargeur `layout-loader.ts`, `scope-of.ts`, liaison différée, exports, budgets ; tests ; commit `perf(motion): load the layout engine on demand`.

### Task 2 : validation hors production

- [ ] `validateMotionSpec` ne valide contre le manifeste que si `process.env.NODE_ENV !== 'production'` ; test ; commit `perf(motion): validate definitions in development only`.

### Task 3 (contrôleur) : mesures et vérification

- [ ] Tailles avant / après, banc d'essai, suites complètes, doc construite sur trois navigateurs, spec.
