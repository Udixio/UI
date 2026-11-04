# R14 — Registre de choix : toutes les familles restantes

Méthode R10–R13 : 5 experts (M1 moteur/rendu, M2 layout/gestes, M3 runtime
global/observateurs, M4 frameworks/îles/SSR, M5 API/DX/outillage), ≤ 10 choix
chacun, annotations croisées, greffier, puis top 10 + notes en un passage.
**Sélection finale : la meilleure réponse à CHAQUE question ci-dessous**, plus
un top 5 global.

## À lire avant tout

- `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`, surtout le §8 :
  §8.0 et §8.0 bis (validés), §8.1 vocabulaire et §8.1 bis états/layout
  (proposés : à respecter sauf démonstration contraire).
- `docs/motion/research/R10-choix/00-cadre.md` (24 familles).
- `docs/motion/research/E1-internal-inventory.md` (ce qui anime aujourd'hui
  dans les composants Udixio) pour la question 7.

## Questions (toutes doivent recevoir une réponse)

1. **Séquences et chorégraphie (F11)** : enchaîner, décaler, propager
   parent → enfants ; définition TS, HTML, et lien avec le handle unique.
2. **Gestes (F18)** : drag, lancer, inertie, swipe, drag-to-reorder ;
   alternative clavier obligatoire (WCAG) ; transmission de la vitesse au
   handle ; verbe ou action.
3. **Texte (F16)** : découpage lettres / mots / lignes, brouillage ;
   accessibilité (lecteurs d'écran), SSR, reflow.
4. **SVG (F17)** : tracé, morphing, trajectoire ; natif vs anime.js.
5. **Valeurs réactives et compteurs (F14, F15)** : comment `defineValue`
   s'écrit et se consomme (curseur, parallaxe, compteur) dans les 5 formes.
6. **Responsive et scopes (F19)** : animation différente par breakpoint,
   container queries, nettoyage groupé.
7. **Usage interne (F22)** : comment les composants Udixio existants (FAB,
   tabs, snackbar, text-field, switch, carousel, side-sheet, progress…)
   migrent sur la surface publique, sans API privée.
8. **Tokens (F1)** : liste des tokens de mouvement (durées, easings, ressorts
   M3 Expressive, distances, rythmes de stagger), noms `--udx-motion-*`,
   émission CSS / TS / Tailwind.
9. **Performance et chargement (F21)** : découpage en modules par verbe,
   budgets de poids, préchargement, pause onglet caché.
10. **Outillage IA et doc (F23)** : manifeste, `llms.txt`, MCP `@udixio/mcp`,
    erreurs qui citent la recette.

## Exigence de cohérence entre familles (demande du porteur)

Chaque famille doit rester cohérente avec les autres : mêmes verbes et
grammaire (`data-motion` + `data-motion-<option>`, objets TS équivalents),
mêmes options partagées, mêmes conventions de défauts (reprise, rendu réduit),
même handle, même présence. **Chaque choix porte une ligne « Cohérence : »**
(conventions réutilisées / nouveautés justifiées / exceptions déclarées).

## Format

```
### <id> — <titre court>
- Énoncé : <la décision, précise>
- Questions : Q.. ; Familles : F..
- Nature : global | instance | les deux
- Avantages : <puces courtes>
- Limites : <puces courtes>
- Conflits : <ids ou « aucun connu »>
- Cohérence : <…>
```

Identifiants préfixés `R` : `M1-R01`… Fichiers dans
`docs/motion/research/R14-reste/`. Chacun n'écrit que ses fichiers, aucune
commande git, recherche web seulement pour vérifier un fait précis.
