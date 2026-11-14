# R18 — Calibrage des valeurs provisoires

Spec : `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`, §8.2.4,
§8.2.6 et « Points ⚑ — statut ». Tokens M3 officiels : `docs/motion/research/R17-m3-motion-tokens.md`.

Trois valeurs sont **provisoires** :

- **P1 — Ressort par défaut du relâchement d'un geste** (drag, lancer, swipe) :
  actuellement `spring.fast.spatial` (Expressive : damping 0,6 / stiffness 800),
  supposition non sourcée. Alternatives possibles : `spring.default.spatial`,
  ressort selon la taille de l'élément (comme M3 le fait pour les vitesses),
  autre.
- **P2 — Tokens de distance** `--udx-motion-distance-{sm,md,lg}` = 8 / 24 / 64 px
  (glissements d'apparition, `slide`, `direction`). M3 n'en définit pas.
- **P3 — Tokens de stagger** `tight` / `normal` / `loose` = 30 / 60 / 120 ms,
  avec un plafond total de cascade de 400 ms. M3 n'en définit pas.

Pour chaque point : cherche des **preuves sourcées** (doc officielle M3 et
composants M3 utilisant des ressorts ou des glissements, Apple HIG / SwiftUI,
Fluent 2, Carbon, Atlassian, Polaris, Primer, Motion / Framer Motion,
GSAP, anime.js, études ou articles reconnus sur le timing et le stagger,
WCAG 2.3.3 pour les distances), puis propose une valeur (ou confirme
l'actuelle) avec justification. Signale ce qui n'est que déduction.
