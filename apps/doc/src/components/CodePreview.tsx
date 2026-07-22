import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
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

type LegacyProps = {
  mode?: 'legacy';
  code?: string;
  scope?: Record<string, unknown>;
  children?: React.ReactNode;
  className?: string;
  center?: boolean;
  preview?: boolean;
};

type MultiFrameworkProps = {
  mode: 'multiframework';
  rootId: string;
  frameworks: ExampleFramework[];
  sources: Partial<Record<ExampleFramework, string>>;
};

type Props = LegacyProps | MultiFrameworkProps;

const frameworkLabels: Record<ExampleFramework, string> = {
  react: 'React',
  angular: 'Angular',
};

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
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const liveRef = useRef<HTMLDivElement | null>(null);

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

  async function handleCopy() {
    const source = activeFramework ? sources[activeFramework] : undefined;
    if (!source) return;

    try {
      await navigator.clipboard.writeText(source);
      setCopyState('ok');
      if (liveRef.current)
        liveRef.current.textContent = 'Code copied to clipboard';
    } catch {
      setCopyState('error');
      if (liveRef.current) liveRef.current.textContent = 'Copy failed';
    }

    setTimeout(() => {
      setCopyState('idle');
      if (liveRef.current) liveRef.current.textContent = '';
    }, 1500);
  }

  if (!activeFramework) return null;

  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-high px-2 py-1">
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

      <div className="flex items-center gap-1">
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
        <UI.IconButton
          onToggle={handleCopy}
          size="xSmall"
          icon={iContentCopy}
          label={`Copy ${frameworkLabels[activeFramework]} code to clipboard`}
          iconSelected={iContentCopyFilled}
          activated={copyState === 'ok'}
        />
      </div>
      <div ref={liveRef} className="sr-only" aria-live="polite" />
    </div>
  );
};

const LegacyCodePreview = ({
  code,
  scope,
  children,
  center = true,
  preview = true,
}: LegacyProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const liveRef = useRef<HTMLDivElement | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code ?? '');
      setCopyState('ok');
      if (liveRef.current)
        liveRef.current.textContent = 'Code copied to clipboard';
      setTimeout(() => {
        setCopyState('idle');
        if (liveRef.current) liveRef.current.textContent = '';
      }, 1500);
    } catch (e) {
      setCopyState('error');
      if (liveRef.current) liveRef.current.textContent = 'Copy failed';
      setTimeout(() => {
        setCopyState('idle');
        if (liveRef.current) liveRef.current.textContent = '';
      }, 1500);
    }
  }

  return (
    <UI.Card
      className={classNames(
        'not-prose card-code mt-4 flex-col bg-surface-container-low',
        {
          ' flex': preview,
        },
      )}
      variant={'filled'}
    >
      <UI.TabGroup defaultTab={preview ? 0 : 1}>
        <div
          className={classNames('flex pr-2 items-center', {
            'bg-surface-container-high relative': preview,
            'w-fit ': !preview,
          })}
        >
          {preview && (
            <UI.Tabs variant={'secondary'}>
              <UI.Tab
                className={'bg-surface-container-high'}
                label={'Preview'}
                selected
              ></UI.Tab>
              <UI.Tab
                className={'bg-surface-container-high'}
                label={'Code'}
              ></UI.Tab>
            </UI.Tabs>
          )}
          <UI.IconButton
            onToggle={handleCopy}
            size={'xSmall'}
            className={classNames('absolute right-2', {
              'top-1/2 -translate-y-1/2': preview,
              'top-3': !preview,
            })}
            icon={iContentCopy}
            label={'Copy to clipboard'}
            iconSelected={iContentCopyFilled}
            activated={copyState == 'ok'}
          />
        </div>

        <UI.TabPanels>
          <UI.TabPanel className={'flex-1'}>
            <LiveProvider code={code} scope={{ ...UI, ...scope }}>
              <>
                <LivePreview
                  className={classNames(' bg-surface-bright', {
                    'flex justify-center items-center flex-1 flex-col p-8':
                      center,
                  })}
                />
                <LiveError />
              </>
            </LiveProvider>
          </UI.TabPanel>
          <UI.TabPanel className={'flex-1'}>
            <LiveProvider code={code} scope={{ ...UI, ...scope }}>
              <div className={"p-4 ' bg-surface-bright pr-12"}>
                {!children && (
                  <>
                    <LiveEditor />
                    <LiveError />
                  </>
                )}
                {children && children}
              </div>
            </LiveProvider>
          </UI.TabPanel>
        </UI.TabPanels>
      </UI.TabGroup>
    </UI.Card>
  );
};

export const CodePreview = (props: Props) => {
  if (props.mode === 'multiframework') {
    return <MultiFrameworkToolbar {...props} />;
  }

  return <LegacyCodePreview {...props} />;
};
