# Vote 3 — J5

1. J4
   Force : onze intentions qui couvrent texte, SVG, défilement, trajectoire et partage, avec des valeurs fixées par le designer et un repli du partage choisi explicitement.
   Faiblesse : cinq rythmes et trois durées figés au code limitent le réglage fin, et le repli `flip` réintroduit du JS à la demande du designer.
2. J1
   Force : mêmes cas couverts que J4, avec un palier fixe, un repli déclaré et journalisé en dev, et le coût le plus lisible des trois.
   Faiblesse : vocabulaire en français sans accents dans le code et attributs mêlés (`data-motion-groupe`, `data-motion-rythme`), moins naturel pour un agent ; le cœur chargé à chaque page n'est pas chiffré.
3. J2
   Force : architecture la plus propre (un nom par verbe dans les trois langages, cascade ramenée à un `group`, pas d'échappement libre).
   Faiblesse : trois rythmes seulement et `draw` limité au trait, ce qui plafonne l'expression que le designer peut régler ; `move` et `scroll` toujours en JS.
