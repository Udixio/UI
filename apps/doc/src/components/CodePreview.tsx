import React, { useEffect, useState } from 'react';
import * as UI from '@udixio/ui-react';
import { classNames } from '@udixio/core';
import { iUnfoldLess } from '@udixio/icons-rounded-400/unfold_less';
import { iUnfoldMore } from '@udixio/icons-rounded-400/unfold_more';
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
  /** `split`: the code and the preview are shown together (Code.astro lays them out), so there is no Preview / Code switch. */
  layout?: 'tabs' | 'split';
};

type Props = SingleSourceProps | MultiFrameworkProps;

// ─── Shared shell ─────────────────────────────────────────────────────────────
// These classes are the single definition of a code block's chrome: the card
// and the body are rendered on the Astro side (the multi-framework panels hold
// React/Angular islands that React cannot own), the toolbar on the React side.
// Code.astro imports them so the two modes cannot diverge.
// The card is a container (`code`), for the layouts of what it holds. Its overflow is `clip`, not `hidden`: clip still
// rounds the corners, but keeps the card from becoming a scroll box, so the sticky preview of a split block (below) sticks
// to the viewport and not to the card.
export const codeCardClass =
  'not-prose card-code @container/code mt-4 overflow-clip rounded-2xl border border-outline-variant bg-surface-container-low';
export const codeBodyClass = 'bg-surface-bright';
// The layout of a live preview. Its background is the site's demo surface
// (DemoSurface.astro, inset in the card): it follows the doc's theme, and its
// size is reserved by the example when it changes size.
export const codePreviewClass = 'flex p-5 @min-[560px]/demo:p-8';
// A long line wraps, as everywhere on the site (Code.astro: `text-wrap`), and a word longer than the column (a package
// path, a long name) breaks inside it rather than pushing the code out of the card: on a phone the column holds about 32
// characters, and before this the end of such a word was cut off by the panel (review 6, M2).
export const codePanelClass = 'code-source overflow-auto p-4 [&_pre]:wrap-anywhere';
// A split block (Code.astro, `layout="split"`): the code and the preview side by side from 768 px of card, the code on the
// left; stacked below, the preview on top, above its code (it is small, and it is what the reader came to see; review 6
// M3). The preview comes first in the document too, as in a `tabs` block: the grid places it in the right column when
// the card is wide. The preview takes a third of the card, and never less than 18.5rem: a toast with its action on one
// line, and the surface's padding. The code is set as in every other code block of the site, same size, and a long line
// wraps: below 768 px its column would be too narrow for it (a 1280 px viewport gives a card of about 680 px: stacked).
// The preview's edge with the code is the card's outline colour. On a motion page the block is as wide as every other
// wide block (MotionPage).
export const codeSplitBodyClass = 'grid @min-[768px]/code:grid-cols-[minmax(0,2fr)_minmax(18.5rem,1fr)]';
export const codeSplitPreviewClass =
  'border-b border-outline-variant @min-[768px]/code:col-start-2 @min-[768px]/code:row-start-1 @min-[768px]/code:border-b-0 @min-[768px]/code:border-s';
/** The code of a split block: the left column when the card is wide, on the row of its preview. */
export const codeSplitCodeClass = '@min-[768px]/code:col-start-1 @min-[768px]/code:row-start-1';
// Beside its code, the preview cell is as tall as the code: its example sits at the top, by the first lines, where the
// reader sees it (and where it comes into view, which hydrates its island), not in the middle of a long column.
export const codeSplitPreviewTopClass = '@min-[768px]/code:items-start';
// Beside its code, the example (the surface inside the cell, which is as tall as the code) sticks below the top of the
// viewport while the reader scrolls a long code column: it stays in view. It stops at the cell's bottom edge, so it
// never leaves its code. It does not grow to the cell's height (flex-none), which would leave no room to stick. Stacked,
// it is a plain block. The offset is a margin, not a header: the motion pages have no sticky header. The sticky element
// is the surface, not the panel (the grid cell, which stays static): no ancestor up to the viewport scrolls or clips
// (the card's overflow is `clip`), so it sticks in every engine.
export const codeSplitPreviewStickyClass = '@min-[768px]/code:sticky @min-[768px]/code:top-6 @min-[768px]/code:flex-none';

// ─── A long split code ────────────────────────────────────────────────────────
// A split code longer than `SPLIT_CODE_CAP_FROM` lines is shown 24 lines high (24 × 28 px, the code's line height:
// `max-h-168`), so that its preview and the prose after it stay near; a button under it shows the rest. A shorter code is
// shown whole: folding away a few lines would only add a click. The fold is visual only: the copy button copies the whole
// source, a screen reader reads all of it, and without JavaScript (`scripting: none`) the code is shown whole.
/** A split code is folded from this many lines: 24 shown, at least 7 behind the button. */
export const SPLIT_CODE_CAP_FROM = 31;
/** The tab panel of a folded code: the bar is placed against its bottom edge. */
export const codeCapPanelClass = 'relative';
/** The folded source, 24 lines high until its button unfolds it (`data-expanded`, set by CodeExpandButton). */
export const codeCapSourceClass =
  'peer/source max-h-168 overflow-hidden data-expanded:max-h-none [@media(scripting:none)]:max-h-none';
/**
 * The bar of the button. Folded, it lies over the last lines, which fade into the code's background, and only the button
 * takes the pointer (the lines under the fade stay selectable). Unfolded, it follows the code.
 */
export const codeCapBarClass = [
  'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pt-16 pb-4',
  'bg-linear-to-t from-surface-bright from-35% to-transparent',
  'peer-data-expanded/source:static peer-data-expanded/source:bg-none peer-data-expanded/source:pt-4 peer-data-expanded/source:pb-0',
  '[@media(scripting:none)]:hidden',
].join(' ');

/**
 * The button under a folded split code (Code.astro): it unfolds the code (`controls`, the id of the folded source) and
 * folds it again. It is a disclosure: `aria-expanded` says the state, `aria-controls` names the source. Folding a long
 * code moves the button up: it is brought back into view, so the reader does not lose their place.
 */
export const CodeExpandButton = ({ controls, lines }: { controls: string; lines: number }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    const source = document.getElementById(controls);
    if (!source) return;
    const next = !expanded;
    source.toggleAttribute('data-expanded', next);
    setExpanded(next);
    if (!next) requestAnimationFrame(() => source.nextElementSibling?.scrollIntoView({ block: 'nearest' }));
  };

  return (
    <UI.Button
      variant="tonal"
      size="small"
      icon={expanded ? iUnfoldLess : iUnfoldMore}
      label={expanded ? 'Show less' : `Show all ${lines} lines`}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={toggle}
      className="pointer-events-auto"
    />
  );
};

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
  layout = 'tabs',
}: MultiFrameworkProps) => {
  const { framework: chosen, synced } = useChosenFramework();
  const activeFramework = resolveExampleFramework(chosen, frameworks);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const { copied, copy, liveRef } = useCopyToClipboard();
  const split = layout === 'split';
  const hasPreview = activeFramework !== undefined && previews.includes(activeFramework);
  // Without a live preview there is nothing to switch to: the code is shown, and the switch is left out. A split block
  // shows both, and has no switch either.
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
          (!split && panel.dataset['view'] !== view);
      });
    delete root.dataset['codeSsr'];
  }, [activeFramework, view, rootId, synced, split]);

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
      // One framework (a reading, or a block with one source) is shown by its name, with no tabs.
      start={
        frameworks.length > 1 ? (
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
        ) : (
          <span className="px-2 text-label-large text-on-surface-variant">
            {FRAMEWORK_LABELS[activeFramework]}
          </span>
        )
      }
      end={
        <>
          {hasPreview && !split && (
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
