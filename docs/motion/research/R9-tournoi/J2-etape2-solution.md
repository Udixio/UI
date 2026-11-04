# J2 — Étape 2 : solution « Intentions » (`@udixio/motion`)

## 1. Nom et description

**Intentions** : un vocabulaire fermé d'intentions (entrer, sortir, changer, déplacer, cascader, partager, révéler) et des tokens nommés (durée, courbe, rythme, variante réduite) dans un fichier de données que le designer possède.
Un cœur TypeScript sans framework valide la spec, résout la politique de réduction une fois, et route chaque intention vers le backend le moins coûteux : CSS, WAAPI, View Transitions, ou moteur JS chargé à la demande.
Les liaisons (`data-motion` pour HTML/Astro, hooks React, directives Angular, actions Svelte) ne traduisent que la syntaxe ; l'état vit sur l'élément et la coordination passe par le DOM.

## 2. Exemples

**HTML / Astro** (zéro configuration par île) :

```html
<!-- layout Astro : une fois -->
<script>import '@udixio/motion/attach';</script>

<!-- n'importe quel HTML ou île : le nom est un token du fichier -->
<section data-motion="cascade" data-motion-group="intro" data-motion-rythme="0.12">
  <article>…</article>
</section>
```

**React** (les noms des tokens sont typés depuis le fichier, un nom inconnu ne compile pas) :

```tsx
import { useMotion, Presence } from '@udixio/motion/react';

export function Panneau({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useMotion('entree', { group: 'panneaux' });
  return (
    <Presence present={open} token="sortie">{/* garde le nœud jusqu'à exit() */}
      <div ref={ref}>{children}</div>
    </Presence>
  );
}
```

## 3. Pourquoi

- Le coût se paie par capacité utilisée (J1) : un fondu compile en CSS ou WAAPI, sans JS, et seul le backend demandé est chargé.
- Un vocabulaire fermé et des tokens (J4) rendent l'erreur visible : `'entrer-vite'` ou `duree: 420` échouent au build, l'agent n'a que des noms à reproduire.
- Le designer possède les valeurs (J5) : tokens en données, variante réduite dessinée comme token jumeau, rythme en fraction de durée.
- La réduction du mouvement (J3) vit dans le cœur : un adaptateur ne peut pas la contourner, et l'état final reste correct sans animation.
- Côté maintenance (J2) : une sémantique, une table de routage, des fixtures jouées dans les trois frameworks. Ajouter un moteur ne casse aucune API.
- Le plafond d'expression tient par composition (cascade, partage, texte, SVG) et par un échappement nommé `motion.custom`, compilé en JS.

## 4. Comment

1. Le cœur valide la spec : types générés depuis les tokens, garde runtime en dev qui nomme le champ fautif.
2. Il lit la réduction (`matchMedia` et `data-motion` sur `<html>`) une fois ; chaque île la lit seule.
3. Il route : opacité et transform sans interruption vers CSS ; interruptible vers WAAPI ; partage vers View Transitions si supporté ; séquence à ressort, texte, SVG vers JS chargé à la demande.
4. Chaque liaison appelle `attach(el, spec)` et renvoie `detach()`. Sortie : `exit(el) -> Promise`, dont React paie un wrapper de présence (documenté).
5. État sur l'élément (WeakMap) ; registre `globalThis[Symbol.for('udixio.motion@1')]` ; groupes résolus par `data-motion-group`.
6. Parité : fixtures communes aux quatre liaisons ; un test mesure la page sans animation complexe, pour que le plancher (J1) reste visible.

## 5. Repris et rejeté

- Repris de J4 et J5 : vocabulaire fermé, tokens en données, rythme fractionnaire, rejet au build avec le nom du token.
- Repris de J1 et J3 : routage par capacité, réduction résolue une fois dans le cœur, état et focus synchrones.
- Rejeté : « natif d'abord » comme plafond (J1 le concède) ; anime.js seulement comme backend de repli, pas comme socle ; Tailwind comme véhicule du mouvement, mais ses tokens exposés en variables CSS ; le plugin Astro, car la liaison HTML est dans le cœur.
