# Findings ouverts — audit StateLayer et suites

Date : 2026-09-11 — Branche : `feat/theme-config`

Deux constats établis au cours de l'audit de `StateLayer` dépassent son périmètre et
n'ont **pas** été traités. Ils sont consignés ici avec leurs preuves pour qu'ils ne se
perdent pas, chacun avec la raison pour laquelle il mérite sa propre décision.

---

## 1. `className` est un mécanisme React translittéré, sur 34 composants Angular

**Sévérité : major. Portée : toute la surface publique de `@udixio/ui-angular`.**

Preuves :

- **35 inputs `className` répartis sur 34 composants**, et **aucun alias `class`** :
  `grep -rn 'readonly className' packages/ui-angular/src/lib --include=*.ts | grep -v spec`.
- `className` est le nom de la propriété DOM **de React**. Aucun développeur Angular
  n'écrit `[className]` : il écrit `class` ou `[class]`.

Règle enfreinte — `references/public-api-standard.md`, modèle en trois couches : le
**concept** (« des classes ») est invariant, l'**orthographe** appartient à la forme de
livraison. Celle de React a été conservée sur toute la bibliothèque.

**Pourquoi ce n'est pas un simple renommage.** `class` serait faux pour deux raisons :
collision avec la liaison de classe native d'Angular sur l'hôte, et surtout **ce n'est pas
la classe de l'hôte**. Le type est `string | ClassNameComponent<Interface>` — un contrat de
style pour les éléments *internes* du composant, éventuellement fonction des états. Le nom
idiomatique serait plutôt `classes`, mais c'est une décision de nommage à prendre, pas à
déduire.

**Coût** : breaking sur 34 composants, tous les exemples de `apps/doc`, et tout
consommateur externe. Mérite sa propre spec.

---

## 2. La doctrine révisée du plugin n'est pas active

**Sévérité : major. Portée : toute session invoquant les skills de gouvernance.**

> **Clos le 2026-09-12** — plugin mis à jour en `0.3.0` avec `--scope project` ; les
> skills se chargent désormais depuis `plugins/udixio-ui-governance/`. Le premier
> composant livré sous la doctrine active est le badge (ci-dessous).

Preuves :

- Plugin installé : `0.1.0+codex.20260722135539`. Dépôt : `0.2.0+codex.20260909101404`.
- Le cache contient **zéro** occurrence de `platform-shape` et dit encore « Motion ».
- Le marketplace `udixio-ui` pointe pourtant sur le dépôt
  (`~/.claude/plugins/known_marketplaces.json`, `source: directory`) — c'est l'instantané
  du cache qui est figé.

**Conséquence** : une session qui invoque `audit-parity`, `sync-angular-component` ou
`audit-multiframework` aujourd'hui applique les **anciennes** règles. Tout le travail de
révision de doctrine est sans effet tant que le plugin n'est pas rafraîchi.

**Remède** : `claude plugin update udixio-ui-governance`, puis redémarrage. Non exécuté
ici : cela modifie l'environnement de l'utilisateur et n'aurait aucun effet dans la session
courante.

---

## 3. Badge — `FORM-BADGE-001`, accepté et livré (2026-09-12)

**Sévérité : major → `fixed`.** Le premier badge Angular était un composant enveloppant
`udx-badge`, copie de la forme React. La règle d'attachement tranche pour la directive :
le badge s'attache à un élément que le consommateur possède. Verdict `platform-shape`,
accepté par l'utilisateur, consigné dans `badge.overview.mdx` (« On an icon »).

Livré (`8d89131c`, `347c5973`, `efc55a0c`) :

- `[udxBadge]` avec inputs `udxBadge*`, surface `BadgeSurface`, et
  `createBadgeAnchorController` dans `@udixio/core/dom` (boîte résolue à travers
  `display: contents`, containing block, ré-attachement après re-rendu de l'hôte).
- `visible` / `udxBadgeVisible` et `createBadgeTransitionController` (anime.js) pour
  l'apparition et la disparition ; `NavigationRailItem.badge` dans les deux frameworks.
- `PARITY-BADGE-001` (`fixed`) : la forme chaîne de `udxBadgeClass` était inerte, le
  conteneur étant l'élément marqué ; état dérivé `attached` dans le contrat de style et
  synchronisation des classes conteneur sur l'élément marqué.

Preuve : core 382, React 342, Angular 288 ; audit-parity `validate` sans finding ouvert
(matrice de tests Angular alignée sur React : bord d'ancrage, point annoncé, formes de
classes).

Observé dans Chrome (onglet visible, 35 frames / 300 ms), sortie puis retour, Angular et
React : opacité et scale 1 → 0.5 → 0.1 → 0, `visibility: hidden` en fin de sortie ; puis
0 → 0.5 → 0.9 → 1 avec `role="status"` rétabli. La première mesure, faite sur un onglet
caché (`visibilityState: hidden`, zéro `requestAnimationFrame`), ne prouvait rien : anime.js
se met en pause sur document caché.

---

## Traités, pour mémoire

Les autres findings de l'audit `StateLayer` ont été corrigés : vocabulaire (`State` →
`StateLayer`), absence totale de tests d'adaptateur, contrat couleur
(`--default-color` en override déguisé, échec silencieux du survol), prop creux `children`,
`type: 'div'` contre un `<span>` rendu, absence de TSDoc, et la transition de sélection
manquante d'Angular Chip. La forme directive a été **déclinée** avec sa justification et sa
condition de réouverture, consignées dans la TSDoc de l'adaptateur Angular.
