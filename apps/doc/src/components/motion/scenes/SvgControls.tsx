/**
 * The controls of the "Draw or morph SVG" scene (`svg.ts`), as Udixio UI components: the shape the icon morphs into (a Chip
 * per shape), Draw again, and on a need page Move again, for the dot on its arc. In a tile, a chip shows the target in code.
 * They render the state the scene publishes (`sceneState.ts`); their `data-svg-*` hooks reach the scene's click listener.
 */
import { Button, Chip } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

/** The shapes the icon morphs into, in the order of their chips. */
export const SVG_SHAPES = ['Cookie', 'Flower', 'Clover', 'Sunny'] as const;
export type SvgShape = (typeof SVG_SHAPES)[number];
export type SvgState = { shape: SvgShape };

type Props = {
  size?: 'tile' | 'page';
};

export function SvgControls({ size = 'tile' }: Props) {
  const [ref, state] = useSceneState<SvgState>({ shape: 'Cookie' });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Shape the icon morphs into">
        {SVG_SHAPES.map((name) => (
          // Selected by the scene: the chip's own request only reaches it as a click.
          <Chip key={name} label={name} selected={state.shape === name} onSelectedChange={() => {}} data-svg-shape={name} />
        ))}
      </div>
      <Button variant="tonal" size="small" label="Draw again" data-svg-draw-again />
      {size === 'page' && <Button variant="tonal" size="small" label="Move again" data-svg-move-again />}
      {size === 'tile' && (
        <code className="inline-flex items-center rounded-lg bg-surface-container-high px-2.5 py-1 font-mono text-label-medium tracking-normal text-on-surface-variant">
          morph: '{state.shape}'
        </code>
      )}
    </div>
  );
}
