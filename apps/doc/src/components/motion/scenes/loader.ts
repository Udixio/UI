/**
 * Mounts the live scenes of the Animation section. A stage carries `data-motion-scene="<name>"`, and the scene it names
 * is `scenes/<name>.ts`, which exports `mount(root)`: the function mounts the scene in the stage and returns its
 * teardown. A scene is imported when its stage first nears the view, and torn down when the client router swaps the
 * page. Nothing plays until a scene mounts, and a scene is not imported by the page shell.
 */

/** What a scene module exports: its mount, which returns the teardown. */
export type SceneModule = {
  mount: (root: HTMLElement) => () => void;
};

/** Every scene of this folder, loaded on demand. Adding a scene file is the only step: there is no registry to update. */
const scenes = import.meta.glob<SceneModule>(['./*.ts', '!./loader.ts']);

const STAGE_SELECTOR = '[data-motion-scene]';

/** The stages that are loading or mounted, with the teardown of a mounted one. */
const stages = new Map<HTMLElement, (() => void) | undefined>();
let observer: IntersectionObserver | undefined;
/** Bumped on each teardown, so that a scene still loading when the page is swapped is never mounted on the old page. */
let generation = 0;

function mountStage(stage: HTMLElement): void {
  if (stages.has(stage)) return;
  const name = stage.dataset['motionScene'];
  const load = name ? scenes[`./${name}.ts`] : undefined;
  if (!load) {
    console.error(`[motion] no scene "${name}" for this stage`, stage);
    return;
  }

  stages.set(stage, undefined);
  const started = generation;
  load()
    .then((scene) => {
      if (started !== generation || !stages.has(stage)) return;
      stages.set(stage, scene.mount(stage));
    })
    .catch((error: unknown) => {
      stages.delete(stage);
      console.error(`[motion] the scene "${name}" did not mount`, error);
    });
}

function start(): void {
  const elements = [...document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)];
  if (elements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(mountStage);
    return;
  }

  // The stage is mounted when it is half a viewport away from the view, so a visitor who scrolls finds it playing.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        mountStage(entry.target as HTMLElement);
      }
    },
    { rootMargin: '50% 0px' },
  );
  elements.forEach((element) => observer?.observe(element));
}

function stop(): void {
  observer?.disconnect();
  observer = undefined;
  generation++;
  for (const teardown of stages.values()) {
    try {
      teardown?.();
    } catch (error) {
      console.error('[motion] a scene did not tear down', error);
    }
  }
  stages.clear();
}

document.addEventListener('astro:page-load', start);
document.addEventListener('astro:before-swap', stop);
