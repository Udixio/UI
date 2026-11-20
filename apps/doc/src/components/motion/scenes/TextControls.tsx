/**
 * The controls of the "Animate text" scene (`text.ts`), as Udixio UI components: the split (chars · words · lines) and Replay.
 * On a need page also the origin (first · center · last) and the verb (appear · reveal), each a group of Chips. In a tile, a
 * chip shows the split in code. They render the state the scene publishes (`sceneState.ts`); their `data-text-*` hooks reach
 * the scene's click listener.
 */
import { Button, Chip } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type TextBy = 'chars' | 'words' | 'lines';
export type TextOrigin = 'first' | 'center' | 'last';
export type TextVerb = 'appear' | 'reveal';
export type TextState = { by: TextBy; origin: TextOrigin; verb: TextVerb };

const SPLITS: readonly TextBy[] = ['chars', 'words', 'lines'];
const ORIGINS: readonly TextOrigin[] = ['first', 'center', 'last'];
const VERBS: readonly TextVerb[] = ['appear', 'reveal'];

type Props = {
  size?: 'tile' | 'page';
};

export function TextControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<TextState>({ by: 'words', origin: 'first', verb: 'reveal' });

  // The chips are selected by the scene: a chip's own request only reaches it as a click.
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Split the text into">
        {SPLITS.map((by) => (
          <Chip key={by} label={by} selected={state.by === by} onSelectedChange={() => {}} data-text-by={by} />
        ))}
      </div>
      {size === 'page' && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Origin of the cascade">
            {ORIGINS.map((origin) => (
              <Chip key={origin} label={origin} selected={state.origin === origin} onSelectedChange={() => {}} data-text-origin={origin} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Verb">
            {VERBS.map((verb) => (
              <Chip key={verb} label={verb} selected={state.verb === verb} onSelectedChange={() => {}} data-text-verb={verb} />
            ))}
          </div>
        </>
      )}
      <Button variant={size === 'page' ? 'filled' : 'tonal'} size="small" label="Replay" data-text-replay />
      {size === 'tile' && (
        <code
          className="inline-flex items-center rounded-lg bg-surface-container-high px-2.5 py-1 font-mono text-label-medium tracking-normal text-on-surface-variant"
          data-text-readout="split"
        >
          split: '{state.by}'
        </code>
      )}
    </div>
  );
}
