import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Tab, Tabs } from '@udixio/ui-react';
import {
  type ExampleFramework,
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
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
 * are mounted again: the indicator then starts under the chosen tab, instead of sliding there from React's.
 */
export const FrameworkTabs = ({
  frameworks,
  selected,
  onSelect,
  synced,
  className,
  tabAttributes,
  ...labelling
}: FrameworkTabsProps) => (
  <Tabs
    key={synced ? 'client' : 'server'}
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
);

