import { FrameworkTabs } from '@/components/FrameworkTabs';
import {
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

/** The id of the API reference's panel, which the tabs control. */
export const API_PANEL_ID = 'component-api-panel';

/** The id of a framework's tab, which names the panel while it shows that framework's API. */
export const apiTabId = (framework: ExampleFramework) =>
  `component-api-tab-${framework}`;

/**
 * The framework of an API page: the site's framework choice (the same store as the code blocks and the switch of a
 * motion page), among the frameworks the component has an API for, as the site's framework tabs (FrameworkTabs).
 *
 * The reference below the tabs is rendered by the island, React's first: the tabs show the framework the reference
 * shows, so the head script has no attribute to apply to them, and the island renders them and the reference
 * together once it has the stored choice. Until then the wrapper holds `data-code-ssr`, so the selected tab draws its
 * static indicator.
 */
export function ApiFrameworkSelector({
  activeFramework,
  frameworks,
  synced,
}: {
  activeFramework: ExampleFramework;
  frameworks: ExampleFramework[];
  /** False while the island renders the server's choice (`useChosenFramework`). */
  synced: boolean;
}) {
  return (
    <div
      data-code-ssr={synced ? undefined : ''}
      className="min-w-0 max-w-full border-b border-outline-variant"
    >
      <FrameworkTabs
        aria-label="API framework"
        frameworks={frameworks}
        selected={activeFramework}
        synced={synced}
        onSelect={setPreferredExampleFramework}
        tabAttributes={(framework) => ({
          id: apiTabId(framework),
          'aria-controls': API_PANEL_ID,
        })}
      />
    </div>
  );
}
