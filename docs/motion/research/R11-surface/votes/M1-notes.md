M5-S10 : 9 — garde-fous depuis une source unique, valide 4 sur 4 : seule réponse à l'exigence de vérification ; risque : génération à tenir en CI, lint aveugle aux noms construits.
M5-S08 : 9 — continuité `carry` ou `restart` avec source visible, valide 4 sur 4 et absorbe les quatre formulations concurrentes ; risque : `carry` peut faire perdre le gain natif.
M5-S09 : 9 — boucles et suivis abonnés à l'horloge partagée, valide 4 sur 4 : une boucle par page, pause et réduction uniformes ; risque : un abonné lent retarde la frame.
M5-S07 : 8 — parité en cinq formes, valide 4 sur 4 : seul moyen de tenir les environnements alignés ; risque : cinq formes à tester, nom `useMotion` non tranché.
M4-S04 : 8 — définitions nommées typées, valide 4 sur 4 : spec partagée entre îles, seule surface de F14 et F15 ; risque : indirection, lecture par signal non tranchée avec M1-S07.
M5-S01 : 7 — attributs réduits à des références, valide 4 sur 4 ; risque : contredit l'identité en valeur de M2-S02 et `udx-shared` de M4-S09.
M5-S04 : 7 — Tailwind limité aux tokens et aux états, consensus 5 sur 5 ; risque : un effet ne s'écrit pas en classe seule, périmètre étroit.
M1-S10 : 6 — VT nommée au premier attach, jamais en vol, seule couverture de F8 et F9 ; risque : Chromium seul, contradiction ouverte avec M4-S09 et refus de `carry` pendant une VT.
M2-S01 : 6 — `layout(el, mutate)` explicite, seule entrée de F7 ; risque : React doit mesurer avant commit, appel oublié silencieux.
M1-S08 : 6 — texte et SVG préparés au rendu, seul mécanisme de F16 et F17 sans conflit ; risque : DOM plus lourde, découpe serveur et client à aligner.
M3-S01 : 6 — `reveal` et `scrub` distincts, valide 4 sur 4 ; risque : contredit `follow` de M5-S02, contradiction ouverte.
M5-S02 : 5 — quinze verbes couvrant F1 à F24 ; risque : sept contradictions ouvertes (`drag`, `scroll`, `follow`, `disappear`), quinze verbes pour un débutant.
M2-S03 : 5 — présence en état `data-presence`, valide 4 sur 4 ; risque : contredit `disappear` et `dismiss`, contradiction ouverte.
M2-S02 : 5 — identité sérialisable au SSR, seule base de F8 hors VT ; risque : contredit M5-S01 sur les valeurs en attribut.
M4-S09 : 5 — HTML et Astro par attributs statiques, valide 4 sur 4 ; risque : `udx-shared` en conflit avec M1-S10 et M5-S01, attribut verbeux.
M5-S05 : 4 — tokens émis au build avec ressorts compilés en `linear()` ; risque : retire les paramètres JS dont `carry` a besoin, contradiction ouverte.
