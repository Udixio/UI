# M4 — Vote sur le registre R14 (21 choix)

Vote de M4 (frameworks, îles, SSR), après lecture de `registre.md`. Notes entières de 1 à 10, en jugeant la réponse à la question et la cohérence avec §8 de la spec (§8.0, §8.0 bis, §8.1, §8.1 bis).

Correction à mon propre choix : ma limite sur `morphTo` (M4-R09, fusionné dans M1-R05) était fausse. `dist/modules/svg/morphto.js` rééchantillonne les deux chemins par longueur (`precision` 0,33 par défaut) ; le morphing n'exige donc pas le même nombre de points. La contradiction 9 du registre se résout en faveur de M1-R05.

## 1. Top 10

1. M2-R03 — alternative à un seul pointeur et au clavier obligatoire : WCAG 2.5.7 et 2.1.1, et seule règle a11y bloquante du lot.
2. M3-R03 — abonnement borné : un observateur par page, pause hors onglet et hors vue, `inspect()` ; c'est la mise en œuvre de §8.0 #3 et §8.1 bis.
3. M1-R01 — séquence TS compilée une fois, handle unique, seek et reverse exacts ; répond à Q1 dans les deux écritures.
4. M1-R05 — tracé et trajectoire natifs, morphing par `morphTo` (vérifié) ; c'est le seul choix SVG cohérent avec « natif d'abord » (§8.0 bis).
5. M2-R01 — geste = source de valeurs sans verbe ; respecte les sept verbes de §8.1 et le `defineValue` de §8.0 bis #5.
6. M3-R01 — valeur écrite dans le DOM sans re-rendu : seul chemin qui tient à 60 Hz dans les cinq formes.
7. M3-R04 — un moteur par page via `Symbol.for`, verbe absent = zéro octet ; applique §8.0 #1 et §8.0 #5.
8. M3-R06 — paliers identiques à Tailwind, reconstruction au seul changement de palier ; cohérent avec la règle « Tailwind règle les tokens » (§8.0 bis).
9. M1-R10 — les 19 contrôleurs passent par un seul chemin ; seule réponse à Q7 sur le fond (usage interne sans API privée).
10. M5-R03 — manifeste `llms.txt` et JSON produits au build ; réalise la règle de garde-fou de §8.0 bis #1.

## 2. Notes

M1-R01 : 8 — définition TS et HTML avec handle unique (§8.0 #4) ; reste à trancher `part` contre `step` et la syntaxe `at`.
M2-R06 : 7 — règle de rang visuel et plafond testables pour les cascades ; ne couvre pas l'enchaînement d'une séquence (Q1).
M1-R06 : 7 — une source, trois émissions ; l'alias `--duration-*` dans `@theme` écrase l'échelle native (risque signalé par M1), à corriger avant de valider.
M2-R01 : 8 — geste sans verbe, cohérent avec les sept verbes de §8.1 ; la valeur de geste s'appuie sur `defineValue` (§8.0 bis #5).
M2-R02 : 7 — relâchement en `carry` avec `velocity.source` (§8.0 #4, §8.0 bis #4) ; deux sources de vitesse à unifier avec M3-R09.
M2-R03 : 9 — alternative obligatoire et typée, conforme à WCAG 2.5.7 ; l'exception `essential` est consignée, ce qui respecte §8.0 bis #1.
M2-R04 : 7 — reorder en `layout` avec `commit` séparant affichage et donnée ; respecte §8.1 #2 et n'ajoute pas de verbe.
M1-R04 : 7 — `sr-only` et `aria-hidden` sont corrects, mais le découpage côté client casse les enfants gérés par React (point 4a) ; à amender avant validation.
M3-R01 : 8 — écriture directe dans le DOM, zéro re-rendu, cohérent avec M5-S04 (§8.0 bis #5) ; la variable sur les cibles est préférable à la racine.
M4-R06 : 7 — valeur finale rendue par le serveur et animation après hydratation, utile au SSR ; `<data>` sort de la grammaire `data-motion` de §8.0 bis.
M3-R06 : 8 — paliers partagés avec Tailwind, sans reconstruction à chaque pixel ; cohérent avec §8.0 bis et la règle des tokens Tailwind.
M3-R05 : 7 — registre par racine et élagage à la frame suivante ; l'élagage paresseux et le couple `revert` / `dispose` restent à trancher.
M3-R04 : 8 — chargement par verbe et cache par majeure, conforme à §8.0 #1 et #5 ; le préchargement au repos est à arbitrer avec M2-R10.
M3-R03 : 9 — un observateur par page et pause hors onglet à coût nul, appliquant §8.0 #3 et §8.1 bis ; la raison de pause est lisible par un agent.
M1-R10 : 8 — un seul chemin de résolution pour les 19 contrôleurs ; cohérent avec C11 et §8.0 bis #3, sous réserve du nom de la prop (M4-R02).
M1-R05 : 8 — tracé et trajectoire natifs, `morphTo` rééchantillonne (vérifié) ; le tracé `pathLength` est un attribut standard.
M4-R02 : 6 — prop `motion` unique et tokens : utile, mais un renommage qui fait doublon avec M1-R10 et M2-R07 ; je le note bas pour ne pas favoriser mon propre choix.
M3-R07 : 5 — jeton de réduction unique, mais `scale` à 0 rend `disappear` instantané, contraire au fondu de §8.1 ; corrigeable par un `calc` séparé.
M3-R08 : 7 — budget de paint et lint, complète M5-L02 ; l'échappatoire `allow-paint` est acceptable pour le spinner.
M5-R03 : 8 — manifeste unique pour types, lint, MCP et doc ; réalise §8.0 bis #1 directement.
M5-R04 : 7 — outils MCP validant avant écriture ; utile, mais dépend du manifeste et ajoute une surface à maintenir.
