/**
 * The control of the "Follow pointer or state" scene (`pointer.ts`): the Level slider, which fills the gauge of the scene. The
 * scene owns the level (`sceneState.ts`): the slider renders it, and reports each value it is given as an `input` event on
 * its own element, with the level (0 to 1) in `detail`, as a native range does.
 */
import { Slider } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type PointerState = {
  /** The level the gauge shows, 0 to 1. */
  level: number;
};

export function PointerControls() {
  const [ref, state] = useSceneState<PointerState>({ level: 0.6 });

  return (
    <div className="flex items-center gap-3 text-label-large text-on-surface">
      <span>Level</span>
      <div className="w-40">
        <Slider
          ref={ref}
          min={0}
          max={1}
          step={0.01}
          value={state.level}
          aria-label="Level"
          onChange={(level) => ref.current?.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: level }))}
          data-pointer-level
        />
      </div>
    </div>
  );
}
