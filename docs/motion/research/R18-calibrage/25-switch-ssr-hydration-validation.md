# Switch : validation SSR et hydratation

Les tests navigateur rendent le Switch initialement activé dans Node sans `window` ni `document`, puis hydratent le même balisage avec les styles compilés :

- React : `switch-hydration.browser.spec.tsx`, rendu serveur React et `hydrateRoot`.
- Svelte : `switch-svelte-hydration.browser.spec.ts`, bundle serveur Svelte et `hydrate`.
- Angular : `switch-angular-hydration.browser.spec.ts`, `renderApplication` avec `provideServerRendering` et `provideClientHydration`, puis `bootstrapApplication` avec `provideClientHydration`. Le rendu comprend les marqueurs et les données d'état d'hydratation Angular. La fixture serveur utilise `@angular/platform-server`, déclaré dans `apps/doc/package.json`.

Pour chaque adaptateur, les tests vérifient la conservation des nœuds du Switch et de sa poignée, l'offset initial de 20 px, la visibilité pendant les mutations observées, l'absence d'avertissements et d'erreurs navigateur, une interaction clavier et la libération de l'observateur et de l'écouteur de politique. Un échantillonnage `requestAnimationFrame` commence avant le chargement client et se poursuit pendant au moins 250 ms après le constat de l'hydratation ; il contrôle l'offset calculé, la visibilité et l'absence d'animations actives. Les tests Angular et Svelte contrôlent aussi les anciens styles lors des mutations et les appels à `Element.animate`. L'échantillonnage ne garantit pas l'observation de changements synchrones entre deux images.

Ces contrôles portent sur les préférences système `reduce` et `no-preference` dans Chromium et Firefox, pour un Switch activé au rendu initial. Les 12 cas passent. WebKit n'a pas été exécuté dans cette validation. La cible CI des tests motion inclut ces trois fichiers ; les modifications de la fixture serveur Angular et du manifeste de l'application de documentation déclenchent aussi cette cible en validation de PR.

Commande exécutée depuis la racine :

```sh
MOTION_BROWSERS=chromium,firefox ./node_modules/.bin/vitest run --config packages/tailwind/search-motion.config.mts tests/switch-hydration.browser.spec.tsx tests/switch-svelte-hydration.browser.spec.ts tests/switch-angular-hydration.browser.spec.ts
```
