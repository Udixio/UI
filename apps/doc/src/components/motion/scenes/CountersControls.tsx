/**
 * The controls of the "Count a number" scene (`counters.ts`): Add 1,000, and on the need page the language group (en · fr ·
 * de), which sets the language of the numbers. The scene owns the language (`sceneState.ts`): these render from it, and
 * their `data-counters-*` hooks reach the scene's click listener on the stage.
 */
import { Button, Chip } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export const COUNTER_LANGUAGES = ['en', 'fr', 'de'] as const;
export type CounterLanguage = (typeof COUNTER_LANGUAGES)[number];
export type CountersState = {
  /** The language the numbers are written in. */
  lang: CounterLanguage;
};

type Props = {
  size?: 'tile' | 'page';
};

const noop = () => {};

export function CountersControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<CountersState>({ lang: 'en' });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button size="small" label="Add 1,000" data-counters-add />
      {size === 'page' && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Language of the numbers">
          {COUNTER_LANGUAGES.map((lang) => (
            // Selected by the scene: the chip's own request only reaches it as a click.
            <Chip key={lang} label={lang} selected={state.lang === lang} onSelectedChange={noop} data-counters-lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
