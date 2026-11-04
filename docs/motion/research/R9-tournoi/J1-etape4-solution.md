# J1 — Étape 4 : solution « Paliers fixes » (v3)

## 1. Nom et description

**Paliers fixes.** Onze verbes fermés (entrer, sortir, changer, deplacer, partager, sequence, compter, texte, dessiner, defiler, boucler). Chaque verbe est lié à un palier fixe, publié et testé : 0 CSS, 1 API native (WAAPI, View Transitions), 2 module JS chargé à l'appel. Le palier ne change jamais selon le navigateur ; seul le rendu de repli varie, il est déclaré dans le jeton et journalisé en dev.
Les jetons (durée, courbe, rythme `serre | moyen | lache`, rendus `reduit` et `repli`) vivent dans un fichier du designer. Les composants ne contiennent aucun nombre de mouvement.

## 2. Exemples

### Exemple A — Astro / HTML

```astro
<html lang="fr" data-motion-policy="auto">
<script>import '@udixio/motion';</script>

<h2 data-motion="entrer">Titre</h2>                       <!-- palier 0 : CSS -->
<ul data-motion="sequence" data-motion-groupe="intro" data-motion-rythme="moyen">
  <li>Carte 1</li><li>Carte 2</li>                        <!-- palier 1 : WAAPI, aucun module -->
</ul>
<strong data-motion="compter" data-motion-de="0">1280</strong>
<!-- palier 2 : seul le module compter est téléchargé ; la cible 1280 est du contenu -->
<!-- sequnce ou rythme="0.12" : erreur au build, qui nomme le verbe ou les jetons attendus -->
```

### Exemple B — Angular : sortie native et erreurs typées

```ts
import { m } from '@udixio/motion/angular';

@Component({
  template: `
    @if (ouvert) {
      <ul [udxMotion]="liste">@for (p of photos; track p.id) { <li>{{ p.label }}</li> }</ul>
    }
    <strong [udxMotion]="compte">1280</strong>`,
})
export class Galerie {
  @Input() photos: Photo[] = [];
  @Input() ouvert = true;
  liste = m.sequence({ groupe: 'intro', rythme: 'moyen' });  // palier 1
  compte = m.compter({ de: 0, ton: 'lent' });                // palier 2 ; sortie = animate.leave
  // m.sequence({ rythme: 0.12 }) : erreur, rythme attend serre | moyen | lache
  // m.boucler({ every: 'lent' }) : erreur, pause manquante (WCAG 2.2.2)
}
```

## 3. Pourquoi

- Palier fixe par verbe : le coût est lisible et testé. Un navigateur sans View Transitions ne change pas de palier, il exécute le repli déclaré (réponse aux critiques de J3 et J4).
- Onze verbes couvrent la liste du problème : apparitions, sorties, défilement, transitions, mise en page, partage, listes, compteurs, texte, SVG. Les gestes restent hors périmètre, dit explicitement.
- La sortie est explicite dans chaque liaison : `animate.leave` (Angular), `out:` (Svelte), `exit()` (HTML). Seul React paie un wrapper de présence, documenté.
- Lexique fermé, erreurs nommées au build, lint qui refuse tout nombre de mouvement hors `tokens.json` (J4, J5).
- Pause, `essentiel` avec raison et rendu réduit sont des champs du type (J3) ; le rendu réduit est dans le jeton.
- Le compteur et le texte chargent un module JS : c'est le prix d'un chiffre ou d'un découpage qui se met à jour, et il est mesuré en dev.

## 4. Comment

1. `tokens.json` (designer) : durée, courbe, rythme nommé, `reduit` et `repli` obligatoires. Il génère les types et les propriétés `--udx-*`.
2. Table fixe verbe → palier : 0 pour entrer, sortir, changer, boucler, dessiner, defiler (repli `statique`) ; 1 pour sequence et partager (repli `fondu` du nouvel élément) ; 2 pour deplacer (FLIP, opt-in), compter, texte.
3. Repli : quand l'API cible manque, le rendu de repli s'exécute ; la dev log donne le palier et la raison. Aucune retombée silencieuse.
4. Politique : `data-motion-policy` et `matchMedia` lus une fois sur `<html>`. En mode réduit, seul le rendu `reduit` est compilé, sans module de palier 2 si inutile.
5. L'interruption est explicite : CSS et API natives retargetent sans conserver la vitesse ; `ressort: true` force le palier 2.
6. `motion check` (CI, sur le HTML construit et sur le TS) : verbe inconnu, jeton absent, nombre hors tokens, pause absente pour boucler, raison absente pour essentiel. Aucun plugin Astro à l'exécution.
7. Groupes via `data-motion-groupe`, résolus dans le DOM ; l'état des séquences vit dans `globalThis[Symbol.for('udixio.motion@1')]`. Un membre tardif joue seul (exception documentée). Parité : fixtures communes aux quatre liaisons.

## 5. Ce qui a changé et pourquoi

- `defiler` et `partager` gardent un palier fixe ; seul le rendu de repli varie, déclaré et journalisé (critiques de J3 et J4 sur le palier conditionnel).
- La sortie est étendue à toutes les liaisons, et `motion check` impose le lint des nombres hors tokens (critiques de J2 et J5).
- Vocabulaire ASCII identique entre HTML, JS et exemples ; le compteur lit sa cible dans le texte, donc le code ne contient aucun nombre (J5).
