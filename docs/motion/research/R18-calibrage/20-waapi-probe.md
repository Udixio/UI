# Spike : sondage du timing WAAPI

**Statut : expérimentation locale, pas une implémentation ni une garantie générale de compatibilité.** Ce document complète [19-timing-routing.md](19-timing-routing.md).

## Décision proposée

Utiliser le constructeur `KeyframeEffect` de `target.ownerDocument.defaultView`, sur un élément HTML créé par ce document et laissé détaché. Construire un effet avec des keyframes fixes `[{ opacity: 0 }, { opacity: 1 }]`, une durée fixe positive et la chaîne `easing` exacte. Ne pas créer d'`Animation` ni appeler `animate` pour la sonde. Lire `effect.getTiming().easing` pour le diagnostic de normalisation, sans imposer son égalité textuelle à l'entrée : une sérialisation différente peut représenter le même timing. L'effet devient inaccessible après la sonde ; aucun `cancel()` n'est nécessaire puisqu'aucune animation n'a été créée.

Avant de qualifier un refus de syntaxe, vérifier dans le même contexte qu'un effet témoin avec `easing: 'linear'` est constructible et que `getTiming` fonctionne. Isoler ensuite l'appel du constructeur candidat de la lecture de `getTiming`. Après témoin positif, seule une `TypeError` provenant **du constructeur candidat** donne **syntaxe refusée par cette sonde**. Vérifier son identité avec `error instanceof view.TypeError` dans le realm de la vue, uniquement si ce constructeur est disponible et fiable ; sinon classer l'erreur **inconnue**. Une exception de `getTiming`, y compris une `TypeError`, donne toujours **inconnu**. Toute autre exception, échec du témoin, absence de document, vue, constructeur ou méthode, ou contexte inaccessible donne **inconnu**, avec diagnostic. Vérifier séparément que `target.animate` existe : son absence donne aussi inconnu pour ce backend. Ce classement n'identifie pas nécessairement la cause interne d'une `TypeError` : la création réelle reste autoritaire et son erreur doit remonter.

L’implémentation expérimentale capture le constructeur `KeyframeEffect` une seule fois avant le témoin. Pour identifier une `TypeError` du realm, elle applique une heuristique conservatrice : nom `TypeError`, absence de propriété `Symbol.hasInstance` propre et représentation native de la fonction. Ces indices ne prouvent pas l’authenticité d’un realm modifié ou hostile ; une représentation native différente peut aussi conduire à **inconnu**, même pour une véritable `TypeError`.

Un candidat construit puis relu donne **syntaxe acceptée**, pas une preuve de support sémantique : une normalisation ou substitution silencieuse reste possible. Le résultat à trois états ci-dessus est un constat de parseur, et ne suffit pas à affirmer le booléen de support sémantique requis par le routage. Une politique explicite doit établir les représentations et moteurs pour lesquels ce constat constitue une preuve suffisante, par des essais de conformité indépendants ; sinon le support reste inconnu et la sélection est différée ou échoue explicitement.

En SSR et pour un document sans vue, ne pas sonder ni choisir de paire ; conserver la référence et résoudre après hydratation. Si l'option prioritaire est inconnue, ne pas déduire que le fallback est le meilleur choix. Ne pas toucher au DOM au chargement du module. Refaire la sélection si document ou cible change. Tout cache éventuel doit être borné, lié à la vue et à la chaîne exacte, et ne pas masquer les changements d'environnement ; commencer sans cache.

Le constructeur teste ici le timing d'effet WAAPI, comme l'option de timing passée à `target.animate`, mais n'établit pas que l'appel réel réussira sur cette cible, ces frames ou ce document ; il ne démontre pas non plus une interpolation correcte pour toutes les valeurs et tous les moteurs. Conserver les gardes du provider et propager son erreur, sans bascule silencieuse. La lecture de `getTiming()` révèle la sérialisation retournée, pas la preuve d'une équivalence sémantique après normalisation ; une substitution silencieuse ne peut donc pas être généralement exclue par ce seul test. Si une garantie sémantique est nécessaire, ajouter des mesures indépendantes de progression, et classer comme inconnu toute normalisation non vérifiable selon une politique explicite.

## Résultats observés le 7 novembre 2026

Playwright en mode headless, Google Chrome **156.0.8078.47** et Firefox Playwright **157.0**, sur Linux. La cible et la sonde appartenaient à une iframe même origine, avec un constructeur différent de celui du document parent. Le `linear()` testé était le premier easing généré dans `packages/motion/src/spring-data.generated.ts`, avec ses stops complets ; ce n'est pas une campagne sur les douze paires.

| Entrée | Chrome | Firefox |
|---|---|---|
| `linear()` généré | accepté, sérialisation identique | accepté, sérialisation identique |
| `cubic-bezier(0.2, 0, 0, 1)` | accepté, sérialisation identique | accepté, sérialisation identique |
| `linear(0, nope)` | `TypeError` | `TypeError` |
| `cubic-bezier(2, 0, 0, 1)` | `TypeError` | `TypeError` |
| `bogus` | `TypeError` | `TypeError` |
| `linear` | accepté | accepté |

`document.getAnimations()` de l'iframe reste à zéro avant et après chaque construction, y compris les erreurs. Un essai distinct a associé le `KeyframeEffect` détaché à une `Animation`, l'a mise en pause à 50 % et a lu une progression de 0,944007275 sous Chrome et 0,944007277 sous Firefox ; puis `cancel()` a laissé le compte du document à zéro. Ce résultat ponctuel montre une progression non linéaire, pas une validation de calibration ni une preuve de nettoyage mémoire.

Enfin, sur une cible **connectée** dans l'iframe, une animation réelle `element.animate` cubic a fait passer les comptes document/cible de 0/0 à 1/1 et l'opacité calculée de 1 à 0,877834 à mi-durée ; après `cancel()`, les comptes sont revenus à 0/0 et l'opacité à 1 dans les deux moteurs. La promesse `finished` rejetée après annulation a été interceptée (`AbortError`). Cette dernière expérience explique pourquoi démarrer une animation réelle est moins approprié pour une sonde : elle affecte temporairement la cible et impose un nettoyage explicite. Le décompte d'animations et le retour de style ne prouvent pas l'absence absolue de fuite mémoire.

`document.getAnimations()` peut aussi inclure des animations CSS (`CSSAnimation` et transitions) : les comptes observés ici correspondent à un document initialement vide et ne permettent pas de conclure en présence d'autres animations. Dans les tests futurs, comparer les identités et ensembles avant/après, et préserver les animations préexistantes. Une sonde WAAPI positive ne prouve pas le support CSS, ni inversement. L'iframe testée était même origine ; un accès inter-origine ou un contexte inaccessible doit rester inconnu sans tentative de contourner cette limite.

## Matrice de validation restante

| Situation | Attendu à vérifier | Statut |
|---|---|---|
| SSR sans DOM, document sans vue, API ou constructeur absents | inconnu, aucun accès ou effet de bord | non exécuté |
| Témoin en échec ; constructeur candidat levant une exception autre que `view.TypeError` ou identité impossible à vérifier | inconnu | non exécuté |
| `getTiming` candidat levant une exception, y compris `TypeError` | inconnu ; jamais refus syntaxique | non exécuté |
| Normalisation ou substitution simulée | syntaxe acceptée distincte du support sémantique inconnu | non exécuté |
| Cible et document changés, iframe même origine | sonder dans le nouveau realm ; appel effectif du provider et nettoyage | sonde et animation directe seulement, sans provider |
| Document avec CSSAnimation et animations WAAPI préexistantes | aucune nouvelle animation ni modification des animations existantes | non exécuté |
| Iframe inter-origine ou vue inaccessible | inconnu sans accès interdit | non exécuté |
| Tous les ressorts, schémas et courbes acceptés | comparer plusieurs points et durées à une référence indépendante | non exécuté |
| Échec réel du provider après sonde positive, annulation, fin et politique réduite | propager l'erreur, vérifier styles, comptes et absence de bascule implicite | non exécuté |
| Safari, anciennes versions et environnements sous charge | documenter les résultats par version | non exécuté |

Les observations Chrome et Firefox sont limitées aux essais décrits ci-dessus. Le retour à zéro des comptes et la restauration du style ne prouvent pas une absence de fuite mémoire ; celle-ci exige une investigation dédiée. Le protocole complet figure dans le document précédent.
