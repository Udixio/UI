/**
 * The words of the Animation section, defined once on /motion/glossary, each under the anchor `#term-<slug>`.
 *
 * A page links a term to its definition with `glossaryHref`:
 *
 * @example
 * ```astro
 * ---
 * import { glossaryHref } from '@/lib/motion-glossary';
 * ---
 * <p>The <a href={glossaryHref('binding')}>binding</a> replays the emphasis.</p>
 * ```
 *
 * A definition is one to three sentences, in the second person. Text between backticks is shown as inline code.
 */
export type MotionTerm = {
  /** The term as the documentation writes it. */
  term: string;
  /** The end of the anchor: the term is defined at `#term-<slug>`. */
  slug: string;
  /** Other words that mean the same term, so that `glossaryHref` finds it by them too (a plural, a verb form). */
  aliases?: readonly string[];
  /** The definition. Text between backticks is inline code. */
  definition: string;
  /** The page that tells more, if any. */
  see?: { label: string; href: string };
};

/** The page that holds the glossary. */
export const GLOSSARY_PAGE = '/motion/glossary';

/** Every term of the Animation section, in alphabetical order. */
export const MOTION_GLOSSARY: readonly MotionTerm[] = [
  {
    term: 'at rest',
    slug: 'at-rest',
    aliases: ['rest', 'resting'],
    definition:
      'The state of an element once its motion has ended. Each field that ends at its neutral value (`opacity` 1, `x` and `y` 0, `scale` 1, `rotate` 0) leaves the inline style, so your stylesheet and classes such as `hover:scale-105` apply again.',
  },
  {
    term: 'backend',
    slug: 'backend',
    aliases: ['backends'],
    definition:
      'The engine that plays an animation: `waapi`, the Web Animations API of the browser; `css`, CSS animations; or `animejs`, the anime.js library. The runtime plays its motions with the Web Animations API. The word matters when you call a provider, or `resolveSpring()`, which picks the curve that a backend supports.',
    see: { label: 'Springs and tokens', href: '/motion/tokens' },
  },
  {
    term: 'binding',
    slug: 'binding',
    aliases: ['bindings', 'bound', 'bind'],
    definition:
      'The link between one element and one motion, made when you attach the motion. It knows the kind, the verb and the presence of the element, and the handle of its last play. It replays, pauses, shows or hides the element, and `destroy()` removes the motion and the inline styles it wrote. `motion()` returns it, and `getMotion(element, kind)` finds it.',
    see: { label: 'API reference', href: '/motion/api' },
  },
  {
    term: 'channel',
    slug: 'channel',
    aliases: ['channels'],
    definition:
      'One of the two numbers of a pointer value defined with `axis: \'both\'`. The value writes one channel per axis, `--udx-motion-value-<name>-x` and `--udx-motion-value-<name>-y`, each on its own spring.',
    see: { label: 'Values', href: '/motion/values' },
  },
  {
    term: 'definition',
    slug: 'definition',
    aliases: ['define', 'defined', 'reference', 'references', 'as references'],
    definition:
      '`defineMotion(name, spec)` registers a motion under its name, for the whole page, and returns its reference: `{ name, spec }`. You attach a motion by its name or by its reference. Defining a name again with the same spec returns the same reference; with another spec, it throws. `@udixio/motion/presets` exports the reference of each preset.',
    see: { label: 'Presets and verbs', href: '/motion/presets' },
  },
  {
    term: 'development checks',
    slug: 'development-checks',
    aliases: ['development', 'development refuses', 'in development'],
    definition:
      'The checks that run while you develop. An invalid spec throws when you define it, and the console reports an unknown name, an exit that keeps focus with nowhere to send it, and a `--udx-motion` that names a motion of another kind; in HTML, it also reports a second motion of a kind the element already holds. They run where `process.env.NODE_ENV` is not `production`, and always in the `development` build that a bundler picks in development mode. A page without a bundler has them off: `connectMotion({ development: true })` turns the console reports on.',
    see: { label: 'Troubleshooting', href: '/motion/troubleshooting#development-checks' },
  },
  {
    term: 'emphasis',
    slug: 'emphasis',
    aliases: ['emphases', 'emphasize'],
    definition:
      'A motion of the verb `emphasize`: a short move that draws attention to an element that stays in place, such as a press or a shake. It replays from its first keyframe each time you trigger it.',
    see: { label: 'Draw attention', href: '/motion/emphasis' },
  },
  {
    term: 'entry and exit',
    slug: 'entry-and-exit',
    aliases: ['entry', 'entries', 'exit', 'exits', 'enter', 'leave'],
    definition:
      'The two halves of a presence. The entry plays when the element is shown or inserted. The exit plays when it is hidden or removed: the element stays on the page, `inert`, until the exit has ended. In this documentation, an entry is always the entry of a presence: the path you import a part of the package from is its import path.',
    see: { label: 'Show and hide', href: '/motion/presence' },
  },
  {
    term: 'gesture',
    slug: 'gesture',
    aliases: ['gestures'],
    definition:
      'A way to move an element with the pointer, with a keyboard alternative. You define it with `defineGesture`, whose `kind` option names it: `drag`, `swipe` or `reorder`. You attach it as you attach a motion. An element carries one gesture at a time.',
    see: { label: 'Drag, swipe, reorder', href: '/motion/gestures' },
  },
  {
    term: 'handle',
    slug: 'handle',
    aliases: ['handles'],
    definition:
      'The control of one motion while it plays: `pause()`, `play()`, `reverse()`, `seek()` and `cancel()`, its `duration` and `currentTime`, and `finished`, a promise that resolves to `\'finished\'` or `\'cancelled\'` and never rejects. A binding gives the handle of its last play as `handle`.',
    see: { label: 'API reference', href: '/motion/api' },
  },
  {
    term: 'import path',
    slug: 'import-path',
    aliases: ['import paths', 'subpath', 'presets import path'],
    definition:
      'The path you import a part of the package from, such as `@udixio/motion/value` or `@udixio/motion/presets`. `@udixio/motion` does not contain the others, so a page loads only what it uses. The API reference lists every import path with its exports.',
    see: { label: 'API reference', href: '/motion/api#entries' },
  },
  {
    term: 'interrupt',
    slug: 'interrupt',
    aliases: ['carry', 'restart'],
    definition:
      'What a motion does when it is triggered again while it still plays. With `restart`, it plays again from its first keyframe. With `carry`, it goes on from where the element is. Emphasis and layout motions take the option.',
  },
  {
    term: 'keyframes',
    slug: 'keyframes',
    aliases: ['keyframe', 'field', 'fields', 'frame', 'frames'],
    definition:
      'The visual states a motion goes through, from the first to the last. Each keyframe sets fields: `opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY` and `rotate`, plus `draw` and `along` for SVG. A layout motion has none. For any other CSS property, use `animateStyle`.',
    see: { label: 'Presets and verbs', href: '/motion/presets' },
  },
  {
    term: 'kind',
    slug: 'kind',
    aliases: ['kinds'],
    definition:
      'The group of a verb: presence (`appear`, `disappear`), emphasis (`emphasize`), view (`reveal`, `scrub`), loop (`loop`) and layout (`layout`). An element holds at most one motion of each kind, and `getMotion(element, kind)` reads it. The `kind` option of `defineGesture` is another thing: it names the gesture, `drag`, `swipe` or `reorder`, and a gesture has no verb.',
  },
  {
    term: 'loop',
    slug: 'loop',
    aliases: ['loops'],
    definition:
      'A motion of the verb `loop`. It plays forever from the moment it is bound, and pauses by itself while its element is out of view or its tab is hidden. Its definition says how the page lets people pause it: `pause: \'control\'` or `pause: \'essential\'` with a `reason`.',
    see: { label: 'Loop, and pause it', href: '/motion/loop' },
  },
  {
    term: 'motion',
    slug: 'motion',
    aliases: ['motions'],
    definition:
      'A named description of how an element moves: a verb, keyframes and options such as a timing. You define it once and attach it to as many elements as you need.',
  },
  {
    term: 'policy',
    slug: 'policy',
    aliases: ['reduced motion', 'reduced-motion policy'],
    definition:
      'The reduced-motion rule that every motion follows. Motion is reduced when `<html data-motion-policy="reduce">` is set, or else when the system asks for it (`prefers-reduced-motion: reduce`). Each verb then has its reduced render: an entry or an exit becomes a short fade, an emphasis shows its end frame, a reveal shows at once, a scrub stays still and a loop does not play.',
    see: { label: 'Reduced motion', href: '/motion/accessibility' },
  },
  {
    term: 'presence',
    slug: 'presence',
    aliases: ['presences'],
    definition:
      'Whether an element is on the page, and the kind of the motions that show it: the verbs `appear` and `disappear`. Showing the element plays its entry, and hiding or removing it plays its exit first. While it is bound, the element carries `data-motion-presence`: `entering`, `present` or `exiting`.',
    see: { label: 'Show and hide', href: '/motion/presence' },
  },
  {
    term: 'preset',
    slug: 'preset',
    aliases: ['presets'],
    definition:
      'A motion that the library has already defined. Importing `@udixio/motion/presets` defines thirteen of them, such as `fade`, `slide`, `press` and `reflow`, so that you can name them on an element.',
    see: { label: 'Presets and verbs', href: '/motion/presets' },
  },
  {
    term: 'provider',
    slug: 'provider',
    aliases: ['providers', 'raw provider'],
    definition:
      'A low-level player for one backend: `waapiProvider`, `cssProvider` or `animejsProvider`, each from its import path under `@udixio/motion/providers/`. Its `animate()` plays keyframes on an element and returns a handle, and that is all: no name, no binding, no reduced-motion policy. Apply the policy yourself before you call it. The runtime does not need a provider from you.',
    see: { label: 'API reference', href: '/motion/api' },
  },
  {
    term: 'reflow',
    slug: 'reflow',
    aliases: ['layout motion', 'layout'],
    definition:
      'The preset of the verb `layout`. A layout motion has no keyframes: when the layout around the element changes, the element moves from its old box to its new one, and nothing is left inline at the end.',
    see: { label: 'Move to a new place', href: '/motion/layout' },
  },
  {
    term: 'runtime',
    slug: 'runtime',
    definition:
      'The code of `@udixio/motion` that plays the motions. There is one per page, shared by every copy of the package and every framework adapter: it holds the definitions, the reduced-motion policy and the frame loop. In HTML, `connectMotion()` connects your page to it.',
  },
  {
    term: 'scheme',
    slug: 'scheme',
    aliases: ['schemes', 'expressive', 'standard'],
    definition:
      'The set of spring values the tokens take: `expressive`, the default, or `standard`. In the expressive scheme the fast spatial spring overshoots by about 9.5 %; in the standard one, the spatial springs overshoot by about 0.15 %. `data-motion-scheme="standard"` on `<html>` selects the standard scheme for the runtime and for the stylesheet; `defineTokens({ scheme })` chooses it for the values you read in TypeScript.',
    see: { label: 'Springs and tokens', href: '/motion/tokens' },
  },
  {
    term: 'scope',
    slug: 'scope',
    aliases: ['scopes', 'layout scope'],
    definition:
      'The part of the page that a layout motion watches: the closest ancestor with `data-motion-scope`, or else the parent of the element. A change outside the scope does not move the element. The import path `@udixio/motion/scope` is a different thing: its `inspect()` and `revert()` act on every motion under a root element.',
    see: { label: 'Move to a new place', href: '/motion/layout' },
  },
  {
    term: 'sequence',
    slug: 'sequence',
    aliases: ['sequences'],
    definition:
      'Steps played on the children of one root, on one timeline, with one handle. You define it with `defineSequence`, and each child names its step with `data-motion-step`.',
    see: { label: 'Choreograph steps', href: '/motion/sequences' },
  },
  {
    term: 'settled',
    slug: 'settled',
    aliases: ['settle'],
    definition:
      'A present element that is bound as already in place: no entry plays. `connectMotion()` settles the elements that are on the page when it connects. React settles server-rendered content when it hydrates, and Angular marks its server render so that it is settled; in Svelte, pass `settled: true`.',
  },
  {
    term: 'shared identity',
    slug: 'shared-identity',
    aliases: ['shared'],
    definition:
      'A key that two layout motions share, given with the `shared` option (`data-motion-shared` in HTML). When one element leaves and the other appears, the new one morphs from the place and size of the old one. `shared` is an option of the verb `layout`, not a verb.',
    see: { label: 'Morph one into another', href: '/motion/shared-elements' },
  },
  {
    term: 'spatial and effects springs',
    slug: 'spatial-effects',
    aliases: ['spatial', 'effects', 'spatial spring', 'effects spring', 'spring', 'springs'],
    definition:
      'The two families of spring tokens, each fast, default or slow. Spatial springs move position, scale and rotation, and may overshoot a little: the fast one by about 9.5 %. Effects springs change opacity and the drawn stroke of a shape, and never overshoot. By default, an `appear` motion moves its spatial fields on the default spatial spring, and its opacity on the default effects spring.',
    see: { label: 'Springs and tokens', href: '/motion/tokens' },
  },
  {
    term: 'split',
    slug: 'split',
    definition:
      'An option that cuts the text of the element into `words`, `chars` or `lines`, and plays the keyframes on each piece, one after another. It applies to `appear`, `disappear` and `reveal`. It is an option, not a verb.',
    see: { label: 'Animate text', href: '/motion/text' },
  },
  {
    term: 'stagger',
    slug: 'stagger',
    aliases: ['cascade', 'staggered'],
    definition:
      'The delay between elements that enter together: `tight`, `normal` or `loose`, 20, 50 and 100 ms by default. They start one after another, in visual order, from the side that `origin` names. It applies to `appear`, `disappear` and `reveal`.',
    see: { label: 'Make a list appear', href: '/motion/lists' },
  },
  {
    term: 'token',
    slug: 'token',
    aliases: ['tokens'],
    definition:
      'A named value of the motion system, shared with the components: springs such as `spring.fast.spatial`, durations such as `duration.medium2`, easings, distances and stagger steps. A motion names its timing with a token, and the tokens are also CSS variables, `--udx-motion-…`.',
    see: { label: 'Springs and tokens', href: '/motion/tokens' },
  },
  {
    term: 'trigger',
    slug: 'trigger',
    aliases: ['triggers', 'triggered'],
    definition:
      'What makes a bound motion play. A presence plays when the element is shown or hidden; an emphasis, when its state changes or you call `play()`; a reveal, when the element enters the view; a scrub, as the page scrolls; a layout, when the layout around the element changes. A loop starts as soon as it is bound.',
  },
  {
    term: 'value',
    slug: 'value',
    aliases: ['values'],
    definition:
      'A number that follows a source (the pointer, the scroll, a state you set, or time) and is written on the element as a CSS variable, `--udx-motion-value-<name>`. A value is not a motion: your CSS decides what the number changes.',
    see: { label: 'Values', href: '/motion/values' },
  },
  {
    term: 'verb',
    slug: 'verb',
    aliases: ['verbs'],
    definition:
      'What a motion does, and so what triggers it: `appear`, `disappear`, `emphasize`, `reveal`, `scrub`, `loop` or `layout`. Every definition names one.',
  },
  {
    term: 'view motion',
    slug: 'view-motion',
    aliases: ['view', 'reveal', 'scrub'],
    definition:
      'A motion that the viewport drives. A reveal (`reveal`) plays when the element scrolls into view, and a scrub (`scrub`) follows the scroll position. Both are of the kind view, so an element holds one of the two.',
    see: { label: 'Reveal on scroll', href: '/motion/reveal' },
  },
];

/** The anchor id of a term: `term-<slug>`. */
export function glossaryAnchor(term: MotionTerm): string {
  return `term-${term.slug}`;
}

/** The terms by every word that names them (term, slug and aliases), in lower case. */
const BY_WORD = new Map<string, MotionTerm>();
for (const entry of MOTION_GLOSSARY) {
  for (const word of [entry.term, entry.slug, ...(entry.aliases ?? [])]) {
    const key = word.toLowerCase();
    if (!BY_WORD.has(key)) BY_WORD.set(key, entry);
  }
}

/** The term a word names, by its term, its slug or one of its aliases, ignoring case. */
export function findTerm(word: string): MotionTerm | undefined {
  return BY_WORD.get(word.toLowerCase());
}

/**
 * The link to the definition of a term: `/motion/glossary#term-<slug>`.
 * @param word - The term, its slug or one of its aliases, in any case.
 * @returns The link; throws for a word the glossary does not define, so that a typo fails the build.
 */
export function glossaryHref(word: string): string {
  const entry = findTerm(word);
  if (!entry) throw new Error(`motion-glossary: "${word}" is not a term of the glossary`);
  return `${GLOSSARY_PAGE}#${glossaryAnchor(entry)}`;
}

/** Every term with its anchor and link, for a page that lists them or a check that tests them. */
export const GLOSSARY_ANCHORS: readonly { term: string; anchor: string; href: string }[] = MOTION_GLOSSARY.map(
  (entry) => ({ term: entry.term, anchor: glossaryAnchor(entry), href: `${GLOSSARY_PAGE}#${glossaryAnchor(entry)}` }),
);
