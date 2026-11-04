# R9 — Tournoi : le problème

## Le problème (volontairement ouvert)

Udixio UI est une bibliothèque de composants Material 3 open source, disponible
en React, Angular et Svelte, aussi utilisée dans des sites Astro (architecture
en « îles » : des morceaux de React, Svelte ou HTML pur cohabitent sur une même
page sans contexte partagé).

Elle a besoin d'une **manière commune de faire de l'animation** (« motion »),
pour ses propres composants et pour les sites que ses utilisateurs construisent
avec elle : apparitions, sorties, animations au scroll, transitions entre états,
animations de mise en page, éléments partagés entre vues, listes, séquences,
gestes, compteurs, texte, SVG, etc.

Aujourd'hui, les développeurs qui utilisent Udixio font très peu de motion,
parce que les outils existants coûtent trop cher à l'usage : verbeux, difficiles
à relire, limités à un seul framework, ou fragiles quand un agent IA écrit le
code. Le but est que faire du motion avec Udixio devienne banal, fiable et
agréable — pour un humain comme pour un agent IA.

Personne n'a encore décidé **à quoi doit ressembler cette solution**. C'est
exactement ce qu'on cherche.

## Préférences actuelles du porteur du projet (CONTESTABLES)

Ce ne sont pas des vérités. Ce sont les orientations actuelles du porteur du
projet. Il est **ouvert à ce que n'importe laquelle soit remise en cause** :
si tu démontres, arguments à l'appui (A + B ⇒ C), qu'une préférence est un
mauvais choix pour ce problème, propose mieux. Une remise en cause doit être
argumentée, pas gratuite.

- Tailwind CSS est aujourd'hui utilisé dans tout l'écosystème Udixio.
- anime.js v4 est le moteur d'animation JavaScript envisagé. Les capacités
  natives du navigateur (CSS, Web Animations API, View Transitions,
  animations liées au scroll…) sont envisagées en priorité quand elles
  existent.
- Navigateurs visés : requête browserslist `defaults`.
- Chaque framework devrait pouvoir tirer parti de ses propres forces, sans être
  bridé par les limites des autres.
- Le résultat devrait être compréhensible et vérifiable : un agent IA doit
  pouvoir l'écrire correctement, et une erreur doit se voir plutôt qu'échouer
  en silence.
- Ne charger que ce qui est réellement utilisé.

## Règles communes à tous les participants

- Réflexion et conception : pas d'audit du dépôt, pas d'inventaire de
  dépendances. Recherche web autorisée uniquement pour vérifier UN fait précis
  dont dépend un argument.
- Chacun n'écrit QUE ses propres fichiers dans `docs/motion/research/R9-tournoi/`.
- Aucune commande git.
- Être concis : respecter les limites de longueur données à chaque étape.
