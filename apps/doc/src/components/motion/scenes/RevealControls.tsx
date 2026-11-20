/**
 * The controls of the "Reveal on scroll" scene (`reveal.ts`), as Udixio Chips: the Once · Always group, which sets how each
 * card of the feed plays on each entry. They render the state the scene publishes (`sceneState.ts`); their `data-reveal-mode`
 * hooks reach the scene's click listener. In a tile, a chip shows the motion in code.
 */
import { Chip } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type RevealMode = 'once' | 'always';
export type RevealState = { mode: RevealMode };

const MODES: readonly { mode: RevealMode; label: string }[] = [
  { mode: 'once', label: 'Once' },
  { mode: 'always', label: 'Always' },
];

type Props = {
  size?: 'tile' | 'page';
};

export function RevealControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<RevealState>({ mode: 'once' });

  // Selected by the scene: the chip's own request only reaches it as a click.
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Repeat">
        {MODES.map(({ mode, label }) => (
          <Chip key={mode} label={label} selected={state.mode === mode} onSelectedChange={() => {}} data-reveal-mode={mode} />
        ))}
      </div>
      {size === 'tile' && (
        <code
          className="inline-flex items-center rounded-lg bg-surface-container-high px-2.5 py-1 font-mono text-label-medium tracking-normal text-on-surface-variant"
          data-reveal-readout
        >
          repeat: '{state.mode}'
        </code>
      )}
    </div>
  );
}
