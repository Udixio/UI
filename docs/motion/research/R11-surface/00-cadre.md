# R11 — Registre de choix : la surface d'écriture de @udixio/motion

Suite directe de R10 (`docs/motion/research/R10-choix/`). Même méthode, mêmes
experts M1–M5, même cadre général (`R10-choix/00-cadre.md` : projet, 24
familles, distinction global / instance, préférences contestables).

## Acquis (validés par le porteur, ne pas remettre en cause)

Les 5 fondations du moteur issues de R10 :

1. M5-07 — runtime global unique par page, partagé entre îles (`globalThis`,
   `Symbol.for('udixio.motion@1')`, compteur de références).
2. M4-03 — présence : le nœud reste (`inert`, `aria-hidden`) jusqu'à
   `finished` ; `animate.leave` / `out:` quand ils suffisent ; hook en React.
3. M1-04 — une seule frame rAF, phases lecture puis écriture.
4. M5-08 — handle unique (`play/pause/reverse/seek/cancel/finished`), reprise
   par valeur et vitesse courantes.
5. M1-01 — moteur choisi par animation, natif d'abord, anime.js à la demande.

## Question de ce tour : la surface d'écriture

Comment un auteur (humain ou agent IA) **écrit** une animation, dans chaque
environnement (HTML/Astro, React, Angular, Svelte, composants Udixio internes),
pour les 24 familles. Cela inclut au minimum :

- le **vocabulaire** (verbes, intentions, options, noms) et son nombre ;
- la **place de Tailwind** (classes, variants, plugin, valeurs arbitraires) ;
- les **attributs HTML** vs classes vs objets typés ;
- la **définition** des animations (inline, config nommée TS, tokens, CSS) ;
- la **forme par framework** (composant, hook, directive, attachment, action) ;
- la **vérification** (typage, build, lint, runtime dev) ;
- les **tokens** de mouvement (M3, designer) ;
- comment la surface s'appuie sur les 5 acquis (déclaration auprès du runtime
  global, handle, présence) ;
- les deux tensions laissées par R10 : (a) reprise par vitesse vs WAAPI qui ne
  la transporte pas ; (b) boucle unique enregistrée dans le runtime global ;
- les familles sous-représentées en R10 : F6, F9, F14, F15, F16, F17, F18,
  F19, F22, F23.

Débats d'entrée (PAS des conclusions) : `R8-api-debat/R8-synthese.md`,
`R9-tournoi/J2-finale-solution.md` et `J4-finale-solution.md`, et les choix R10
mal classés sur la syntaxe (M5-01 vocabulaire fermé 4,8 ; M5-04 plugin Tailwind
CSS-first 5,4 ; M5-02 trois syntaxes équivalentes). Comprendre pourquoi ils ont
été mal notés fait partie du travail.

## Format et règles

Identique à R10, avec des identifiants préfixés `S` : `M1-S01`, `M2-S01`…
Fichiers dans `docs/motion/research/R11-surface/`. Chacun n'écrit que ses
fichiers, aucune commande git, recherche web seulement pour vérifier un fait
précis.
