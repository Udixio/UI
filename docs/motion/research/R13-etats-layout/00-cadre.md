# R13 — Registre de choix : états, layout, partagé, présence, pages

Méthode identique à R10–R12 : 5 experts motion (M1 moteur/rendu, M2 layout/
partagé/présence, M3 scroll/runtime global, M4 frameworks/îles/SSR, M5
API/DX/outillage), ≤ 10 choix chacun, annotations croisées, greffier, top 10,
notation 1–10, on garde les 5 meilleurs.

## À lire avant tout

- `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`, en entier mais
  surtout le **§8** : §8.0 fondations moteur (validé), §8.0 bis surface
  d'écriture (validé), §8.1 vocabulaire (proposé, à respecter sauf
  démonstration contraire).
- `docs/motion/research/R10-choix/00-cadre.md` : les 24 familles et la
  distinction global / instance.
- Au besoin : `R1-native-support.md` (support natif), `R4-fallback-fidelity.md`
  (pièges WAAPI/CSSAnimation), `R3-scroll-timeline-semantics.md`.

## Question de ce tour

Couvrir **intégralement** les cas suivants, qui sont aujourd'hui des trous :

1. **Changement d'état de layout** (ex. `justify-start` → `justify-end`,
   réordonnancement, changement de taille) : comment le changement est
   **détecté** et comment la **mesure avant mutation** est capturée dans chaque
   environnement (React n'a pas de point pré-mutation hors
   `getSnapshotBeforeUpdate` ; Angular ; Svelte `$effect.pre` ; HTML pur), et
   que faire des changements purement CSS (`:hover`) invisibles au JS.
2. **Transition d'état non géométrique avec ressort ou reprise de vitesse**
   (rotation, couleur, échelle, propriété personnalisée qui change avec un
   état) : quel verbe ou quelle forme, compatible avec les 7 verbes et la
   liste des noms réservés (`transition`, `animate` sont réservés).
3. **Panneau qui reste monté** (accordéon, disclosure, hauteur `auto`,
   `hidden` / `inert`) : `layout`, présence, ou cas dédié ; natif
   (`interpolate-size`, `::details-content`) vs JS.
4. **Élément partagé** (`layout` qui partage une géométrie) : comment
   l'identité s'écrit (attribut, option), entre composants et entre îles
   Astro, règles d'unicité, ce qui se passe quand l'homologue n'existe pas.
5. **Transitions de page / route** : View Transitions (même document et
   cross-document), Astro ClientRouter, routeurs React / Angular / SvelteKit ;
   verbe, option ou intégration.
6. **Présence** : détails restants (ordre d'entrée/sortie dans une liste,
   sortie d'un élément dont le parent se démonte, `data-presence`, rendu
   réduit).

Chaque choix doit rester compatible avec §8.0, §8.0 bis et §8.1, ou démontrer
pourquoi l'un d'eux doit changer.

## Exigence de cohérence entre familles (demande du porteur)

Chaque famille doit rester cohérente avec les autres : mêmes verbes et même
grammaire (`data-motion` + `data-motion-<option>`, objets TS équivalents),
mêmes options partagées (`trigger`, `direction`, `duration`, `easing`,
`stagger`, `group`…), mêmes conventions de défauts (reprise, rendu réduit),
même forme de handle et de présence. **Chaque choix ajoute une ligne
« Cohérence : »** qui dit quels verbes / options / conventions existants il
réutilise et ce qu'il introduit de nouveau (à justifier). Un choix qui crée
une exception à une convention commune doit le dire explicitement.

## Format et règles

Format d'un choix :

```
### <id> — <titre court>
- Énoncé : <la décision, précise>
- Familles : F..
- Nature : global | instance | les deux
- Avantages : <puces courtes>
- Limites : <puces courtes>
- Conflits : <ids ou « aucun connu »>
- Cohérence : <conventions réutilisées / nouveautés justifiées>
```

Identifiants préfixés `L` : `M1-L01`… Fichiers dans
`docs/motion/research/R13-etats-layout/`. Chacun n'écrit que ses fichiers,
aucune commande git, recherche web seulement pour vérifier un fait précis.
