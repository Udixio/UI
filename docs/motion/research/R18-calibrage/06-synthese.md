# R18 — Synthèse des recherches de calibrage

Statut : recherche exploratoire, valeurs non validées visuellement. Les cinq
rapports M1–M5 contiennent leurs sources, hypothèses et limites. Les nombres
ci-dessous sont des candidats de comparaison, pas des exigences de M3.

| Sujet | Propositions | État |
|---|---|---|
| Ressort au lâcher | `default.spatial` pour un retour générique (M2, M3, M5) ; `fast` pour petit composant (M4) ; choix explicite selon surface (M1) | Pas de ressort universel établi ; comparer `fast` et `default` avec vitesses et surfaces variées. |
| Distances | 8 / 24 / 64 px (M1, M2, M4, M5) ; 8 / 24 / 48 px (M3) | Consensus de point de départ, mais aucune preuve ne valide ces nombres ; ne pas les déclarer définitifs. |
| Stagger | 20 / 50 / 100 ms (M1, M3), 30 / 50 / 100 ms (M2), 30 / 60 / 120 ms (M4, M5) | Comparer les deux échelles extrêmes ; 60 ms est un précédent Udixio, pas une norme. |

## Faits et limites

- La vitesse au lâcher et la destination comptent autant que le ressort.
  Une inertie libre et un ressort vers une cible sont deux comportements
  distincts. Les paramètres physiques et les unités du moteur doivent être
  vérifiés avant conversion ; un easing précalculé ne conserve pas la vitesse.
- Aucun pixel n'est intrinsèquement « accessible ». Le critère
  [WCAG 2.2 2.3.3](https://www.w3.org/TR/WCAG22/#animation-from-interactions)
  est de niveau AAA et demande de pouvoir désactiver les animations de
  mouvement non essentielles déclenchées par interaction.
- [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/motion/choreography)
  donne 20 ms pour un tableau et évoque un temps total inférieur à 500 ms ;
  ce n'est ni une étude indépendante disponible ici, ni une validation du
  plafond Udixio. Les exemples d'autres bibliothèques ne sont pas des normes.
- La page M3 de fonctionnement ne fournit pas son contenu sans JavaScript
  dans le lecteur de recherche utilisé pour cette synthèse ; les affirmations
  M3 détaillées restent attribuées aux rapports R17 et M1–M5, et ne constituent
  pas une vérification indépendante ici.

> **Photographie antérieure à la décision** : les passages ci-dessous décrivent
> les questions alors ouvertes. Pour le choix opérationnel provisoire retenu,
> voir [la décision actualisée](07-decision-proposee.md) et la [spécification](../../../superpowers/specs/2026-11-03-udixio-motion-design.md#826-tokens-et-variables-css-i07-i25-r17-s1).

## Point à trancher : sens du plafond de 400 ms

La spec dit « plafond de cascade », sans déterminer si elle borne le dernier
**départ** ou la dernière **fin**. Les experts proposent souvent la première
interprétation, sans qu'elle soit une décision validée. Avec un dernier départ
à 400 ms et une durée de 300 ms, la fin survient à 700 ms, hors délai initial.
Ne pas implémenter un plafond comme s'il s'agissait de l'autre.

Si le plafond porte sur les départs, une proposition à comparer est un pas
effectif `min(pas, 400 / (n - 1))` pour `n > 1`, zéro pour `n <= 1`, avec
des rangs normalisés selon l'origine. Cette formule est une proposition,
pas une décision de la spec. Un budget de fin inclurait durée et délai initial.

## Protocole de comparaison proposé

1. Geste : comparer `fast` et `default` sur contrôle compact, carte et sheet,
   avec vitesse initiale nulle, faible et forte, inversion, interruption et
   bornes. Distinguer retour vers cible et lancer inertiel.
2. Entrées : comparer 8 / 24 / 48 / 64 px sur petits et grands éléments,
   écrans étroits et zoom ; tester aussi le mouvement réduit et l'absence de JS.
3. Listes : comparer 20 / 50 / 100 et 30 / 60 / 120 ms pour 1, 4, 10 et 50
   éléments, origines first / last / center. Mesurer séparément dernier départ
   et fin effective, et vérifier l'ordre visuel et la disponibilité du contenu.
4. Vérifier sur les moteurs pris en charge et un appareil modeste ; relever
   les mesures et préférences, sans présenter une démonstration visuelle comme
   une étude utilisateur ou une preuve d'accessibilité.

Les valeurs et le sens du plafond restent provisoires tant que ces comparaisons
n'ont pas été réalisées et évaluées. Aucun code de production n'est modifié.
