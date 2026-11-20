/**
 * The bridge between a scene (`scenes/<name>.ts`, plain DOM) and its controls, which are Udixio UI components in a React
 * island (`scenes/<Name>Controls.tsx`). Not a scene: the loader only imports a module a stage names.
 *
 * - The scene owns the state and the logic. It reads what the visitor does from DOM events on the stage (a click on a
 *   `data-*` hook, a submit, an input): the hooks are attributes the island puts on the components, which forward them to
 *   their native element, so a click works before the island hydrates.
 * - The scene publishes its state on the stage after each change, and again when the island asks for it (an island that
 *   hydrates after the scene mounted). The island renders the components from that state only.
 */

/** The event that carries a scene's state to its controls. */
export const SCENE_STATE_EVENT = 'motion-scene-state';
/** The event an island sends when it starts listening, so that the scene publishes its current state again. */
export const SCENE_SYNC_EVENT = 'motion-scene-sync';

/**
 * Publishes the state now, and on each sync request. `read` returns the current state; call `publish()` after each change.
 * Returns the publish function and the teardown.
 */
export function createSceneState<State>(root: HTMLElement, read: () => State): { publish: () => void; stop: () => void } {
  const publish = () => root.dispatchEvent(new CustomEvent<State>(SCENE_STATE_EVENT, { detail: read() }));
  root.addEventListener(SCENE_SYNC_EVENT, publish);
  publish();
  return { publish, stop: () => root.removeEventListener(SCENE_SYNC_EVENT, publish) };
}
