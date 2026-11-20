/**
 * The Position slider of the "Animate any CSS" scene (`animate.ts`), a Udixio UI slider that drives the dot of the track
 * over a spring. The scene owns the position (`sceneState.ts`): the slider renders it. The slider reports each value it is
 * given as an `input` event on its own element, with the value in `detail`, as a native range does; the scene listens to
 * it on the stage.
 */
import { Slider } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type AnimateState = {
  /** The position of the slider, 0 to 100. */
  position: number;
};

export function AnimatePosition() {
  const [ref, state] = useSceneState<AnimateState>({ position: 0 });

  return (
    <div className="flex w-full items-center gap-3 text-label-large text-on-surface">
      <span>Position</span>
      <div className="min-w-0 flex-1">
        <Slider
          ref={ref}
          min={0}
          max={100}
          step={1}
          value={state.position}
          aria-label="Position"
          onChange={(position) => ref.current?.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: position }))}
          data-animate-range
        />
      </div>
    </div>
  );
}
