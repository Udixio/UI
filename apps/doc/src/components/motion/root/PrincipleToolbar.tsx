import { useLayoutEffect, useRef } from 'react';
import { CopyFromPageButton } from '@/components/CopyCodeButton';
import { FrameworkTabs, useChosenFramework } from '@/components/FrameworkTabs';
import { EXAMPLE_FRAMEWORKS, setPreferredExampleFramework } from '@/stores/exampleFrameworkStore';

/**
 * The header of the principle's code block (Principle.astro): the framework tabs, which are the code blocks' own tabs
 * (FrameworkTabs), and the copy button, which names itself after the framework. The tabs and the button follow the store
 * as the code blocks' toolbars do. The block's panels are static: until this island has the stored choice, the layout's head
 * script shows the right one (lib/framework-choice.ts tells the contract); once it has, the chosen panel is shown here.
 */
export const PrincipleToolbar = () => {
  const { framework, synced } = useChosenFramework();
  const toolbar = useRef<HTMLDivElement>(null);

  // Layout effect: the panel changes in the same frame as the tab, so no frame shows the new tab with the old code.
  useLayoutEffect(() => {
    if (!synced) return;
    const card = toolbar.current?.closest('[data-code-tabs]');
    card?.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel) => {
      panel.hidden = panel.dataset.framework !== framework;
    });
  }, [framework, synced]);

  return (
    <div
      ref={toolbar}
      // Wide, one row: the tabs, then the copy button. Narrow, the tabs keep the row and the button wraps above them.
      className="flex min-h-12 flex-wrap-reverse items-center gap-2 border-b border-outline-variant ps-2.5 pe-2"
      // Until the stored choice is applied, the tabs draw their selection from aria-selected, and the static bar of the
      // selected tab stands in for the indicator (FrameworkTabs).
      data-code-ssr={synced ? undefined : ''}
    >
      <FrameworkTabs
        aria-label="Framework of the example"
        frameworks={EXAMPLE_FRAMEWORKS}
        selected={framework}
        synced={synced}
        onSelect={setPreferredExampleFramework}
        tabAttributes={(choice) => ({
          id: `principle-tab-${choice}`,
          'aria-controls': `principle-code-${choice}`,
          'data-code-tab': '',
          'data-framework': choice,
        })}
      />
      <CopyFromPageButton label="Copy the code" perFramework />
    </div>
  );
};
