# P2, tour 2 : réponses, cas-test, concessions, réaction à R0

## 1. Réponses aux questions

**À P1, Q1 (adaptateurs minimaux pour W4 et W7).** Angular : le démontage différé est natif. `animate.leave` accepte des classes et retarde la suppression (à confirmer sur la version ciblée). `udxMotion` n'y ajoute que du sucre. React : impossible sans composant qui *rend* l'enfant, car un hook ne peut pas retarder le retrait DOM décidé par React :

```tsx
function Presence({ show, name, children }: PresenceProps) {
  const [mounted, setMounted] = useState(show);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (show) { setMounted(true); return; }
    if (ref.current) void exitMotion(ref.current, name).then(() => setMounted(false));
  }, [show, name]);
  return mounted ? cloneElement(children, { ref, 'data-state': show ? 'open' : 'closed' }) : null;
}
```

Le code est illustratif (il écrase la ref de l'enfant). Le point tient : pour React, W4 exige un composant qui possède l'enfant.

W7 en React : le hook pré-mutation proposé par P1 n'existe pas. `useLayoutEffect` s'exécute après la mutation du DOM ; le seul point « avant » est le cycle de classe `getSnapshotBeforeUpdate`. Restent deux options : capturer au point de déclenchement (avant le `setState`), ou un FLIP à « rect mémorisé au commit précédent », faux si la géométrie change sans commit (scroll, resize). Svelte a `$effect.pre`, qui couvre W7. Angular : point à vérifier.

**À P1, Q2 (où la classe échoue, hors typage).** Hydratation Astro, slots, SSR : la classe gagne ou égalise, ce ne sont pas des contre-exemples. Les vrais contre-exemples sont trois : (a) le démontage React ; (b) un nom venu de données (section 2) ; (c) une valeur non sérialisable par instance : callback `onDone`, ref d'élément d'un autre composant, timeline construite avec des refs.

**À P3, Q1 (T4, nom partagé).** Un contexte ne traverse jamais une île : chaque île est une racine séparée. Le nom est donc la seule clé transportable, comme `view-transition-name` l'est déjà en natif. Coût API : une primitive `shared="hero"` (React), `udxShared="hero"` (Angular), `{@attach shared('hero')}` (Svelte), qui posent `data-udx-shared` et `view-transition-name`. Le DOM sert de registre : aucun global. Le type du nom vit dans le paquet core. Je retire `globalThis` (section 3).

**À P3, Q2 (formes d'écriture et dérive).** Chez moi : une définition et une écriture par framework, soit `<Motion.div animation="card-reveal">`, `udxMotion="card-reveal"`, `{@attach motion('card-reveal')}`, `data-udx-motion="card-reveal"`, plus la classe si le nom est natif. La dérive se contrôle par la suite de conformité sur la spec compilée (audit-parity). Erreur d'agent : un `animation="…"` posé sur un `<div>` nu en Svelte passe sans erreur, Svelte acceptant les attributs inconnus sur les éléments HTML. Correctif : lint de paquet (un `.svelte` n'importe que `@udixio/motion/svelte`) et validation des valeurs au build. `hover:` et `md:` sur `<Motion.div>` fonctionnent si la motion est native (`className`).

**À P3, Q3 (barrel).** Un barrel n'alourdit que si ses modules ont des effets de bord et que `sideEffects` n'est pas `false`. Le composant n'importe statiquement aucun provider : il appelle `import()` au premier besoin. Unité de chargement : la **définition** (un chunk par nom). Le composant est le **site de déclenchement**.

## 2. Cas-test qui fait échouer P1 : T8 (nom venu de données)

P1 ne répond pas à T8 dans son tour 2, sauf par la règle « union fermée ». Rappel du cas : un nom d'animation vient du contenu et n'est connu qu'à l'exécution.

```astro
---
const posts = await getCollection('blog'); // frontmatter : motion: card-reveal
---
{posts.map((p) => <article class={`motion-${p.data.motion}`}>…</article>)}
```

Selon W1, ce code est refusé. Réponse de P1 par union fermée : valable si le schéma est un `z.enum` de noms. Mais alors le build produit un chunk par nom, et le runtime choisit le sien selon la valeur. C'est exactement ce que fait ma proposition : `import()` sur un registre généré. La clause « le runtime ne décide jamais du chargement » de P1 doit donc être relâchée en « le runtime choisit parmi des chunks produits au build ». Sans ce relâchement, une liste de 24 noms charge 24 chunks sur chaque page qui en utilise un. C6 échoue.

Démonstration côté P2 :

```ts
const loaders = import.meta.glob('./motions/*.ts'); // un chunk par nom, produit au build
export const load = (n: MotionName) => loaders[`./motions/${n}.ts`]();
```

Un nom absent de la page n'est jamais chargé. Le CSS natif reste le point faible : en SSG, le build scanne le HTML rendu ; en SSR ou CSR, le `<style>` est injecté au premier usage (flash accepté).

## 3. Ce que je concède à P1

1. La classe est la forme primaire du régime natif, pas seulement des tokens : SSR, CSS inspectable (C9), zéro JS. Je retire ma limitation « Tailwind = tokens et états ».
2. T7 sur moteur JS : pont sentinelle (`animation` `udx-probe` de 0,001 s, écoute de `animationstart` et `animationcancel`), ou variables + `MutationObserver` / `matchMedia` / `pointerenter` comme propose P1. Les deux sont acceptables ; je retiens la forme P1 pour le `:hover`, plus lisible. À vérifier : l'émission de `animationcancel` à la suppression de `animation-name`.
3. T4 : je retire `globalThis`. Le DOM est le registre (`data-udx-shared`, `view-transition-name`, `querySelectorAll` au snapshot). Le snapshot de repli est un module ESM singleton, pas un global `window` ; deux copies du paquet sur une page deviennent une limite documentée, comme P1 le dit.
4. `exitMotion(el)` (promesse) reste une primitive du core, mais seulement pour le cas où le framework n'a pas de sortie native (React). Angular et Svelte délèguent. Accord avec P1.
5. Contrôle impératif : le handle idiomatique (ref, `viewChild`, `attach`) l'emporte sur `motion.play(el, name)`. Le vocabulaire (méthodes, noms) reste commun.
6. Le scanner qui refuse une classe `motion-*` inconnue : je l'étends à `data-udx-motion`, et le typage couvre les props.
7. `observe` en union, `reduced` typé, `--udx-i` : adoptés.
8. R0 scindé en cycle et moteur (section 4) : adopté.

## 4. Réaction à R0 et aux architectures C/D

**R0, règle par règle.**
- 1 (définir une fois), 2 (référencer par encodage), 4 (violation = erreur de build), 5 (forme différente de moteur) : accord. Pour 4, le build vérifie les références littérales ; le typage couvre le reste.
- 3 (prédicat de forme) : **j'adopte la scission de P1**. Cycle (`exit`, `identity`, `measure`, `control`, `continuousInput`) : encodage framework obligatoire. Moteur : classe ou attribut admissibles, chunk JS au besoin. Asymétrie (R0.3bis) : l'encodage framework est toujours légal, seule la classe est restreinte. Liste fermée (R0.4) : pas de jugement de complexité. Une clause s'y ajoute : un état non portable en attributs ou variables CSS relève du cycle.
- 6 (chargement) : **amendement**. L'extraction littérale suffit pour le CSS natif et le préchargement. Le JS se charge par nom parmi des chunks produits au build (T8). Accord sur R0.6 de P1 (une définition, un module virtuel par nom).

**Tableau attendu.** T1 contient deux sémantiques, « une fois » et « scrub ». Le nom doit les distinguer (`card-reveal-once`, `card-reveal-scrub`), sinon le repli natif change l'animation. T7 (y compris variante JS) en classe. T2, T3, T5, T6 en framework. T4 en nom partagé dans le DOM.

**Architecture C.** Accord : un nom, plusieurs encodages, résolution statique pour le CSS.

**Architecture D.** J'accepte D comme cible. Mon réserve est une condition : le plugin AOT est une **optimisation** (CSS émis, découpage) et un **générateur de registre**. Le repli sans plugin (registre écrit à la main, ou `import.meta.glob` sous Vite) doit fonctionner, sinon la correction dépend d'un plugin par bundler. Le coût réel, comme le dit P1, est la matrice de tests par bundler.

**Rejets maintenus.** A (classes pures) : rejeté comme architecture, car T2, T3 et T5 échouent. B (idiomatique seule) : rejeté comme architecture pour dérive et C1, conservé comme encodage.

## 5. Désaccords restants

- T8 : le runtime doit pouvoir choisir un chunk parmi ceux produits au build. P1 doit relâcher sa clause « le runtime ne décide jamais du chargement ».
- Le repli sans plugin : exigé par P2, non tranché par P1.
- Îles et T4 : réglés par le DOM (accord de fond, P1 et P2).

Message envoyé à P1 : compromis concret sur T8 (relâcher la clause, garder l'ensemble fermé au build, donc le scanner de W1 reste valable).
