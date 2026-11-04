# J2 — Étape 1 : thèse (mainteneur multi-framework)

## Thèse

Une seule sémantique du mouvement vit dans le cœur, framework-agnostique : une spec en données pures (cibles, états, durée, position dans une séquence) et un runtime qui l'exécute. React, Angular, Svelte et la forme HTML (`data-motion`, pour Astro) ne traduisent que la syntaxe d'attachement au cycle de vie. Conséquences :

1. L'état vit sur l'élément (WeakMap), jamais dans l'arbre d'un framework. Une séquence entre éléments se coordonne par le DOM (ids, `data-motion-group`), pas par un Context. Les îles Astro cessent d'être une exception : chaque île est un cas normal.
2. Le moteur est un détail d'implémentation : WAAPI quand la spec est dans son périmètre, anime.js sinon. Aucune API ne casse. Condition : chaque primitive a un équivalent natif, ou est déclarée « capacité étendue » dans la doc (ressorts, découpe de texte).
3. Le registre partagé est `globalThis[Symbol.for('udixio.motion@1')]`, versionné par majeure : une instance par page si les îles partagent la majeure. Deux majeures coexistent sans coordination : exception documentée.
4. Le plafond d'expression vient de la composition de quelques primitives, pas du nombre d'options. Petite surface (J2, J4), expressivité (J5).
5. La réduction du mouvement (J3) vit une seule fois dans le runtime. Un adaptateur ne peut pas la contourner.
6. Une erreur de contrat est levée (types fermés au build, exception en dev au runtime), jamais avalée.
7. Parité prouvée par un jeu de fixtures exécuté dans les trois frameworks : une divergence est un test rouge, pas une revue.

« Chaque framework tire parti de ses forces » : oui, dans l'ergonomie de liaison seulement (action Svelte, directive Angular à signaux, hook React). Une API propre à React (composant `<Motion>` avec présence intégrée) reste une dette tant qu'elle n'a pas d'équivalent dans la spec.

## Exemple 1 — Une spec, quatre liaisons

```ts
// core : données pures, typées, validées
export const enterCard = {
  target: 'card',
  from: { opacity: 0, y: 12 },
  to: { opacity: 1, y: 0 },
  duration: 300,
};
```

- React : `const ref = useMotion(enterCard)`
- Angular : `<div [udxMotion]="enterCard">`
- Svelte : `<div use:motion={enterCard}>`
- Astro / HTML : `<div data-motion="enter-card">`

Chaque liaison appelle `core.attach(el, spec)` et renvoie `detach()`. Si une liaison fait plus que ça, c'est de la logique de framework qui doit remonter dans le cœur.

## Exemple 2 — Contre-exemple : la sortie, où la syntaxe ne suffit pas

Retirer un élément après son animation de sortie demande un protocole commun, pas une traduction :

```
core.exit(el, spec) -> Promise<void>        // un seul protocole
React   : présence (le nœud reste monté via state jusqu'à la promesse)   coût : wrapper
Angular : animate.leave, mappé sur exit                                  coût : nul
Svelte  : out:, mappé sur exit                                           coût : nul
```

Règle contractuelle : un adaptateur ne retire jamais le nœud avant la résolution. Test de conformité : une liste qui se réduit ne fait pas collisionner les éléments sortants avec les entrants. Exception à documenter : React est le seul à payer le wrapper de présence.

## Exemple 3 — Astro : trois îles, une instance, pas de plugin

```html
<ReactIsland client:visible><Card id="a" data-motion-group="intro" /></ReactIsland>
<SvelteIsland client:load><Card id="b" data-motion-group="intro" /></SvelteIsland>
<section data-motion="enter" data-motion-group="intro" data-motion-stagger="80">…</section>
```

- Contre-exemple : un `MotionProvider` React ne voit pas l'île Svelte (racines séparées). La séquence « intro » est alors incomplète, sans erreur.
- Solution : le groupe se résout par `querySelectorAll('[data-motion-group="intro"]')`, le registre par `globalThis`. La forme HTML est livrée dans le cœur : zéro configuration.
- Exceptions à documenter : (a) une île `client:visible` hydratée après le déclenchement démarre à son hydratation ; (b) deux majeures sur une page ne se coordonnent pas ; (c) sur `astro:before-swap`, `detach()` est obligatoire, et la spec doit être idempotente.
