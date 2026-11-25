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
 * - `[data-framework-choice="angular"]`: a radio of a page's framework switch (`FrameworkSwitch.astro`), whose
 *   `aria-checked` says whether it is the chosen framework, and `[data-code-tab][data-framework="angular"]`: a tab of a code
 *   block (CodePreview), whose `aria-selected` says whether it shows the chosen framework, the code block's own fallback
 *   included. Both keep a roving `tabindex`.
 * - `[data-code-frameworks]` and `[data-code-previews]` on a code block (Code.astro), around its `[data-example-panel]`s:
 *   the block shows the chosen framework when it has it, else its first one, in its preview when it has one, else its code.
 *   A block marked `[data-code-layout="split"]` shows the chosen framework's code and preview together.
 * - `[data-code-ssr]`: an island of framework tabs (a code block's card, the switch) that has not applied the stored
 *   choice yet. The tabs and the radios draw their state from `aria-selected` / `aria-checked` meanwhile (FrameworkTabs).
 *
 * The head script applies the stored choice to each of these elements as the parser inserts them, before anything is
 * painted. Once hydrated, the tabs and the code blocks follow the store themselves (FrameworkTabs, CodePreview); this
 * module keeps the rest in step: on each change of the store (a code block's tabs, a switch, another tab of the browser)
 * and after each client-side navigation. Prose is plain HTML: nothing hydrates to switch it.
 */
import {
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

/** The frameworks an element names in `data-framework-variant`, or in any attribute that lists frameworks. */
export function frameworksIn(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean);
}

/**
 * Shows `framework` in `root` (a document, or a part of one): the root attribute and the variants. The tabs and the code
 * blocks follow the store themselves (FrameworkTabs, CodePreview), so they are not touched here once the page has loaded.
 */
export function showChosenFramework(framework: ExampleFramework, root: Document = document): void {
  root.documentElement.dataset.docsFramework = framework;
  for (const variant of root.querySelectorAll<HTMLElement>('[data-framework-variant]')) {
    variant.hidden = !frameworksIn(variant.dataset.frameworkVariant).includes(framework);
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
}
