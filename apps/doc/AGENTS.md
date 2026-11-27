# Documentation site

- Every control is a Udixio component (Button, IconButton, Chips, Tabs, Switch, Slider, TextField…): in the React, Angular and Svelte examples, in the scenes, and in the site's own chrome (code tabs, framework selector, copy buttons, player controls). Native elements only in the HTML tab and for the element that is itself the animation. Before calling a change finished, grep `<button|<input|<select|role="tab"` in `src` and justify each native one left.
- Style with Tailwind classes and theme tokens; no new `.css` file and no `<style>` block.
- Each example exists for React, Angular, Svelte and HTML (`src/examples/<framework>/`), and they show the same thing.
- Nothing type-checks this app: `astro build` strips types, and `tsc -p tsconfig.app.json` fails on the `ui-angular` project reference. A breaking change in a package silently breaks its call sites here. To sweep, use a throwaway tsconfig outside the repo with no `references`, `paths` mapping `@udixio/*` to each package's `src/index.ts` and `@/*` to `./src/*`, and `src/examples/angular/**` excluded; ignore the `astro:content` and `import.meta.glob` errors.
- The browser tests live in `tests/`; run one file at a time (`node --test tests/<file>`).
