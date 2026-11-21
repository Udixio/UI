import React, { useEffect, useState } from 'react';
import * as UI from '@udixio/ui-react';
import { classNames } from '@udixio/core';
import { CopyIconButton, useCopyToClipboard } from '@/components/CopyCodeButton';
import { FRAMEWORK_LABELS, FrameworkTabs, useChosenFramework } from '@/components/FrameworkTabs';
import {
  EXAMPLE_FRAMEWORKS,
  type ExampleFramework,
  resolveExampleFramework,
  setPreferredExampleFramework,
} from '@/stores/exampleFrameworkStore';

type SingleSourceProps = {
  mode?: 'single';
  code?: string;
  /** Language of the block, shown in the toolbar. */
  language?: string;
  className?: string;
};

type MultiFrameworkProps = {
  mode: 'multiframework';
  rootId: string;
  frameworks: ExampleFramework[];
  /** The frameworks that have a live preview slot; the others show their code only. */
  previews: ExampleFramework[];
  sources: Partial<Record<ExampleFramework, string>>;
};

type Props = SingleSourceProps | MultiFrameworkProps;

// ─── Shared shell ─────────────────────────────────────────────────────────────
// These classes are the single definition of a code block's chrome: the card
// and the body are rendered on the Astro side (the multi-framework panels hold
// React/Angular islands that React cannot own), the toolbar on the React side.
// Code.astro imports them so the two modes cannot diverge.
// The card is a container (`code`), for the layouts of what it holds.
export const codeCardClass =
  'not-prose card-code @container/code mt-4 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low';
export const codeBodyClass = 'bg-surface-bright';
// The layout of a live preview. Its background is the site's demo surface
// (DemoSurface.astro, inset in the card): it follows the doc's theme, and its
// size is reserved by the example when it changes size.
export const codePreviewClass = 'flex p-5 @min-[560px]/demo:p-8';
export const codePanelClass = 'code-source overflow-auto p-4';

// ─── Before the toolbar hydrates ──────────────────────────────────────────────
// The server renders React's tab selected. The visitor's framework is on <html data-docs-framework> from the first paint,
// and the layout's head script sets the `aria-selected` of each tab (`[data-code-tab]`) to it as the parser inserts the
// tab: the tabs follow it (FrameworkTabs). The card holds `data-code-ssr` until this toolbar has applied the stored
// choice; meanwhile the Preview / Code switch is hidden for each stored choice that the block shows without a preview.
// Tailwind reads these classes as written, so each one is spelled out in full.
const HIDDEN_BEFORE_HYDRATION: Record<ExampleFramework, string> = {
  html: '[[data-docs-framework=html]_[data-code-ssr]_&]:hidden',
  react: '[[data-docs-framework=react]_[data-code-ssr]_&]:hidden',
  angular: '[[data-docs-framework=angular]_[data-code-ssr]_&]:hidden',
  svelte: '[[data-docs-framework=svelte]_[data-code-ssr]_&]:hidden',
};

/** The Preview / Code switch before hydration: hidden for each stored choice that the block shows without a preview. */
function viewSwitchBeforeHydration(
  frameworks: readonly ExampleFramework[],
  previews: readonly ExampleFramework[],
): string {
  return EXAMPLE_FRAMEWORKS.filter((chosen) => {
    const shown = resolveExampleFramework(chosen, frameworks);
    return shown === undefined || !previews.includes(shown);
  })
    .map((chosen) => HIDDEN_BEFORE_HYDRATION[chosen])
    .join(' ');
}

const toolbarClass =
  'flex min-h-12 items-center justify-between gap-x-2 border-b border-outline-variant bg-surface-container-high';

/** Toolbar: `start` on the left, `end` on the right, announcement included. */
const CodeToolbar = ({
  start,
  end,
  liveRef,
  className,
}: {
  start?: React.ReactNode;
  end?: React.ReactNode;
  liveRef: React.RefObject<HTMLSpanElement | null>;
  className?: string;
}) => (
  <div className={classNames(toolbarClass, className)}>
    {start}
    <div className="ms-auto flex min-h-12 items-center gap-2">{end}</div>
    <span ref={liveRef} className="sr-only" aria-live="polite" />
  </div>
);

const VIEWS = { preview: 'Preview', code: 'Code' } as const;

const MultiFrameworkToolbar = ({
  rootId,
  frameworks,
  previews,
  sources,
}: MultiFrameworkProps) => {
  const { framework: chosen, synced } = useChosenFramework();
  const activeFramework = resolveExampleFramework(chosen, frameworks);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const { copied, copy, liveRef } = useCopyToClipboard();
  const hasPreview = activeFramework !== undefined && previews.includes(activeFramework);
  // Without a live preview there is nothing to switch to: the code is shown, and the switch is left out.
  const view = hasPreview ? activeView : 'code';

  useEffect(() => {
    const root = document.getElementById(rootId);
    // The first render of a hydration has the server's framework; the stored one comes with the next. Until then the
    // panels stay as the head script showed them, and the card keeps `data-code-ssr`.
    if (!root || !synced) return;

    root
      .querySelectorAll<HTMLElement>('[data-example-panel]')
      .forEach((panel) => {
        panel.hidden =
          panel.dataset['framework'] !== activeFramework ||
          panel.dataset['view'] !== view;
      });
    delete root.dataset['codeSsr'];
  }, [activeFramework, view, rootId, synced]);

  if (!activeFramework) return null;

  /** The panels a framework's tab shows: its preview (when it has one) and its code (Code.astro gives them these ids). */
  const panelsOf = (framework: ExampleFramework) =>
    [previews.includes(framework) && `${rootId}-${framework}-preview`, `${rootId}-${framework}-code`]
      .filter(Boolean)
      .join(' ');

  return (
    <CodeToolbar
      liveRef={liveRef}
      // Wide, one row: the tabs, then the view switch and the copy button. Narrow (a phone, a narrow column), the tabs
      // keep the row on the card's track and the buttons wrap above them.
      className="flex-wrap-reverse ps-1 pe-2"
      start={
        <FrameworkTabs
          aria-label="Example framework"
          className="code-framework-pills"
          frameworks={frameworks}
          selected={activeFramework}
          synced={synced}
          onSelect={setPreferredExampleFramework}
          tabAttributes={(framework) => ({
            id: `${rootId}-tab-${framework}`,
            'aria-controls': panelsOf(framework),
            'data-code-tab': '',
            'data-framework': framework,
          })}
        />
      }
      end={
        <>
          {hasPreview && (
            <div
              role="group"
              aria-label="Example view"
              className={classNames(
                'flex items-center gap-1',
                viewSwitchBeforeHydration(frameworks, previews),
              )}
            >
              {(['preview', 'code'] as const).map((mode) => (
                <UI.Button
                  key={mode}
                  toggleable
                  variant="filled"
                  size="xSmall"
                  label={VIEWS[mode]}
                  pressed={activeView === mode}
                  // A pressed view stays pressed: one of the two is always shown.
                  onPressedChange={(pressed) => pressed && setActiveView(mode)}
                />
              ))}
            </div>
          )}
          <CopyIconButton
            label={`Copy ${FRAMEWORK_LABELS[activeFramework]} code to clipboard`}
            copied={copied}
            onCopy={() => copy(sources[activeFramework])}
          />
        </>
      }
    />
  );
};

// A single source: no framework selector, no preview/code toggle — there is
// nothing to preview. The shell (card, body) is rendered by Code.astro, exactly
// as for the multi-framework case.
const SingleSourceToolbar = ({ code, language }: SingleSourceProps) => {
  const { copied, copy, liveRef } = useCopyToClipboard();

  return (
    <CodeToolbar
      liveRef={liveRef}
      className="px-2"
      start={
        <span className="px-2 text-label-large text-on-surface-variant">
          {language ?? 'code'}
        </span>
      }
      end={
        <CopyIconButton
          label="Copy code to clipboard"
          copied={copied}
          onCopy={() => copy(code)}
        />
      }
    />
  );
};

export const CodePreview = (props: Props) => {
  if (props.mode === 'multiframework') {
    return <MultiFrameworkToolbar {...props} />;
  }

  return <SingleSourceToolbar {...props} />;
};
