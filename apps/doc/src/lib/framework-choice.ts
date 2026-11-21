/**
 * The framework the reader chose, shown everywhere on a page: in its prose, its inline API names and its code blocks.
 *
 * The choice is the site's example preference (`stores/exampleFrameworkStore`, stored under
 * `udixio:docs:preferred-example-framework`, React by default). It reaches the page through one DOM contract:
 *
 * - `<html data-docs-framework="svelte">`: the chosen framework, set in the `<head>` before the first paint
 *   (layouts/layout.astro), and again on each change. CSS may follow it.
 * - `[data-framework-variant="html svelte"]`: a variant of some content, for the frameworks it names (one or more, separated
 *   by spaces). It is `hidden` unless it names the chosen framework. `ForFramework.astro` and `ApiName.astro` write them;
 *   the server renders React's variant shown and the others `hidden`, so the page reads right without JavaScript.
 * - `[data-framework-choice="angular"]`: a button that chooses a framework (`FrameworkSwitch.astro`). Its `aria-pressed`
 *   says whether it is the chosen one.
 * - `[data-code-frameworks]` and `[data-code-previews]` on a code block (Code.astro), around its `[data-example-panel]`s:
 *   the block shows the chosen framework when it has it, else its first one, in its preview when it has one, else its code.
 *
 * The head script applies the stored choice to each of these elements as the parser inserts them, before anything is
 * painted. This module keeps them in step afterwards: on each change of the store (a code block's tabs, a switch, another
 * tab of the browser) and after each client-side navigation. Prose is plain HTML: nothing hydrates to switch it.
 */
import {
  EXAMPLE_FRAMEWORKS,
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

/** The frameworks an element names in `data-framework-variant`, or in any attribute that lists frameworks. */
export function frameworksIn(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean);
}

function isFramework(value: unknown): value is ExampleFramework {
  return (EXAMPLE_FRAMEWORKS as readonly unknown[]).includes(value);
}

/**
 * Shows `framework` in `root` (a document, or a part of one): the root attribute, the variants and the switches. The code
 * blocks follow the store themselves (CodePreview), so they are not touched here once the page has loaded.
 */
export function showChosenFramework(framework: ExampleFramework, root: Document = document): void {
  root.documentElement.dataset.docsFramework = framework;
  for (const variant of root.querySelectorAll<HTMLElement>('[data-framework-variant]')) {
    variant.hidden = !frameworksIn(variant.dataset.frameworkVariant).includes(framework);
  }
  for (const choice of root.querySelectorAll<HTMLElement>('[data-framework-choice]')) {
    choice.setAttribute('aria-pressed', String(choice.dataset.frameworkChoice === framework));
  }
}

let connected = false;

/** Keeps the page in step with the store, once per window: the client router keeps this module across navigations. */
export function connectFrameworkChoice(): void {
  if (connected || typeof document === 'undefined') return;
  connected = true;
  initializeExampleFrameworkPreference();
  // Called at once with the stored choice, then on each change, wherever it comes from.
  preferredExampleFrameworkStore.subscribe((framework) => showChosenFramework(framework));
  document.addEventListener('astro:page-load', () => showChosenFramework(preferredExampleFrameworkStore.get()));
  document.addEventListener('click', (event) => {
    const choice = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-framework-choice]') : null;
    if (choice && isFramework(choice.dataset.frameworkChoice)) setPreferredExampleFramework(choice.dataset.frameworkChoice);
  });
}
