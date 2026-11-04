# J3, étape 2 : solution

## 1. Nom et description

**Couche sobre** : le socle statique est toujours correct, le mouvement est une couche ajoutée sous condition.
- Le cœur résout un mode unique (`full`, `fade`, `instant`) une fois ; chaque îlot et chaque adaptateur le lit, aucun ne le recalcule.
- Vocabulaire fermé (`reveal`, `leave`, `change`, `loop`, `progress`, `scroll`) ; chaque intention déclare son rendu réduit, champ obligatoire.
- Focus, `inert`, `aria-*`, annonces et pause sont garantis par le runtime, jamais laissés au composant.

## 2. Exemples d'utilisation

### Astro / HTML

```astro
<html lang="fr" data-motion-policy="auto"> <!-- auto | reduce : réglage du site -->
<script src="/motion/core.js" type="module"></script>

<button aria-expanded="false" aria-controls="aide" data-motion-trigger="aide">Aide</button>
<div id="aide" data-motion="reveal" hidden>…</div>

<div data-motion="loop" data-motion-every="4000" data-motion-pause="pause-slides">…</div>
<button id="pause-slides">Mettre en pause</button>
```

`core.js` n'ajoute le mouvement que si le mode le permet. En mode `reduce`, le carrousel reste à une diapositive, avec précédent et suivant accessibles.

### React

```tsx
import { useReveal } from '@udixio/motion/react';

export function Aide() {
  const [open, setOpen] = useState(false);
  const panel = useReveal<HTMLDivElement>({ open, focus: 'first' }); // gère hidden, inert, focus
  return (
    <>
      <button aria-expanded={open} aria-controls="aide" onClick={() => setOpen(o => !o)}>Aide</button>
      <div id="aide" ref={panel}>…</div>
    </>
  );
}
```

Aucune requête `prefers-reduced-motion` dans le composant. Un `hidden` posé à la main est refusé par le cœur, en dev, avec un message qui nomme la règle.

## 3. Pourquoi

- Quand le socle est statique, la réduction ne coûte rien : l'état final existe déjà, le mouvement n'est qu'une couche. Plancher (J1) et plafond (J5) cessent de s'opposer ici.
- « Qui désactive ? » reçoit une réponse fixe : le cœur. L'oubli devient impossible par construction, pas par vigilance. C'est le point que je refuse dans « on désactivera pour les personnes concernées ».
- Un rendu réduit obligatoire rend la variante visible en revue : on ne peut pas écrire un mouvement sans dire ce qu'il devient.
- Un attribut sur `<html>` est le seul état partagé entre îles Astro ; il ne demande aucun contexte, donc aucune exception au cas îlot (J2).
- Les invariants (focus, `inert`, annonces) sont là où un moteur défaillant nuit vraiment ; les placer dans un runtime les soumet à un seul jeu de tests.
- Je conteste deux préférences implicites : le motif « mouvement actif, puis `motion-reduce:` » (Tailwind renverse la charge, car le mouvement reste actif tant qu'on ne l'annule pas), et le scroll-linked activé par défaut.

## 4. Comment

- Résolution : `matchMedia('(prefers-reduced-motion: reduce)')` et `data-motion-policy` donnent un mode unique, publié sur `<html>` ; les adaptateurs ne lisent que ce mode.
- Compilation : chaque intention descend au moteur le moins coûteux (CSS, puis WAAPI, puis JS chargé à la demande). En mode réduit, seul le rendu réduit est compilé : le moteur JS n'est pas téléchargé.
- Sortie : `inert` au départ, puis animation, puis `hidden`. Le focus revient au déclencheur avant l'animation, pas après.
- `loop`, durée supérieure à 5 s ou démarrage automatique exigent un handle de pause, déclenchable au clavier. `scroll` exige un nom explicite, sinon rendu statique.
- `essential: { reason }` est requis pour tout mouvement non réductible : absence = erreur de type au build et erreur de dev au runtime.
- Test de conformité : pour chaque intention, les modes `full` et `instant` produisent le même DOM final, le même focus et les mêmes annonces (comparaison automatique).

## 5. Repris et rejetés

- Repris de J4 (vocabulaire fermé, jetons, erreur typée), de J2 (spec en données, liaisons minces, `data-motion` pour Astro), de J1 (CSS et WAAPI comme plancher) et de J5 (le rendu réduit est une donnée nommée que le designer règle).
- Rejeté de J5 : une variante réduite dessinée à la main sans défaut. Ici le défaut générique (`fade` ou `instant`) existe toujours, et le designer le surcharge par un jeton.
- Rejeté de J2 : le registre `globalThis` pour la politique. Un attribut DOM suffit ; le registre reste utile pour l'état des séquences.
