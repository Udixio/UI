import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import * as UI from '@udixio/ui-react';
import { classNames } from '@udixio/core';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iContentCopyFilled } from '@udixio/icons-rounded-400/filled/content_copy';
import '@/components/code-framework-select.css';
import {
  EXAMPLE_FRAMEWORKS,
  type ExampleFramework,
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
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

const frameworkLabels: Record<ExampleFramework, string> = {
  html: 'HTML',
  react: 'React',
  angular: 'Angular',
  svelte: 'Svelte',
};

// ─── Shared shell ─────────────────────────────────────────────────────────────
// These classes are the single definition of a code block's chrome: the card
// and the body are rendered on the Astro side (the multi-framework panels hold
// React/Angular islands that React cannot own), the toolbar on the React side.
// Code.astro imports them so the two modes cannot diverge.
// The card is a container: below 560 px of its own width (a phone, or a narrow column) the framework pills give way to
// the framework select, which sets the same preference.
export const codeCardClass =
  'not-prose card-code @container/code mt-4 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low';
export const codeBodyClass = 'bg-surface-bright';
// The layout of a live preview. Its background is the site's demo surface
// (DemoSurface.astro, inset in the card): it follows the doc's theme, and its
// size is reserved by the example when it changes size.
export const codePreviewClass = 'flex p-5 @min-[560px]/demo:p-8';
export const codePanelClass = 'code-source overflow-auto p-4';

// ─── Before the toolbar hydrates ──────────────────────────────────────────────
// The server renders React's pill selected. The visitor's framework is on <html data-docs-framework> from the first paint
// (layouts/layout.astro), and the card holds `data-code-ssr` until this toolbar has applied the stored choice: these
// classes give the pills, and the Preview / Code switch, the look of that choice meanwhile. Tailwind reads them as
// written, so each one is spelled out in full.
const PILL_ON: Record<ExampleFramework, string> = {
  html: '[[data-docs-framework=html]_[data-code-ssr]_&]:bg-secondary-container [[data-docs-framework=html]_[data-code-ssr]_&]:text-on-secondary-container',
  react: '[[data-docs-framework=react]_[data-code-ssr]_&]:bg-secondary-container [[data-docs-framework=react]_[data-code-ssr]_&]:text-on-secondary-container',
  angular: '[[data-docs-framework=angular]_[data-code-ssr]_&]:bg-secondary-container [[data-docs-framework=angular]_[data-code-ssr]_&]:text-on-secondary-container',
  svelte: '[[data-docs-framework=svelte]_[data-code-ssr]_&]:bg-secondary-container [[data-docs-framework=svelte]_[data-code-ssr]_&]:text-on-secondary-container',
};
const PILL_OFF: Record<ExampleFramework, string> = {
  html: '[[data-docs-framework=html]_[data-code-ssr]_&]:bg-transparent [[data-docs-framework=html]_[data-code-ssr]_&]:text-on-surface-variant',
  react: '[[data-docs-framework=react]_[data-code-ssr]_&]:bg-transparent [[data-docs-framework=react]_[data-code-ssr]_&]:text-on-surface-variant',
  angular: '[[data-docs-framework=angular]_[data-code-ssr]_&]:bg-transparent [[data-docs-framework=angular]_[data-code-ssr]_&]:text-on-surface-variant',
  svelte: '[[data-docs-framework=svelte]_[data-code-ssr]_&]:bg-transparent [[data-docs-framework=svelte]_[data-code-ssr]_&]:text-on-surface-variant',
};
const HIDDEN_BEFORE_HYDRATION: Record<ExampleFramework, string> = {
  html: '[[data-docs-framework=html]_[data-code-ssr]_&]:hidden',
  react: '[[data-docs-framework=react]_[data-code-ssr]_&]:hidden',
  angular: '[[data-docs-framework=angular]_[data-code-ssr]_&]:hidden',
  svelte: '[[data-docs-framework=svelte]_[data-code-ssr]_&]:hidden',
};

/** The classes of a pill before hydration: selected for each stored choice that the block resolves to it. */
function pillBeforeHydration(
  pill: ExampleFramework,
  rendered: ExampleFramework,
  frameworks: readonly ExampleFramework[],
): string {
  return EXAMPLE_FRAMEWORKS.map((chosen) => {
    const shown = resolveExampleFramework(chosen, frameworks);
    if (pill === rendered) return shown === pill ? '' : PILL_OFF[chosen];
    return shown === pill ? PILL_ON[chosen] : '';
  })
    .filter(Boolean)
    .join(' ');
}

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
  'flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-high px-2 py-1';

/** Copy + screen-reader announcement, shared by both toolbars. */
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  async function copy(source?: string) {
    if (!source) return;

    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      if (liveRef.current)
        liveRef.current.textContent = 'Code copied to clipboard';
    } catch {
      setCopied(false);
      if (liveRef.current) liveRef.current.textContent = 'Copy failed';
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      if (liveRef.current) liveRef.current.textContent = '';
    }, 1500);
  }

  return { copied, copy, liveRef };
}

/** Toolbar: `start` on the left, `end` on the right, announcement included. */
const CodeToolbar = ({
  start,
  end,
  liveRef,
}: {
  start?: React.ReactNode;
  end?: React.ReactNode;
  liveRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <div className={toolbarClass}>
    {start}
    <div className="flex items-center gap-1">{end}</div>
    <div ref={liveRef} className="sr-only" aria-live="polite" />
  </div>
);

const CopyButton = ({
  label,
  copied,
  onCopy,
}: {
  label: string;
  copied: boolean;
  onCopy: () => void;
}) => (
  <UI.IconButton
    toggleable
    onPressedChange={onCopy}
    size="xSmall"
    icon={iContentCopy}
    label={label}
    pressedIcon={iContentCopyFilled}
    pressed={copied}
  />
);

const MultiFrameworkToolbar = ({
  rootId,
  frameworks,
  previews,
  sources,
}: MultiFrameworkProps) => {
  const preferredFramework = useStore(preferredExampleFrameworkStore, {
    ssr: 'initial',
  });
  const activeFramework = resolveExampleFramework(
    preferredFramework,
    frameworks,
  );
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const { copied, copy, liveRef } = useCopyToClipboard();
  const hasPreview = activeFramework !== undefined && previews.includes(activeFramework);
  // Without a live preview there is nothing to switch to: the code is shown, and the switch is left out.
  const view = hasPreview ? activeView : 'code';

  useEffect(() => {
    initializeExampleFrameworkPreference();
  }, []);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    // The first render of a hydration has the server's framework; the stored one comes with the next. Until then the
    // panels stay as the head script showed them, and the classes of the stored choice stay on.
    if (activeFramework !== resolveExampleFramework(preferredExampleFrameworkStore.get(), frameworks)) return;

    root
      .querySelectorAll<HTMLElement>('[data-example-panel]')
      .forEach((panel) => {
        panel.hidden =
          panel.dataset['framework'] !== activeFramework ||
          panel.dataset['view'] !== view;
      });
    delete root.dataset['codeSsr'];
  }, [activeFramework, view, rootId, frameworks]);

  if (!activeFramework) return null;

  return (
    <CodeToolbar
      liveRef={liveRef}
      start={
        <div
          className="flex flex-wrap items-center gap-1"
          aria-label="Example framework"
        >
          {/* A narrow block (below 560 px of the card) shows the select instead of the pills: same preference. */}
          <div className="code-framework-pills flex flex-wrap items-center gap-1 @max-[560px]/code:hidden">
            {frameworks.map((framework) => (
              <button
                key={framework}
                type="button"
                className={classNames(
                  'rounded-full px-3 py-2 text-label-large transition-colors',
                  activeFramework === framework
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                  pillBeforeHydration(framework, activeFramework, frameworks),
                )}
                aria-pressed={activeFramework === framework}
                onClick={() => setPreferredExampleFramework(framework)}
              >
                {frameworkLabels[framework]}
              </button>
            ))}
          </div>
          <div className="code-framework-select @max-[560px]/code:flex!">
            <select
              className="text-label-large"
              aria-label="Framework"
              value={activeFramework}
              onChange={(event) =>
                setPreferredExampleFramework(
                  event.target.value as ExampleFramework,
                )
              }
            >
              {frameworks.map((framework) => (
                <option key={framework} value={framework}>
                  {frameworkLabels[framework]}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
      end={
        <>
          {hasPreview && (
            <div
              className={classNames(
                'flex rounded-full bg-surface-container p-1',
                viewSwitchBeforeHydration(frameworks, previews),
              )}
              aria-label="Example view"
            >
              {(['preview', 'code'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={classNames(
                    'rounded-full px-3 py-1.5 text-label-medium capitalize transition-colors',
                    activeView === mode
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant',
                  )}
                  aria-pressed={activeView === mode}
                  onClick={() => setActiveView(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
          <CopyButton
            label={`Copy ${frameworkLabels[activeFramework]} code to clipboard`}
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
      start={
        <span className="px-2 text-label-large text-on-surface-variant">
          {language ?? 'code'}
        </span>
      }
      end={
        <CopyButton
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
