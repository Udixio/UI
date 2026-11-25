import type { NavSection } from '@/components/Sidebar';

/**
 * The sections of the Animation side panel, in order, by mechanism: how to start, complete recipes, the motions (verbs, in
 * dependency order), the other families, the direct functions, the system that tunes every motion, and the reference.
 */
export type MotionSection =
  | 'Start'
  | 'Recipes'
  | 'Motions'
  | 'Values, gestures, sequences'
  | 'Functions'
  | 'System'
  | 'Reference';

/** One page of the Animation section, as the side panel, the root page and the related cards see it. */
export type MotionNeed = {
  /** The page slug; empty for the overview. */
  slug: string;
  /**
   * The side-panel label and the page's H1: the concept word the API and its errors use (Presence, Layout, Shared
   * elements), 24 characters at most.
   */
  label: string;
  /**
   * The need the page answers, in the reader's words ("Show and hide", "Draw attention"): the page's subtitle, under its
   * H1, and the card's title in the root page's gallery. A page with no need of its own (a start or reference page) has none.
   */
  need?: string;
  section: MotionSection;
  href: string;
  /**
   * The API chips of the page; the root page's gallery and the related cards show the first one. One vocabulary: a chip is
   * the function a developer calls first for the need. `defineMotion`, which nine needs start from, is followed by the word
   * of its spec that makes the need (`defineMotion · reveal`, `defineMotion · stagger`), and `defineValue` likewise
   * (`defineValue · format`). No presets, attributes, CSS variables or token names: a need with no function of its own
   * (per breakpoint, reduced motion) has no chip.
   */
  hints: string[];
  /** One sentence for the root page and the related cards. */
  summary: string;
  /** Two or three related slugs; empty for the start and reference pages. */
  related: string[];
  /** The scene module of the page's hero; a need of the root page's gallery has one, the start and reference pages none. */
  scene?: string;
  /**
   * `false` keeps the page out of the side panel: a page reached by its URL only (the roadmap), or a need that is a section
   * of another page (its `href` carries the anchor), which keeps its card in the root page's gallery.
   */
  nav?: false;
};

/** The page that introduces a section, when it has one: the header of each page of the section links to it. */
export const SECTION_LANDINGS: Partial<Record<MotionSection, string>> = {
  Recipes: '/motion/recipes',
};

const SECTION_ORDER: MotionSection[] = [
  'Start',
  'Recipes',
  'Motions',
  'Values, gestures, sequences',
  'Functions',
  'System',
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
    hints: ['defineMotion'],
    summary: 'A first motion in four steps: install the package, define a motion, attach it to a toast, and see it play.',
    related: [],
  },
  {
    slug: 'how-it-works',
    label: 'How it works',
    section: 'Start',
    href: '/motion/how-it-works',
    hints: [],
    summary: 'Define, attach, trigger, play: the parts of the library, its seven verbs, what an element can carry, and the words the rest of the documentation uses.',
    related: ['choosing-an-api', 'getting-started'],
  },
  {
    slug: 'choosing-an-api',
    label: 'Choosing an API',
    section: 'Start',
    href: '/motion/choosing-an-api',
    hints: [],
    summary: 'When two parts of the library answer the same need, which one to take: a motion or animateStyle, <Motion> or useMotion, a loop, a scroll effect, a cascade.',
    related: ['how-it-works'],
  },
  {
    slug: 'recipes',
    label: 'Recipes',
    section: 'Recipes',
    href: '/motion/recipes',
    hints: [],
    summary: 'A dialog, toasts, an accordion, a tab indicator and a navigation menu, each complete in HTML, React, Angular and Svelte.',
    related: [],
    nav: false,
  },
  {
    slug: 'recipes/dialog',
    label: 'Dialog',
    need: 'Confirm in a modal dialog',
    section: 'Recipes',
    href: '/motion/recipes/dialog',
    hints: [],
    summary: 'Ask for a confirmation in a dialog that enters over a scrim, and give focus back to the button that opened it when it leaves.',
    related: ['presence', 'accessibility', 'recipes/toasts'],
  },
  {
    slug: 'recipes/toasts',
    label: 'Toasts',
    need: 'Queue short messages',
    section: 'Recipes',
    href: '/motion/recipes/toasts',
    hints: [],
    summary: 'Show short messages that enter one after the other, leave after four seconds or when you undo, and let the others close the gap.',
    related: ['lists', 'presence', 'recipes/dialog'],
  },
  {
    slug: 'recipes/accordion',
    label: 'Accordion',
    need: 'Open answers in place',
    section: 'Recipes',
    href: '/motion/recipes/accordion',
    hints: [],
    summary: 'Open one answer at a time in place, while every answer stays in the page for search engines and assistants.',
    related: ['presence', 'layout', 'recipes/navigation-menu'],
  },
  {
    slug: 'recipes/tab-indicator',
    label: 'Tab indicator',
    need: 'Move the indicator between tabs',
    section: 'Recipes',
    href: '/motion/recipes/tab-indicator',
    hints: [],
    summary: 'Move the indicator from the tab you leave to the tab you choose, and keep every panel in the page.',
    related: ['shared-elements', 'layout', 'recipes/accordion'],
  },
  {
    slug: 'recipes/navigation-menu',
    label: 'Navigation menu',
    need: 'Open submenus of links',
    section: 'Recipes',
    href: '/motion/recipes/navigation-menu',
    hints: [],
    summary: 'Open submenus of links that grow from their trigger, while their links stay in the page for crawlers.',
    related: ['presence', 'accessibility', 'recipes/tab-indicator'],
  },
  {
    slug: 'presence',
    label: 'Presence',
    need: 'Show and hide',
    section: 'Motions',
    href: '/motion/presence',
    hints: ['defineMotion · appear'],
    summary: 'Set the hidden attribute and the exit plays before the element is gone; insert an element and its entry plays.',
    related: ['lists', 'emphasis', 'accessibility'],
    scene: 'presence',
  },
  {
    slug: 'emphasis',
    label: 'Emphasis',
    need: 'Draw attention',
    section: 'Motions',
    href: '/motion/emphasis',
    hints: ['defineMotion · emphasize'],
    summary: 'A short motion that replays on each change of state: a press, or a shake when a value is wrong.',
    related: ['presence', 'values', 'accessibility'],
    scene: 'emphasis',
  },
  {
    slug: 'layout',
    label: 'Layout',
    need: 'Move to a new place',
    section: 'Motions',
    href: '/motion/layout',
    hints: ['defineMotion · layout'],
    summary: 'An element that changes its place or its size travels to the new one, and its content keeps its shape.',
    related: ['shared-elements', 'lists', 'gestures'],
    scene: 'resize',
  },
  {
    slug: 'lists',
    label: 'Lists',
    need: 'Make a list appear',
    section: 'Motions',
    href: '/motion/lists',
    hints: ['defineMotion · stagger'],
    summary: 'Items added together cascade in visual order; a leaving item lets its neighbours close the gap.',
    related: ['presence', 'layout', 'shared-elements'],
    scene: 'inbox',
  },
  {
    slug: 'shared-elements',
    label: 'Shared elements',
    need: 'Morph one into another',
    section: 'Motions',
    href: '/motion/shared-elements',
    hints: ['defineMotion · shared'],
    summary: 'Elements that share a key travel from one to the other: a thumbnail opens into its detail and closes back.',
    related: ['layout', 'svg', 'page-transitions'],
    scene: 'gallery',
  },
  {
    slug: 'reveal',
    label: 'Reveal',
    need: 'Reveal on scroll',
    section: 'Motions',
    href: '/motion/reveal',
    hints: ['defineMotion · reveal'],
    summary: 'Waits in its first frame until it enters the view, then plays once; with repeat, it plays on each entry.',
    related: ['scrub', 'counters', 'scroll'],
    scene: 'reveal',
  },
  {
    slug: 'scrub',
    label: 'Scrub',
    need: 'Link to the scroll',
    section: 'Motions',
    href: '/motion/scrub',
    hints: ['defineMotion · scrub'],
    summary: 'Runs a motion as the page scrolls, from its first frame to its last, in browsers that have scroll timelines.',
    related: ['reveal', 'values', 'scroll'],
    scene: 'thread',
  },
  {
    slug: 'loop',
    label: 'Loop',
    need: 'Loop, and pause it',
    section: 'Motions',
    href: '/motion/loop',
    hints: ['defineMotion · loop'],
    summary: 'Plays forever, rests off-screen, and always comes with a way to pause it.',
    related: ['accessibility', 'svg', 'emphasis'],
    scene: 'loop',
  },
  {
    slug: 'text',
    label: 'Text',
    need: 'Animate text',
    section: 'Motions',
    href: '/motion/text',
    hints: ['defineMotion · split'],
    summary: 'The text is split into words, characters or lines, and each piece plays in turn; it is read once, in full.',
    related: ['sequences', 'reveal', 'counters'],
    scene: 'text',
  },
  {
    slug: 'svg',
    label: 'SVG',
    need: 'Draw or morph SVG',
    section: 'Motions',
    href: '/motion/svg',
    hints: ['defineMotion · draw', 'morph'],
    summary: 'A stroke is drawn, a dot travels along a path, and one path morphs into another.',
    related: ['sequences', 'shared-elements', 'loop'],
    scene: 'svg',
  },
  {
    slug: 'values',
    label: 'Values',
    need: 'Follow pointer or state',
    section: 'Values, gestures, sequences',
    href: '/motion/values',
    hints: ['defineValue'],
    summary: 'A continuous value, from the pointer, the scroll, a state or the time, is written to a CSS variable.',
    related: ['gestures', 'scrub', 'sequences'],
    scene: 'pointer',
  },
  {
    slug: 'counters',
    label: 'Counters',
    need: 'Count a number',
    section: 'Values, gestures, sequences',
    href: '/motion/values#counters',
    hints: ['defineValue · format'],
    summary: 'A formatted value that counts to each new number; screen readers get the final one.',
    related: ['reveal', 'text', 'values'],
    scene: 'counters',
    nav: false,
  },
  {
    slug: 'gestures',
    label: 'Gestures',
    need: 'Drag, swipe, reorder',
    section: 'Values, gestures, sequences',
    href: '/motion/gestures',
    hints: ['defineGesture'],
    summary: 'Drag an element, swipe it away or reorder a list, each with a keyboard alternative.',
    related: ['layout', 'values', 'lists'],
    scene: 'gestures',
  },
  {
    slug: 'sequences',
    label: 'Sequences',
    need: 'Choreograph steps',
    section: 'Values, gestures, sequences',
    href: '/motion/sequences',
    hints: ['defineSequence'],
    summary: 'Steps that play in order from one root, with one handle to play, pause and seek them.',
    related: ['reveal', 'text', 'svg'],
    scene: 'launch',
  },
  {
    slug: 'animate',
    label: 'animateStyle and springs',
    need: 'Animate any CSS',
    section: 'Functions',
    href: '/motion/animate',
    hints: ['animateStyle'],
    summary: 'Animates any CSS property over a token\'s timing, or follows a moving target over a spring.',
    related: ['tokens', 'values', 'per-breakpoint'],
    scene: 'animate',
  },
  {
    slug: 'scroll',
    label: 'scrollTo',
    need: 'Scroll to a target',
    section: 'Functions',
    href: '/motion/scroll',
    hints: ['scrollTo'],
    summary: 'Scrolls to a target over a spring; the visitor\'s own scrolling stops it.',
    related: ['reveal', 'scrub', 'page-transitions'],
    scene: 'scroll',
  },
  {
    slug: 'page-transitions',
    label: 'Page transitions',
    need: 'Change pages',
    section: 'Functions',
    href: '/motion/page-transitions',
    hints: ['navigate'],
    summary: 'The page slides forward or back with the direction of navigation, through navigate() or Astro\'s client router.',
    related: ['shared-elements', 'scroll', 'accessibility'],
    scene: 'pages',
  },
  {
    slug: 'tokens',
    label: 'Tokens',
    need: 'Springs and tokens',
    section: 'System',
    href: '/motion/tokens',
    hints: ['defineMotion · timing'],
    summary: 'Springs, durations and easings are named tokens: a motion refers to them by name instead of by value.',
    related: ['per-breakpoint', 'animate', 'accessibility'],
    scene: 'springs',
  },
  {
    slug: 'presets',
    label: 'Presets',
    need: 'Attach a motion without defining it',
    section: 'System',
    href: '/motion/presets',
    hints: ['defineMotion'],
    summary: 'The seven verbs describe what a motion does; presets are named motions you can attach without defining them.',
    related: ['presence', 'emphasis', 'tokens'],
  },
  {
    slug: 'accessibility',
    label: 'Accessibility',
    need: 'Reduced motion',
    section: 'System',
    href: '/motion/accessibility',
    hints: [],
    summary: 'Under the reduced-motion policy an appearance becomes a short fade, a reveal shows at once, and a loop does not play.',
    related: ['per-breakpoint', 'loop', 'tokens'],
    scene: 'policy',
  },
  {
    slug: 'per-breakpoint',
    label: 'Per breakpoint',
    need: 'Change the motion per screen size',
    section: 'System',
    href: '/motion/per-breakpoint',
    hints: [],
    summary: 'Sets the motion of an element per breakpoint through a CSS variable, so a phone and a desktop can play different ones.',
    related: ['tokens', 'accessibility', 'animate'],
    scene: 'scopes',
  },
  {
    slug: 'loading-and-weight',
    label: 'Loading and weight',
    need: 'What a page downloads, and when',
    section: 'System',
    href: '/motion/loading-and-weight',
    hints: [],
    summary: 'What each import path and each adapter weighs, measured, when it loads, and which browser releases have each feature the package falls back from.',
    related: ['getting-started', 'api'],
  },
  {
    slug: 'api',
    label: 'API',
    section: 'Reference',
    href: '/motion/api',
    hints: [],
    summary: 'Every export of @udixio/motion and of its adapters, grouped by task: signature, options, defaults and the import path to take it from.',
    related: [],
  },
  {
    slug: 'glossary',
    label: 'Glossary',
    section: 'Reference',
    href: '/motion/glossary',
    hints: [],
    summary: 'The words of the library, each with its meaning and where it shows up: binding, handle, presence, emphasis, kind, token and the others.',
    related: ['how-it-works'],
  },
  {
    slug: 'troubleshooting',
    label: 'Troubleshooting',
    section: 'Reference',
    href: '/motion/troubleshooting',
    hints: [],
    summary: 'What to check when nothing animates, text stretches, focus is lost or an entry replays: each symptom with its cause and its fix.',
    related: [],
  },
  {
    slug: 'inspect',
    label: 'Inspect and revert',
    need: 'Read and tear down the motions of a page',
    section: 'Reference',
    href: '/motion/inspect',
    hints: ['inspect', 'revert'],
    summary: 'inspect() reports what plays on a page or a section, in development; revert() tears a section\'s motions down.',
    related: [],
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
    nav: false,
  },
];

/** The side panel of the Animation section: its pages, grouped by section. */
export const MOTION_SECTIONS: NavSection[] = SECTION_ORDER.map((category) => ({
  category,
  pages: MOTION_NEEDS.filter((need) => need.section === category && need.nav !== false).map(
    ({ slug, label, href }) => ({ slug, label, href }),
  ),
}));
