# Documentation examples

Examples are executable framework components. An MDX page imports both the
component and its raw source, then gives each available framework a named slot:

```mdx
import Code from '@/components/Code.astro';
import ReactExample from '@/examples/react/example.tsx';
import { AngularExample } from '@/examples/angular/example.ts';
import reactSource from '@/examples/react/example.tsx?raw';
import angularSource from '@/examples/angular/example.ts?raw';

<Code codes={{ react: reactSource, angular: angularSource }}>
  <ReactExample slot="react" client:load />
  <AngularExample slot="angular" client:load />
</Code>
```

Only provide a source and slot for frameworks that implement the example.
`Code.astro` derives the visible framework tabs from that intersection.
The selected framework is shared by every example through
`preferredExampleFrameworkStore` and persisted in local storage. A
single-framework example falls back locally without replacing that preference.
