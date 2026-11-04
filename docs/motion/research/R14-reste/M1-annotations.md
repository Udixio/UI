# M1 — Annotations des choix M2 à M5 (R14)

Légende : valide (je retiens tel quel), conteste (désaccord argumenté), neutre (descriptif ou mineur). Mes propres choix M1-R01 à M1-R10 sont cités quand ils se recouvrent ; ils sont absorbés dans les groupes de doublons ci-dessous.

## M2 (gestes, listes, chorégraphie, usage interne)

- M2-R01 : valide — +pas de huitième verbe, définition nommée, s'appuie sur defineValue / −écriture de valeur à chaque frame ; conflits: M1-R03, M4-R08, M5-R07 ; cohérence: exception: source sans verbe, à consigner au manifeste
- M2-R02 : valide — +reprise sans à-coup, handle expose velocity.source et les événements grab/drag/release/settle / −carry impose anime.js (pas d'équivalent WAAPI), `velocityStack` absent des faits vérifiés (à vérifier) ; conflits: M3-R09 (deux sources de vitesse), M1-R03 ; cohérence: exception: un geste force anime.js, déclarée
- M2-R03 : valide — +WCAG 2.5.7, 2.1.1 et 2.5.1 couverts, champ `alternative` typé, Motion Reorder n'a pas de clavier (vérifié) / −chemin Espace / flèches à tester ; conflits: M5-R08 (flèches Haut / Bas, autre schéma), M4-R08 (clavier hors runtime) ; cohérence: exception: `essential`, consignée
- M2-R04 : valide — +ordre traité comme donnée, séparé de l'affichage (`commit`), seuil de vitesse sans remplacer la position (checkReorder vérifié) / −`commit="live"` modifie le DOM pendant le geste (focus, sélection) ; conflits: — ; cohérence: ok (`commit` nouveauté justifiée)
- M2-R05 : conteste — +même syntaxe TS et HTML, un handle, propagation par le DOM / −`at` accepte `'+=0.1'` (nombre nu, contraire au token de M5-R05 et à R12) ; conflits: M1-R01, M4-R07, M5-R05 ; cohérence: exception: `data-motion-sequence` et `data-motion-step`, à aligner sur M5-R06
- M2-R06 : valide — +rang visuel mesuré, plafond testable, sibling-index n'est pas la source / −mesure d'un rang par liste, RTL à trancher ; conflits: M1-R02 (je cède), M4-R07 ; cohérence: ok (token de plafond justifié)
- M2-R07 : valide — +une seule surface à tester, retrait des types Motion publics (E1) / −migration progressive, breaking D2 ; conflits: — ; cohérence: exception: props `transition` supprimées, à consigner au journal D2
- M2-R08 : conteste — +texte HTML intact sans JS, reflow géré pour `lines` / −aria-label sur un conteneur sans rôle n'est pas fiable ; « brouillage hors v1 » contredit M4-R04 ; conflits: M3-R10, M4-R03, M4-R04, M5-R10 ; cohérence: exception: aria-label écrit par le runtime, à inscrire au manifeste
- M2-R09 : valide — +invalidation par ResizeObserver, pas de layout au changement de breakpoint, tokens Tailwind / −geste actif pendant un changement de palier à régler ; conflits: M3-R06 ; cohérence: ok
- M2-R10 : conteste — +aucun geste ne charge anime Draggable, une copie par page / −`pointerenter` absent au tactile ; déclencheur concurrent de l'idle de M3-R04 ; conflits: M3-R04, M1-R09 ; cohérence: exception: chargement à l'intention, déclarée

## M3 (runtime, observateurs, valeurs, performance)

- M3-R01 : valide — +zéro re-rendu, même chemin pour curseur, parallaxe et compteur, transform reste compositeur / −variable posée sur la racine invalide les descendants (écrire sur les cibles) ; nommage `--udx-<nom>` contre `--udx-value-<nom>` (M1-R07) ; conflits: M4-R05, M5-R09, M1-R07 ; cohérence: exception: `data-motion-value`, nouvel attribut justifié
- M3-R02 : valide — +valeur finale lisible sans JS, durée en ms comme les tokens / −état initial à mesurer avant démarrage ; conflits: M4-R06 ; cohérence: ok
- M3-R03 : valide — +un IntersectionObserver par page, raison de pause exposée par inspect() / −une entrée qui pousse l'élément hors écran se bloque (fait établi) ; conflits: M1-R09 (pause, doublon) ; cohérence: exception: `reveal` avec `once` se désabonne, déclarée
- M3-R04 : valide — +une copie d'anime par page, préchargement par verbe, `modulepreload` seulement pour les verbes présents / −HTML pur sans build sans `modulepreload`, délai idle à fixer ; conflits: M2-R10 (déclencheur), M1-R09, M4-R10 ; cohérence: ok (cache par majeure justifié par M5-07)
- M3-R05 : valide — +scope = registre, élagage des déconnectés, un seul point de nettoyage / −élagage tardif si l'onglet est caché ; registre WAAPI et observateurs à vérifier en S1 ; conflits: M1-R08 (doublon) ; cohérence: ok
- M3-R06 : valide — +paliers lus dans le thème, identiques à Tailwind, reconstruction au seul changement de palier / −valeur figée dans un keyframe WAAPI, position perdue sans `carry` ; conflits: M2-R09, M1-R08 ; cohérence: exception: palier de conteneur hors Tailwind, déclarée
- M3-R07 : valide — +une source CSS et JS, aucun appel par composant, couvre les transitions non gardées / −`calc(scale × durée)` ne couvre pas les ressorts JS ni Lenis ; conflits: R10 M1-10 (résolution à la compilation), à concilier ; cohérence: ok
- M3-R08 : valide — +budget de propriétés visible, tracé SVG natif sans JS, renvoi à la recette / −`allow-paint` est une échappatoire, seuil provisoire ; conflits: M4-R09 (complémentaire, pas un doublon) ; cohérence: exception: spinner circulaire via `allow-paint`, déclarée
- M3-R09 : valide — +vitesse mesurée côté pointeur, indépendante du moteur, un écouteur par racine / −`getCoalescedEvents` Safari 18.2+ selon une source secondaire ; la règle WCAG citée pour le clavier est 2.1.1, pas 2.5.7 ; conflits: M2-R02 (source de vitesse), M1-R03, M4-R08 ; cohérence: exception: clavier = action, déclarée
- M3-R10 : valide — +pas de découpage faux après chargement des polices, lignes recalculées seulement si la largeur change le nombre de lignes / −`fonts.onloadingdone` non couvert par `fonts.ready` ; seuil de mots à fixer ; conflits: M2-R08, M4-R03, M5-R10 ; cohérence: exception: découpage ponctuel sans abonné, déclarée

## M4 (usage interne, texte, SSR, valeurs, gestes, SVG)

- M4-R01 : valide — +les composants sont le premier utilisateur de la surface, lint sur les `exports` / −chaque `udx-*` devient une API publique à maintenir ; conflits: M1-R10, M2-R07 (doublons) ; cohérence: ok
- M4-R02 : valide — +une prop, une unité, parité avec la nav rail, dépendance dure à Motion retirée des `.d.ts` / −rupture de toutes les liaisons, `apps/doc` non typée (balayage requis) ; conflits: M5-R02 (noms de ressorts `spring-expressive` contre `spring.spatial.fast`), M2-R07 ; cohérence: ok (prop `motion` justifiée)
- M4-R03 : conteste — +SSR et sans JS voient le texte, pas de nœud intrus pour les lignes (vérifié dans dist anime) / −la pré-découpe par build en HTML contredit M2-R08 et M3-R10 ; `data-motion-line` ne correspond pas aux segments de M2-R08 ; conflits: M2-R08, M3-R10, M5-R10, M1-R04 ; cohérence: exception: pré-découpe par build, à arbitrer
- M4-R04 : conteste — +zéro re-rendu pendant le brouillage, un lecteur ne lit pas vingt états par seconde / −`textContent` efface une sélection ; contredit « brouillage hors v1 » de M2-R08 ; conflits: M2-R08 ; cohérence: ok
- M4-R05 : valide — +deux canaux (CSS pour le continu, store pour le discret), même nom dans les cinq formes / −variable sur la racine invalide les descendants, snapshot quantifié exigé par React ; conflits: M3-R01, M5-R09, M1-R07 ; cohérence: ok
- M4-R06 : valide — +SSR donne la valeur finale, `<data>` porte la valeur machine, hydratation sans divergence / −locale identique exigée côté serveur et client ; conflits: M3-R02 (doublon) ; cohérence: ok
- M4-R07 : conteste — +même ordre sous React, Angular et Svelte grâce au rang DOM / −le rang DOM diverge du rang visuel (aveu de l'auteur), contraire à M2-R06 ; conflits: M2-R06, M5-R05, M1-R01 ; cohérence: ok
- M4-R08 : conteste — +vitesse exacte au relâchement, aucun re-rendu pendant le glissement / −« le runtime ne gère pas les flèches » contredit M2-R03 (alternative dans le geste) ; conflits: M2-R01, M2-R03, M5-R08, M3-R09 ; cohérence: ok (`data-motion-gesture` à consigner)
- M4-R09 : valide — +`pathLength` est un attribut SVG standard (corrige E1), seul le morphing charge anime / −« morphTo exige le même nombre de points » est à vérifier (M1-R05 suppose un rééchantillonnage) ; `d` écrasé par un rendu framework à vérifier ; conflits: M1-R05 (doublon), M3-R08 ; cohérence: ok
- M4-R10 : valide — +import sans effet de bord (Astro, Angular SSR, SvelteKit), StrictMode géré, cleanup dans les cinq formes / −`import()` retarde le premier frame, à précharger ; conflits: M3-R04, M1-R09 ; cohérence: ok

## M5 (tokens, outillage, séquences, gestes, texte)

- M5-R01 : conteste — +une source TS, trois émissions, migration nommée depuis `--anim-*` / −les alias `--duration-*` et `--ease-*` en `@theme` écrasent l'échelle native de Tailwind (`duration-150`…) ; M1-R06 propose `duration-udx-*` ; conflits: M5-S04 (`--animate-*`), M1-R06 ; cohérence: exception: alias Tailwind à retirer
- M5-R02 : valide — +ressort source, repli dérivé au build pour `carry` et les navigateurs sans `linear()` / −la courbe `0.2,0,0,1` est appelée « legacy » alors que c'est la courbe standard M3 ; valeurs à recouper ; conflits: M4-R02 (nommage des ressorts), M1-R06 (doublon) ; cohérence: ok
- M5-R03 : valide — +un contrat unique pour agents et humains, Motion publie `llms.txt` (R2) / −manifeste à tenir à jour, `llms.txt` grossit avec les fiches ; conflits: M5-R04 (complémentaire) ; cohérence: ok
- M5-R04 : valide — +l'agent valide avant d'écrire, codes d'erreur communs build, runtime et MCP / −une définition construite à l'exécution échappe à la validation ; conflits: M5-R03 ; cohérence: ok
- M5-R05 : valide — +`after` inconnu = erreur de type, décalage en token, handle unique / −séquences longues difficiles à relire ; conflits: M1-R01, M2-R05, M4-R07 (doublons) ; cohérence: ok
- M5-R06 : valide — +même graphe dans les cinq formes, `data-motion-step` filtrable par `attributeFilter` / −HTML dépend d'une définition chargée ; directive Angular `udxSequence` à aligner sur `udxMotion` (S07) ; conflits: M2-R05 ; cohérence: ok
- M5-R07 : valide — +primitive `gesture` sans nouveau verbe, vitesse explicite (S08) / −inertie calculée par frame, `velocity.source` souvent `estimated` au tactile ; conflits: M2-R01 (doublon) ; cohérence: exception: primitive hors vocabulaire (V08), déclarée
- M5-R08 : conteste — +garde-fou au build, présence de l'alternative vérifiée par les niveaux S10 / −schéma `ArrowUp` / `ArrowDown` sur le handle incompatible avec l'espace de M2-R03 ; deux schémas à ne pas garder ; conflits: M2-R03, M4-R08 ; cohérence: ok
- M5-R09 : valide — +même nom pour curseur, parallaxe et compteur, aucun re-rendu / −`source: 'pointer.x'` ne correspond pas à `source: 'pointer', axis: 'x'` (M3-R01) ; conflits: M3-R01, M4-R05 (doublons) ; cohérence: ok
- M5-R10 : conteste — +une seule fonction pour les cinq formes, SSR sert le texte source / −`aria-label` sur le conteneur, même défaut que M2-R08 ; `letters` ici contre `chars` ailleurs ; conflits: M2-R08, M3-R10, M4-R03 ; cohérence: ok

## Doublons à fusionner (groupe : id à garder ; ids absorbés)

- Séquence : garder M5-R05 (définition) et M5-R06 (formes) ; absorbent M1-R01, M2-R05, M4-R07
- Cascade par rang : garder M2-R06 ; absorbent M1-R02 (chemin CSS seulement si ordre DOM = ordre visuel) et M4-R07 (rang DOM rejeté)
- Tokens : garder M5-R02 (ressort source) et M5-R01 (émission, alias Tailwind corrigé) ; absorbe M1-R06
- Geste déclaré : garder M2-R01 ; absorbent M1-R03 (partie geste), M4-R08, M5-R07
- Vitesse : garder M3-R09 (échantillonnage pointeur) ; absorbent M1-R03 (fenêtre de 100 ms) et la partie vitesse de M2-R02 (M2-R02 garde ressort et événements)
- Alternative clavier : garder M2-R03 ; absorbent M5-R08, la partie boutons de M4-R08 et M1-R03 (partie alternative)
- Découpage de texte : garder M2-R08 (aria corrigée : texte source en `sr-only`, fragments en `aria-hidden`) ; absorbent M3-R10, M5-R10, M4-R03 et M1-R04 ; le brouillage (M4-R04) reste à arbitrer avec M2-R08
- Valeurs réactives : garder M3-R01 ; absorbent M4-R05, M5-R09 et M1-R07 (nommage `--udx-<nom>` à trancher)
- Compteur : garder M4-R06 ; absorbe M3-R02 (format `Intl.NumberFormat`)
- Chargement : garder M3-R04 ; absorbent M1-R09 (partie chargement), M4-R10 (partie import) ; le déclencheur de M2-R10 reste à arbitrer
- Pause et visibilité : garder M3-R03 ; absorbe M1-R09 (partie pause)
- Scope : garder M3-R05 ; absorbe M1-R08 (partie scope)
- Responsive : garder M3-R06 ; absorbent M1-R08 (partie palier) et M2-R09 (règle d'invalidation conservée)
- Usage interne : garder M4-R01 ; absorbent M1-R10 et M2-R07 (détails des contrôleurs en annexe)
- Non doublons, à garder distincts : M3-R08 et M4-R09 (budget contre pratique SVG), M5-R03 et M5-R04 (manifeste contre outils), M4-R02 (API de prop)
