import type { NavSection } from '@/components/Sidebar';

/** The sections of the Animation side panel, in order. */
export type MotionSection =
  | 'Start'
  | 'Appear & leave'
  | 'Move'
  | 'Follow the scroll'
  | 'Respond & tell'
  | 'Fine-tune'
  | 'Reference';

/** One page of the Animation section, as the side panel, the root page and the related cards see it. */
export type MotionNeed = {
  /** The page slug; empty for the overview. */
  slug: string;
  /** The side-panel label, 24 characters at most. */
  label: string;
  section: MotionSection;
  href: string;
  /** The API names shown as chips on the page; the root page's gallery shows the first one. */
  hints: string[];
  /** One sentence for the root page and the related cards. */
  summary: string;
  /** Two or three related slugs; empty for the start and reference pages. */
  related: string[];
  /** The scene module of the page's hero; a need of the root page's gallery has one, the start and reference pages none. */
  scene?: string;
};

const SECTION_ORDER: MotionSection[] = [
  'Start',
  'Appear & leave',
  'Move',
  'Follow the scroll',
  'Respond & tell',
  'Fine-tune',
  'Reference',
];

/** Every page of the Animation section, in the order of the side panel. */
export const MOTION_NEEDS: MotionNeed[] = [
  {
    slug: '',
    label: 'Overview',
    section: 'Start',
    href: '/motion',
    hints: [],
    summary: 'What @udixio/motion does, need by need, with a live example of each.',
    related: [],
  },
  {
    slug: 'getting-started',
    label: 'Getting started',
    section: 'Start',
    href: '/motion/getting-started',
    hints: ['connectMotion'],
    summary: 'Install the package, connect the runtime once, and attach a first motion by name.',
    related: ['presets', 'presence', 'accessibility'],
  },
  {
    slug: 'presets',
    label: 'Presets and verbs',
    section: 'Start',
    href: '/motion/presets',
    hints: ['defineMotion'],
    summary: 'The seven verbs describe what a motion does; presets are named motions you can attach without defining them.',
    related: ['presence', 'emphasis', 'tokens'],
  },
  {
    slug: 'presence',
    label: 'Show and hide',
    section: 'Appear & leave',
    href: '/motion/presence',
    hints: ['fade', 'slide', 'scale'],
    summary: 'Set the hidden attribute and the exit plays before the element is gone; insert an element and its entry plays.',
    related: ['lists', 'emphasis', 'accessibility'],
    scene: 'presence',
  },
  {
    slug: 'lists',
    label: 'Make a list appear',
    section: 'Appear & leave',
    href: '/motion/lists',
    hints: ['cascade', 'stagger'],
    summary: 'Items added together cascade in visual order; a leaving item lets its neighbours close the gap.',
    related: ['presence', 'layout', 'shared-elements'],
    scene: 'inbox',
  },
  {
    slug: 'emphasis',
    label: 'Draw attention',
    section: 'Appear & leave',
    href: '/motion/emphasis',
    hints: ['press', 'shake'],
    summary: 'A short motion that replays on each change of state: a press, or a shake when a value is wrong.',
    related: ['presence', 'values', 'accessibility'],
    scene: 'emphasis',
  },
  {
    slug: 'layout',
    label: 'Move to a new place',
    section: 'Move',
    href: '/motion/layout',
    hints: ['reflow'],
    summary: 'An element that changes its place or its size travels to the new one, and its content keeps its shape.',
    related: ['shared-elements', 'lists', 'gestures'],
    scene: 'resize',
  },
  {
    slug: 'shared-elements',
    label: 'Morph one into another',
    section: 'Move',
    href: '/motion/shared-elements',
    hints: ['data-motion-shared'],
    summary: 'Elements that share a key travel from one to the other: a thumbnail opens into its detail and closes back.',
    related: ['layout', 'svg', 'page-transitions'],
    scene: 'gallery',
  },
  {
    slug: 'gestures',
    label: 'Drag, swipe, reorder',
    section: 'Move',
    href: '/motion/gestures',
    hints: ['defineGesture'],
    summary: 'Drag an element, swipe it away or reorder a list, each with a keyboard alternative.',
    related: ['layout', 'values', 'lists'],
    scene: 'gestures',
  },
  {
    slug: 'page-transitions',
    label: 'Change pages',
    section: 'Move',
    href: '/motion/page-transitions',
    hints: ['navigate'],
    summary: 'The page slides forward or back with the direction of navigation, through navigate() or Astro\'s client router.',
    related: ['shared-elements', 'scroll', 'accessibility'],
    scene: 'pages',
  },
  {
    slug: 'reveal',
    label: 'Reveal on scroll',
    section: 'Follow the scroll',
    href: '/motion/reveal',
    hints: ['rise'],
    summary: 'Waits in its first frame until it enters the view, then plays once; with repeat, it plays on each entry.',
    related: ['scrub', 'counters', 'scroll'],
    scene: 'reveal',
  },
  {
    slug: 'scrub',
    label: 'Link to the scroll',
    section: 'Follow the scroll',
    href: '/motion/scrub',
    hints: ['parallax'],
    summary: 'Runs a motion as the page scrolls, from its first frame to its last, in browsers that have scroll timelines.',
    related: ['reveal', 'values', 'scroll'],
    scene: 'thread',
  },
  {
    slug: 'scroll',
    label: 'Scroll to a target',
    section: 'Follow the scroll',
    href: '/motion/scroll',
    hints: ['scrollTo'],
    summary: 'Scrolls to a target over a spring; the visitor\'s own scrolling stops it.',
    related: ['reveal', 'scrub', 'page-transitions'],
    scene: 'scroll',
  },
  {
    slug: 'values',
    label: 'Follow pointer or state',
    section: 'Respond & tell',
    href: '/motion/values',
    hints: ['defineValue'],
    summary: 'A continuous value, from the pointer, the scroll, a state or the time, is written to a CSS variable.',
    related: ['gestures', 'scrub', 'counters'],
    scene: 'pointer',
  },
  {
    slug: 'counters',
    label: 'Count a number',
    section: 'Respond & tell',
    href: '/motion/counters',
    hints: ['format'],
    summary: 'A formatted value that counts to each new number; screen readers get the final one.',
    related: ['reveal', 'text', 'values'],
    scene: 'counters',
  },
  {
    slug: 'sequences',
    label: 'Choreograph steps',
    section: 'Respond & tell',
    href: '/motion/sequences',
    hints: ['defineSequence'],
    summary: 'Steps that play in order from one root, with one handle to play, pause and seek them.',
    related: ['reveal', 'text', 'svg'],
    scene: 'launch',
  },
  {
    slug: 'text',
    label: 'Animate text',
    section: 'Respond & tell',
    href: '/motion/text',
    hints: ['split'],
    summary: 'The text is split into words, characters or lines, and each piece plays in turn; it is read once, in full.',
    related: ['sequences', 'reveal', 'counters'],
    scene: 'text',
  },
  {
    slug: 'svg',
    label: 'Draw or morph SVG',
    section: 'Respond & tell',
    href: '/motion/svg',
    hints: ['draw', 'morph'],
    summary: 'A stroke is drawn, a dot travels along a path, and one path morphs into another.',
    related: ['sequences', 'shared-elements', 'loop'],
    scene: 'svg',
  },
  {
    slug: 'loop',
    label: 'Loop, and pause it',
    section: 'Respond & tell',
    href: '/motion/loop',
    hints: ['rotate', 'breathe'],
    summary: 'Plays forever, rests off-screen, and always comes with a way to pause it.',
    related: ['accessibility', 'svg', 'emphasis'],
    scene: 'loop',
  },
  {
    slug: 'tokens',
    label: 'Springs and tokens',
    section: 'Fine-tune',
    href: '/motion/tokens',
    hints: ['spring.*'],
    summary: 'Springs, durations and easings are named tokens: a motion refers to them by name instead of by value.',
    related: ['scopes', 'animate', 'accessibility'],
    scene: 'springs',
  },
  {
    slug: 'scopes',
    label: 'Per breakpoint',
    section: 'Fine-tune',
    href: '/motion/scopes',
    hints: ['--udx-motion'],
    summary: 'Sets the motion of an element per breakpoint through a CSS variable, so a phone and a desktop can play different ones.',
    related: ['tokens', 'accessibility', 'animate'],
    scene: 'scopes',
  },
  {
    slug: 'animate',
    label: 'Animate any CSS',
    section: 'Fine-tune',
    href: '/motion/animate',
    hints: ['animateStyle'],
    summary: 'Animates any CSS property over a token\'s timing, or follows a moving target over a spring.',
    related: ['tokens', 'values', 'scopes'],
    scene: 'animate',
  },
  {
    slug: 'accessibility',
    label: 'Reduced motion',
    section: 'Fine-tune',
    href: '/motion/accessibility',
    hints: ['data-motion-policy'],
    summary: 'Under the reduced-motion policy an appearance becomes a short fade, a reveal shows at once, and a loop does not play.',
    related: ['scopes', 'loop', 'tokens'],
    scene: 'policy',
  },
  {
    slug: 'limits',
    label: 'Limits',
    section: 'Reference',
    href: '/motion/limits',
    hints: [],
    summary: 'The current limits, family by family.',
    related: [],
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    section: 'Reference',
    href: '/motion/roadmap',
    hints: [],
    summary: 'The status of each family, and of the verification.',
    related: [],
  },
  {
    slug: 'manifest',
    label: 'Manifest (JSON)',
    section: 'Reference',
    href: '/motion-manifest.json',
    hints: [],
    summary: 'The contract of the package as JSON, for agents and tools: verbs, options, presets, tokens and exports.',
    related: [],
  },
];

/** The side panel of the Animation section: its pages, grouped by section. */
export const MOTION_SECTIONS: NavSection[] = SECTION_ORDER.map((category) => ({
  category,
  pages: MOTION_NEEDS.filter((need) => need.section === category).map(
    ({ slug, label, href }) => ({ slug, label, href }),
  ),
}));
