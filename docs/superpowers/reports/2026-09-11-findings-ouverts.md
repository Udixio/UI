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

## Traités, pour mémoire

Les autres findings de l'audit `StateLayer` ont été corrigés : vocabulaire (`State` →
`StateLayer`), absence totale de tests d'adaptateur, contrat couleur
(`--default-color` en override déguisé, échec silencieux du survol), prop creux `children`,
`type: 'div'` contre un `<span>` rendu, absence de TSDoc, et la transition de sélection
manquante d'Angular Chip. La forme directive a été **déclinée** avec sa justification et sa
condition de réouverture, consignées dans la TSDoc de l'adaptateur Angular.
