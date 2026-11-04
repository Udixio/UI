# J1 — Étape 3 : solution « Paliers fixes »

## 1. Nom et description

**Paliers fixes.** Onze intentions fermées (entrer, sortir, changer, déplacer, partager, séquence, compter, texte, dessiner, défiler, boucler). Chacune a un palier d'exécution fixe, écrit dans une table publiée et testée : 0 CSS, 1 API native (WAAPI, View Transitions), 2 module JS chargé à la demande.
Le palier ne dépend ni de l'auteur ni de la présence d'un attribut voisin. Les jetons (durée, courbe, rythme, variante réduite obligatoire) vivent dans un fichier que le designer possède.

## 2. Exemples

### Exemple A — Astro : onze intentions possibles, trois paliers utilisés

```astro
<!-- layout : une fois ; le noyau lit la politique et ne charge que les modules demandés -->
<html lang="fr" data-motion-policy="auto">
<script>import '@udixio/motion';</script>

<h2 data-motion="entrer">Titre</h2>                      <!-- palier 0 : CSS, aucun module -->
<ul data-motion="sequence" data-motion-groupe="intro" data-motion-rythme="moyen">
  <li>Carte 1</li><li>Carte 2</li>                       <!-- palier 1 : WAAPI, aucun module -->
</ul>
<strong data-motion="compter" data-motion-de="0" data-motion-vers="1280">0</strong>
<!-- palier 2 : seul le module « compter » est téléchargé -->
<!-- data-motion="sequnce" échoue au build Astro, avec la liste des intentions -->
```

### Exemple B — React : erreurs de typage, pause obligatoire

```tsx
import { m, useMotion } from '@udixio/motion/react';

export function Galerie({ photos, total }: { photos: Photo[]; total: number }) {
  const liste = useMotion(m.sequence({ groupe: 'intro', rythme: 'moyen' }));   // palier 1
  const compte = useMotion(m.compter({ de: 0, vers: total, ton: 'lent' }));    // palier 2
  // m.sequence({ rythme: 0.12 })  -> erreur : 'rythme' attend 'serre' | 'moyen' | 'lache'
  // m.boucler({ every: 'lent' })  -> erreur : 'pause' manquant (WCAG 2.2.2)
  return (
    <>
      <strong ref={compte}>0</strong>
      <ul ref={liste}>{photos.map((p) => <li key={p.id}>{p.label}</li>)}</ul>
    </>
  );
}
```

## 3. Pourquoi

- Un palier fixe par intention rend le coût lisible : une page sans `compter`, `texte`, `déplacer` ni `partager` ne charge aucun module JS. La table est testée, donc la page de mesure (ms, Ko) peut la vérifier.
- Onze verbes couvrent la liste du problème : apparitions, sorties, transitions, mise en page, partage, listes, séquences, compteurs, texte, SVG, défilement. Les gestes restent hors périmètre de cette version, et je le dis.
- Un lexique fermé et des erreurs nommées au build (J4) : l'agent a des noms à reproduire, et une faute casse le build au lieu de ne rien animer.
- Pause et rendu réduit sont des champs obligatoires du type (J3) ; le rendu réduit est pris dans le jeton, que le designer dessine.
- Les valeurs brutes n'existent que dans le fichier du designer (J5) ; le code ne voit que des noms.

## 4. Comment

1. `tokens.json` (designer) : durée, courbe, rythme (`serre | moyen | lache`, en fraction de durée), `reduit` obligatoire. Il génère les types.
2. Table fixe : palier 0 pour `entrer`, `sortir`, `changer`, `dessiner`, `boucler`, et `défiler` quand le navigateur le tient ; palier 1 pour `sequence` et `partager` (View Transitions, sans FLIP par défaut) ; palier 2 pour `déplacer` (FLIP, opt-in), `compter`, `texte`.
3. Le noyau lit `data-motion-policy` et `matchMedia` une seule fois, puis n'exécute que le rendu réduit si la politique le demande.
4. L'interruption est explicite : CSS et API natives retargetent sans conserver la vitesse ; un ressort est déclaré `ressort: true` et passe au palier 2.
5. En dev, chaque élément affiche son palier, le poids du module et toute retombée à l'état final avec sa raison. Aucun repli silencieux.
6. Sortie : `inert` au départ, puis animation, puis retrait. L'adaptateur React paie un wrapper de présence, documenté comme exception.
7. Les groupes se résolvent par `data-motion-groupe` ; l'état des séquences vit dans `globalThis[Symbol.for('udixio.motion@1')]`, versionné par majeure.

## 5. Ce qui a changé et pourquoi

- Le palier est fixé par l'intention, sans détection d'attributs voisins : les critiques de J2, J4 et J5 visaient cette magie.
- Vocabulaire unique en français pour HTML et JS (`rythme`, `groupe`, `ton`), avec erreurs de build nommant l'intention ; les incohérences signalées par J3 et J5 sont corrigées.
- Ajout de `compter`, `texte`, `dessiner`, `déplacer`, `partager`, `défiler`, `boucler` avec pause typée : la couverture relevée par J2, J3 et J4 est comblée ; le FLIP reste opt-in, sans repli par défaut (J5).
