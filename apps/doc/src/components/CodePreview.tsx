import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import * as UI from '@udixio/ui-react';
import { classNames } from '@udixio/core';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iContentCopyFilled } from '@udixio/icons-rounded-400/filled/content_copy';
import {
  initializeExampleFrameworkPreference,
  preferredExampleFrameworkStore,
  resolveExampleFramework,
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

type SingleSourceProps = {
  mode?: 'single';
  code?: string;
  /** Langue du bloc, affichée dans la barre d'outils. */
  language?: string;
  className?: string;
};

type MultiFrameworkProps = {
  mode: 'multiframework';
  rootId: string;
  frameworks: ExampleFramework[];
  sources: Partial<Record<ExampleFramework, string>>;
};

type Props = SingleSourceProps | MultiFrameworkProps;

const frameworkLabels: Record<ExampleFramework, string> = {
  react: 'React',
  angular: 'Angular',
};

// ─── Coque partagée ───────────────────────────────────────────────────────────
// Ces classes sont l'unique définition de l'habillage d'un bloc de code : la
// carte et le corps sont rendus côté Astro (les panneaux multiframework
// contiennent des îlots React/Angular que React ne peut pas posséder), la barre
// côté React. Code.astro les importe pour que les deux modes ne puissent pas
// diverger.
export const codeCardClass =
  'not-prose card-code mt-4 overflow-hidden rounded-2xl bg-surface-container-low';
export const codeBodyClass = 'bg-surface-bright';
export const codePanelClass = 'code-source overflow-auto p-4';

const toolbarClass =
  'flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-high px-2 py-1';

/** Copie + annonce vocale, partagées par les deux barres d'outils. */
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

/** Barre d'outils : `start` à gauche, `end` à droite, annonce vocale incluse. */
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
  sources,
}: MultiFrameworkProps) => {
  const preferredFramework = useStore(preferredExampleFrameworkStore);
  const activeFramework = resolveExampleFramework(
    preferredFramework,
    frameworks,
  );
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const { copied, copy, liveRef } = useCopyToClipboard();

  useEffect(() => {
    initializeExampleFrameworkPreference();
  }, []);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    root
      .querySelectorAll<HTMLElement>('[data-example-panel]')
      .forEach((panel) => {
        panel.hidden =
          panel.dataset['framework'] !== activeFramework ||
          panel.dataset['view'] !== activeView;
      });
  }, [activeFramework, activeView, rootId]);

  if (!activeFramework) return null;

  return (
    <CodeToolbar
      liveRef={liveRef}
      start={
        <div
          className="flex flex-wrap items-center gap-1"
          aria-label="Example framework"
        >
          {frameworks.map((framework) => (
            <button
              key={framework}
              type="button"
              className={classNames(
                'rounded-full px-3 py-2 text-label-large transition-colors',
                activeFramework === framework
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              )}
              aria-pressed={activeFramework === framework}
              onClick={() => setPreferredExampleFramework(framework)}
            >
              {frameworkLabels[framework]}
            </button>
          ))}
        </div>
      }
      end={
        <>
          <div
            className="flex rounded-full bg-surface-container p-1"
            aria-label="Example view"
          >
            {(['preview', 'code'] as const).map((view) => (
              <button
                key={view}
                type="button"
                className={classNames(
                  'rounded-full px-3 py-1.5 text-label-medium capitalize transition-colors',
                  activeView === view
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant',
                )}
                aria-pressed={activeView === view}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            ))}
          </div>
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

// Une seule source : ni sélecteur de framework, ni bascule preview/code — il n'y
// a rien à prévisualiser. La coque (carte, corps) est rendue par Code.astro,
// exactement comme pour le multiframework.
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
