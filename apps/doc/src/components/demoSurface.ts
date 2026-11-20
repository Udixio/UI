/**
 * The demo surface: the one background every live example of the site sits on — the motion scenes (MotionStage), the
 * framework previews of a code block (Code.astro), the root page's stage and result. It follows the theme (no forced
 * light) and reads against the page in both modes by three things together: its tone, `surface` — the base the components
 * are designed on (an elevated button keeps its contrast), and a step away from the page's `surface-container` (darker in
 * dark mode, lighter in light mode) —, the discreet dot grid of the `demo-surface` utility (styles/global.css), and an
 * outline: its own when framed, its card's when inset. DemoSurface.astro adds the reserved size.
 */
export const demoSurfaceClass = 'demo-surface bg-surface text-on-surface';

/**
 * A standalone stage draws its own edge. The radius steps down on a narrow stage; `@container/demo` must be on an
 * ancestor (DemoSurface's frame) for the narrow step, and without one the wide radius holds.
 */
export const demoSurfaceFramedClass = 'border border-outline-variant rounded-4xl @max-[560px]/demo:rounded-3xl';
