# @udixio/motion — étape 5 : gestes et transitions de page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manipulation directe — glisser, balayer, réordonner — avec relâchement en ressort initialisé par la vitesse et une alternative clavier obligatoire ; et des transitions de page qui s'appuient sur les View Transitions natives.

**Architecture:** `defineGesture(name, spec)` (entrée `@udixio/motion/gesture`, chargée à la demande comme les valeurs) ; une liaison par élément qui écoute les pointeurs (capture), suit le doigt en écrivant `translate` en ligne, mesure la vitesse sur les derniers échantillons, puis relâche avec le ressort intégré par frame déjà utilisé par les valeurs (extrait dans un module commun). Le réordonnancement déplace le nœud dans le DOM au franchissement du milieu d'un voisin et laisse le moteur de layout animer les voisins (`reflow`). Les transitions de page passent par `navigate(update, { direction })` (View Transitions natives, types et `data-motion-direction`) ; un adaptateur Astro s'appuie sur les événements du ClientRouter.

**Tech Stack:** TypeScript, Pointer Events (capture), View Transitions (`document.startViewTransition`, types), Vitest navigateur (trois navigateurs : les trois ont `startViewTransition` avec types), Astro.

**Spec:** §8.2.2 (`defineGesture`), §8.2.5 (`GestureSpec`), §8.2.4 (gestes et transitions de page), §8.1 ter Q2, §8.1 quater I18, I24, §8.1 quinquies (S2 : Astro), §8.4 F9, F18, F20.

## Global Constraints

- Gestes : `kind: 'drag' | 'swipe' | 'reorder'` ; `axis` ; `bounds: 'parent' | 'none'` ; `release` (ressort, défaut `spring.default.spatial`) ; `alternative` obligatoire et typée par nature : `drag` → `'arrows'`, `swipe` → `'action'`, `reorder` → `'grab'` (WCAG 2.1.1, 2.5.7).
- Un geste n'a pas de verbe ; reprise `carry` (un nouveau contact attrape l'élément là où il est, avec sa vitesse annulée).
- Vitesse exposée (`binding.velocity`, `source: 'estimated'` — les événements coalescés ne sont pas fiables, R16).
- Mouvement réduit : pas d'animation de relâchement (position finale posée).
- Événements DOM sur l'élément : `motion-dragend`, `motion-swipe` (annulable), `motion-reorder` (annulable : `preventDefault()` laisse le DOM à l'application).
- Annonces clavier du réordonnancement dans une région `role="status"` unique, masquée visuellement.
- Transitions de page : pas de verbe ; ressort `spring.slow.spatial` (validé §8.1 quinquies ⚑ point 4) ; mouvement réduit → mise à jour sans transition ; rejets de `ready` / `finished` attrapés.
- Charge machine : vérifier la charge avant chaque lancement navigateur.

## Review Focus

1. **Deuxième contact pendant le relâchement** : l'élément est rattrapé là où il est, sans saut.
2. **Pointeur qui sort de la fenêtre** (capture) et `pointercancel` : relâchement propre.
3. **Réordonnancement au clavier** : Espace, flèches, Échap, annonces.
4. **Balayage refusé** (`preventDefault`) : l'élément revient.
5. **Navigation pendant une transition** : la seconde remplace la première sans erreur non gérée.

### Task 1 : gestes (cœur)
### Task 2 : transitions de page
### Task 3 : HTML et adaptateurs
### Task 4 : démo et README
### Task 5 (contrôleur) : vérification et spec
