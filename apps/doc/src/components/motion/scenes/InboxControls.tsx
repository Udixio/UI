/**
 * The controls of the "Make a list appear" scene (`inbox.ts`): Add one and Add three, and the origin of the cascade. On a
 * need page, also the stagger and the exit. The scene owns the options (`sceneState.ts`): these chips render from it, and
 * their `data-inbox-*` hooks reach the scene's click listener on the stage.
 */
import { Button, Chip } from '@udixio/ui-react';
import {
  INBOX_EXITS,
  INBOX_ORIGINS,
  INBOX_STAGGERS,
  type InboxExit,
  type InboxOrigin,
  type InboxStagger,
} from './data/inbox';
import { useSceneState } from './useSceneState';

export type InboxState = {
  origin: InboxOrigin;
  stagger: InboxStagger;
  exit: InboxExit;
};

const ORIGIN_LABELS: Record<InboxOrigin, string> = { first: 'First', center: 'Center', last: 'Last' };
const STAGGER_LABELS: Record<InboxStagger, string> = { tight: 'Tight', normal: 'Normal', loose: 'Loose' };
const EXIT_LABELS: Record<InboxExit, string> = { 'in-place': 'In place', 'out-of-flow': 'Out of flow' };

type Props = {
  /** `page` adds the stagger and the exit groups. */
  size?: 'tile' | 'page';
};

const noop = () => {};

export function InboxControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<InboxState>({ origin: 'first', stagger: 'normal', exit: 'out-of-flow' });

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="small" label="Add one" data-inbox-add="1" />
        <Button variant="tonal" size="small" label="Add three" data-inbox-add="3" />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Cascade origin">
        {INBOX_ORIGINS.map((origin) => (
          // Selected by the scene: the chip's own request only reaches it as a click.
          <Chip
            key={origin}
            label={ORIGIN_LABELS[origin]}
            selected={state.origin === origin}
            onSelectedChange={noop}
            data-inbox-origin={origin}
          />
        ))}
      </div>
      {size === 'page' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Stagger">
            {INBOX_STAGGERS.map((stagger) => (
              <Chip
                key={stagger}
                label={STAGGER_LABELS[stagger]}
                selected={state.stagger === stagger}
                onSelectedChange={noop}
                data-inbox-stagger={stagger}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Exit">
            {INBOX_EXITS.map((exit) => (
              <Chip
                key={exit}
                label={EXIT_LABELS[exit]}
                selected={state.exit === exit}
                onSelectedChange={noop}
                data-inbox-exit={exit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
