import type { NavSection } from '@/components/Sidebar';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';
import { FRAMEWORK_LABELS, FRAMEWORK_LINES } from './motion-facts.ts';

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

/** The tabs a feature page authors: its overview and its guide. */
export type AuthoredTab = 'overview' | 'guide';

/** The tabs a feature page can have: the authored ones, the API reference and the examples of its recipes. */
export type FeatureTab = AuthoredTab | 'api' | 'examples';

/** Every tab a feature can have, in the order of its tab header. */
export const FEATURE_TABS: readonly FeatureTab[] = [
  'overview',
  'guide',
  'api',
  'examples',
];

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
   * Whether the page has a reading in each framework (`/react/motion/…`). False on the neutral pages: the overview, the
   * glossary, the limits, the roadmap, loading and weight, and the API index.
   */
  perFramework: boolean;
  /** The tabs a feature page authors; a page without tabs is not a feature. */
  tabs?: readonly AuthoredTab[];
  /** The features a recipe uses: a feature's Examples tab lists the recipes that name it. */
  features?: readonly string[];
  /**
   * The API chips of the page; the root page's gallery and the related cards show the first one. One vocabulary: a chip is
   * the function a developer calls first for the need. `defineMotion`, which nine needs start from, is followed by the word
   * of its spec that makes the need (`defineMotion · reveal`, `defineMotion · stagger`), and `defineValue` likewise
   * (`defineValue · format`). No presets, attributes, CSS variables or token names: a need with no function of its own
   * (per breakpoint, reduced motion) has no chip.
   */
  hints: string[];
  /**
   * One sentence for the root page and the related cards, the same in every framework: what the reader gets, never the
   * syntax of one framework (an attribute, a component, a directive).
   */
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
    perFramework: false,
    hints: [],
    summary: 'What @udixio/motion does, need by need, with a live example of each.',
    related: [],
  },
  {
    slug: 'getting-started',
    label: 'Getting started',
    section: 'Start',
    href: '/motion/getting-started',
    perFramework: true,
    hints: ['defineMotion'],
    summary: 'A first motion in four steps: install the package, define a motion, attach it to a toast, and see it play.',
    related: [],
  },
  {
    slug: 'how-it-works',
    label: 'How it works',
    section: 'Start',
    href: '/motion/how-it-works',
    perFramework: true,
    hints: [],
    summary: 'Define, attach, trigger, play: the parts of the library, its seven verbs, what an element can carry, and the words the rest of the documentation uses.',
    related: ['choosing-an-api', 'getting-started'],
  },
  {
    slug: 'choosing-an-api',
    label: 'Choosing an API',
    section: 'Start',
    href: '/motion/choosing-an-api',
    perFramework: true,
    hints: [],
    summary: 'When two parts of the library answer the same need, which one to take: a motion or any CSS property, an element or a component, a preset or your own motion, a loop, a scroll effect, a cascade.',
    related: ['how-it-works'],
  },
  {
    slug: 'recipes',
    label: 'Recipes',
    section: 'Recipes',
    href: '/motion/recipes',
    perFramework: true,
    hints: [],
    summary: 'A dialog, toasts, an accordion, a tab indicator and a navigation menu, each complete in HTML, React, Angular and Svelte.',
    related: [],
    nav: false,
  },
  {
    slug: 'recipes/dialog',
    label: 'Dialog',
    need: 'Ask for a confirmation',
    section: 'Recipes',
    href: '/motion/recipes/dialog',
    perFramework: true,
    features: ['presence'],
    hints: [],
    summary: 'A dialog that enters over a scrim, and gives focus back to the button that opened it when it leaves.',
    related: ['presence', 'accessibility', 'recipes/toasts'],
  },
  {
    slug: 'recipes/toasts',
    label: 'Toasts',
    need: 'Queue short messages',
    section: 'Recipes',
    href: '/motion/recipes/toasts',
    perFramework: true,
    features: ['presence', 'lists'],
    hints: [],
    summary: 'Each message enters after the last, leaves after four seconds or on Undo, and the others close the gap.',
    related: ['lists', 'presence', 'recipes/dialog'],
  },
  {
    slug: 'recipes/accordion',
    label: 'Accordion',
    need: 'Open one answer at a time',
    section: 'Recipes',
    href: '/motion/recipes/accordion',
    perFramework: true,
    features: ['presence', 'layout'],
    hints: [],
    summary: 'Each answer opens in place, and every answer stays in the page for search engines and assistants.',
    related: ['presence', 'layout', 'recipes/navigation-menu'],
  },
  {
    slug: 'recipes/tab-indicator',
    label: 'Tab indicator',
    need: 'Follow the chosen tab',
    section: 'Recipes',
    href: '/motion/recipes/tab-indicator',
    perFramework: true,
    features: ['shared-elements', 'layout'],
    hints: [],
    summary: 'The indicator travels from the tab you leave to the tab you choose, and every panel stays in the page.',
    related: ['shared-elements', 'layout', 'recipes/accordion'],
  },
  {
    slug: 'recipes/navigation-menu',
    label: 'Navigation menu',
    need: 'Open submenus from a menu bar',
    section: 'Recipes',
    href: '/motion/recipes/navigation-menu',
    perFramework: true,
    features: ['presence'],
    hints: [],
    summary: 'Each submenu grows from its trigger, and its links stay in the page for search engines.',
    related: ['presence', 'accessibility', 'recipes/tab-indicator'],
  },
  {
    slug: 'presence',
    label: 'Presence',
    need: 'Show and hide',
    section: 'Motions',
    href: '/motion/presence',
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion · appear'],
    summary: 'An element that appears plays its entry, and an element that leaves plays its exit before it is gone.',
    related: ['lists', 'emphasis', 'accessibility'],
    scene: 'presence',
  },
  {
    slug: 'emphasis',
    label: 'Emphasis',
    need: 'Draw attention',
    section: 'Motions',
    href: '/motion/emphasis',
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion · shared'],
    summary: 'Elements that share a key travel from one to the other: a thumbnail opens into its detail and closes back.',
    related: ['layout', 'svg'],
    scene: 'gallery',
  },
  {
    slug: 'reveal',
    label: 'Reveal',
    need: 'Reveal on scroll',
    section: 'Motions',
    href: '/motion/reveal',
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion · reveal'],
    summary: 'Waits in its first frame until it enters the view, then plays once, or on each entry if you ask.',
    related: ['scrub', 'counters'],
    scene: 'reveal',
  },
  {
    slug: 'scrub',
    label: 'Scrub',
    need: 'Link to the scroll',
    section: 'Motions',
    href: '/motion/scrub',
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion · scrub'],
    summary: 'Runs a motion as the page scrolls, from its first frame to its last, in browsers that have scroll timelines.',
    related: ['reveal', 'values'],
    scene: 'thread',
  },
  {
    slug: 'loop',
    label: 'Loop',
    need: 'Loop, and pause it',
    section: 'Motions',
    href: '/motion/loop',
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
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
    perFramework: true,
    tabs: ['guide'],
    hints: ['animateStyle'],
    summary: 'Animates any CSS property over a token\'s timing, or follows a moving target over a spring.',
    related: ['tokens', 'values', 'per-breakpoint'],
    scene: 'animate',
  },
  {
    slug: 'tokens',
    label: 'Tokens',
    need: 'Give every motion the same timing',
    section: 'System',
    href: '/motion/tokens',
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion · timing'],
    summary: 'Springs, durations and easings are named tokens: a motion refers to them by name instead of by value.',
    related: ['per-breakpoint', 'animate', 'accessibility'],
    scene: 'springs',
  },
  {
    slug: 'presets',
    label: 'Presets',
    need: 'Use a ready-made motion',
    section: 'System',
    href: '/motion/presets',
    perFramework: true,
    tabs: ['guide'],
    hints: ['defineMotion'],
    summary: 'Thirteen motions come ready-made: name one on an element and it plays, by the same name in every framework.',
    related: ['presence', 'emphasis', 'tokens'],
  },
  {
    slug: 'accessibility',
    label: 'Accessibility',
    need: 'Respect reduced motion',
    section: 'System',
    href: '/motion/accessibility',
    perFramework: true,
    tabs: ['guide'],
    hints: [],
    summary: 'Under the reduced-motion policy an appearance becomes a short fade, a reveal shows at once, and a loop does not play.',
    related: ['per-breakpoint', 'loop', 'tokens'],
    scene: 'policy',
  },
  {
    slug: 'per-breakpoint',
    label: 'Per breakpoint',
    need: 'Adapt the motion to the screen size',
    section: 'System',
    href: '/motion/per-breakpoint',
    perFramework: true,
    tabs: ['guide'],
    hints: [],
    summary: 'An element can take another motion, or none, at each breakpoint, so a phone and a desktop can play different ones.',
    related: ['tokens', 'accessibility', 'animate'],
    scene: 'scopes',
  },
  {
    slug: 'loading-and-weight',
    label: 'Loading and weight',
    need: 'Know what it costs, and where it runs',
    section: 'System',
    href: '/motion/loading-and-weight',
    perFramework: false,
    hints: [],
    summary: 'What each import path and adapter weighs, gzipped, and when it loads; from which release of each browser a feature works, and what the package does in older ones.',
    related: ['getting-started', 'api'],
  },
  {
    slug: 'api',
    label: 'API',
    section: 'Reference',
    href: '/motion/api',
    perFramework: false,
    hints: [],
    summary: 'Every export of @udixio/motion and of its adapters, grouped by task: signature, options, defaults and the import path to take it from.',
    related: [],
  },
  {
    slug: 'glossary',
    label: 'Glossary',
    section: 'Reference',
    href: '/motion/glossary',
    perFramework: false,
    hints: [],
    summary: 'The words of the library, each with its meaning and where it shows up: binding, handle, presence, emphasis, kind, token and the others.',
    related: ['how-it-works'],
  },
  {
    slug: 'troubleshooting',
    label: 'Troubleshooting',
    section: 'Reference',
    href: '/motion/troubleshooting',
    perFramework: true,
    hints: [],
    summary: 'What to check when nothing animates, text stretches, focus is lost or an entry replays: each symptom with its cause and its fix.',
    related: [],
  },
  {
    slug: 'inspect',
    label: 'Inspect and revert',
    need: 'See the motions of a page, and remove them',
    section: 'Reference',
    href: '/motion/inspect',
    perFramework: true,
    tabs: ['guide'],
    hints: ['inspect', 'revert'],
    summary: 'Lists the motions of a page or a section and the state of each, in development, and removes them to leave each element as its stylesheet sets it.',
    related: [],
  },
  {
    slug: 'limits',
    label: 'Limits',
    section: 'Reference',
    href: '/motion/limits',
    perFramework: false,
    hints: [],
    summary: 'The current limits, family by family.',
    related: [],
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    section: 'Reference',
    href: '/motion/roadmap',
    perFramework: false,
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

/** What a tab adds to the title of its reading, and the sentence that opens its description. */
const TAB_WORDING: Record<FeatureTab, { word: string; lead?: string }> = {
  overview: { word: '' },
  guide: { word: ' guide', lead: 'The complete guide.' },
  api: { word: ' API', lead: 'The API reference.' },
  examples: { word: ' examples', lead: 'Complete examples.' },
};

/**
 * The title of a page: `Presence in Svelte · Motion` on a reading, `Presence guide in Svelte · Motion` on its guide and
 * `Glossary · Motion` on a neutral page; the home is `Motion`. The layout appends the name of the site.
 */
export function motionTitle(
  need: MotionNeed,
  framework?: ExampleFramework,
  tab?: FeatureTab,
): string {
  if (need.slug === '') return 'Motion';
  if (framework === undefined || !need.perFramework)
    return `${need.label} · Motion`;
  return `${need.label}${TAB_WORDING[tab ?? 'overview'].word} in ${FRAMEWORK_LABELS[framework]} · Motion`;
}

/**
 * The description of a page: its summary, and on a reading the sentence of its framework after it, with the opening
 * sentence of its tab in front (`The complete guide.`).
 */
export function motionDescription(
  need: MotionNeed,
  framework?: ExampleFramework,
  tab?: FeatureTab,
): string {
  if (framework === undefined || !need.perFramework) return need.summary;
  const lead = TAB_WORDING[tab ?? 'overview'].lead;
  return [lead, need.summary, FRAMEWORK_LINES[framework]]
    .filter((part) => part !== undefined)
    .join(' ');
}
