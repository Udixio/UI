# J4 — Étape 2 : solution

## 1. Nom et description

**Lexique** : un vocabulaire fermé de sept intentions (`enter`, `exit`, `change`, `reveal`, `share`, `sequence`, `loop`) dont les options n'acceptent que des jetons nommés du thème. Une spec est une donnée ; le cœur la valide, la compile vers CSS, WAAPI ou un chunk JS selon la capacité, et refuse au typage ou au build tout nom inconnu.
Un seul lexique pour React, Angular, Svelte et l'HTML d'Astro ; le moteur reste invisible ; la variante réduite et la pause sont exigées par le type, jamais optionnelles.

## 2. Exemples d'utilisation

### Astro (HTML, îles sans contexte partagé)

```html
<ul data-motion="sequence" data-motion-entry="rise" data-motion-rhythm="medium">
  <li>Un</li><li>Deux</li>
</ul>
<h2 data-motion="reveal" data-motion-entry="fade">Titre</h2>
```

Si l'agent écrit `data-motion="sequnce"`, le build Astro échoue :

```
error motion: data-motion="sequnce" : intention inconnue. Attendu : enter | exit | change | reveal | share | sequence | loop
```

### Angular (typé)

```ts
import { sequence, loop } from '@udixio/motion/angular';

@Component({ template: `<ul [udxMotion]="intro"><li>…</li></ul>` })
export class Liste {
  intro = sequence({ entry: 'rise', rhythm: 'medium' });            // valide
  // sequence({ entry: 'rise', rhythm: 0.12 })
  //   erreur : 'rhythm' attend 'tight' | 'medium' | 'loose' ; raw(0.12) pour forcer
  // loop({ every: 'slow' })
  //   erreur : 'pause' manquant (WCAG 2.2.2)
}
```

## 3. Pourquoi

- L'échec principal d'un agent est l'erreur muette, plus que l'ignorance : un nom faux doit casser le build, pas produire une absence d'animation.
- Une intention = un chemin d'écriture. L'agent reproduit le motif le plus fréquent de son corpus ; le lexique doit donc n'en avoir qu'un correct par effet.
- Séquence, partage et révélation sont des intentions de premier rang : le cas de J5 s'exprime sans que l'auteur choisisse un moteur, et le coût reste par capacité (J1).
- Pause et variante réduite sont des champs obligatoires du type (J3) : l'oubli n'est plus possible, ni pour un humain, ni pour un agent.
- Jetons en JSON : le designer règle une valeur, le développeur et l'agent écrivent un nom, jamais un nombre.

## 4. Comment

1. `tokens.json` (durées, courbes, rythmes, ressorts) : chaque jeton déclare sa variante réduite, champ obligatoire. Il génère les types.
2. Un manifeste unique des intentions génère les types TypeScript, la validation de l'HTML au build Astro et la page de doc (un exemple par intention).
3. Compilation : un ressort sans interruption devient `linear()` en CSS ; avec interruption, WAAPI ; texte découpé, trajectoire ou élément partagé sans View Transitions passent par un chunk JS chargé à la demande.
4. La politique de réduction et les pauses sont résolues une fois dans le runtime ; aucun adaptateur ne peut les contourner.
5. Liaisons minces à partir du même objet : `[udxMotion]` (Angular), hook (React), `use:motion` (Svelte), `data-motion` (HTML).
6. En dev, tout passage au moteur JS est signalé avec sa raison et son poids en Ko.

## 5. Repris et rejeté

- Repris : de J1 le routage par capacité et le ressort en `linear()` ; de J5 les intentions, les jetons en données et le rythme fractionnaire ; de J3 les intentions, la pause typée et la variante jumelle ; de J2 la spec-donnée et `data-motion`.
- Rejeté : exposer la surface d'options d'anime.js (ease/easing, delay/stagger sous plusieurs formes). Ma contestation : anime.js reste moteur JS, il ne devient pas langage. Tailwind n'est pas véhicule (`animate-*`, `motion-safe:`) ; ses classes peuvent seulement être générées depuis les jetons.
- Contesté : le partage en FLIP JS (J5) est le point le plus fragile du moteur à deux branches ; J1 doit le mesurer avant qu'il devienne la référence.
