/**
 * The island side of `sceneState.ts`: a scene's controls render from the state the scene publishes on its stage. `initial`
 * is the scene's state before it mounts, which the server renders. Not a scene: the loader only imports a module a stage
 * names.
 */
import { useEffect, useRef, useState } from 'react';
import { SCENE_STATE_EVENT, SCENE_SYNC_EVENT } from './sceneState';

export function useSceneState<State, Element extends HTMLElement = HTMLDivElement>(initial: State) {
  const ref = useRef<Element>(null);
  const [state, setState] = useState(initial);

  useEffect(() => {
    const stage = ref.current?.closest<HTMLElement>('[data-motion-scene]');
    if (!stage) return;
    const onState = (event: Event) => setState((event as CustomEvent<State>).detail);
    stage.addEventListener(SCENE_STATE_EVENT, onState);
    // The scene may have mounted (and changed) before this island hydrated: it publishes its state again.
    stage.dispatchEvent(new CustomEvent(SCENE_SYNC_EVENT));
    return () => stage.removeEventListener(SCENE_STATE_EVENT, onState);
  }, []);

  return [ref, state] as const;
}
