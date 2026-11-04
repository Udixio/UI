# P1, tour 3 : réponse finale au consensus P3 (v2)

## Verdict

**Accord sur l'ensemble, avec un amendement (R5) et une remarque non bloquante (T3 React).**

## Accords

- **R1 à R4, R6, R8, R9, R10** : accord. R9 suit ma réponse à P2 Q3 (`md:` par `matchMedia`, `data-[…]:` par `MutationObserver`, `hover:` par `pointerenter` avec divergence tactile documentée).
- **R7** : accord, y compris l'amendement 3 de P2 (aucun module vide pour un nom natif pur).
- **T8 (a) et (b)** : accord. Ma clause « le runtime ne décide jamais du chargement » est remplacée par R7, comme demandé.
- **T1** : accord sur la correction en `card-reveal-once` (IO et attribut d'état) et `card-reveal-scrub` (`view()` natif).
- **T4** : accord, DOM comme registre, sans global.
- **Plugin Tailwind requis, plugin de bundler optionnel** : accord, sous réserve de la suite de conformité avec et sans plugin.
- **Faisabilité de R5 côté Tailwind** : confirmée. Le plugin voit les candidats `motion-*` du scan et peut les comparer au registre fermé. Il doit échouer explicitement sur un candidat inconnu, car une classe inconnue n'est pas émise.

## Amendement

**R5 (précision).** La vérification au build ne vaut que pour les classes, parce que seul le plugin Tailwind les voit. Les références par attribut (`data-udx-motion`) et par props ou directives ne passent par aucun plugin requis. Sans plugin de bundler, la détection d'un nom inconnu (ex. `data-udx-motion="card-reveall"`) doit donc être assurée par la suite de conformité, et optionnellement par le script CLI du scanner. Sans cette précision, une faute de frappe en HTML passerait en silence dans une installation sans plugin de bundler, ce que C1 interdit. Formulation proposée pour R5 : « Vérifié au build pour les classes (plugin Tailwind) ; pour les attributs, props et directives, vérifié par la suite de conformité et, si installé, par le scanner CLI. »

## Remarque non bloquante

**T3 React.** Je ne bloque pas le point ouvert. Mon ordre de préférence : option (ii) pour les réordonnancements déclenchés par un événement utilisateur (capture exacte dans le setter), option (i) pour les données distantes (rect mémorisé, limite documentée). Les deux options restent acceptables au tableau.
