import { Component, createRef, type MouseEvent, type ReactNode, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import { Tab, Tabs } from '@udixio/ui-react';
import { rememberReadingPosition, restoreReadingPosition } from '@/lib/reading-position';
import {
  EXAMPLE_FRAMEWORKS,
  type ExampleFramework,
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
  setPreferredExampleFramework,
} from '@/stores/exampleFrameworkStore';

export const FRAMEWORK_LABELS: Record<ExampleFramework, string> = {
  html: 'HTML',
  react: 'React',
  angular: 'Angular',
  svelte: 'Svelte',
};

/**
 * The visitor's framework, as an island may render it. The server renders React; the first client render of a hydration
 * must render the same, so `synced` is false and `framework` is `'react'` until the island has mounted. The next render has
 * the stored choice (`synced` true), and follows every change of it afterwards, wherever it comes from.
 */
export function useChosenFramework(): { framework: ExampleFramework; synced: boolean } {
  const stored = useStore(preferredExampleFrameworkStore);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    initializeExampleFrameworkPreference();
    setSynced(true);
  }, []);

  return { framework: synced ? stored : 'react', synced };
}

type FrameworkTabsProps = {
  /** The frameworks offered, in order. */
  frameworks: readonly ExampleFramework[];
  /** The framework shown. */
  selected: ExampleFramework;
  onSelect: (framework: ExampleFramework) => void;
  /** False while the island renders the server's choice (`useChosenFramework`): see "Before hydration" below. */
  synced: boolean;
  className?: string;
  /** Attributes of the tablist (its accessible name). */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Attributes of each tab: its hooks, and the ids that tie it to its panels. */
  tabAttributes?: (framework: ExampleFramework) => Record<string, string | undefined>;
};

type FocusAcrossRemountProps = {
  /** Changes when the children are mounted again: the focus is then kept on the same tab. */
  remountKey: string;
  children: ReactNode;
};

/**
 * Keeps the keyboard focus on the same tab when FrameworkTabs mounts its tabs again: their `key` changes at hydration, and
 * removing the focused tab would drop the focus to the body. React calls `getSnapshotBeforeUpdate` before it changes the DOM,
 * while the focused tab still exists, and `componentDidUpdate` once the new tabs are in place: the tab at the same position
 * takes the focus. No hook has both moments, which is why this is a class. Its wrapper is `display: contents`, so it takes no
 * box of its own.
 */
class FocusAcrossRemount extends Component<FocusAcrossRemountProps, object, number | null> {
  private readonly region = createRef<HTMLDivElement>();

  private tabs(): HTMLElement[] {
    return [...(this.region.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  }

  getSnapshotBeforeUpdate(previous: FocusAcrossRemountProps): number | null {
    if (previous.remountKey === this.props.remountKey) return null;
    const focused = document.activeElement;
    const index = this.tabs().findIndex((tab) => tab === focused);
    return index === -1 ? null : index;
  }

  componentDidUpdate(previous: FocusAcrossRemountProps, _previousState: object, index?: number | null): void {
    if (previous.remountKey === this.props.remountKey || index == null) return;
    this.tabs()[index]?.focus({ preventScroll: true });
  }

  render() {
    return (
      <div ref={this.region} className="contents">
        {this.props.children}
      </div>
    );
  }
}

/**
 * The framework tabs of a code block (CodePreview): Udixio's secondary Tabs, scrollable when the row is narrower than its tabs, on the track of the
 * toolbar or header that holds them (no border or surface of their own).
 *
 * Before hydration: the server renders React's tab selected, and the head script of the layout sets each tab's
 * `aria-selected` and `tabindex` to the visitor's choice as the parser inserts it (lib/framework-choice.ts tells the
 * contract). The label colour follows `aria-selected` rather than the component's state, so it is right from the first
 * paint; the sliding indicator is placed by script, so while an ancestor holds `data-code-ssr` it stays hidden and the
 * selected tab draws a static one of the same size and colour instead. Once the island has the stored choice the tabs
 * are mounted again: the indicator then starts under the chosen tab, instead of sliding there from React's. The keyboard
 * focus stays on the same tab through that remount (FocusAcrossRemount).
 */
export const FrameworkTabs = ({
  frameworks,
  selected,
  onSelect,
  synced,
  className,
  tabAttributes,
  ...labelling
}: FrameworkTabsProps) => {
  const remountKey = synced ? 'client' : 'server';

  return (
    <FocusAcrossRemount remountKey={remountKey}>
      <Tabs
        key={remountKey}
        {...labelling}
        variant="secondary"
        scrollable
        selectedTab={Math.max(0, frameworks.indexOf(selected))}
        onSelectedTabChange={(index) => {
          const framework = index == null ? undefined : frameworks[index];
          if (framework) onSelect(framework);
        }}
        className={{
          tabs: `min-w-0 max-w-full border-b-0 bg-transparent [scrollbar-width:none] ${className ?? ''}`,
          indicator: '[[data-code-ssr]_&]:invisible',
        }}
      >
        {frameworks.map((framework) => (
          <Tab
            key={framework}
            label={FRAMEWORK_LABELS[framework]}
            className={{
              tab: 'flex-none px-3 after:absolute after:inset-x-0 after:bottom-0 after:hidden after:h-0.5 after:bg-primary [[data-code-ssr]_&]:aria-selected:after:block',
              label: 'text-on-surface-variant [[aria-selected=true]_&]:text-on-surface',
            }}
            // The head script has set `aria-selected` and `tabindex` to the stored choice: expected, and replaced once synced.
            suppressHydrationWarning
            {...tabAttributes?.(framework)}
          />
        ))}
      </Tabs>
    </FocusAcrossRemount>
  );
};

/** The framework of a link of the switch, and where its click goes. */
type SwitchLinks = Record<ExampleFramework, string>;

/** A click that opens the link in another place (a new tab, a window) is the browser's: the switch leaves it alone. */
const opensElsewhere = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/**
 * Follows a link of the switch in the site: the choice is stored, the place of the reader is kept, and the page changes
 * without a load. Without JavaScript, or in another place, the link is the browser's (its href is the reading's address).
 */
function followSwitchLink(
  event: MouseEvent<HTMLAnchorElement>,
  framework: ExampleFramework,
  current: ExampleFramework,
  href: string,
): void {
  if (opensElsewhere(event)) return;
  event.preventDefault();
  if (framework === current) return;
  setPreferredExampleFramework(framework);
  const position = rememberReadingPosition();
  document.addEventListener('astro:after-swap', () => restoreReadingPosition(position), { once: true });
  void navigate(href + window.location.hash);
}

type FrameworkSwitchLinksProps = {
  /** The id of the element that names the switch: "Written for". */
  labelledBy: string;
  /** The framework of the reading the switch is on. */
  current: ExampleFramework;
  /** The address of the same page in each framework, as the server rendered it. */
  hrefs: SwitchLinks;
};

/**
 * The switch of a motion reading's header (FrameworkSwitch.astro): the framework the page is written for, one link per
 * framework to the same page under its prefix (framework-urls spec §2.7). It is Udixio's Tabs in link mode, as the feature
 * tabs are (PageTabs): the selected framework is the reading's own, drawn by the server, and the links work without
 * JavaScript. With JavaScript a click stores the choice and keeps the reader's place (lib/reading-position).
 * The arrow keys move the focus between the frameworks; Enter follows the focused link.
 */
export const FrameworkSwitchLinks = ({ labelledBy, current, hrefs }: FrameworkSwitchLinksProps) => (
  <div className="min-w-0 max-w-full border-b border-outline-variant">
    <Tabs
      aria-labelledby={labelledBy}
      variant="secondary"
      scrollable
      selectedTab={Math.max(0, EXAMPLE_FRAMEWORKS.indexOf(current))}
      className={{
        tabs: 'min-w-0 max-w-full border-b-0 bg-transparent [scrollbar-width:none]',
      }}
    >
      {EXAMPLE_FRAMEWORKS.map((framework) => (
        <Tab
          key={framework}
          href={hrefs[framework]}
          label={FRAMEWORK_LABELS[framework]}
          aria-current={framework === current ? 'page' : undefined}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => followSwitchLink(event, framework, current, hrefs[framework])}
          className={{
            tab: 'flex-none px-3',
            label: 'text-on-surface-variant [[aria-selected=true]_&]:text-on-surface',
          }}
        />
      ))}
    </Tabs>
  </div>
);
