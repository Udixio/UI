# R12 — Registre de choix : le vocabulaire de @udixio/motion

Même méthode et mêmes experts M1–M5 que R10 et R11. Cadre général :
`../R10-choix/00-cadre.md` (projet, 24 familles, global / instance).

## Acquis validés (ne pas remettre en cause)

- R10 (fondations moteur) et R11 (surface d'écriture) : voir
  `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` §8.0 et §8.0 bis.
- En particulier : définitions nommées en TS (`defineMotion`, `defineValue`) ;
  attribut `data-motion` = **référence** (nom), jamais de valeur libre ;
  Tailwind = tokens et états avec variants, jamais d'inscription ; même
  surface dans les 5 environnements ; manifeste unique qui génère types,
  lint, erreurs dev et doc agents ; reprise `carry` / `restart` avec **défaut
  par verbe** ; Udixio livre des **définitions prêtes à l'emploi** (presets M3).

## Question de ce tour : quels mots ?

1. **Les verbes** (ou intentions) : leur liste, leur nombre, leur nom, la
   famille qu'ils couvrent, leur défaut de reprise (`carry` / `restart`), leur
   rendu réduit par défaut. Contrainte connue : aucun homonyme des API natives
   des frameworks (`animate.enter` / `animate.leave` Angular, `in:` / `out:` /
   `transition:` / `animate:` Svelte, `AnimatePresence` / `exit` React-Motion,
   `view-transition-*` CSS) — ou alors justifier.
2. **Les options** : noms et valeurs fermées (déclencheur, rythme, groupe /
   cascade, direction, distance, durée, easing, pause, seuil…), lesquelles
   sont des tokens.
3. **Les presets livrés** : liste des définitions prêtes à l'emploi (ex.
   apparitions, sorties, emphase, boucles) et leur nommage.
4. **La grammaire HTML** : comment une option s'écrit à côté de
   `data-motion` (attributs `data-motion-*` ? une seule chaîne ?), compatible
   avec le principe « référence seulement ».
5. **La langue et la casse** des noms (anglais, kebab-case…).

Entrées utiles (PAS des conclusions) : `../R2-syntaxes.md` §17 (noms
convergents entre 11 bibliothèques, pièges comme « down »), les vocabulaires
de R9 (`J2-finale-solution.md`, `J4-finale-solution.md`), R11 `M5-S02`
(noté 4,0, pourquoi ?), `M3-S01` (`reveal` / `scrub`, 6,0), `M2-S03`
(présence comme état), `M4-S02` (pas d'homonyme natif).

## Format et règles

Identique à R10/R11, identifiants préfixés `V` : `M1-V01`… Fichiers dans
`docs/motion/research/R12-vocabulaire/`. Chacun n'écrit que ses fichiers, pas
de git, recherche web seulement pour vérifier un fait précis.
