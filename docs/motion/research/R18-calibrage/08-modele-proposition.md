# Proposition — domaines manquants de `MotionSpec`

Statut : proposition de recherche, pas une modification de la spec ni une API implémentée. Elle complète uniquement les cinq noms non définis en §8.2.3 ; les ressorts et le contrat provider restent distincts. Les valeurs ci-dessous sont des choix de conception, sauf mention contraire.

## Choix

Une chaîne CSS libre ou des nombres arbitraires rendraient le modèle difficile à valider et à porter. Proposition limitée : des références de tokens fermées, issues de tables pures partagées, et une représentation expérimentale de plage. Les types ci-dessous illustrent des domaines candidats : ils ne constituent pas une API définitive et ne prescrivent aucun runtime de scroll ou registre DOM.

```ts
type DurationToken = `duration.${'short' | 'medium' | 'long' | 'extraLong'}${1 | 2 | 3 | 4}`;
type EasingToken = 'easing.linear' | 'easing.standard'
  | 'easing.standardAccelerate' | 'easing.standardDecelerate';
type DistanceToken = 'distance.sm' | 'distance.md' | 'distance.lg';

type ViewRangeName = 'cover' | 'contain' | 'entry' | 'exit'
  | 'entry-crossing' | 'exit-crossing';
type ScrollRange = { kind: 'view'; name: ViewRangeName }
  | { kind: 'scroll' };

declare const sharedKeyBrand: unique symbol;
type SharedKey = string & { readonly [sharedKeyBrand]: true };
// Validation pure proposée, indépendante d'un document ou d'un registre.
declare function parseSharedKey(name: string): SharedKey;
```

`duration.*` reprend les 16 durées M3 historiques : short 1–4 = 50/100/150/200 ms ; medium = 250/300/350/400 ms ; long = 450/500/550/600 ms ; extraLong = 700/800/900/1000 ms. Les courbes sont `linear` = `linear`, `standard` = `cubic-bezier(0.2, 0, 0, 1)`, `standardAccelerate` = `cubic-bezier(0.3, 0, 1, 1)` et `standardDecelerate` = `cubic-bezier(0, 0, 0, 1)`. Ces noms et cette sélection réduite sont une convention Udixio ; les valeurs viennent du [système de courbes Material](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md#curves-easing--duration). Les ressorts M3 restent le premier choix (§8.2.4, R17) ; ces courbes ne remplacent pas la physique ni les courbes calculées d'un ressort. La courbe M3 emphasized complète est volontairement exclue : sa forme en deux segments n'est pas équivalente à une unique cubic-bezier. Les durées et courbes sont indépendantes du schéma de ressort choisi.

`distance.*` référence les trois clés déjà exposées par `defineTokens()` ; elles sont des magnitudes positives en pixels CSS, le sens venant de `direction`. Leurs valeurs restent provisoires et soumises au calibrage R18. Une source unique de tables pures peut produire les valeurs initiales et les noms de variables CSS sous `--udx-motion-*` ; cela ne prouve pas que CSS et JS observent la même valeur effective quand la cascade ou des surcharges interviennent. Leur résolution effective et l'application de l'échelle de réduction (§8.2.6, exception de disparition comprise) restent à définir et vérifier.

## Plages et identité

Les six noms de `ViewRangeName` correspondent aux plages CSS étudiées dans [R3](../R3-scroll-timeline-semantics.md), mais leur présence dans ce type est exploratoire : aucune preuve n'établit encore que chaque plage soit réalisable avec une équivalence satisfaisante entre natif et repli. `kind: 'scroll'` représente conceptuellement la progression entière ; le choix de la source, du sujet et de l'axe, ainsi que les défauts de `range` et `axis`, restent ouverts. R3 documente notamment inactivité, plage nulle et éléments sticky, dont le traitement effectif reste à établir. Aucun conteneur nommé, pourcentage partiel, longueur ou mélange de bornes n'est représenté ici : ce modèle ne couvre pas tout F5 et ne doit pas être implémenté comme contrat complet sur cette seule base.

La validation pure proposée prend une chaîne et retourne cette même chaîne primitive marquée au seul niveau TypeScript ; elle n'enregistre rien et n'accède ni au DOM ni à un état global. La marque est effacée et n'ajoute ni symbole ni objet au JSON. La grammaire exacte et le nom de cette fonction restent à définir ; une désérialisation exige une nouvelle validation, sans confiance dans un cast. Séparément, I17 et §8.3.3 décrivent une identité unique par document, une erreur en dev et `first-live` en production, avec exclusion des éléments sortants. Le cycle de vie du registre DOM, ses interactions avec SSR, HMR et copies multiples, et la relation avec `defineShared` restent à concevoir. Une validation syntaxique pure ne prouve ni l'enregistrement ni l'unicité.

```ts
const card = parseSharedKey('card'); // forme illustrative, API non arrêtée
const timing: CurveTiming = { duration: 'duration.medium2', easing: 'easing.standard' };
```

La validité d'une liste de keyframes vide pour `layout` reste à préciser séparément. Une définition sérialisée contient des chaînes et des objets JSON, jamais une fonction de validation, un symbole, une fonction d'easing ou une instance de provider.

## Impacts et limites

- Le sous-ensemble sûr consiste à définir une source unique de tables pures et de validation pour les noms et valeurs initiales des tokens, puis à générer ou alimenter depuis elle les représentations nécessaires. Le manifeste commun n'existe pas encore et son format reste à concevoir. Aujourd'hui `MotionTokens` n'expose que `spring`, `distance` et `stagger` ; l'ajout de duration/easing, de variables CSS et de leur validation reste du travail à faire.
- `MotionTiming` dans `contract.ts` est un timing **résolu** (`number` en ms, `string` CSS) destiné aux providers : ne pas confondre cette interface avec `CurveTiming` sérialisable. La source des valeurs effectives en présence de cascade CSS et le moment de résolution restent ouverts ; aucune parité CSS/JS n'est établie par ces tables.
- Le futur manifeste devrait permettre de refuser les tokens inconnus et les options hors domaine, y compris après désérialisation. La validation et la sémantique des plages dépendent du contrat scroll encore à définir ; les six plages ne constituent pas une promesse de prise en charge.
- `SharedKey` garantit uniquement le passage par une validation typée en TS, pas la validité d'une chaîne issue de JSON ni l'unicité à l'exécution. La grammaire, la relation avec `defineShared`, le double appel et le registre par document restent à définir.
- Le domaine `StaggerToken` utilisé en §8.2.5 et la forme globale du manifeste restent hors de cette proposition. La durée maximale et les besoins des boucles ne sont pas déterminés ; les 16 durées M3 proposées ne constituent pas une limite fonctionnelle validée pour `loop`.
