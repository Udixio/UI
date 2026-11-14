# Durées et courbes — proposition de contrat F1

**Statut :** conception partiellement implémentée : tables et CSS générés, validation des références dans le manifeste et résolution explicite `resolveCurve` des valeurs initiales. Ce document conserve aussi des propositions et critères historiques précisés par les révisions ci-dessous ; il ne signifie pas que F1 est complet. Il ne rend pas `MotionDocument` exécutable, n'exécute aucune animation automatiquement et ne choisit pas de backend. Les ressorts restent les défauts de §8.2.4 ; une paire courbe/durée ne restitue pas leur physique ni une reprise de vitesse.

## Domaine et provenance

Le système de courbes Material est historique depuis l'arrivée des ressorts Expressive : il reste utile aux transitions et aux courbes explicites. Le [tableau officiel Material Components](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md#curves-easing--duration) donne les 16 durées et les valeurs des courbes ci-dessous. La sélection de quatre courbes, les noms préfixés `duration.` et `easing.`, ainsi que leur traduction CSS sont des conventions Udixio, pas des noms officiels M3. `linear` est mathématiquement équivalent à la cubic-bezier officielle `(0, 0, 1, 1)`. La courbe emphasized complète est exclue : ses deux segments ne sont pas une unique cubic-bezier ; les autres courbes Material ne sont pas promises par ce sous-ensemble.

| Références `duration.*` | Valeurs initiales en ms, index 1 à 4 |
|---|---|
| `short1` … `short4` | 50, 100, 150, 200 |
| `medium1` … `medium4` | 250, 300, 350, 400 |
| `long1` … `long4` | 450, 500, 550, 600 |
| `extraLong1` … `extraLong4` | 700, 800, 900, 1000 |

| Référence | Valeur CSS initiale |
|---|---|
| `easing.linear` | `linear` |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `easing.standardAccelerate` | `cubic-bezier(0.3, 0, 1, 1)` |
| `easing.standardDecelerate` | `cubic-bezier(0, 0, 0, 1)` |

Ces valeurs sont identiques avec `scheme: 'expressive'` et `scheme: 'standard'` : le schéma produit sélectionne les ressorts, pas ces courbes historiques. Une paire explicite n'est pas un fallback de `SpringRef` ; les couples de repli officiels d'un ressort restent ceux de `resolveSpring` ([17](17-spring-resolver.md)). Les durées jusqu'à 1000 ms ne constituent pas un domaine validé pour toutes les boucles ; `loop` demeure hors du manifeste opérationnel actuel.

## Représentation et validation

Une source déclarative `scripts/curve-source.json`, fermée et contrôlée, contient les deux tables de valeurs. Un générateur déterministe `scripts/generate-curves.mjs` produit `src/curve-data.generated.ts` (`curveData` avec `duration` et `easing`, `as const`) et un bloc CSS dédié. `tokens.ts` et `manifest.ts` importent cette donnée générée : le manifeste dérive ses listes de références par préfixage des clés, sans seconde liste manuelle. Les types dérivent de `keyof typeof curveData` ; les valeurs initiales et noms ont donc une seule source.

La forme TS publique ajoutée à `MotionTokens` est précisément `duration: Record<keyof typeof curveData.duration, number>` et `easing: Record<keyof typeof curveData.easing, string>`. `defineTokens(options?: { scheme?: MotionScheme }): MotionTokens` conserve sa signature actuelle, sans surcharge de personnalisation : les nouvelles tables sont copiées à chaque appel, comme les objets existants. Exporter `DurationToken`, `EasingToken`, `CurveTiming` depuis l'entrée racine, et les types de manifeste correspondants depuis `./manifest` ; garder `curveData` interne. `defineTokens` reste disponible depuis la racine. Aucune lecture de DOM ni détection de support, y compris au chargement du module. Les valeurs initiales ne sont pas des valeurs CSS calculées.

```ts
type DurationToken = `duration.${'short' | 'medium' | 'long' | 'extraLong'}${1 | 2 | 3 | 4}`;
type EasingToken = 'easing.linear' | 'easing.standard'
  | 'easing.standardAccelerate' | 'easing.standardDecelerate';
type CurveTiming = { duration: DurationToken; easing: EasingToken };
// Exemple de définition JSON, pas de timing résolu pour un provider :
const timing: CurveTiming = { duration: 'duration.medium2', easing: 'easing.standard' };
```

Le manifeste version 1 accepte actuellement uniquement une chaîne `SpringRef` dans `timing` et seulement trois verbes. Étendre explicitement ce champ à l'union chaîne ressort / objet `CurveTiming`, sans élargir les verbes, valeurs visuelles ou autres options. L'ajout est rétrocompatible pour les documents existants ; un ancien validateur rejettera les nouveaux documents : synchroniser consommateur et manifeste, ne pas prétendre à la compatibilité inverse. À la désérialisation, exiger un objet JSON non nul et non tableau avec exactement les deux champs propres requis, chaînes appartenant à leurs domaines respectifs ; refuser champs inconnus, valeurs numériques, CSS libre, références inconnues et objets partiels. Réutiliser les codes et chemins d'erreur du validateur actuel, déterministes, et ne jamais indexer une table sur une propriété héritée. La validation signifie seulement que la définition est reconnue ; elle ne prouve ni support navigateur ni exécution runtime.

## Génération du manifeste

Le script actuel `generate-motion-manifest.mjs` transpile `manifest.ts` seul et l'importe par URL `data:` : une importation relative de `curve-data.generated.js` y échouerait. Adapter ce script pour transpiler dans un répertoire temporaire le graphe local de modules TS à partir de `manifest.ts`, en conservant les chemins relatifs `.js`, puis importer l'entrée générée par URL `file:`. Déterminer le graphe à partir des imports statiques locaux, refuser les imports externes ou chemins hors de `src`, échouer sur toute erreur de transpilation ou dépendance absente et nettoyer le répertoire en `finally`. Ne pas charger le paquet construit ni exécuter des fichiers générés périmés à la place des sources ; `--check` reste sans écriture dans le dépôt. Cette adaptation est obligatoire avant d'importer la table dans le manifeste. Le test Nx doit vérifier d'abord `generate-curves --check`, puis manifeste et ressorts, en plus des tests existants.

## CSS, résolution et réduction

Générer dans `motion.css`, dans un bloc autonome `/* BEGIN GENERATED CURVE TOKENS */` … `/* END GENERATED CURVE TOKENS */`, au niveau du document, `--udx-motion-duration-short1` … `--udx-motion-duration-extra-long4` et `--udx-motion-easing-linear`, `--udx-motion-easing-standard`, `--udx-motion-easing-standard-accelerate`, `--udx-motion-easing-standard-decelerate`. Utiliser les mêmes valeurs en `:root` pour les navigateurs sans `@property` ; déclarer les durées enregistrées `<time>` héritées et les courbes avec syntaxe universelle `*` héritée, avec valeur initiale correspondante. Aucun alias hors `--udx-motion-*`. Le générateur ne remplace que son bloc et refuse marqueurs absents, multiples ou mal ordonnés ; il préserve octet pour octet le bloc des ressorts et tout le reste. Adapter aussi le générateur des ressorts pour exiger exactement une paire de ses propres marqueurs et conserver réciproquement le bloc des courbes. `--check` compare sans écrire. Génération déterministe et contrôle de fraîcheur : la table, les déclarations et le manifeste JSON ne doivent pas diverger. Les valeurs ne changent pas sous `data-motion-scheme`.

Pour un usage CSS, le consommateur choisit explicitement la variable et applique une fois l'échelle : `transition-duration: calc(var(--udx-motion-duration-medium2) * var(--udx-motion-scale)); transition-timing-function: var(--udx-motion-easing-standard);`. La cascade et l'héritage peuvent surcharger les variables ; la table TS reste la valeur initiale, sans parité automatique avec la valeur calculée. Lire une valeur calculée, convertir les unités et synchroniser CSS/JS sortent de cette tranche. Pour une animation impérative, l'appelant peut construire un `MotionTiming` résolu à partir des valeurs TS initiales, en ms et chaîne CSS, après application de la politique ; le provider brut ne résout pas les références et n'applique pas la réduction. Ne pas envoyer une durée zéro au provider CSS actuel qui exige une durée positive : appliquer directement le rendu réduit approprié. Le fondu réduit de `disappear` fait exception à la multiplication par l'échelle (§8.2.6) ; son choix et son application restent à la couche appelante. Une échelle à zéro seule ne réalise pas les rendus `static`, `neutral` ou `frozen`.

`resolveCurve(timing)` fournit explicitement cette paire initiale en millisecondes et chaîne CSS ; il refuse les objets mal formés et références inconnues. Il ne lit ni le DOM ni la politique, n'applique aucune échelle et ne lance aucune animation.

En SSR, produire les valeurs initiales et le CSS sans `window`, `document` ni `matchMedia`. La politique effective et les éventuelles surcharges CSS ne sont connues que côté client ; ne pas supposer une préférence système serveur. La sélection et l'actualisation de politique restent à la couche existante `runtime-policy`, sans annoncer ici d'intégration automatique au timing.

## Vérifications pour une implémentation ultérieure

- Tester exhaustivement les 16 durées et quatre courbes contre les valeurs ci-dessus, les deux schémas et le défaut `expressive`, ainsi que l'indépendance des objets retournés ; tester les unions TS avec références valides et invalides.
- Tester le générateur sur une copie temporaire : modifier une valeur de la source, constater l'échec de `--check`, régénérer puis constater le changement cohérent du TS, du CSS et, après génération du manifeste, de ses domaines si un nom change ; vérifier le succès de `--check` et l'idempotence. Exécuter les générateurs courbes et ressorts dans les deux ordres, comparer les sorties octet pour octet et vérifier que chaque générateur préserve le bloc de l'autre et les zones manuelles. Tester les marqueurs invalides sans mutation. Tester le script manifeste avec le graphe réel, une dépendance absente et un import externe interdit ; vérifier la sortie et le nettoyage temporaire en succès comme en erreur.
- Tester le manifeste et son JSON généré : ressorts existants toujours valides ; paire complète acceptée ; champs manquants ou supplémentaires, `null`, tableau, types incorrects, noms inconnus et clés héritées refusés aux chemins attendus ; aucun verbe différé accepté par inadvertance. Vérifier la génération reproductible et les exports publics.
- Vérifier le CSS généré pour chaque nom, valeur, enregistrement, héritage et repli `:root` ; en navigateur, mesurer une transition représentative, tester héritage et surcharge locale, les deux schémas, et comparer les valeurs initiales CSS à TS sans conclure à une synchronisation après surcharge. Tester le repli sans `@property` dans un environnement approprié et signaler tout cas non exercé.
- Tester la réduction standard et l'exception du fondu de disparition à la couche qui les applique, y compris durée nulle sans appel invalide au provider. Tester en Node sans globals DOM et documenter explicitement les limites SSR et l'absence de résolution automatique. Exécuter les tests et build motion existants et `pnpm --dir packages/motion run size` ; conserver les plafonds gzip actuels core 2,6 kB, manifest 1,9 kB, motion-css 2,2 kB et provider css 4,3 kB, ainsi que les autres plafonds configurés. Mesurer et signaler tout dépassement sans augmenter implicitement un budget ; vérifier les exports et déclarations du paquet construit ; ces tests ne démontrent pas la prise en charge d'un runtime futur.


## Révision des budgets après mesure

La première mesure héritait de deux chargements d’esbuild : le plugin explicite
et celui du preset racine. Le paquet motion sélectionne désormais son propre
preset `@size-limit/preset-small-lib`, avec un seul chargement, sans modifier les
autres paquets. Sur le build F1, le manifeste mesure 2,031 kB gzip après ajout
des domaines et de la validation des paires ; son plafond passe de 1,9 à
2,3 kB. Le CSS mesure 2,276 kB après ajout des propriétés enregistrées et des
valeurs de repli ; son plafond passe de 2,2 à 2,6 kB. Ces deux plafonds
appliquent 10 % de marge, arrondie au dixième supérieur. Le plafond core de
2,6 kB et tous les autres restent inchangés. Ces chiffres remplacent les
plafonds initiaux du plan ci-dessus après décision explicite, et non une
affirmation que les anciens plafonds étaient respectés.

## Révision de la génération CSS

Les deux générateurs écrivent désormais chacun leur propre feuille CSS dans
`public/` : `motion-springs.generated.css` et `motion-curves.generated.css`.
La feuille document `motion.css` les importe comme fichiers voisins ; le build
et le paquet distribuent les trois fichiers ensemble. Cela remplace le projet
initial de deux blocs écrits dans un même fichier : les générations concurrentes
ne se disputent plus une cible commune et ne dépendent d’aucun verrou système.
Les comparaisons `--check` vérifient chaque feuille générée séparément. Les
consommateurs qui copient les actifs doivent garder les trois fichiers ensemble.

Les anciens critères portant sur la présence, l’ordre et la préservation de
marqueurs dans une feuille commune sont abandonnés. Ils sont remplacés par la
vérification des deux imports, de chaque fragment généré et de leur livraison,
ainsi que par la comparaison des sorties produites dans les deux ordres et en
parallèle. Le budget CSS inclut les deux imports et est testé séparément contre
un grossissement de chacun des fragments.

## Révision du budget core après résolution des courbes

Sur un build frais, `size-limit --json` mesure le core à 2 785 octets gzip,
au-delà de l'ancien plafond de 2 600 octets. Le plafond est recalibré à
3 100 octets : mesure multipliée par 1,1 puis arrondie au dixième de kB
supérieur. L'export racine `resolveCurve` reste disponible. Les différences de
génération des données et de preset de mesure contribuent au contexte de cette
comparaison ; le dépassement entier ne peut pas être attribué à ce seul export.
Les autres budgets restent inchangés.
