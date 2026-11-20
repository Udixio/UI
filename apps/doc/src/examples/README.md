# Documentation examples

Examples are executable framework components. An MDX page imports both the
component and its raw source, then gives each available framework a named slot:

```mdx
import Code from '@/components/Code.astro';
import ReactExample from '@/examples/react/example.tsx';
import { AngularExample } from '@/examples/angular/example.ts';
import SvelteExample from '@/examples/svelte/example.svelte';
import reactSource from '@/examples/react/example.tsx?raw';
import angularSource from '@/examples/angular/example.ts?raw';
import svelteSource from '@/examples/svelte/example.svelte?raw';

<Code codes={{ react: reactSource, angular: angularSource, svelte: svelteSource }}>
  <ReactExample slot="react" client:load />
  <AngularExample slot="angular" client:load />
  <SvelteExample slot="svelte" client:load />
</Code>
```

Only provide a source and slot for frameworks that implement the example.
`Code.astro` derives the visible framework tabs from that intersection.

The rule has two parts, one for the tab and one for the preview:

- **A source alone lists a tab.** A non-empty source for a framework (`html`, `react`, `angular` or `svelte`) adds its
  tab, with the code alone. `html` is the plain markup and module script, as a reader would paste it.
- **A preview needs a slot.** The live preview of a framework exists only when the page fills that framework's slot.
  A wrapper that always declares its slots (such as `MotionUsage`) passes the list of live frameworks in the
  `previews` prop instead. A tab without a preview hides the Preview / Code switch and shows its code.

The motion examples (`examples/{html,react,angular,svelte}/motion-*.*`) are read by `MotionUsage.astro` by base name.
The root page's principle shows `motion-principle.*` whole, beside that same file running (`components/motion/root/Principle.astro`).
The selected framework is shared by every example through
`preferredExampleFrameworkStore` and persisted in local storage. A
single-framework example falls back locally without replacing that preference.
