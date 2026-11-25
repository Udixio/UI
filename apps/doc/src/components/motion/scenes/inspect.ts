/**
 * The "Inspect a section" scene: three cards, one kind of motion each (a reveal, a presence and an emphasis), and Inspect this
 * section, which reads the report of `inspect()` for the section and writes it into the readout of the stage. The scene keeps
 * no state: its button sends its click through `data-inspect-button`. Markup: `Inspect.astro`; control: `InspectControls.tsx`,
 * a Udixio Button. The hero of /motion/inspect.
 */
import { inspect } from '@udixio/motion/scope';

/** The reduced-motion policy of the report, in words. */
const POLICY = {
  none: 'Full motion',
  document: 'Reduced by the document',
  system: 'Reduced by the system setting',
} as const;

export function mount(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>('[data-inspect-section]');
  const readout = root.querySelector<HTMLElement>('[data-inspect-readout]');
  if (!section || !readout) return () => {};

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-inspect-button]')) return;
    const report = inspect(section);
    const kinds = report.bindings.map((binding) => binding.kind).join(', ');
    readout.textContent = `${POLICY[report.policy.source]}. ${report.bindings.length} bindings in this section: ${kinds}. ${report.definitions.length} motions defined on the page.`;
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
