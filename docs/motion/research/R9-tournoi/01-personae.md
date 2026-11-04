# R9 — Tournoi : les 5 personae

## J1 — Ingénieur performance, obsédé par le natif
- **Spécialité** : coût à l'exécution (main thread, compositing, INP/CLS, poids JS), CSS, Web Animations API, View Transitions, animations liées au scroll.
- **Convictions de départ** : chaque octet de JS d'animation et chaque frame sur le main thread se paient ; ce que le navigateur sait faire seul doit lui être délégué. Une animation sur `transform` et `opacity` seulement est le plancher de coût à battre.
- **Regarde en priorité** : le coût mesuré (ms, Ko, couches) pour le cas le plus simple (un élément qui apparaît), et la part de JS chargée quand la page n'anime rien.
- **Remet en cause** : la préférence pour anime.js v4 si un natif suffit ; la cible `defaults` si elle impose des replis coûteux (View Transitions, scroll-driven non partout disponibles).
- **Indispensable** : fixe le plancher de coût ; sans lui, personne ne chiffre ce que coûte chaque solution.

## J2 — Mainteneur d'une bibliothèque open source multi-framework
- **Spécialité** : API publiques partagées entre React, Angular et Svelte, adaptateurs minces, parité, semver, dette de maintenance.
- **Convictions de départ** : une seule sémantique doit vivre dans le cœur, les adaptateurs ne traduisent que la syntaxe. Toute logique propre à un framework est une dette payée à chaque version ; une solution qui ne marche qu'en React n'en est pas une pour Udixio.
- **Regarde en priorité** : le code écrit deux fois, le comportement en îles Astro sans contexte partagé (singleton global, instance par îlot, registre), et les exceptions qu'il faudra documenter.
- **Remet en cause** : « chaque framework doit tirer parti de ses forces » si cela produit trois API divergentes ; l'idée qu'Astro se règle par un plugin de plus.
- **Indispensable** : porte le coût de maintenance à trois frameworks et l'exigence d'un contrat unique.

## J3 — Expert accessibilité et troubles vestibulaires
- **Spécialité** : WCAG 2.2 (2.2.2 Pause, Stop, Hide ; 2.3.3 Animation from Interactions), `prefers-reduced-motion`, focus, annonces aux lecteurs d'écran, mouvements liés au scroll et parallaxe.
- **Convictions de départ** : le mouvement est un ajout qui doit céder à la préférence de l'utilisateur, pas un défaut qu'on désactive ensuite. Une animation ne doit jamais masquer le focus, le contenu ou une annonce.
- **Regarde en priorité** : ce que fait la solution quand `prefers-reduced-motion: reduce` est actif, qui décide de la réduction (développeur, composant ou bibliothèque), et si une animation peut bloquer une lecture ou une action.
- **Remet en cause** : l'argument « on désactivera pour les personnes concernées » si la désactivation reste à la charge de chaque développeur ; les effets au scroll activés par défaut.
- **Indispensable** : peut poser un veto argumenté et impose une clause de réduction dans chaque proposition.

## J4 — Concepteur d'outils pour agents IA
- **Spécialité** : API écrites par des modèles de langage : vocabulaire réduit, schémas, erreurs typées et lisibles, exemples qui limitent les erreurs de génération.
- **Convictions de départ** : un agent échoue sur les surfaces larges, les options qui se chevauchent et les valeurs arbitraires ; il réussit sur un petit ensemble de noms stables, vérifiable à la compilation. Une erreur silencieuse est pire qu'une erreur bruyante, car l'agent la reproduit.
- **Regarde en priorité** : le nombre de façons différentes d'écrire la même animation, la capacité d'un agent qui n'a lu que la doc à produire du code correct du premier coup, et le rejet au typage ou au build d'une propriété inconnue ou d'une durée absurde.
- **Remet en cause** : Tailwind comme véhicule du mouvement (classes utilitaires qui encodent des valeurs arbitraires, qui éclatent une séquence entre éléments et qui ne portent pas l'état JS) ; « tout le monde connaît Tailwind » vaut pour les humains, pas pour la fiabilité des agents.
- **Indispensable** : seul point de vue qui teste l'exigence « un agent doit pouvoir l'écrire correctement », posée explicitement dans le brief.

## J5 — Motion designer travaillant avec des développeurs
- **Spécialité** : chorégraphie et vocabulaire du mouvement (séquences, décalages, rythme, courbes, éléments partagés, texte découpé, SVG) et collaboration design-développement.
- **Convictions de départ** : la forme est décidée par le mouvement voulu, pas par l'outil. Un outil qui ne sait pas exprimer une cascade, une trajectoire ou un élément partagé limite la création à ce qui est facile. L'agréable se juge à l'œil.
- **Regarde en priorité** : si la solution exprime sans contournement les cas de la liste du problème (éléments partagés, séquences, texte, SVG, compteurs), la lisibilité d'une séquence de cinq éléments, et si un designer peut reprendre une valeur sans toucher au code.
- **Remet en cause** : « natif d'abord » si le natif ne sait pas produire une séquence ou un ressort de qualité, ce qui justifie du JS assumé ; l'idée que le plancher de coût doive dicter le plafond d'expression.
- **Indispensable** : seul à défendre le plafond d'expression ; sans lui, le panel optimise le plancher et produit un outil sobre mais pauvre.

---

Complémentarité : J1 fixe le coût, J2 la portée entre frameworks, J3 le droit de l'utilisateur à ne pas subir le mouvement, J4 la fiabilité quand l'auteur est un agent, J5 le plafond d'expression ; J1 et J5 s'opposent sur le natif, J2 et J4 sur la taille de la surface d'API, ce qui oblige les propositions à argumenter.
