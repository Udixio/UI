# M2 — Annotations des choix M1, M3, M4, M5 (layout, partage, presence)

Lecture depuis la specialite layout / element partage / presence. Statut : valide = compatible avec le cadre layout ; conteste = contredit une contrainte layout ou presence ; neutre = hors de ma specialite ou sans effet direct.

## M1 — moteur et rendu

- M1-01 : valide — +FLIP en transform sur le compositor quand rien ne demande la vitesse / −une interruption en vol sur WAAPI n'expose pas la vitesse exigee par M2-08 / conflits: M2-08, M2-04
- M1-02 : neutre — +ressort de layout sans JS par frame quand `linear()` existe / −table figee : une reprise en vol ne transporte pas la vitesse du ressort / conflits: M2-08
- M1-03 : valide — +reprise FLIP et presence sans saut a la vitesse courante, base de M2-08 / −vitesse WAAPI estimee sur 2 a 3 frames, bruitee sur les inversions courtes / conflits: M2-04
- M1-04 : valide — +phases lecture puis ecriture declarees par abonne, la version la plus complete de M2-02 / −une copie de la lib = une boucle de plus sans registre partage (voir M4-05) / conflits: —
- M1-05 : neutre — +seek et reverse exacts pour une chorégraphie de sortie / −deux horloges WAAPI et frame a resynchroniser ; handle a detruire / conflits: M4-08 (doublon)
- M1-06 : valide — +mesure explicite avant mutation, tracable, sans moteur layout (≈21 kB evites) / −scale sans correction d'enfants, a porter par M2-03 ; mutation non encadree = mesure fausse / conflits: M2-09
- M1-07 : valide — +resolution des layoutId entre iles et noeud retenu jusqu'a l'homologue : mecanisme de sortie partagee utile / −collision d'identite sans espace de noms ; noeud fantome si l'homologue n'arrive jamais / conflits: M2-07, M2-05
- M1-08 : neutre — +zero JS par frame et zero polyfill pour le lie au scroll / −sans support, l'element reste a l'etat final : les etats de presence doivent le prevoir / conflits: —
- M1-09 : neutre — +ecriture directe de valeur dans le DOM, utile aux positions de FLIP continu sans re-rendu / −contourne le framework ; collision avec un style inline gere par le composant / conflits: M4-07
- M1-10 : neutre — +une seule regle de reduction pour FLIP et sorties, depuis un point unique / −un figement ne suffit pas pour le layout : les retours d'etat (focus, selection) doivent subsister / conflits: M4-09 (doublon)

## M3 — scroll, declencheurs, runtime global

- M3-01 : valide — +etat in / out publie sur l'element, lisible par une sortie qui attend un etat / −un observateur par couple marge/seuil : un singleton par document reste fragile entre iles / conflits: M4-06
- M3-02 : conteste — +aucun contenu cache sans JS, principe defendable pour l'hydratation tardive / −un etat « pending » pose au montage cree un saut visible sur une entree de presence (contredit M4-04) / conflits: M4-04
- M3-03 : valide — +sentinelle sans transform pour declencher une entree ou sortie decalee sans se desarmer / −un noeud de plus a produire au SSR ; sentinelle de hauteur nulle peut alterer une grille / conflits: —
- M3-04 : neutre — +inscription par cycle de vie, libere l'observateur au retrait du noeud / −l'element doit etre defini avant la peinture ; une classe Tailwind ne peut pas inscrire / conflits: M3-02 (ordre de definition)
- M3-05 : neutre — +distinction scrub / once nette, hors de mon perimetre / −hors Chromium, `once` repose sur IntersectionObserver / conflits: —
- M3-06 : neutre — +zero listener sur les navigateurs a timeline / −sans JS, l'effet disparait ; aucun repli de layout n'est prevu / conflits: —
- M3-07 : valide — +scroll natif intact : ancres et restauration de position restent valables pour les listes / −un scroll programme en cours de FLIP decale la mesure (voir M2-06, M2-10) / conflits: —
- M3-08 : neutre — +progression en propriete CSS, une passe par frame pour le suivi / −le repli ecrit des styles et recalcule sur grand DOM ; ordre lecture/ecriture a aligner / conflits: M2-02
- M3-09 : valide — +pause hors-vue et onglet cache, reprise sans saut ; un FLIP en vol doit etre recale au retour / −une presence figee hors ecran retarde sa promesse `finished` / conflits: M4-03
- M3-10 : valide — +timelines CSS scopees par ile : une sortie ne resout pas vers le noeud voisin / −une regle de scope de plus par ile ; le mot « scope » designe ici autre chose qu'en M4-10 / conflits: M4-10

## M4 — integration frameworks

- M4-01 : valide — +noyau pur testable en Node : FLIP et presence se testent sans DOM / −le handle `{finished, cancel, dispose}` diverge de M5-08 (pas de `dispose` la-bas) / conflits: M5-08
- M4-02 : valide — +idempotence du demarrage : un FLIP ne se double pas apres un montage StrictMode / −un WeakMap par copie de module casse entre iles / conflits: M4-05 (deja signale)
- M4-03 : valide — +presence : noeud retenu jusqu'a `finished`, regle observable simple ; c'est la sortie defendue ici (absorbe M2-05) / −React doit retenir des enfants hors de la source de verite ; cles et ordre a gerer / conflits: M1-07, M3-09, M4-10
- M4-04 : valide — +pas de saut d'hydratation pour les entrees de presence, etat final dans le HTML / −`@starting-style` absent des vieux Chrome : entree non animee sans repli JS / conflits: M3-02
- M4-05 : valide — +registre partage : resolution des layoutId entre iles et boucle unique, socle de M2-01 / −etat global ; degradation silencieuse si l'avertissement est ignore / conflits: M2-01, M1-07, M5-07 (doublons)
- M4-06 : conteste — +contourne l'auto-desarmement par sentinelle, meme principe que M3-03 / −« un seul IntersectionObserver par page » contredit M3-01 (un par couple marge/seuil) / conflits: M3-01, M3-03 (doublon)
- M4-07 : neutre — +valeurs continues sans re-rendu, compatible avec un FLIP continu / −en React, un store lu pendant le rendu peut produire du tearing ; l'ecriture DOM reste preferable / conflits: M1-09
- M4-08 : valide — +handle de sequence, `finished` resolu sur statut sans rejet au demontage : indispensable aux sorties chorégraphiees / −un handle ne survit pas au remontage ; la sequence est recreee / conflits: M1-05 (doublon)
- M4-09 : valide — +store unique de preference, consomme par chaque adaptateur, y compris le layout / −chaque ile lit matchMedia sans M4-05 ; ne pas supprimer les retours d'etat / conflits: M1-10 (doublon)
- M4-10 : valide — +dispose au demontage et a `astro:before-swap` : FLIP et observateurs nettoyes sans fuite / −un scope par composant coute si nombreux ; ordre dispose / sortie a fixer (voir M2-05) / conflits: M4-03, M2-07 (homonyme)

## M5 — API, DX, outillage

- M5-01 : valide — +les verbes `layout`, `enter`, `exit`, `track` nomment la coordination necessaire / −aucun verbe pour F16 et F17 ; `sequence` porte seul la complexite de F11 / conflits: —
- M5-02 : neutre — +`data-motion` permet entrees et presence dans les iles HTML pur / −grammaire d'attribut a maintenir ; une classe Tailwind ne porte ni portee ni callbacks de presence / conflits: M2-01 (deux attributs pour une identite)
- M5-03 : neutre — +tokens de duree et de ressort partages, emis en CSS / −`linear()` fige a la compilation : pas de vitesse a la reprise (M2-08) ; contredit M1-02 / conflits: M2-08, M1-02
- M5-04 : neutre — +`motion-enter-…` en CSS pur pour les entrees de presence / −sortie vers `display:none` non transitionnee sous Firefox (faits etablis) : la presence reste en JS / conflits: M4-03
- M5-05 : neutre — +chargement par page : pas de chunk layout sur une page sans FLIP / −l'analyse statique rate les `layoutId` construits a l'execution / conflits: —
- M5-06 : neutre — +entree `/layout` separee avec taille publiee (≈21 kB) / −FLIP et presence partagent un cycle de mesure : le scheduler doit vivre dans un chemin commun / conflits: M2-02
- M5-07 : valide — +singleton versionne avec compteur de references : une seule boucle de layout entre iles / −compteur a tenir, fuite si un unmount manque ; deux majeures = deux scans / conflits: M2-01, M1-07, M4-05 (doublons)
- M5-08 : valide — +handle commun ; la reprise lit valeur et vitesse courantes, coeur de M2-08 / −vitesse conservee seulement pour les proprietes numeriques ; `commitStyles` a trancher pour les sorties / conflits: M4-01, M5-03
- M5-09 : valide — +intention `essential` / `decorative` par token : le mouvement decoratif peut etre fige, l'essentiel (retour de focus) garde / −jugement sujet a debat ; deux implementations a garder identiques / conflits: M1-10 (doublon)
- M5-10 : neutre — +manifeste qui decrit les verbes layout et presence pour les agents / −regeneration en CI, derive si non verifiee / conflits: —

## Doublons a fusionner

- Registre `globalThis` / singleton inter-iles (layoutId, boucle, preference) : M2-01, M1-07, M4-05, M5-07. Garder **M5-07** (contrat versionne avec compteur) ; M2-01 (resolution layoutId), M1-07 (noeud retenu) et M4-05 (degradation de version) deviennent des extensions de ce registre.
- Boucle lecture/ecriture : M1-04 ≡ M2-02. Garder **M1-04**.
- FLIP en transform : M1-06 ≡ M2-03. Garder **M2-03** (correction d'enfants), en reprenant l'API `measure()` de M1-06.
- Handle d'animation et de sequence : M4-01, M5-08, M4-08, M1-05. Garder **M5-08** comme contrat (play, pause, reverse, seek, cancel, finished) ; M4-08 reste la regle de statut ; M1-05 devient une implementation ; aligner M4-01 sur `cancel` (pas `dispose`).
- Presence / sortie : M2-05 ≡ M4-03. Garder **M4-03** (contrat par framework).
- Sentinelle de vue : M3-03 ≡ M4-06 (la regle d'auto-desarmement est la meme). Garder **M3-03** ; M4-06 perd sa clause « un observateur par page », incompatible avec M3-01.
- Reduction de mouvement : M1-10 ≡ M4-09, avec M5-09 comme champ `intent`. Garder **M4-09** (store) ; M5-09 fournit le champ `intent`.
- Ressort en `linear()` : M1-02 et M5-03 se contredisent (compilation a l'execution contre au build). A trancher ; mon avis : **M5-03** au build, M1-02 seulement en repli.

Chevauchements a trancher, non fusionnes : M1-09 / M4-07 (ecriture DOM contre valeur reactive pour F14) ; M2-07 / M4-10 / M3-10 (le mot « scope » designe trois objets differents, a renommer).
