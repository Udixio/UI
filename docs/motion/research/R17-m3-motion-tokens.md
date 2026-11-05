# R17 — Valeurs officielles des tokens de mouvement M3 Expressive

Relevé le 2026-11-05 par navigation directe (extension Chrome) sur la doc
officielle :

- https://m3.material.io/styles/motion/overview/how-it-works
- https://m3.material.io/styles/motion/overview/specs (tableau de tokens,
  sélecteur « See more values »)

## Système

- Depuis mai 2025 (M3 Expressive), le **système physique à ressorts remplace**
  le système easing + durée. Les tokens d'easing, de durée et de path sont
  dits « legacy » et restent disponibles comme **repli** (encore utilisés pour
  les transitions).
- Deux **schémas** : `expressive` (par défaut, avec dépassement / rebond) et
  `standard` (fonctionnel, rebond minimal). Schémas personnalisés possibles.
- Un ressort = **raideur** (stiffness), **amortissement** (damping ratio) et
  vitesse initiale.
- Tokens : 2 types × 3 vitesses. `spatial` (position, rotation, taille, coins :
  dépasse puis rebondit) et `effects` (couleur, opacité : **aucun
  dépassement**). Vitesses `fast` (petits composants : switch, bouton),
  `default` (éléments couvrant partiellement l'écran : bottom sheet, rail
  étendu), `slow` (plein écran).
- Le schéma n'est **pas** dans le nom du token : `md.sys.motion.spring.fast.spatial`,
  le schéma est appliqué au niveau du produit.
- « All component motion is driven by two tokens : expressive fast spatial and
  expressive fast effects ».
- Les valeurs exactes peuvent varier selon l'appareil (montre, téléphone,
  tablette) d'après la page « How it works » ; pour les plateformes Android et
  Web, le tableau donne des valeurs **identiques** (vérifié).

## Ressorts (tokens `md.sys.motion.spring.<vitesse>.<type>`)

Valeurs identiques pour les plateformes **Android et Web**.

| Token | Expressive : damping / stiffness | Standard : damping / stiffness |
|---|---|---|
| fast spatial | 0,6 / 800 | 0,9 / 1400 |
| default spatial | 0,8 / 380 | 0,9 / 700 |
| slow spatial | 0,8 / 200 | 0,9 / 300 |
| fast effects | 1 / 3800 | 1 / 3800 |
| default effects | 1 / 1600 | 1 / 1600 |
| slow effects | 1 / 800 | 1 / 800 |

(`damping` = ratio d'amortissement ; 1 = critique, sans dépassement. Les
`effects` sont critiques dans les deux schémas.)

## Conversion officielle pour le web : ressort → courbe

Section « Web : Convert springs to curves » : à utiliser pour les animations
**sans interruption ni geste** ; sinon, utiliser les ressorts.

| Ressort | cubic-bezier | Durée |
|---|---|---|
| Expressive fast spatial | 0.42, 1.67, 0.21, 0.90 | 350 ms |
| Expressive default spatial | 0.38, 1.21, 0.22, 1.00 | 500 ms |
| Expressive slow spatial | 0.39, 1.29, 0.35, 0.98 | 650 ms |
| Expressive fast effects | 0.31, 0.94, 0.34, 1.00 | 150 ms |
| Expressive default effects | 0.34, 0.80, 0.34, 1.00 | 200 ms |
| Expressive slow effects | 0.34, 0.88, 0.34, 1.00 | 300 ms |
| Standard fast spatial | 0.27, 1.06, 0.18, 1.00 | 350 ms |
| Standard default spatial | 0.27, 1.06, 0.18, 1.00 | 500 ms |
| Standard slow spatial | 0.27, 1.06, 0.18, 1.00 | 750 ms |
| Standard fast effects | 0.31, 0.94, 0.34, 1.00 | 150 ms |
| Standard default effects | 0.34, 0.80, 0.34, 1.00 | 200 ms |
| Standard slow effects | 0.34, 0.88, 0.34, 1.00 | 300 ms |

## Impact sur la spec (neutre)

- Confirme I25 (`spring.<rôle>.<vitesse>`) et M1-R06 / M1-L05 (paramètres
  physiques conservés) ; l'ordre officiel du nom est `spring.<vitesse>.<type>`
  (ex. `spring.fast.spatial`), le schéma étant global.
- La conversion officielle utilise des **cubic-bezier hors [0,1]** (dépassement)
  et des durées fixes : c'est un repli officiel prêt à l'emploi pour le palier
  natif, à côté d'un `linear()` dérivé du ressort.
- La règle officielle « courbes seulement sans interruption ni geste » rejoint
  la reprise `carry` / `restart` (I02) : `carry` avec vitesse → ressort.
- Le schéma (`expressive` / `standard`) est un réglage global du produit, pas
  une option par animation : à intégrer à `defineTokens`.
