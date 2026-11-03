# R5 — Licences et coûts des moteurs candidats pour `@udixio/motion`

> Travail R5 du §7 de la spec `docs/superpowers/specs/2026-11-03-udixio-motion-design.md`.
> Alimente la décision **D3** (GSAP comme provider futur). **Ce document ne
> prend aucune décision.**
>
> Rédigé le 2026-11-03. L'auteur n'est pas juriste. Les points marqués
> **⚖️ avis juridique** sont des questions d'interprétation qu'un juriste
> devrait trancher avant de s'y fier.

## 0. Point de départ : sous quelle licence Udixio est distribué

- `LICENSE` à la racine : **Apache License 2.0**. `package.json` racine : `"license": "Apache-2.0"`.
- `packages/ui-svelte` : `Apache-2.0`. `packages/mcp` : **`MIT`**.
- `packages/core`, `theme`, `tailwind`, `ui-react` et `ui-angular` n'ont pas de champ
  `license` dans leur `package.json`. Sur npm, ils sont donc publiés sans
  licence déclarée, même si le `LICENSE` racine s'applique au dépôt. À
  harmoniser, indépendamment de R5.

Conséquence pour ce rapport : la consigne parle d'une « lib MIT », mais Udixio
est en fait **Apache-2.0**, sauf `@udixio/mcp` qui est en MIT. L'analyse
couvre les deux cas. Pour les moteurs étudiés, les conclusions de
compatibilité ne changent pas : MIT et Apache-2.0 sont toutes deux
permissives, OSI, et intègrent sans difficulté du code MIT ou Apache-2.0.

Ce qui existe déjà dans le dépôt :
- `@udixio/core` a `animejs ^4.5.0` et `motion ^12.23.0` en `dependencies`.
- `@udixio/ui-react` a `lenis`, `motion` et `animejs`.
- `@udixio/ui-angular` a `motion`.

## 1. Tableau de synthèse

| Moteur / paquet | Version npm (03/11/2026) | Licence | OSI ? | Dépendance dure | Peer | Optionnelle | Obligations pour les utilisateurs finaux | Risques principaux |
|---|---|---|---|---|---|---|---|---|
| **anime.js** (`animejs`) | 4.5.0 | MIT (© 2025 Julian Garnier) | Oui | Oui | Oui | Oui | Conserver la notice de copyright si le code est embarqué dans un bundle | Projet d'un seul mainteneur, financé par des sponsors (bus factor). Licence stable. |
| **GSAP** (`gsap`) | 3.15.0 | « Standard No Charge » GSAP License (Webflow), propriétaire et gratuite | **Non** | Possible mais ⚖️ | Oui (sans redistribuer) ⚖️ | Oui ⚖️ | Chaque utilisateur qui installe GSAP est lié **directement** par la licence Webflow, y compris l'interdiction des outils visuels concurrents | Restriction de domaine d'usage, résiliation à la discrétion de Webflow, révision unilatérale (pour les versions futures), pas de clause de droit applicable |
| **Motion** (`motion`, `framer-motion`) | 14.9.0 | MIT (© 2024 Motion B.V.) | Oui | Oui | Oui | Oui | Notice de copyright | Faibles. Certaines fonctions sont réservées à Motion+ (payant). |
| **Motion+** (`motion-plus`, `motion-plus-dom`, `motion-plus-react`) | 1.5.x | Fichier `LICENSE` **MIT** dans les paquets npm publics, alors que le produit est présenté comme « exclusif aux membres » (399 USD une fois par développeur, abonnement annuel pour les équipes). « Builder's Licence » à négocier si on « revend » ses fonctions. | Le texte MIT l'est. Le statut réel est ambigu. ⚖️ | ⚖️ déconseillé sans accord écrit | ⚖️ | ⚖️ | Si Udixio en dépend, chaque utilisateur dépend d'un produit commercial | Contradiction entre le fichier MIT et le discours commercial. « Builder's Licence » probablement exigée pour une lib qui expose ces fonctions. |
| **scroll-timeline-polyfill** (flackr/scroll-timeline) | 1.1.0 | Apache-2.0 | Oui | Oui | Oui | Oui (import à la demande) | Conserver `LICENSE`. Signaler les modifications si le code est forké. Pas de fichier `NOTICE` dans le paquet. | Maintenance : dernière release npm le 15/05/2024, dernier push le 26/08/2024. Limites connues sur les feuilles de style cross-origin. |
| **Lenis** (`lenis`) | 1.3.27 | MIT (darkroomengineering) | Oui | Oui | Oui | Oui | Notice de copyright | Faibles. Projet actif (push le 29/10/2026). |

« Dépendance dure / peer / optionnelle » indique s'il est possible, au regard de
la licence, d'en faire ce type de dépendance pour une lib Apache-2.0 ou MIT.
Ce n'est pas une recommandation.

## 2. Tailles (min + gzip)

Méthode principale : bundle ESM navigateur avec **esbuild 0.28.2**
(`--bundle --minify --format=esm`), puis `gzip -9`. Mesures du 03/11/2026,
dans un dossier jetable, sur les versions du tableau. Les chiffres
Bundlephobia (paquet entier, sans tree-shaking) et les chiffres officiels
sont donnés à titre de comparaison. Les écarts avec les chiffres officiels
viennent de l'outil et du niveau de compression. Les budgets réels seront
fixés par I3 (`size-limit`).

| Import mesuré | min | min+gzip |
|---|---|---|
| anime.js `animate` | 32,4 kB | **12,7 kB** |
| anime.js `animate` + `createTimeline` + `stagger` | 39,3 kB | 15,5 kB |
| anime.js `waapi` (`waapi.animate`) | 11,0 kB | **4,8 kB** |
| anime.js `onScroll` + `animate` | 45,7 kB | 17,1 kB |
| anime.js `createLayout` | 61,4 kB | 21,5 kB |
| anime.js `createDraggable` | 58,6 kB | 20,2 kB |
| anime.js `spring` seul | 4,2 kB | 1,7 kB |
| anime.js `splitText` seul | 8,6 kB | 3,7 kB |
| anime.js complet (`import *`) | 123,0 kB | 42,9 kB (Bundlephobia : 40,5 kB) |
| GSAP core (`gsap`) | 70,7 kB | **27,5 kB** (Bundlephobia : 27,4 kB) |
| GSAP + ScrollTrigger | 115,2 kB | 45,1 kB |
| GSAP + Flip | 95,9 kB | 36,3 kB |
| GSAP + SplitText | 78,1 kB | 30,6 kB |
| Motion `animate` hybride (`motion`) | 69,3 kB | **25,2 kB** (doc officielle : 22 kB) |
| Motion `animate` mini (`motion/mini`, WAAPI) | 8,3 kB | **3,3 kB** (doc officielle : 3,2 kB) |
| Motion `scroll` | 8,8 kB | 3,9 kB |
| Motion `inView` | 0,8 kB | 0,5 kB |
| Motion pour React (`framer-motion`, paquet entier) | 216 kB | 73,9 kB (Bundlephobia, sans tree-shaking) |
| Motion+ `motion-plus-dom` (point d'entrée) | 3,2 kB | 1,5 kB (Bundlephobia) |
| Lenis | 18,7 kB | **5,4 kB** |
| scroll-timeline-polyfill | 59,2 kB | **17,1 kB** (Bundlephobia ne sait pas le mesurer : pas de point d'entrée déclaré) |

Ces chiffres sont des coûts en octets, pas des coûts financiers : les
paquets sont tous gratuits, sauf Motion+.

## 3. Détails par moteur

### 3.1 anime.js v4

- **Licence** : MIT, « Copyright (c) 2025 Julian Garnier ». Vérifié dans
  `LICENSE.md` sur `juliangarnier/anime` (branche `master`), via l'API GitHub
  (`spdx_id: MIT`) et dans le champ `license` du paquet npm 4.5.0.
- **Restrictions** : aucune, au-delà du maintien de la notice de copyright et
  de licence dans « toutes les copies ou parties substantielles ».
- **Financement** : le README indique « Anime.js is 100% free and is only made
  possible with the help of our sponsors ». Le projet est financé par GitHub
  Sponsors (paliers Platinum et Silver). Aucune offre payante ni double
  licence n'a été trouvée.
- **En dépendance d'une lib Apache-2.0 ou MIT** : dure, peer ou optionnelle,
  sans contrainte juridique. Si Udixio **embarque** du code anime.js dans ses
  `dist`, il faut reproduire la notice MIT. Pour une simple dépendance npm, la
  notice voyage avec le paquet.
- **Obligations pour les utilisateurs** : aucune, sauf conserver la notice
  dans leurs bundles. En pratique, les bundlers gardent les commentaires
  `@license` s'ils sont configurés pour le faire.
- **Risques** : un seul mainteneur principal, financé par des dons. Un projet
  sous MIT ne peut pas être « repris » rétroactivement : les versions déjà
  publiées restent MIT. Les versions futures pourraient changer de licence,
  mais rien ne l'indique aujourd'hui.

### 3.2 GSAP (Webflow)

**Contexte** : Webflow a racheté GreenSock fin 2024. Depuis le 30/04/2025, tout
GSAP est gratuit, y compris les plugins autrefois réservés aux membres
(SplitText, MorphSVG, ScrollSmoother, Inertia…), sous une licence unique : la
« Standard No Charge GSAP License ».
Le paquet npm ne contient **pas** de fichier `LICENSE`. La licence est
désignée par le champ `license` du `package.json` (« Standard 'no charge'
license: https://gsap.com/standard-license ») et par l'en-tête des sources :
`@license Copyright 2008-2026, GreenSock. All rights reserved. Subject to the
terms at https://gsap.com/standard-license`.

**Texte en vigueur** (effective date 30/04/2025, dernière modification
30/05/2025) :

- **Grant** : « Webflow grants you a non-exclusive, worldwide license to use,
  reproduce, display, and implement GSAP Products » uniquement pour les
  *Permitted Uses*.
- **Permitted Uses** : « the implementation and/or use of GSAP Products on any
  website, web application, or digital interface ».
- **Prohibited Uses** : « any implementation and/or use of GSAP Products in
  tools that allow users to build visual animations without code » qui
  « encourages, induces, or materially assists in creating a solution that
  competes with Webflow's visual animation building capabilities ».
- **Competitive Products** : « any software, tool, or service that enables
  users to create, edit, or manage animations through a visual interface »
  comparable à Webflow.
- **Restrictions** (liste complète) :
  1. « Use any GSAP Products for any Prohibited Uses without prior written consent »
  2. « Reverse engineer any GSAP Products for the purpose of creating Competitive Products »
  3. « Remove or alter any proprietary notices or branding from GSAP Products »
- **Propriété** : tous les droits restent « the exclusive property of Webflow ».
- **Résiliation** : « Webflow may terminate this GSAP License and revoke your
  access in its discretion » en cas de non-respect. Ensuite, il faut « cease
  all use of GSAP Products and destroy all copies ».
- **Modification** : Webflow peut modifier la licence « at any time by posting
  the revised terms ». Qui refuse la révision ne peut pas utiliser les
  versions publiées après sa date d'effet, mais garde les versions antérieures
  aux conditions d'origine. Une mise à jour ne doit pas entraîner de
  « material degradation » de la sécurité ou des fonctions.
- La licence est incorporée aux conditions d'utilisation de Webflow (ToS).
  Elle prime sur elles en cas de conflit. **Elle ne contient pas de clause de
  droit applicable.**
- FAQ (texte hors licence) : « AI-generated code is not a "Prohibited Use" ».
  « We want to encourage developers to build on top of GSAP, including visual
  tools that don't directly compete ». Pour les cas douteux, il faut contacter
  Webflow.

**OSI ?** Non. La restriction de domaine d'usage contredit le critère n° 6 de
l'Open Source Definition (« No Discrimination Against Fields of Endeavor »).
ScanCode la classe « Proprietary Free ». Des tiers la rangent explicitement
parmi les licences non OSI.

**Redistribution dans une lib open source** : la licence n'a pas de clause
explicite de redistribution ni de sous-licence. Le grant inclut
« reproduce », mais seulement pour les *Permitted Uses* (« on any website, web
application, or digital interface »).
- ⚖️ **avis juridique** : une bibliothèque de composants publiée sur npm, qui
  n'est ni un site ni une application, est-elle un *Permitted Use* ? Selon la
  réponse, **embarquer** GSAP dans les `dist` d'Udixio (dépendance dure
  bundlée) peut être, ou non, couvert.
- Une page du forum GSAP sur la redistribution dans un plugin WordPress
  (`/community/forums/topic/44709-…`) est aujourd'hui en 404. Aucune réponse
  officielle sur le cas « librairie qui dépend de GSAP » n'a été trouvée dans
  les pages consultées.

**Les utilisateurs finaux sont-ils liés ?** Oui, de fait. Si `gsap` est une
dépendance (dure, peer ou optionnelle) installée depuis npm, chaque projet
reçoit GSAP de Webflow sous la licence Webflow. Udixio ne peut pas lui
appliquer sa propre licence. Conséquences :
- un utilisateur d'Udixio qui construit un **outil visuel d'animation sans
  code** concurrent de Webflow violerait la licence GSAP dès que le provider
  GSAP est chargé ;
- ⚖️ **avis juridique** : Udixio est-il exposé (incitation, « materially
  assists ») si sa doc ou son MCP pousse un tel usage ? Et un futur éditeur
  visuel d'animations dans la doc Udixio (playground, éditeur de specs)
  serait-il un *Competitive Product* ?

**Compatibilité avec Apache-2.0 / MIT** : il n'y a pas de conflit au sens du
copyleft, car aucune des deux licences n'interdit de dépendre de logiciel
propriétaire. En revanche :
- Udixio ne pourrait plus se dire « 100 % open source » pour les
  installations qui incluent GSAP ;
- certaines organisations (distributions, entreprises avec politique
  « OSI-only », SBOM ou outils de conformité) bloquent les licences non OSI
  identifiées par ScanCode et outils similaires. Une dépendance **dure**
  propagerait ce blocage à tous les utilisateurs d'Udixio. Une dépendance
  **peer optionnelle** dans un paquet séparé (ex. `@udixio/motion-gsap`) la
  confinerait à ceux qui l'activent. C'est une observation, pas une
  recommandation.

**Risques** :
- résiliation discrétionnaire en cas de non-respect jugé par Webflow ;
- révision unilatérale (atténuée : les versions antérieures restent sous
  l'ancien texte, donc épingler les versions est une protection partielle) ;
- vocabulaire flou (« competes with Webflow's visual animation building
  capabilities », « materially assists ») ;
- absence de droit applicable et de juridiction ⚖️ ;
- dépendance stratégique envers un acteur commercial dont le produit (Webflow
  Interactions) est concurrent d'une partie des usages possibles.

**Coût financier** : 0 €.

### 3.3 Motion (motion.dev) et Motion+

**`motion` / `framer-motion`** : MIT, « Copyright (c) 2024 Motion B.V. »
(`LICENSE.md` du dépôt `motiondivision/motion`, champ npm `MIT`, v14.9.0). Ce
paquet ne contient aucune restriction. Il peut être une dépendance dure, peer
ou optionnelle d'une lib Apache-2.0 ou MIT. Udixio en dépend déjà
(`motion ^12.23.0`). Financement : sponsors et Motion+.

**Motion+** (motion.dev/plus) :
- **Prix** : 399 USD une fois par développeur (données structurées de la page),
  avec mises à jour à vie. Les équipes de 2 personnes ou plus paient un
  **abonnement annuel** par siège.
- **Contenu** : composants « Motion UI » (Carousel, Ticker, Cursor,
  AnimateNumber, AnimateText, Typewriter, ScrambleText, AnimateView, Curtains,
  splitText ; AnimateActivity en accès anticipé), plus de 510 exemples,
  50 sections, l'AI Kit (recherche dans la doc, MCP, génération de springs
  CSS), Motion Studio, Performance Doctor, un GitHub et un Discord privés.
- **Licence annoncée** : « Motion+ APIs and examples are licensed under MIT, so
  once you've added code to your site, it's yours forever. » Usage commercial
  autorisé. Mais : « If your product effectively resells Motion+ capabilities
  to your users, you'll need a Builder's Licence. Contact us for details. »
  La doc du Studio SDK précise qu'un outil externe destiné aux clients
  nécessite cette Builder's License.
- **Constat technique** : `motion-plus`, `motion-plus-dom` et
  `motion-plus-react` sont publiés sur le **registre npm public**, avec un
  fichier `LICENSE` **MIT** (« Copyright (c) 2024 Motion One ») et du code
  fonctionnel : split-text, scramble-text, typewriter et curtains côté DOM ;
  Cursor, Ticker, AnimateNumber, AnimateText et Typewriter côté React. Les
  README disent pourtant « exclusive to Motion+ members ». Certains éléments
  (Carousel, exemples) semblent n'être accessibles que via le GitHub privé.
- ⚖️ **avis juridique** : un fichier MIT dans un paquet public suffit-il à
  autoriser n'importe qui à l'utiliser et à le redistribuer sans être membre ?
  Ou bien les conditions commerciales (achat par développeur, Builder's
  Licence) s'appliquent-elles, au titre des CGV ou d'une revendication de
  marque ou de contrat ? Une lib comme Udixio, qui exposerait des fonctions
  Motion+ à tous ses utilisateurs, ressemble à la définition de « resells
  Motion+ capabilities to your users ». La seule voie sûre serait un accord
  écrit avec Motion (support@motion.dev).
- **Obligations pour les utilisateurs** : si Udixio en dépendait, ses
  utilisateurs devraient sans doute être membres Motion+, ou Udixio aurait
  besoin d'une Builder's Licence. Non vérifié.

### 3.4 Polyfill `scroll-timeline` (flackr)

- **Licence** : Apache-2.0 (API GitHub, `LICENSE` dans le paquet npm
  `scroll-timeline-polyfill` 1.1.0). Aucun fichier `NOTICE` n'est présent dans
  le paquet.
- **OSI** : oui. Même licence qu'Udixio : compatible.
- **Obligations** : conserver la licence. Si le code est **forké ou modifié**
  et redistribué, signaler les modifications (Apache-2.0, §4b). La licence
  contient une clause brevet : la licence est perdue en cas d'action en
  contrefaçon de brevet contre le projet.
- **Statut** : le dépôt est sous un compte personnel (`flackr`, Robert Flack,
  ingénieur Chrome), pas sous une organisation. Aucun disclaimer Google n'a
  été vu. Le polyfill vise la spec actuelle (`ScrollTimeline` /
  `ViewTimeline`, `animation-timeline: scroll()/view()`). Dernière release npm
  le 15/05/2024, dernier push le 26/08/2024, 64 issues ouvertes : la
  maintenance semble ralentie. Les feuilles de style cross-origin ne sont pas
  toujours prises en compte (limite indiquée dans le README).
- **Dépendance** : techniquement possible sous toutes les formes. Son poids
  (environ 17 kB gz) plaide pour un chargement à la demande, mais cela relève
  de la conception, pas de la licence.
- **Risques** : maintenance plutôt que licence. Un fork interne resterait
  possible grâce à Apache-2.0.

### 3.5 Lenis

- **Licence** : MIT (npm 1.3.27, API GitHub `darkroomengineering/lenis`).
  OSI. Projet actif (push le 29/10/2026). Studio darkroom.engineering.
- **Dépendance** : sans contrainte. `@udixio/ui-react` en dépend déjà.
- **Obligations** : notice MIT.
- **Risques** : faibles.

## 4. Points nécessitant un avis juridique (récapitulatif)

1. **GSAP, *Permitted Use*** : une lib publiée sur npm entre-t-elle dans « on
   any website, web application, or digital interface » ? Peut-on **embarquer**
   (bundler) GSAP dans les artefacts publiés d'Udixio ?
2. **GSAP, responsabilité indirecte** : Udixio est-il exposé si un utilisateur
   construit, avec le provider GSAP, un outil visuel concurrent de Webflow
   (« encourages, induces, or materially assists ») ? Faut-il le signaler dans
   la doc et le MCP ?
3. **GSAP, outils Udixio** : un futur éditeur ou playground visuel
   d'animations dans la doc Udixio serait-il un *Competitive Product* ?
4. **GSAP, cadre contractuel** : pas de droit applicable, incorporation des
   ToS Webflow, résiliation discrétionnaire. Quelle portée pour un
   contributeur ou utilisateur hors États-Unis (France, UE) ?
5. **Motion+** : quel est l'effet juridique du fichier MIT des paquets npm
   publics face au discours « exclusive to members » et à la « Builder's
   Licence » ? Une lib open source peut-elle en dépendre, même de façon
   optionnelle ?
6. **Hygiène Udixio (hors moteurs)** : la plupart des paquets publiés n'ont pas
   de champ `license`, et `@udixio/mcp` est en MIT alors que le dépôt est en
   Apache-2.0. Ce n'est pas bloquant pour R5, mais c'est à clarifier.

## 5. Sources (consultées le 2026-11-03)

- GSAP Standard License : https://gsap.com/standard-license
- GSAP, page licensing et FAQ : https://gsap.com/licensing/
- Annonce Webflow « GSAP becomes free » : https://webflow.com/updates/gsap-becomes-free
- Fil Webflow Discourse : https://discourse.webflow.com/t/webflow-makes-gsap-100-free/319967
- ScanCode LicenseDB, `gsap-standard-no-charge-2025` : https://scancode-licensedb.aboutcode.org/gsap-standard-no-charge-2025.html
- Exemple de classement non OSI par un tiers : https://bracket.fi/legal/open-source
- Discussions communautaires (licence non open source, clause Webflow) : https://forum.pinegrow.com/t/gsap-has-been-acquired-by-webflow/9906 ; https://hnews-reader.vercel.app/ask/43868273
- Forum GSAP, plugin WordPress (404 à la date de consultation) : https://gsap.com/community/forums/topic/44709-clarification-on-gsap-licensing-for-a-wordpress-plugin/
- Open Source Definition, critère 6 : https://opensource.org/osd
- anime.js, dépôt et README : https://github.com/juliangarnier/anime
- anime.js, licence : https://raw.githubusercontent.com/juliangarnier/anime/master/LICENSE.md
- Motion, licence : https://raw.githubusercontent.com/motiondivision/motion/main/LICENSE.md
- Motion+ : https://motion.dev/plus
- Motion Studio SDK (Builder's License) : https://motion.dev/docs/studio-sdk
- Motion, taille de `animate` (mini 3,2 kB / hybride 22 kB) : https://motion.dev/docs/animate
- npm registry (versions, champ `license`, tarballs) : https://registry.npmjs.org/animejs, …/gsap, …/motion, …/framer-motion, …/lenis, …/scroll-timeline-polyfill, …/motion-plus, …/motion-plus-dom, …/motion-plus-react
- flackr/scroll-timeline : https://github.com/flackr/scroll-timeline
- Lenis : https://github.com/darkroomengineering/lenis
- API GitHub (licence SPDX, date du dernier push) : https://api.github.com/repos/{juliangarnier/anime, flackr/scroll-timeline, darkroomengineering/lenis, greensock/GSAP}
- Bundlephobia : https://bundlephobia.com/api/size?package=…
- Mesures locales : esbuild 0.28.2 + `gzip -9` (voir §2)
