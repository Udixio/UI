# R15 — Audit de cohérence transversale de @udixio/motion

Date : 2026-11-04. Audit neutre : on constate les écarts entre les décisions, on décrit les options de résolution, on ne recommande rien.

## Sources et méthode

- Spec `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`, §8 (lignes 354 à 495) : §8.0 et §8.0 bis (validés), §8.1, §8.1 bis, §8.1 ter (proposés). Les corrections proposées par Claude en §8.1 sont désignées « §8.1 corrigé ».
- `docs/motion/research/R10-choix/00-cadre.md` : les 24 familles F1 à F24.
- Sections « Contradictions ouvertes » : R12 §3 (37 points, cités « R12 §3.x n°y »), R13 §4 (23 points, « R13 §4 n°y »), R14 §4 (25 points, « R14 §4 n°y »).
- Blocs des choix cités par ces sections, lus dans les registres (têtes de groupe et lignes de groupe). Les ids cités sont écrits `Rxx Mn-Vn/Ln/Rn`.
- Non lus : les fichiers `votes/`, les `Mn-choix.md` et les annotations hors blocs cités. Les verdicts cités viennent des registres.

Légende de la matrice : ✓ conforme ; ✗ I## incohérent ; ? I## non défini ; — sans objet.

## 1. Matrice de cohérence

Colonnes : forme d'écriture (verbe) ; grammaire HTML `data-motion` + `data-motion-<option>` ; objet TS et cinq formes ; options partagées et leurs noms ; défaut de reprise ; rendu réduit ; handle ; présence ; tokens ; chargement.

| Famille | Forme (verbe) | Grammaire HTML | Objet TS / 5 formes | Options partagées (noms) | Défaut de reprise | Rendu réduit | Handle | Présence | Tokens | Chargement |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 Tokens | pas de verbe · ✓ | token en option `data-motion-duration="md"` · ✓ | `defineTokens` (M5-R01) ou source JSON (M1-R06) · ? I07 | échelle `short…extra-long4` ou `short` · ✗ I25 | — | `--udx-motion-scale` à 0 · ✗ I05 | — | — | `--udx-motion-*` ou alias `--duration-*` · ✗ I07 | noyau d'office · ✓ |
| F2 Transitions d'état | `emphasize` + `trigger="state"` · ✗ I06 ; `layout` pour la géométrie · ✓ | `data-motion="<définition>"` · ✓ ; `data-open` ou `data-state` · ✗ I20 | `useMotion(spec, {state})`, `udxMotionState` · ✓ ; référence en chaîne `'collapse'` · ✗ I22 | `interrupt` absent de la liste partagée · ✗ I23 | `emphasize` en restart (M5-V02) contre carry pour changement d'état (§8.0 bis #4) · ✗ I06 | statique (M5-V02) · ✓ | §8.0 #4 · ✓ | — | sonde `@property` opt-in contre zéro écouteur · ? I20 | `emphasize` en idle (M3-R04) · ✓ |
| F3 Présence | `appear` / `disappear` · ✓ | `data-motion="<définition>"` · ✓ ; `data-motion-stagger` sur la racine · ✓ | `useMotion(card, {present})`, `animate.leave`, `out:` · ✓ ; `udixio.motion.remove(el)` hors surface · ✗ I22 | `stagger` en token · ✗ I14 ; `pop` · ✗ I19 | `appear` en restart (M5-V02) contre carry (M2-V06) · ✗ I02 | `appear` en fondu · ✓ ; `disappear` fondu contre instantané · ✗ I05 | `finished` ne rejette jamais · ✓ ; statut `inherited` · ✗ I21 | `data-presence`, nom et valeur de sortie · ✗ I04 ; `inert` avant `finished` · ✗ I19 | `--udx-motion-*` · ✓ | `appear` en idle · ✓ ; fenêtre de contrepartie · ✗ I19 |
| F4 Déclenchement à la vue | `reveal` (`repeat`) · ✓ | `data-motion-trigger="view"` · ✓ | `useMotion` et directive · ✓ | seuils `touch\|quarter\|most` contre `…\|half\|full` · ✗ I23 ; `direction` · ✗ I01 | restart (M3-V01) · ✓ | `fade` ou `instant` (M3-V01) contre instantané (M5-V02) · ✗ I05 | §8.0 #4 · ✓ | — | seuils en tokens, domaine non fixé · ✗ I23 | observateur global · ✓ |
| F5 Lié au scroll | `scrub` · ✓ | `data-motion-range` (mots CSS) · ✓ | `useMotion` et `defineValue` · ✓ | `range`, `axis`, `scroller` · ✓ | « sans reprise » hors carry et restart · ✗ I02 | position neutre (M5-V02) contre instant (M3-V02) · ✗ I05 | §8.0 #4 · ✓ | — | `--udx-motion-*` · ✓ | quand la cible approche de la vue (M3-R04) · ✓ |
| F6 Scroll piloté | action `scrollTo(cible, {duration, easing})` (§8.1 #6), pas un verbe · ✓ | aucun attribut · ✓ | action TS ; présence dans les cinq formes non précisée · ? I22 | `duration` : unité ms ou token non fixée · ? I23 | — | SmoothScroll sans garde (M3-R07) · ✗ I05 | valeur de retour non définie · ? I21 | — | `duration` en ms ou en token · ? I23 | non défini · ? I28 |
| F7 Layout | `layout` · ✓ | `data-motion="layout"` dans les exemples · ✗ I03 ; `data-motion-scope` · ✗ I11 | `motion.layout(portée, mutation)`, `mutate(el, fn)`, `udixio.motion.set` · ✗ I10 | `commit`, `measure`, `correct` · ✗ I23 | carry (M2-V01, M5-V02) · ✓ | instantané (M5-V02) · ✓ | §8.0 #4 · ✓ | sortie en `pop` · ✗ I19 | `--udx-motion-*` · ✓ | anime Layout à la demande (M3-R04) · ✓ |
| F8 Élément partagé | `shared` verbe ou option de `layout` · ✗ I09 | `data-motion-shared` (référence) · ✓ ; `data-motion-layout-id` à valeur libre (écarté) · ✗ I17 | `defineShared` (exception déclarée) · ✗ I22 | `shared` comme option ou verbe · ✗ I09 | restart (M2-V02) absent de la table M5-V02 · ✗ I02 | non défini · ? I05 | §8.0 #4 · ✓ | homologue absent : fenêtre de rétention · ✗ I19 | `view-transition-*` réservé · ✓ | registre `globalThis` (§8.0 #1) · ✓ |
| F9 View Transitions | preset `route` sans verbe · ✗ I13 | `<ClientRouter />` natif (M4-L08) · ✓ ; `data-motion-transition` écarté · ✓ | `navigate(run, {direction})` contre `motion.navigate(update)` · ✗ I18 | `direction` en start et end · ✗ I01 | restart (M2-V02) · ✓ | « pas d'animation » (M2-L07) · ? I05 | valeur de retour de `navigate` non définie · ? I21 | — | `@view-transition` émis par le plugin Tailwind · ✓ | `addTransitionType` à vérifier · ? I30 |
| F10 Listes | `layout`, `appear`, `disappear` · ✓ ; `reorder` · ✗ I24 | `data-motion-stagger` sur le conteneur · ✓ | `useMotion` · ✓ | tokens de `stagger` · ✗ I14 ; `from` first, last, center · ✗ I23 | carry (layout) · ✓ ; restart (appear) · ✓ ; `pop` change le défaut de `disappear` en liste · ✗ I19 | pas de cascade (M2-R06) · ✓ | §8.0 #4 · ✓ | ordre de sortie inverse non couvert · ✗ I19 | `--udx-motion-stagger-max` à inscrire au manifeste · ✓ | noyau · ✓ |
| F11 Chorégraphie | `defineSequence`, pas de verbe · ✓ | `data-motion` racine contre `data-motion-sequence` · ✗ I15 ; enfant `part` contre `step` · ✗ I15 | `defineSequence`, `udxSequence` contre `udxMotion` · ✗ I22 | `at`, `after`/`with`, `'<'` · ✗ I15 | non défini pour les séquences · ? I02 | non défini · ? I05 | handle unique (M1-R01) · ✓ | sortie d'enfant (M5-L07) · ✓ | décalages en tokens · ✗ I15 | non défini · ? I28 |
| F12 Contrôle | handle · ✓ | — | `motion()` renvoie le handle · ✓ | — | reprend depuis valeur et vitesse (§8.0 #4) · ✓ | `finished` résolu au même tick (M2-L09) · ✓ | `step`, `grab`, `drag`, `release`, `settle`, `inherited` · ✗ I21 | `finished` sur le sous-arbre (M1-L10) · ✓ | — | noyau · ✓ |
| F13 Interruption et physique | `carry` et `restart` (§8.0 bis #4) · ✓ | `data-motion-interrupt` dans la définition, pas dans le HTML · ✗ I06 | `interrupt` dans la définition · ✓ | `interrupt` absent de la liste partagée · ✗ I23 | « sans reprise » hors carry et restart · ✗ I02 | — | `velocity.source` exact, estimated, unavailable · ✓ ; source des gestes · ✗ I24 | — | ressort : paramètres contre `linear()` · ✗ I25 | anime pour ressort JS · ✓ |
| F14 Valeurs réactives | `defineValue` · ✓ ; `follow` retiré (§8.1 #2) · ✓ | `data-motion-value` (référence) · ✓ ; placement racine contre cibles · ✗ I26 | `defineValue` · ✓ ; forme `source` · ✗ I26 | `source`, `axis`, `range` contre `from`, `to` · ✗ I26 | — · ? I02 | saut à la valeur (M1-R07) · ? I02 | retour non défini · ? I21 | — | `--udx-<nom>` contre `--udx-value-<nom>` · ✗ I07 | noyau, registre global · ✓ |
| F15 Valeurs et compteurs | `defineValue` avec `format` · ✓ | `<data>` contre `data-motion-value` · ✗ I26 | `defineValue` · ✓ | `format` (Intl) · ✓ | — · ? I02 | valeur finale immédiate (M3-R02) · ✓ | retour non défini · ? I21 | — | durées internes en ms (M1-R06) · ✓ | après hydratation (M4-R06) · ✓ |
| F16 Texte | option `data-motion-split` · ? I27 | `chars` contre `letters` · ✗ I27 | `splitText` ; découpage par le framework contre client · ✗ I27 | domaine fermé · ✗ I27 | — · ? I02 | texte final (M1-R04) · ✓ | brouillage non défini · ? I21 | — | copie `sr-only` et `aria-hidden` · ✗ I27 | `fonts.ready` contre `onloadingdone` · ✗ I30 |
| F17 SVG | `draw` (preset), morph et trajectoire (actions) · ✓ | `pathLength` standard · ✓ ; `d` possédé par le runtime · ✗ I30 | `morphTo` · ✓ | — | — · ? I02 | tracé : réduit non défini · ? I05 | retour non défini · ? I21 | — | `--udx-motion-*` · ✓ | anime chargé pour le morph (M4-R09) · ✓ |
| F18 Gestes | pas de verbe, `defineGesture` · ✓ ; `reorder` · ✗ I24 | `data-motion-gesture` (attribut nouveau) · ✗ I11 | `defineGesture` (septième fonction de définition) · ✗ I22 | clés en français `axes`, `bornes`, `relâchement` · ✗ I23 | `carry` au relâchement (M2-R02) · ✓ | non défini · ? I05 | `velocity`, `grab`, `drag`, `release`, `settle` · ✗ I21 | — | `--udx-drag-x` hors `--udx-motion-*` · ✗ I07 | intention (M2-R10) contre idle (M3-R04) · ✗ I28 |
| F19 Responsive et scopes | paliers Tailwind `md:` · ✓ ; palier de conteneur (exception déclarée) · ✓ | `data-motion-scope` · ✗ I11 | `scope.dispose()` contre `revert()` · ✗ I29 | — | reconstruction, position perdue sans carry (M3-R06) · ✓ | non défini · ? I05 | le scope regroupe les handles · ✗ I29 | élagage des scopes déconnectés (M3-R05) · ✓ | `--breakpoint-*` du thème · ✓ | `matchMedia` partagé · ✓ |
| F20 Accessibilité | `loop` avec `pause` obligatoire (M3-V04) · ✓ ; rendu réduit par verbe · ✗ I05 | `data-motion-pause` · ✓ ; `essential` consigné · ✓ | cinq formes · ✓ | `alternative` contre `keyboard` · ✗ I24 | — | table divergente pour `disappear` et `loop` · ✗ I05 | `pause` du handle · ✓ | `data-presence` lu en CSS · ✗ I04 | `--udx-motion-scale` · ✗ I05 | `matchMedia` partagé · ✓ |
| F21 Performance | — | — | import sans effet de bord (M4-R10) · ✓ | `allow-paint` absent du registre · ✗ I11 | — | — | `inspect()` · ✓ | — | — | idle, intention ou intersection · ✗ I28 |
| F22 Usage interne | contrôleurs en définitions nommées · ✓ | `data-motion` sur les composants · ✓ ; prop `motion` · ✗ I11 | cinq formes · ✓ ; prop `motion` (M4-R02) · ✗ I11 | prop `motion` contre attributs `data-motion-*` · ✗ I11 | règles par verbe · ✓ | ressort du Button déclaré · ✓ | handle · ✓ | sorties des composants · ✓ | préfixe `udx-` pour presets · ✗ I13 | `@udixio/motion/presets` · ✓ |
| F23 Outillage IA | manifeste des verbes (M5-R03) · ✓ | liste fermée des attributs non tenue · ✗ I11 | types générés (§8.0 bis #1) · ✓ | alias `fade-up` non biunivoque (M5-V10) · ✗ I01 | table des défauts incomplète · ✗ I02 | table du manifeste sans règle de sens · ✗ I05 | codes d'erreur communs · ✓ | valeurs `exiting` et `leaving` · ✗ I04 | deux espaces de tokens · ✗ I07 | — · ✓ |
| F24 Boucles | `loop` (septième verbe) · ✓ ; `pulse` et `spin` · ✗ I13 | `data-motion="pulse"` · ✗ I13 | `useMotion` · ✓ | `pause` · ✓ | restart (M3-V04) contre sans reprise (M5-V02) · ✗ I08 | figé, pause ou frame neutre · ✗ I08 | `pause` · ✓ | — | `animation-play-state` · ✓ | abonnement global, pause hors vue (M3-R03) · ✓ |

## 2. Incohérences et trous

Les entrées sont classées par importance décroissante. Les options ne sont pas validées ; l'impact indique ce qui dépend du choix.

### I01 — Convention de direction : origine ou sens

**Familles touchées** : F2, F3, F4, F7, F9, F18, F23.

**Constat** :
- §8.1 corrigé (proposition Claude) : `start` et `end` pour l'horizontal (compatible RTL), `up` et `down` pour le vertical, désignant le sens du mouvement.
- R12 M3-V06 : option `from` (`top`, `bottom`, `start`, `end`, `left`, `right`) désignant l'origine ; `rise` vaut `from: bottom`. Verdict : 0 valide, 4 contestent (M1, M2, M4, M5).
- R12 M4-V08 : `start`, `end`, `up`, `down` comme valeurs d'effet, `left` et `right` exclus. R12 M5-V03 : `direction` avec `up`, `down`, `left`, `right`. M1 propose de renommer `direction` en `from`.
- R12 §3.1 n°1 à 6 : six paires de contradictions sur la convention ; toutes restent à trancher, y compris n°3 et n°6 (couvertes par la fusion G9, mais pas par une décision sur la convention).
- R12 M5-V06 : `up` et `down` valeurs de direction seulement, jamais dans un nom de verbe ou de preset ; R12 M4-V09 : `udx-reveal-fade-up` (direction dans le nom) ; R12 M5-V10 : alias `fade-up` vers `slide` plus `direction`, « non biunivoque » selon M5.

**Options de résolution** :
- **A — Origine (M3-V06)** : `from` avec `top`, `bottom`, `start`, `end`, `left`, `right`. Avantage : même convention que `slide-in-from-*` de Tailwind ; `start` et `end` tiennent en RTL. Limite : `from` se lit comme une position absolue ; `up` et `down` disparaissent ; migration depuis AOS (`fade-down` devient `from: top`).
- **B — Sens (§8.1 corrigé)** : `start` et `end` pour l'horizontal, `up` et `down` pour le vertical. Avantage : un mot par sens, lecture dans les deux sens de l'écriture. Limite : `up` et `down` restent physiques (pas de miroir RTL) ; `left` et `right` sortent du vocabulaire d'effet, donc `direction` (M5-V03) est à réécrire.
- **C — Option `direction` au sens, `from` aux valeurs** : `direction` au domaine fermé `start | end | up | down` pour les effets ; `from` réservé aux valeurs de `defineValue`. Avantage : un seul nom d'option pour le mouvement, sans collision avec `from` de `defineValue` (M1-R07). Limite : deux conventions coexistent (sens pour les effets, origine pour les valeurs), à documenter.

**Impact sur la cohérence globale** : décide les noms directionnels de presets (`rise`, `drop`, `sink`, `lift`, R12 §3.2 n°27 et 28 ; I13), l'option `direction` (I23) et les alias de diagnostic (M5-V10).

### I02 — Défauts de reprise : table incomplète, valeur « sans reprise », présence

**Familles touchées** : F2, F3, F5, F7, F8, F9, F10, F11, F13, F14, F16, F17, F18, F24.

**Constat** :
- §8.0 bis #4 : deux valeurs, `carry` et `restart`. Exemple donné : `restart` pour une apparition, `carry` pour un drag ou un changement d'état.
- R12 M5-V02 (tête de G11) : sept verbes avec leur défaut. `scrub` et `loop` sont « sans reprise », valeur absente de §8.0 bis #4.
- Absents de la table : `shared` (restart dans M2-V02 et M2-V06), `route`, `gesture` (carry dans M2-R02), `sequence`, `draw`, `morph`, `tween`, `split`, `page`, cités par M1-V03 mais hors table retenue.
- Présence : M2-V06 met `appear` et `disappear` en carry ; M5-V02 les met en restart ; M1-V03 signale qu'un `disappear` en restart peut sauter pendant un `appear` (R12 §3.2 n°18, couvert par G11).
- `emphasize` (I06) et `loop` (I08) ont aussi des défauts contestés.

**Options de résolution** :
- **A — Valeur `none` ajoutée** : `none` (sans reprise) à côté de `carry` et `restart`, table complète par preset (M5-V02 plus `shared`, `route`, `gesture`, `sequence`). Avantage : aucune règle hors table. Limite : une troisième valeur à expliquer dans la doc et dans le lint.
- **B — Deux valeurs seulement** : `scrub` en `carry` (la position est la donnée), `loop` en `restart`. Avantage : grammaire à deux valeurs, comme §8.0 bis #4. Limite : `restart` sur une boucle infinie n'a pas de sens de continuité ; `scrub` n'a pas de vitesse à reprendre.
- **C — Présence en carry** : `appear` et `disappear` en `carry` (M2-V06), les autres verbes en `restart`. Avantage : une seule règle de continuité pour la présence. Limite : `carry` force le moteur JS (M5-S08) et un `disappear` repris peut traverser un `appear` en cours (limite notée R12 M1-V03).

**Impact sur la cohérence globale** : la table est le seul endroit où le défaut est écrit ; tant qu'elle est incomplète, F5, F8, F9, F11, F14, F16, F17 et F18 n'ont pas de défaut vérifiable par le manifeste.

### I03 — Verbe écrit dans `data-motion`

**Familles touchées** : F2, F3, F7, F8, F10, F22.

**Constat** :
- §8.1 #1 (proposé) : `data-motion` nomme une animation ou une définition, référence seule ; la règle « l'attribut nomme » est adoptée en §8.0 bis.
- R12 M5-V04 (tête de G6) : le verbe n'est jamais écrit en HTML. R12 §3.2 n°34-35 : verbe dans `data-motion` à trancher (M3, M4, M5) ; M3-V07 et M1-V10 écrivent `data-motion="reveal"`.
- R13 §4 n°4 : `data-motion="layout"` dans les exemples de M2-L04, M2-L05, M4-L01, M4-L04, M4-L05 ; `data-motion="emphasize"` dans M4-L03 ; remplacement proposé par `defineMotion(…, { verb })` (M5-L01).
- R14 M2-R04 : « la liste porte `data-motion="layout"` ».
- Les exemples M5-L03 (`data-motion="chevron"`) et M5-L04 (`data-motion="collapse"`) sont des références et restent conformes.

**Options de résolution** :
- **A — Référence seule (§8.1 #1, M5-V04)** : le verbe est porté par le preset ou la définition. Avantage : une seule sorte de valeur dans `data-motion`. Limite : un `layout` simple exige une définition ou un preset pour un cas trivial.
- **B — Verbe nu accepté comme référence** : `data-motion="layout"` vaut le verbe sans option (défaut du verbe). Avantage : pas de définition pour les cas triviaux, ce que R13 et R14 écrivent déjà. Limite : `data-motion` porte deux natures de valeur ; le lint doit distinguer verbe et nom de définition et refuser les noms réservés (M5-V07).
- **C — Attribut de verbe séparé** : `data-motion-verb="layout"`. Avantage : `data-motion` reste une référence, le verbe est explicite pour les agents. Limite : un attribut de plus, absent du registre (I11) ; contredit « le verbe jamais en HTML » (M5-V04).

**Impact sur la cohérence globale** : touche la grammaire commune aux 24 familles et les exemples de R13 et R14 (à réécrire selon l'option retenue).

### I04 — Attribut et valeurs de présence : nom et sortie

**Familles touchées** : F3, F10, F20, F23.

**Constat** :
- §8.1 bis Q6 : `data-presence` avec `entering | present | leaving` (tête de M5-L08). Le texte note « `leaving` vs `exiting`, nom de l'attribut à trancher ».
- R12 M3-V09 et M4-V03 : `data-presence="entering | present | exiting"`. R13 M2-L09, M4-L10 et M1-L10 : `exiting`.
- R13 M3-L10 : `data-motion-presence="entering | present | leaving"` ; nom écarté au profit de `data-presence` (R13 M5-L08).
- R13 §4 n°2 : signalé par M1 à M5. R12 §3.2 n°15 : statut public de l'état à trancher (M2-V03, M3-V09).

**Options de résolution** :
- **A — `data-presence` et `exiting`** (R12 M3-V09, M4-V03, R13 M2-L09, M4-L10) : valeurs `entering | present | exiting`, comme le vocabulaire de R12. Limite : attribut hors de la grammaire `data-motion-<option>` ; le lint doit interdire son écriture par l'auteur.
- **B — `data-presence` et `leaving`** (tête de M5-L08) : garde la tête de groupe retenue en R13. Limite : diverge de R12 (M3-V09, M4-V03) et de deux variantes R13.
- **C — `data-motion-presence` et `leaving`** (M3-L10) : un préfixe unique `data-motion-*` pour la famille. Limite : attribut écrit par le runtime dans l'espace des options auteur, exception à « l'auteur écrit les options » (R12 M5-V04).

**Impact sur la cohérence globale** : ce nom est lu en CSS (variantes Tailwind), par `inspect()` et par les agents (M5-S09, M5-L10). Un changement après publication de la doc impose une migration.

### I05 — Rendu réduit de `disappear` et `--udx-motion-scale`

**Familles touchées** : F3, F4, F10, F20, F1, F2.

**Constat** :
- R12 M5-V02 : `disappear` réduit « instantané ». R12 M4-V03 (tête de G1) et M1-V04 : fondu. §8.1 corrigé : fondu.
- R13 §4 n°16 : M5-L08 instantané ; M2-L09 et M4-L10 fondu ; M3-L10 laisse à trancher.
- R12 §3.2 n°17 : ouvert entre M4-V03 (fondu) et M5-V02 (instantané).
- R14 M3-R07 : jeton `--udx-motion-scale` à 0 sous `prefers-reduced-motion`, durées en `calc(var(--udx-motion-scale) * …)`. Avec un fondu, la valeur 0 rend le fondu instantané (R14 §4 n°8 ; M4 et M5 contestent ; M2 propose de traiter les fondus à part).
- Rendu réduit de `reveal` non aligné : `instant` (M5-V02) contre `fade` ou `instant` (M3-V01).

**Options de résolution** :
- **A — Fondu (§8.1 corrigé), exception au jeton** : le fondu n'est pas multiplié par `--udx-motion-scale`. Avantage : une sortie visible se termine et la retenue dure le fondu. Limite : une animation d'opacité subsiste sous réduction ; l'exception est à documenter.
- **B — Instantané (M5-V02, M5-L08)** : zéro animation sous réduction, `--udx-motion-scale` à 0 suffit. Limite : contredit §8.1 corrigé et les trois autres propositions (M4-V03, M2-L09, M4-L10) ; la sortie disparaît sans transition.
- **C — Fondu par défaut, option déclarée** : `data-motion-reduced="instant"` au domaine fermé pour le cas instantané. Avantage : choix explicite par élément. Limite : une option de plus (I11) ; le rendu réduit n'est plus unique par verbe (M5-V02).

**Impact sur la cohérence globale** : la règle « rendu réduit par verbe » (§8.1 #5) dépend de ce choix ; il touche aussi `reveal` et `layout` (instantané, M5-V02).

### I06 — Transition d'état non géométrique (Q2) et reprise d'`emphasize`

**Familles touchées** : F2, F13, F1, F14, F15.

**Constat** :
- §8.1 bis Q2 : réponse M5-L03 (`emphasize` avec `trigger="state"` et `interrupt="carry"`). Note 5,6 : « faible — à résoudre en R15 ».
- §8.0 bis #4 : `carry` pour un changement d'état. R12 M5-V02 : `emphasize` en `restart`. M5-L03 déclare `restart` par défaut et écrit `carry` à la main ; M2-L03, M3-L06 et M4-L03 proposent `carry`. R13 §4 n°1 : défaut contesté par M1 et M4.
- R12 M5-V01 (limite) : `emphasize` mêle accentuation et état, « à scinder si les besoins divergent ».
- R13 M1-L04 (`layout` élargi aux valeurs non géométriques) rejeté à 2,2. Alternatives citées : `state` et `defineValue`.
- `interrupt` absent de la liste d'options partagées (M5-L03, limite). `carry` écrit dans la définition, pas dans le HTML (exception déclarée dans M5-L03).

**Options de résolution** :
- **A — `emphasize` avec défaut selon le déclencheur** : `trigger="state"` implique `carry` ; les autres déclencheurs restent en `restart`. Avantage : pas de verbe ajouté. Limite : le défaut dépend de deux options, la table I02 se complique.
- **B — Verbe `state` distinct** (huitième verbe), reprise `carry`. Avantage : sépare accentuation et état (R12 M5-V01). Limite : contredit « sept verbes au plus » (M5-V01) et §8.1 #2 ; impact sur I09.
- **C — `defineValue` pour rotation et couleur** : `emphasize` réservé à l'accentuation en `restart`. Avantage : la reprise porte sur la valeur. Limite : chaque chevron ou couleur devient une définition de valeur ; M1-L04 écarte le cas où `layout` porte ces valeurs.

**Impact sur la cohérence globale** : Q2 reste faible (5,6). Le choix conditionne la table I02 et la liste d'options (I23).

### I07 — Espace de noms des tokens et variables CSS

**Familles touchées** : F1, F10, F13, F14, F15, F18, F19, F20, F23.

**Constat** :
- §8.1 #3 et R12 M5-V07 : tokens en `--udx-motion-*`, jamais `--animate-*` ; `--animate-*` cœur (`spin`, `pulse`, `ping`, `bounce`) ne doit pas être écrasé.
- R14 M5-R01 (variante de G3) : émission `--udx-motion-<rôle>-<nom>` plus alias `@theme` `--duration-*` et `--ease-*` ; « `--animate-*` et `--anim-*` ne sont plus émis » (migration). R14 §4 n°10 : ces alias écrasent l'échelle native (`duration-150`) ; M1-R06 propose `duration-udx-*`. `var()` dans `@theme` à vérifier (Tailwind v4, M3, M4, M5).
- Variables runtime hors `--udx-motion-*` : `--udx-value-<nom>` sur la racine (M1-R07), `--udx-<nom>` sur les cibles (M3-R01), `--udx-drag-x` (M2-R01), `--udx-pointer-x` (M3-R01). Variables dans l'espace `--udx-motion-*` : `--udx-motion-index` (M3-R03), `--udx-motion-stagger-max` (M2-R06), `--udx-motion-scale` (M3-R07).
- Existant : `--anim-*` (R14 M5-R01, migration nommée).

**Options de résolution** :
- **A — Un seul espace `--udx-motion-*`** pour tokens et variables runtime, aucun alias `--duration-*`, `--ease-*` ou `--animate-*`. Avantage : aucune collision avec Tailwind ni avec l'existant. Limite : les utilitaires passent par `duration-udx-*`, à définir et tester.
- **B — Alias `@theme` `--duration-*` et `--ease-*`** (M5-R01), pour que les utilitaires natifs lisent les tokens Udixio. Avantage : utilitaires Tailwind sans préfixe. Limite : écrase l'échelle native de Tailwind (R14 §4 n°10).
- **C — Deux espaces** : `--udx-motion-*` pour le runtime, `duration-udx-*` et `ease-udx-*` pour les utilitaires (M1-R06). Avantage : aucune collision. Limite : deux noms pour une même valeur, double émission à tester (M1-R06).

**Impact sur la cohérence globale** : toutes les familles qui émettent un token ou une variable (F1, F13, F14, F19, F20, F10) ; le manifeste doit lister un seul espace.

### I08 — Boucle `loop` : défaut, rendu réduit, pause

**Familles touchées** : F24, F20, F21.

**Constat** :
- R12 M3-V04 : défaut `restart`, rendu réduit « figé sur l'état neutre », `pause` obligatoire (`control` ou `essential`).
- R12 M5-V02 : `loop` « sans reprise », réduit « en pause contrôlable ».
- R12 M1-V04 : `loop` devient « une frame neutre avec pause exposée » ; M1-V03 : `loop` en `restart`.
- R12 §3.2 n°19 (défaut, ouvert) et n°21 (réduction, couvert par G11 qui retient M5-V02).

**Options de résolution** :
- **A — M3-V04** : `restart`, rendu réduit figé, `pause` obligatoire (`control | essential`). Avantage : la pause (WCAG 2.2.2) est une donnée vérifiée par le lint. Limite : `restart` sur une boucle infinie n'a pas de continuité ; « figé » n'expose pas de pause.
- **B — M5-V02** : sans reprise, réduit en pause contrôlable. Avantage : continuité de la boucle. Limite : suppose un composant de contrôle (limite notée M3-V04).
- **C — M1-V04** : frame neutre et pause exposée, pause obligatoire. Avantage : état final lisible et pause disponible. Limite : suppose une frame neutre pour chaque preset de boucle (`pulse`, `blink`, `indeterminate`, `spin`).

**Impact sur la cohérence globale** : F24 et F20 ; la valeur par défaut détermine ce que voit un utilisateur qui réduit le mouvement.

### I09 — Frontière des verbes : `layout`, `shared`, `state`, `follow`, `page`

**Familles touchées** : F2, F4, F5, F7, F8, F9, F14.

**Constat** :
- §8.1 #2 : sept verbes, `layout` « y compris élément partagé » ; `scrollTo` est une action (§8.1 #6) ; valeurs continues par `defineValue`.
- R12 M2-V02 : `shared` verbe distinct, défaut `restart`. M5-V08 le range comme option de `layout`. R12 §3.1 n°7-8 : placement à trancher.
- §8.1 bis Q4 et R13 M5-L05 : élément partagé par `defineShared` et `data-motion-shared`, ni verbe ni option de `layout` tranchée.
- `state` : cité comme changement natif (R12 M1-V02) et comme déclencheur (`trigger="state"`, R13 M5-L03), sans place dans la liste des sept verbes.
- `follow` : R12 §3.1 n°9 à 12 (ouvert) ; absent de M5-V01 et de §8.1 #2, donc retiré par omission sans décision tracée.
- `page` : R12 M1-V08 et M4-V06 ; retiré par M5-V08 (R12 §3.2 n°22) ; remplacé par le preset `route` (R13 M4-L07).

**Options de résolution** :
- **A — `shared` en option de `layout`** (§8.1 #2, M5-L05 pour l'attribut) : sept verbes, identité déclarée. Avantage : liste fermée intacte. Limite : `layout` couvre géométrie et identité inter-îles (limite de M5-V01) ; le défaut propre à `shared` (restart) demande une option.
- **B — `shared` verbe distinct** (huitième) : intention « partagé » nommée, défaut `restart` explicite (M2-V02). Limite : contredit « sept verbes au plus » (M5-V01).
- **C — `layout` pour la géométrie, `shared` en option, `state` ajouté** : résout aussi I06. Avantage : une seule décision pour deux trous. Limite : huit verbes, liste fermée rompue.

**Impact sur la cohérence globale** : la liste de verbes est la base des quatre niveaux de garde-fous (§8.0 bis #1) et de la table verbe × option (R13 M5-L09).

### I10 — Mesure « avant » d'un layout

**Familles touchées** : F7, F8, F10, F19, F3 (sorties).

**Constat** :
- §8.1 bis Q1 : M3-L02 (cache de la dernière géométrie stable) et M1-L01 (point pré-mutation par environnement).
- Trois formes d'API : `motion.layout(portée, mutation)` (M1-L01, forme TS de `data-motion="layout"`), `mutate(el, fn)` (M5-L01), `udixio.motion.set(el, attrs)` (M3-L03, variante contestée).
- Lecture réelle avant mutation (M2-L01, M1-L02) contre cache (M3-L02, M4-L01) : R13 §4 n°13.
- Points de capture par framework : React `getSnapshotBeforeUpdate` d'un wrapper de classe (M2-L01) contre `useLayoutEffect` à valeur stockée (M3-L03, M4). Svelte `$effect.pre` (M4). Angular : `afterRender` (M1-L02, tranché faux par M4), `effect()` (M2-L01), `ngDoCheck` (M3-L03, non fiable), gestionnaire d'événement et `afterRenderEffect` (M4-L01). R13 §4 n°14 : non tranché, à trancher par spike.

**Options de résolution** :
- **A — Cache de géométrie stable** (M3-L02), lu en phase de lecture, invalidé par `ResizeObserver` et `MutationObserver`. Avantage : une seule source pour les quatre environnements, aucun point pré-mutation à valider. Limite : valeur périmée si un changement non observé déplace l'élément ; coût de lecture par élément suivi.
- **B — Capture pré-mutation par environnement** (M2-L01, M1-L02). Avantage : géométrie lue au moment de la mutation. Limite : trois points à valider (Angular non tranché) et une forme différente par framework.
- **C — Transaction unique `motion.layout(portée, mutation)`** (M1-L01). Avantage : une primitive, lecture avant mutation par construction. Limite : les changements asynchrones (donnée reçue, redimensionnement) hors transaction ne sont pas couverts sans M3-L02.

**Impact sur la cohérence globale** : F7, F8, F10 et les sorties (I19) reposent sur cette mesure ; elle conditionne la surface TS (I22).

### I11 — Registre d'attributs, liste fermée, prop `motion`

**Familles touchées** : toutes (grammaire) ; surtout F3, F7, F8, F11, F14, F16, F18, F19, F21, F22.

**Constat** :
- R12 M5-V03 et M5-V09 : options fermées, liste « fermée et versionnée ». `attributeFilter` dépend de cette liste (M1-V10).
- Attributs proposés et non inscrits au registre : `data-motion-scope` (M3-L01, à ajouter à V03), `data-motion-exit="pop"` (M2-L10, à déclarer), `data-motion-value` (M1-R07, M3-R01, M5-R09), `data-motion-gesture` (M2-R01), `data-motion-split` (M1-R04), `data-motion-sequence` et `data-motion-step` (M2-R05, M5-R06), `data-motion-part` (M1-R01), `data-motion-keep` (M4-L04, renommé par son auteur), `data-motion-interrupt` (M5-L03), `data-motion-group` (M3-V08), `data-motion-commit` (M2-R04, à inscrire au V03), `data-motion-allow-paint` (M3-R08).
- Rejetés : `data-motion-transition` (M2-L07, nom réservé), `data-motion-outlet` (M3-L09), `data-motion-layout-id` (M1-L07, valeur libre).
- R14 M4-R02 : prop `motion` (nom de spec ou objet `{ duration?, easing?, interrupt? }`) remplace `transition`, ses clés alignées sur `data-motion-duration`, `data-motion-easing`, `data-motion-interrupt`. R14 §4 n°23 : trois formes en concurrence (prop `motion`, `data-motion-<option>`, options fermées).

**Options de résolution** :
- **A — Liste fermée versionnée** (M5-V09) : chaque attribut nouveau est inscrit par entrée, le lint refuse le reste. Avantage : grammaire vérifiable. Limite : une quinzaine d'attributs à tenir à jour, et chaque famille en ajoute.
- **B — Un attribut par concept** : `data-motion-step` pour `part` et `step` ; `data-motion-shared` pour `layout-id` ; suppression de `scope`, `keep`, `group`. Avantage : moins d'attributs, doublons résolus. Limite : retire des noms déjà employés dans R12, R13 et R14.
- **C — Parité HTML et TS** : la prop `motion` (objet de tokens) a les mêmes clés que les attributs `data-motion-<option>`. Avantage : une clé par option dans les deux formes. Limite : rupture de toutes les liaisons (R14 M4-R02, D2) ; `apps/doc` non typée, balayage grep requis.

**Impact sur la cohérence globale** : la grammaire `data-motion` plus `data-motion-<option>` (§8.1 #1) est la convention la plus partagée ; ce point la rend fermée ou ouverte.

### I12 — Panneau monté : `collapse` en `layout` ou mécanique CSS (Q3)

**Familles touchées** : F2, F3, F7, F20.

**Constat** :
- §8.1 bis Q3 : réponse M5-L04 (le preset `collapse` passe de `appear` et `disappear` à `layout`). Note 5,2 : « faible — à résoudre en R15 ».
- R12 M5-V05 : `collapse` en `appear` et `disappear` ; exception déclarée par M5-L04.
- R13 M1-L06 : `grid-template-rows` de 0fr à 1fr, sans JS ; `interpolate-size` en amélioration. M4 et M5 contestent (« pas de verbe » hors grammaire, repli `restart`).
- R13 §4 n°3 : CSS pur contre `layout`, signalé par M1 à M5.
- Non vérifié : `hidden="until-found"` et `::details-content` (R13 §4 n°23) ; `display:none` non transitionné dans Firefox (faits établis, R10).

**Options de résolution** :
- **A — `collapse` = `layout`** (M5-L04). Avantage : un verbe pour la hauteur auto, pas de `display:none` à transitionner. Limite : exception à M5-V05 ; deux sources de vérité si l'auteur écrit `hidden` et `inert` ; mesure de hauteur à fournir (I10).
- **B — Mécanique CSS pure** (`grid-template-rows` 0fr à 1fr, M1-L06), preset sans verbe. Avantage : pas de mesure ni de JS sur les navigateurs visés. Limite : preset sans verbe, exception à « chaque preset porte un verbe » (M5-V05) ; repli JS requis.
- **C — `collapse` en `appear` et `disappear`** avec `hidden` (M5-V05 original). Avantage : aucune exception. Limite : `display:none` ne se transitionne pas dans Firefox ; la hauteur auto reste à traiter.

**Impact sur la cohérence globale** : F2, F3, F7 ; pose la question de la présence d'un preset sans verbe (I13 pour `route`).

### I13 — Presets : noms, préfixe, collisions, exceptions

**Familles touchées** : F2, F3, F4, F9, F20, F22, F23, F24.

**Constat** :
- §8.1 #4 : dix presets nommés par effet (R12 M5-V05) : `fade`, `slide`, `scale`, `collapse`, `press`, `pulse`, `shake`, `spin`, `shimmer`, `blink`.
- §8.1 corrigé (correction 3) : `spin` et `pulse` renommés (exemple `rotate`, `breathe`) pour éviter `animate-spin` et `animate-pulse`.
- R12 §3.2 n°29 : `pulse` en `emphasize` (M5-V05) contre `pulse` en boucle (M3-V10). n°30 : `pulse` et `blink` coïncident avec des noms cœur de Tailwind (M5-V07).
- R12 §3.2 n°23 à 26 : préfixe `udx-` (M4-V09) non arbitré ; `udx-reveal-fade-up` porte une direction ; M5-V06 interdit `down` comme nom ; M3-V10 écrit `rise` et `parallax`.
- R12 §3.2 n°27 et 28 : `rise`, `drop`, `sink`, `lift` (M2-V08, sens dans le nom) contre M5-V05 (direction en option).
- Exceptions : `route` sans verbe (R13 M4-L07, « exception 3 ») ; `collapse` en `layout` (I12).

**Options de résolution** :
- **A — Appliquer la correction** (`rotate`, `breathe`) et réserver `pulse` à `loop`. Avantage : plus de collision avec Tailwind ni entre verbes. Limite : renommages à tracer et à documenter ; un nom familier disparaît.
- **B — Garder `pulse` et `spin`**, l'ambiguïté se lève par le verbe. Avantage : pas de renommage. Limite : un nom pour deux effets, collision avec les classes cœur de Tailwind maintenue.
- **C — Préfixe `udx-` obligatoire** pour les presets livrés (M4-V09). Avantage : espace de noms séparé des cœurs Tailwind et des définitions utilisateur. Limite : noms plus longs (`udx-loop-pulse`) ; chaque `udx-*` devient une API publique à maintenir (R14 M4-R01).

**Impact sur la cohérence globale** : F23 (alias et manifeste) ; la liste de presets alimente la table verbe × option (R13 M5-L09) et les exceptions (I09, I12).

### I14 — `stagger` : jeu de tokens

**Familles touchées** : F10, F3, F11.

**Constat** :
- §8.1 corrigé (correction 4) : `stagger` en token `tight`, `normal`, `loose`, jamais en millisecondes.
- R12 M2-V04 (tête de G5) : `stagger: "fast" | "normal" | "slow"`, en millisecondes ou en token. M3-V08 (absorbé) : `tight | snug | medium | loose | wide`. R12 §3.2 n°32 : tokens à arbitrer (M1, M4).
- M1-V09 : `rhythm: tight | snug | medium | loose | wide`.
- R14 M2-R06 et R13 M5-L07 : `data-motion-stagger="tight | normal | loose"` (M5-L07 emploie `tight`).

**Options de résolution** :
- **A — `tight | normal | loose`** (§8.1 corrigé, R14). Avantage : trois valeurs déjà employées par R13 et R14. Limite : ne correspond ni à `rhythm` (M1-V09) ni à M2-V04.
- **B — `tight | snug | medium | loose | wide`** (M3-V08, M1-V09). Avantage : cinq crans déjà choisis dans R12. Limite : R13 et R14 à réécrire (M2-R06, M5-L07).
- **C — `fast | normal | slow`** (M2-V04, tête de groupe). Avantage : vocabulaire de vitesse. Limite : mêmes mots que les tokens de ressort (`fast`, `default`, `slow` en M5-R02) ; confusion possible à la lecture.

**Impact sur la cohérence globale** : un seul domaine pour toutes les cascades (apparition, disparition, boucle, séquence).

### I15 — Chorégraphie : attributs enfant et syntaxe des décalages

**Familles touchées** : F11, F10, F12.

**Constat** :
- Attribut enfant : `data-motion-part="<nom>"` (M1-R01) contre `data-motion-step="<étiquette>"` (M2-R05, M5-R06). Parent : `data-motion="<nom>"` (M1-R01) contre `data-motion-sequence="<nom>"` (M2-R05, M5-R06). R14 §4 n°3.
- Décalages : `at` par token, étiquette ou `+=token`, jamais en millisecondes (M1-R01) ; `'<'`, `'+=0.1'` et étiquette plus 0.1 (M2-R05, dont l'auteur retire le numérique) ; `after` et `with` avec `offset` en token (M5-R05, M4-R07). R14 §4 n°7.
- Cascade sur le parent : `data-motion-stagger` (M4-R07) ; `data-motion-group` (M3-V08).

**Options de résolution** :
- **A — `data-motion-part` et `at`** (M1-R01). Avantage : `at` n'accepte pas de temps nu. Limite : `part` est un attribut nouveau, hors registre (I11).
- **B — `data-motion-step` et `after` et `with`** (M5-R05, M5-R06). Avantage : un nom d'étape inconnu est une erreur de type. Limite : séquences longues plus difficiles à relire (limite notée M5-R05).
- **C — `data-motion-step` et `at` avec étiquettes, `'<'` et `+=token`** (hybride de M2-R05 corrigé). Avantage : un seul nom d'attribut, comme M5-R06. Limite : deux syntaxes de décalage (`at` et `'<'`) à unifier.

**Impact sur la cohérence globale** : F11 surtout ; l'attribut enfant entre dans le registre (I11) et `at` dans la table des tokens de temps (I25).

### I16 — Rang de cascade et `sibling-index()`

**Familles touchées** : F10, F11, F3.

**Constat** :
- M2-R06 (tête de G2) : rang visuel mesuré en phase de lecture, pour l'ordre vu (grilles, RTL).
- M1-R02 : `sibling-index()` (CSS natif, ordre DOM) avec repli JS `i × token`.
- M4-R07 : rang DOM pour séquences et cascades. M3-R03 : index `--udx-motion-index` écrit par le runtime.
- R14 §4 n°2 : signalé par M1 à M5.
- Disponibilité : M1-R02 indique une Baseline depuis le 2026-08-18 (spec §5, selon M1) ; M2-R06 indique une absence sur Chrome 109, Firefox ESR 153 et iOS 18, soit environ 3,6 % de `defaults`. R14 §4 n°21 : à réconcilier.
- Ordre DOM et ordre visuel divergent avec `order`, `row-reverse` et RTL.

**Options de résolution** :
- **A — Rang visuel mesuré** (M2-R06). Avantage : suit ce que voit l'utilisateur. Limite : une lecture de layout par liste et par cascade (objection de M3-R06).
- **B — `sibling-index()` avec repli JS** (M1-R02). Avantage : aucune lecture JS quand le navigateur le supporte. Limite : ordre DOM, pas visuel ; disponibilité à réconcilier.
- **C — Index DOM écrit par le runtime** (`--udx-motion-index`, M3-R03). Avantage : un calcul partagé avec séquences et sorties. Limite : même écart avec l'ordre visuel que B, sans bénéfice natif.

**Impact sur la cohérence globale** : définit « l'ordre » pour les cascades, les séquences (I15) et les sorties en liste (I19).

### I17 — Élément partagé : identité, clé dupliquée, rendu

**Familles touchées** : F8, F9, F7.

**Constat** :
- Identité : `defineShared('nom')` avec `data-motion-shared="nom"` (M5-L05, retenu pour Q4). M1-L07 (`data-motion-layout-id` à valeur libre) écarté. M2-L05 propose une clé libre ; R13 §4 n°11 signale la contradiction avec la référence typée (§8.1 #1).
- Clé dupliquée en production : le premier inscrit garde la clé (M3-L08) contre le dernier monté (M2-L05) : R13 §4 n°12.
- Rendu : FLIP JS unique pour tout élément partagé (M2-L06) contre `view-transition-name: match-element` quand disponible (M4-L05). M2-L06 contredit C3 et §4.5 (natif d'abord) sans démonstration ; `match-element` n'est pas Baseline selon M2-L06 (Chrome 137, Firefox 144, Safari 18.4). R13 §4 n°8 : conflit ouvert.
- `defineShared` est une troisième fonction de définition hors `defineMotion` et `defineValue` (M5-L05, cité comme exception par M2).

**Options de résolution** :
- **A — FLIP JS unique** (M2-L06). Avantage : un seul rendu à tester, interruptible avec vitesse (`carry`). Limite : contredit §4.5 et C3 ; démonstration de fidélité à faire.
- **B — Natif `match-element` quand disponible, sinon registre et FLIP** (M4-L05). Avantage : natif d'abord. Limite : deux rendus pour un même élément selon le navigateur ; fidélité VT contre FLIP non démontrée.
- **C — Clé déclarée et référence typée** (`defineShared`), unique par document. Avantage : identité vérifiable. Limite : la règle de doublon en production reste à choisir (premier gagne, M3-L08, ou dernier, M2-L05).

**Impact sur la cohérence globale** : F8 et F9 ; conditionne la règle « natif d'abord » (§4.5) et la surface TS (I22).

### I18 — Transitions de page : détection, signature, types

**Familles touchées** : F9, F8, F12, F22.

**Constat** :
- R13 §4 n°7 : M3-L09 observe l'outlet par `MutationObserver` après la mutation, donc trop tard pour l'ancien état (M1, M5). `run` de M4-L07 et le repli de M1-L08 supposent une capture avant mutation.
- Signature : `navigate(run, { direction })` (M4-L07, retenu G7) ; `motion.navigate(update)` (M5-L06) ; `motion.navigate(mise à jour)` (M1-L08). R13 : « signature à unifier ».
- `addTransitionType` et `viewTransition` de React Router : à vérifier (R13 §4 n°23 ; M4-L07).
- Route : preset `route` sans verbe (M4-L07) ; `page` retiré du vocabulaire (R12 §3.2 n°22).
- Cross-document : `@view-transition { navigation: auto }` émis par le plugin Tailwind (M2-L07, M4-L08) ; absent de Firefox (3,19 % de `defaults`, R1 cité par M4-L08).

**Options de résolution** :
- **A — `navigate(run, { direction })` du runtime, branché par le routeur** (M4-L07). Avantage : capture avant mutation par construction. Limite : un branchement à écrire et à tester par routeur.
- **B — `motion.navigate(update)` du noyau** (M5-L06), qui encadre la mise à jour. Avantage : une seule forme, pas de `run` à résoudre au montage. Limite : `direction` absente de la signature ; chaque routeur doit passer par le noyau.
- **C — Intégration native seule** (`@view-transition`, `<ClientRouter />`, M2-L07, M4-L08). Avantage : sans JS. Limite : pas de contrôle same-document ; `<ClientRouter />` rejoue les scripts ; Firefox exclu du cross-document.

**Impact sur la cohérence globale** : F9 entier ; `route` est une exception à « un preset porte un verbe » (I13).

### I19 — Sorties : en place ou hors flux, `inert`, statut `inherited`, fenêtre de contrepartie

**Familles touchées** : F3, F7, F8, F10.

**Constat** :
- Sortie d'un élément de liste : en place à sa position d'origine (M4-L09) contre hors flux en `position` fixée (M1-L09, M2-L10, `pop`). R13 §4 n°5. `sibling-index()` compte les sortants que le `stagger` exclut (M1-L09). `data-motion-exit="pop"` (M2-L10) : `exit` est un nom réservé (M5-V07). R13 §4 n°18. `disappear` change de défaut en liste (M1-L09).
- Retenue : §8.0 #2 dit que le nœud est retenu jusqu'à `finished` ; M2-L04 et M5-L04 posent `inert` immédiatement. R13 §4 n°15 : exception non inscrite dans la spec.
- Statut `inherited` au handle (M4-L09) pour les descendants d'un ancêtre sorti : hors §8.0 #4. R13 §4 n°17.
- Fenêtre de contrepartie : une frame (M4-L06) ; jusqu'à `astro:page-load` pour `client:load` et `client:idle` ; `client:visible` non couvert. Même délai que la présence (M4-L09), « à unifier » (R13 M4-L06).
- Enfant ajouté pendant la sortie non couvert ; ordre de sortie inverse hors liste (M5-L07, `order` à arbitrer).
- Garde-fou temporel (M1-L10) qui masque une animation bloquée ; avertissement dev demandé (R13 §4 n°22).

**Options de résolution** :
- **A — Sortie en place à l'index d'origine** (M4-L09, M3-L10) : `inert` et `aria-hidden` posés pendant la retenue. Avantage : aucune géométrie modifiée pendant la sortie. Limite : un trou visible à la place du nœud pendant la sortie.
- **B — Sortie hors flux `pop`** (M2-L10). Avantage : les frères se réajustent immédiatement. Limite : la position fixée casse grilles et pourcentages (M2-L10) ; change le défaut de `disappear` en liste.
- **C — Choix par option déclarée, défaut en place**. Avantage : aucun défaut contesté pour les grilles. Limite : une option de plus (I11), deux comportements à tester.

**Impact sur la cohérence globale** : F3 et F10 ; l'exception `inert` et le statut `inherited` changent le contrat du handle (I21) et la formulation de §8.0 #2.

### I20 — États d'auteur et de survol

**Familles touchées** : F2, F7, F20.

**Constat** :
- Attribut d'état auteur : `data-open` non préfixé (M3-L01, exception déclarée) contre `data-state` (M2-L04, M5-L04, M4-L04). R13 §4 n°21. §8.0 bis cite `data-[open]:` comme variante Tailwind.
- Survol : qui écrit `data-hover` et `data-focus`. Le moteur (M1-L03) contre l'auteur via `pointerenter` et `focusin` (M4-L02). R13 §4 n°10 ; M1-L03 retiré par M1 et M4, à trancher par M3 et M5.
- Détection : observation de classes (M4-L02) contre attributs seuls (M3-L01, §8.0 bis).
- Sonde `@property` opt-in (M3-L04) contre zéro écouteur (M3-L04, §4.3).
- Lint : `layout` combiné à `hover:` est une erreur de build (M5-L02) ; `emphasize` accepte `hover:` (exception déclarée).

**Options de résolution** :
- **A — `data-state` pour tout état d'auteur** (M2-L04, M5-L04). Avantage : une seule convention. Limite : les exemples `data-open` (M3-L01) et `data-[open]:` (§8.0 bis) sont à réécrire.
- **B — `data-open` pour les booléens, `data-state` pour les énumérations** (M3-L01 avec exceptions). Avantage : lisible pour un booléen. Limite : deux conventions, une exception à déclarer.
- **C — Le moteur n'écrit jamais `data-hover` ni `data-focus`** (M3-L04, M5-L02) ; l'auteur les pose et le lint interdit `layout` sous `hover:`. Avantage : aucun écouteur global. Limite : l'auteur écrit ces états lui-même (M4-L02).

**Impact sur la cohérence globale** : F2 et F7 ; le choix fixe la liste `attributeFilter` (I11).

### I21 — Handle : surface étendue

**Familles touchées** : F12, F13, F18, F3, F7, F15, F16.

**Constat** :
- §8.0 #4 : `play`, `pause`, `reverse`, `seek`, `cancel`, `finished` ; `finished` ne rejette jamais.
- §8.0 bis #4 : le handle expose `velocity.source` (exact, estimated, unavailable). M1-V02 : il expose `position` quand la vitesse n'existe pas.
- Extensions dans les registres : `velocity` avec `x` et `y` et événements `grab`, `drag`, `release`, `settle` (M2-R02) ; `step` avec `ArrowUp` et `ArrowDown` (M5-R08) ; statut `inherited` (M4-L09) ; `alternative` (M2-R03) ; `inspect()` (M5-S09, §8.0 bis #2).
- `finished` résolu au même tick pour le rendu réduit (M2-L09) : compatible avec §8.0 #4.

**Options de résolution** :
- **A — Handle fermé** (six méthodes, `velocity`, `position`). Les autres comportements passent par options ou par une action TS séparée. Avantage : une surface pour les agents. Limite : gestes et sorties exigent une autre forme de contrôle (I24).
- **B — Handle documenté par famille** (`step`, événements, `inherited`) dans le manifeste. Avantage : couvre gestes et sorties sans second chemin. Limite : §8.0 #4, validé, est modifié ; le handle n'est plus uniforme.
- **C — Canal d'événements séparé** (`motion.on(el, 'release')`), handle à six méthodes. Avantage : §8.0 #4 intact. Limite : un second chemin à tester et à documenter.

**Impact sur la cohérence globale** : toutes les familles qui renvoient un handle ; toute extension modifie §8.0 #4, déjà validé.

### I22 — Surface TS des cinq formes et fonctions de définition

**Familles touchées** : toutes ; surtout F8, F11, F18, F22, F23.

**Constat** :
- §8.0 bis #3 : `data-motion` (HTML), `useMotion(spec)` (React), `udxMotion` (Angular), `{@attach motion(spec)}` (Svelte), `motion(el, spec)` (noyau).
- §8.0 bis #5 : `defineMotion` et `defineValue`. Autres fonctions proposées : `defineShared` (M5-L05), `defineGesture` (M2-R01), `defineSequence` (M1-R01), `defineTokens` (M5-R01).
- Directives et hooks : `udxSequence` (M5-R06) contre `udxMotion` (M1-R04 : « à aligner »).
- Référence en chaîne : `useMotion('collapse', { state })` (M5-L04) contre une définition, `useMotion(navIndicator, …)` (M5-L03). M5-L04 note la divergence.
- Noyau : `motion.layout(portée, mutation)` (M1-L01), `motion.navigate` (M5-L06), `udixio.motion.set`, `remove` et `inspect` (M3-L03, M3-L10, §8.0 bis #2 pour `inspect`) : hors des cinq formes.

**Options de résolution** :
- **A — Une fonction de définition**, `defineMotion(nom, { kind })` avec `kind` parmi `motion`, `value`, `sequence`, `gesture`, `shared`. Avantage : un point d'entrée pour agents et types. Limite : union TS plus lourde, messages d'erreur plus longs (R13 M5-L09).
- **B — Une fonction par type** : `defineMotion`, `defineValue`, `defineSequence`, `defineGesture`, `defineShared`, `defineTokens`. Avantage : chaque type a sa vérification. Limite : six fonctions à documenter et à porter dans les cinq formes.
- **C — Références en chaîne autorisées pour les presets livrés** (`useMotion('collapse')`) en plus des définitions. Avantage : presets sans import. Limite : deux formes de référence, divergence notée par M5-L04.

**Impact sur la cohérence globale** : §8.0 bis #3 et #5 ne couvrent que deux fonctions et les cinq formes ; la parité (M5-S07) dépend du choix.

### I23 — Options partagées : noms et domaines

**Familles touchées** : F2, F4, F5, F7, F10, F13, F18.

**Constat** :
- `interrupt` absent de la liste partagée (M5-L03, limite) ; présent dans `data-motion-interrupt` (M5-L03) et dans la prop `motion` (R14 M4-R02).
- `from` a trois sens : origine de direction (M3-V06), origine de `stagger` `first | last | center` (M2-V04), `from` et `to` de `defineValue` (M1-R07).
- Seuils : `touch | quarter | most` (M1-V09) contre `touch | quarter | half | full` (M3-V05) ; R12 §3.2 n°31. `margin` : `none | near | far` (M3-V05).
- `repeat` : `once | always` (M5-V03) contre `once` et `repeat` comme options de `reveal` (M4-V04). `trigger` : `load | view | state` (M5-V03).
- Temps : `duration`, `delay`, `easing` (M4-V07) contre `ease` (M1-V05, M1-V09) ; `spring` (M1-V05, M5-L03). R12 §3.2 n°33.
- Gestes : clés françaises `axes`, `bornes`, `snap`, `relâchement` (R14 M2-R01) contre la règle anglaise (M5-V06) ; `commit` (M2-R04) ; `measure` et `correct` (M2-V07) ; `rhythm` (M1-V09) contre `stagger` (M5-V03).
- `keyboard` (M5-R08) contre `alternative` (M2-R03) : R14 §4 n°15. `exit` réservé (M5-V07) et `data-motion-exit` proposé (I19).

**Options de résolution** :
- **A — Un sens par nom, domaines publiés au manifeste** : `from` réservé à l'origine de direction, `stagger` en `origin`, seuils au domaine de M3-V05, noms anglais uniquement. Avantage : aucun nom porteur de deux sens. Limite : renommages à tracer (`from` de `stagger`, `repeat`).
- **B — Vocabulaire de M1-V09** (`rhythm`, `duration: short | medium | long`, `threshold: touch | quarter | most`). Avantage : moins de termes. Limite : `rhythm` et `stagger` coexistent ; M5-V03 et M1-V09 à unifier.
- **C — Liste de M5-V03 plus `interrupt`, `origin` et `commit`**. Avantage : peu de renommages. Limite : `from` garde deux sens (direction et `defineValue`) tant que I01 n'est pas tranché.

**Impact sur la cohérence globale** : toutes les familles qui exposent une option ; la clé `origin` dépend de I01.

### I24 — Gestes : `reorder`, source de vitesse, clavier

**Familles touchées** : F18, F10, F13, F20, F7.

**Constat** :
- `reorder` : verbe de geste seul (M1-R03) ; primitive hors verbes (M2-R01, M5-R07) ; geste et `layout` (M2-R04, G7) ; `data-motion-gesture="reorder"` (M4-R08, M2-R04). R12 M2-V05 le donne comme verbe. §8.1 #2 ne le range pas parmi les sept verbes. R14 §4 n°1.
- Source de vitesse : `Draggable` d'anime (M2-R02, `velocity.source`) ; pointeurs coalescés sur 100 ms (M3-R09) ; moindres carrés sur 3 à 4 échantillons de moins de 100 ms (M1-R03) ; environ 100 dernières ms (M4-R08) ; `source: exact` au pointeur, `estimated` sinon (M5-R07). R14 §4 n°6.
- Clavier : Espace saisit et dépose, flèches déplacent (M2-R03) ; `ArrowUp` et `ArrowDown` sur le handle `step` (M5-R08) ; le runtime ne gère pas les flèches (M4-R08) ; alternative comme action du handle (M3-R09) ; champ `alternative` (M2-R03) contre `keyboard` (M5-R08). R14 §4 n°11 et n°15.
- `getCoalescedEvents` : Safari 18.2+ selon une source secondaire (M3-R09), à vérifier (R14 §4 n°25).

**Options de résolution** :
- **A — `reorder` primitive de `defineGesture` plus `layout`, sans verbe** ; vitesse `exact` au pointeur, `estimated` ailleurs (M5-R07) ; clavier par champ `alternative` obligatoire, Espace et flèches (M2-R03). Avantage : un seul champ clavier, pas de verbe ajouté. Limite : `estimated` fréquent au tactile (M5-R07).
- **B — `reorder` verbe** (M1-R03) ; vitesse par moindres carrés, clavier par flèches et boutons. Avantage : un nom de plus pour les agents. Limite : huitième verbe, contredit §8.1 #2 et M2-R01 ; flèches incompatibles avec Espace selon M2.
- **C — Vitesse unique par `Draggable`** d'anime (M2-R02) pour tous les gestes. Avantage : une seule source de vitesse. Limite : impose anime.js à tout geste, exception à « natif d'abord » (limite de M2-R02) ; la mesure au pointeur est écartée.

**Impact sur la cohérence globale** : F18 surtout ; l'alternative clavier est une règle de build (M5-S10) qui touche F10 et F20.

### I25 — Ressorts, courbes et durées

**Familles touchées** : F13, F1, F14, F15.

**Constat** :
- Nom d'un ressort : `spring: 'soft'` (M5-L03), `easing="spring-<nom>"` (M4-L03), `'spring-expressive'` (M4-R02, que M2 signale comme nom de token inexistant), `spring` par rôle et vitesse (M5-R02 : `fast`, `default`, `slow`). R14 §4 n°18.
- Courbes : `ease` (M1-V05, M1-V09) contre `easing` (M4-V07). R12 §3.2 n°33.
- Paramètres : ressort compilé en `linear()` au build (M5-S05) contre paramètres physiques conservés pour la reprise (M1-L05, que M5 signale comme contradictoire). R13 §4 n°9.
- Qualification de la courbe `0.2,0,0,1` : « legacy » (M5-R02) contre courbe standard M3 (M1 ; R14 §4 n°19).
- Durées : `short1` à `extra-long4` (M5-R02) contre `short` à `extra-long` (M1-R06) contre `short | medium | long` (M1-V09). `md` et `medium2` (M4-V07, M5-R02). R14 §4 n°20. Valeurs M3 à relever avant S1 (§8.1 bis Q8).

**Options de résolution** :
- **A — Ressort = token `spring.<rôle>.<vitesse>`** (M5-R02), courbes et `linear()` dérivés au build, paramètres physiques conservés (M1-L05). Avantage : une source, reprise exacte. Limite : `linear()` absent des vieux Chrome de `defaults` (repli JS) ; nom sur trois niveaux.
- **B — Ressort nommé par intention** (`soft`, `snappy`, `gentle`, M1-V05, M5-L03) dans `easing`. Avantage : lisible pour les agents. Limite : le nom ne dit ni le rôle ni la vitesse ; pas de référence dans M5-R02.
- **C — Une option `easing`** pour courbes et ressorts (`easing="spring-<nom>"`, M4-L03) et échelle `short` à `extra-long` (M1-R06). Avantage : un seul nom d'option. Limite : `spring` (M5-L03) et `ease` disparaissent ; renommages et échelle à arbitrer.

**Impact sur la cohérence globale** : F13 et F1 ; conditionne la reprise de ressort (vitesse `exact`, I21) et la table de tokens (I07).

### I26 — Valeurs réactives et compteurs

**Familles touchées** : F14, F15, F5.

**Constat** :
- Placement : `--udx-value-<nom>` sur la racine (M1-R07) ; `--udx-<nom>` sur les cibles abonnées (M3-R01, retenu G9) ; racine de portée à réduire aux cibles (M4-R05). R14 §4 n°5. Écrire sur la racine invalide le style de tous les descendants (M3-R01).
- Forme : `defineValue('pointer-x', { source: 'pointer', axis: 'x', range: [-1, 1] })` (M3-R01) ; `source: 'pointer.x'` (M5-R09) ; `{ from, to, mapRange, spring }` (M1-R07) ; `source` et `range` (R14 §4 n°16).
- Compteur : `data-motion-value="<nom>"` (M1-R07, M3-R01) contre `<data value="1234">` (M4-R06). R14 §4 n°24.
- Lecture par framework : signal, store, `useSyncExternalStore` avec snapshot stable (M4-R05).

**Options de résolution** :
- **A — Variables sur les cibles abonnées** (M3-R01). Avantage : pas d'invalidation des descendants. Limite : une écriture par cible.
- **B — Variable sur la racine de portée** (M1-R07, M4-R05). Avantage : une écriture pour tous les abonnés. Limite : invalide le style de tous les descendants (M3-R01).
- **C — Forme `source`, `axis`, `range` pour la définition, et `<data>` pour le compteur** (M3-R01, M4-R06). Avantage : forme typée lisible, valeur machine dans le SSR. Limite : `source: 'pointer.x'` (M5-R09) et `from`, `to`, `spring` (M1-R07) disparaissent ; `data-motion-value` et `<data>` cohabitent.

**Impact sur la cohérence globale** : F14 et F15 ; la référence `data-motion-value` est un attribut hors registre (I11).

### I27 — Texte : découpage, accessibilité, brouillage, domaine

**Familles touchées** : F16, F20, F10.

**Constat** :
- Découpage : le framework rend les morceaux, donc le SSR les voit (M4-R03) ; contre découpage client après hydratation, texte source intact en SSR (M1-R04, M2-R08, M3-R10, M5-R10). R14 §4 n°4a.
- Accessibilité : copie `sr-only` du texte complet, morceaux en `aria-hidden` (M1-R04, M4-R03, M4-R04) ; contre `aria-label` sur le conteneur (M5-R10 ; M2-R08 initial, corrigé par son auteur). ARIA 1.2 interdit de nommer un élément générique (à vérifier, M3). R14 §4 n°4b.
- Brouillage : inclus en v1, écrit hors rendu, intermédiaires en `aria-hidden` (M1-R04, M4-R04) ; hors v1 (M2-R08 initial, M3-R10) ; à trancher (R14 §4 n°22).
- Domaine : `chars | words | lines` (M1-R04) contre `letters | words | lines` (M5-R10). R14 §4 n°17.
- `fonts.ready` ne couvre pas `fonts.onloadingdone` : R14 §4 n°25.

**Options de résolution** :
- **A — Découpage client après hydratation, `sr-only` et `aria-hidden`, brouillage hors v1**. Avantage : SSR et lecteurs lisent le texte une fois. Limite : copie qui double le texte dans le DOM ; incompatible avec des enfants gérés par React (M4-R03).
- **B — Découpage par le framework** (M4-R03). Avantage : React garde ses enfants, le SSR montre les morceaux. Limite : spans rendus côté framework, contraire au texte source intact (M2-R08, M1-R04).
- **C — Découpage client avec `aria-label` sur le conteneur** (M5-R10). Avantage : pas de copie `sr-only`. Limite : `aria-label` sur un élément générique non fiable (ARIA 1.2, à vérifier).

**Impact sur la cohérence globale** : F16 ; la copie `sr-only` est une exception déclarée (I27 et I11).

### I28 — Chargement : idle, intention, intersection

**Familles touchées** : F21, F7, F18, F3, F4, F1.

**Constat** :
- Préchargement idle après le premier rendu pour `appear`, `reveal` et `emphasize` (`requestIdleCallback`, repli `setTimeout`) ; `scrub` et `layout` à l'approche de la vue (M3-R04).
- Chargement au premier signal d'intention (`pointerenter`, `focusin`, entrée dans la vue), jamais au chargement (M2-R10). Le module geste n'est chargé que si une cible porte `data-motion-gesture` ou `layout` (M2-R10).
- Préchargement sur `pointerenter` ou intersection (M1-R09).
- R14 §4 n°14 : M3 contre M2 (idle contre « jamais au chargement »). M2 demande de fusionner les déclencheurs (G13).
- `requestIdleCallback` absent de Safari (M3, à vérifier). `import()` retarde la première frame (M4-R10). Premier tactile sans `pointerenter` (M2-R10).

**Options de résolution** :
- **A — Préchargement idle des verbes communs** (M3-R04). Avantage : pas de latence au premier usage. Limite : `requestIdleCallback` à vérifier sur Safari ; des modules peuvent être chargés sans usage.
- **B — Chargement à l'intention seulement** (M2-R10). Avantage : aucun octet inutile. Limite : le premier geste tactile paie la latence de chargement.
- **C — Préchargement par intersection ou `pointerenter`** (M1-R09). Avantage : lié à la présence de l'élément. Limite : n'anticipe pas les verbes sans cible visible (`appear` au chargement de la page).

**Impact sur la cohérence globale** : F21 ; la liste `preload` par verbe du manifeste est commune à toutes les familles.

### I29 — Scope : fin de vie et diagnostic

**Familles touchées** : F19, F21, F22.

**Constat** :
- Fin de vie : `scope.dispose()` (M1-R08) contre `scope.revert()` (M3-R05, nom de `createScope` d'anime). M4-R10 : `revert` différent de `dispose`. R14 §4 n°12.
- `scope` assimilé à `udixio.motion.inspect()` (M1-R08) ; M3 distingue les deux notions, registre et diagnostic. R14 §4 n°13.
- Élagage : scopes déconnectés à la frame suivante (M3-R05). Les adaptateurs appellent `revert()` (cleanup React, `DestroyRef` Angular, retour d'attachment Svelte).
- Contenu du scope : handles, observateurs et WAAPI (M3-R05, à vérifier en S1).

**Options de résolution** :
- **A — `revert()`**, aligné sur `createScope` d'anime (M3-R05). Avantage : même nom que la bibliothèque sous-jacente. Limite : nom emprunté à une bibliothèque tierce pour un cycle de vie propre à Udixio.
- **B — `dispose()`** (M1-R08). Avantage : vocabulaire de cycle de vie courant. Limite : diverge de `createScope` d'anime, utilisé par le registre.
- **C — Deux notions séparées** : `revert()` pour le registre, `inspect()` pour le diagnostic (position de M3). Avantage : pas de confusion. Limite : deux méthodes à documenter et à tester séparément.

**Impact sur la cohérence globale** : F19 ; la même fin de vie sert les adaptateurs (I22).

### I30 — Faits à vérifier portant sur des choix retenus

**Familles touchées** : F17, F9, F16, F18, F21, F7, F8, F10.

**Constat** :
- `morphTo` : rééchantillonne (M1-R05) contre exige le même nombre de points (M4-R09). R14 §4 n°9 ; signalé par M1, M3, M4, M5.
- `d` rendu par le framework qui écrase le morphing (M2, M4 ; à vérifier) ; R14 §4 n°25.
- `var()` dans `@theme` (Tailwind v4) : M3, M4, M5-R01.
- `getCoalescedEvents` : Safari 18.2+ selon une source secondaire (M3-R09) ; à vérifier (M4).
- `sibling-index()` : support à réconcilier (I16) ; R14 §4 n°21.
- `addTransitionType`, `viewTransition` (M4-L07) ; noms d'événements Astro 5.x (M4-L08) ; R13 §4 n°23.
- `hidden="until-found"` et `::details-content` (M1-L06, M2-L04, M3-L07, M4-L04) ; R13 §4 n°23.
- `velocityStack` d'anime (M2-R02, à vérifier).
- `match-element` n'est pas Baseline (M2-L06) ; `fonts.onloadingdone` (I27) ; `requestIdleCallback` absent de Safari (I28).

**Options de résolution** :
- **A — Vérifier chaque point par spike ou test** avant d'arbitrer les choix dépendants. Avantage : décision fondée. Limite : retarde les arbitrages dépendants (I16, I17, I25).
- **B — Décider sous hypothèse documentée au manifeste**, à réviser si le fait est faux. Avantage : le design avance. Limite : rupture si l'hypothèse tombe.
- **C — Retirer du périmètre v1 la partie dépendante** (morph, `sibling-index()`, `match-element`). Avantage : réduit le risque. Limite : familles amputées (F17 morph, F10 cascade, F8 rendu natif).

**Impact sur la cohérence globale** : transverse ; la liste de faits est une entrée du plan de vérification (§7, phase 2).

## 3. Ce qui est déjà cohérent

- **Surface par environnement** : cinq formes sur un même noyau (§8.0 bis #3), avec un même principe de nommage (`useMotion`, `udxMotion`, `{@attach motion}`, `motion(el, spec)`). Les écarts sont traités en I22.
- **Handle unique et `finished` qui ne rejette jamais** (§8.0 #4), repris par R13 et R14 ; les extensions sont en I21.
- **Attribut qui nomme, pas qui valeurise** : `data-motion` en référence seule (§8.1 #1, M5-V04) ; l'écart sur le verbe est en I03.
- **Vocabulaire de reprise** `carry` et `restart`, et `velocity.source` (exact, estimated, unavailable) (§8.0 bis #4), repris par R13 M1-L05 et R14 M2-R02.
- **Valeurs continues par `defineValue`** sans re-rendu (§8.0 bis #5) ; `follow` n'est plus un verbe dans §8.1 #2.
- **Options à domaine fermé**, valeurs en tokens, sans nombre ni unité dans les attributs (R12 M5-V03, G10 retenu à cinq voix).
- **Anglais, kebab-case en HTML, camelCase en TS** (R12 M5-V06, G7), hors clés françaises de M2-R01 (I23).
- **Un moteur et une frame unique par page** (§8.0 #1 et #3), repris dans R13 et R14 (M3-R03, M3-R04).
- **Réserve de noms natifs et Tailwind** (M5-V07) ; `enter`, `in`, `out`, `transition`, `animate` refusés ; `exit` en tension avec I19.
- **Manifeste machine** `llms.txt` et JSON, outils MCP (M5-R03, M5-R04) : aucun désaccord sur le principe.
- **Composants Udixio sur la surface publique** (§8.0 bis #3, M1-R10, M4-R01) : aucun désaccord sur le principe ; la prop `motion` est en I11.
- **Abonnements bornés et pause hors vue ou onglet caché** (M3-R03) et coût par propriété (M3-R08) : aucun désaccord de principe.
