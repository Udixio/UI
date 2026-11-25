import {
  Component,
  createRef,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useStore } from '@nanostores/react';
import { Tab, Tabs } from '@udixio/ui-react';
import { createTabsIndicatorController, type TabsIndicatorController } from '@udixio/core/dom';
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
 * The framework tabs of the site: a code block's tabs (CodePreview) and the switch of a motion page's header
 * (FrameworkSwitch). Udixio's secondary Tabs, scrollable when the row is narrower than its tabs, on the track of the
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

/** The key that moves a radio group's choice, and by how much: arrows step (and wrap), Home and End jump to an end. */
const STEPS: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

/**
 * The switch of a motion page's header (FrameworkSwitch.astro): the framework the page is written for, one choice for the
 * whole site. It is a setting, not a set of tabs (it has no panels: the whole page follows it), so it is a radio group
 * (review 6, Y4), drawn as the code blocks' framework tabs are: the same Udixio Tabs, each `role="radio"` with
 * `aria-checked`, and the same sliding indicator (`createTabsIndicatorController`, the controller of Udixio's Tabs). The
 * keys are a radio group's: an arrow moves the choice, and Tab enters and leaves the group at the checked framework.
 *
 * Each radio is a `[data-framework-choice]`, checked by the head script before the first paint; the wrapper holds
 * `data-code-ssr` until the island has the stored choice, and the checked radio draws a static indicator meanwhile. The
 * radios are never mounted again, so a radio focused before hydration keeps the focus.
 */
export const FrameworkSwitchRadios = ({ labelledBy }: { labelledBy: string }) => {
  const { framework, synced } = useChosenFramework();
  const checked = Math.max(0, EXAMPLE_FRAMEWORKS.indexOf(framework));
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const controller = useRef<TabsIndicatorController | null>(null);

  // The sliding indicator starts once the island has the stored choice: under it at once, then it slides at each change.
  useLayoutEffect(() => {
    if (!synced || !groupRef.current || !indicatorRef.current) return;
    controller.current = createTabsIndicatorController({
      root: groupRef.current,
      indicator: indicatorRef.current,
      selectedTab: () => radios.current[checkedRef.current] ?? null,
    });
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, [synced]);
  useLayoutEffect(() => {
    controller.current?.update();
  });

  const choose = (index: number) => {
    const choice = EXAMPLE_FRAMEWORKS[index];
    if (choice) setPreferredExampleFramework(choice);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const next = step(checked, EXAMPLE_FRAMEWORKS.length);
    choose(next);
    radios.current[next]?.focus();
  };

  return (
    <div data-code-ssr={synced ? undefined : ''} className="min-w-0 max-w-full border-b border-outline-variant">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="relative flex min-w-0 max-w-full overflow-x-auto [scrollbar-width:none]"
        onKeyDown={handleKeyDown}
      >
        {EXAMPLE_FRAMEWORKS.map((choice, index) => (
          <Tab
            key={choice}
            ref={(element: HTMLButtonElement | null) => {
              radios.current[index] = element;
            }}
            variant="secondary"
            label={FRAMEWORK_LABELS[choice]}
            index={index}
            selectedTab={checked}
            role="radio"
            aria-checked={index === checked}
            // A radio is checked, not selected: the tab's own attribute is left out.
            aria-selected={undefined}
            tabIndex={index === checked ? 0 : -1}
            onClick={() => choose(index)}
            data-framework-choice={choice}
            className={{
              tab: 'flex-none px-3 after:absolute after:inset-x-0 after:bottom-0 after:hidden after:h-0.5 after:bg-primary [[data-code-ssr]_&]:aria-checked:after:block',
              label: 'text-on-surface-variant [[aria-checked=true]_&]:text-on-surface',
            }}
            // The head script has set `aria-checked` and `tabindex` to the stored choice: expected, and replaced once synced.
            suppressHydrationWarning
          />
        ))}
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary opacity-0 [[data-code-ssr]_&]:invisible"
        />
      </div>
    </div>
  );
};
