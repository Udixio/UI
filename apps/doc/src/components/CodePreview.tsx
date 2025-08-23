import React, { useRef, useState } from 'react';
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';
import * as UI from '@udixio/ui-react';
import { classNames } from '@udixio/ui-react';
import { faClipboard as farClipboard } from '@fortawesome/free-regular-svg-icons';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';

type Props = {
  code?: string;
  scope?: Record<string, unknown>;
  children?: React.ReactNode;
  className?: string;
  center?: boolean;
  preview?: boolean;
};

export const CodePreview = ({
  code,
  scope,
  children,
  center = true,
  preview = true,
}: Props) => {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const liveRef = useRef<HTMLDivElement | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
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

  const [tab, setTab] = useState<'Code' | 'Preview'>(
    preview ? 'Preview' : 'Code',
  );

  return (
    <UI.Card
      className={classNames('not-prose card-code mt-4 flex-col', {
        'min-h-48 flex': preview,
      })}
      variant={'filled'}
    >
      <div
        className={classNames('flex pr-2 items-center', {
          'bg-surface-container-high relative': preview,
          'w-fit ': !preview,
        })}
      >
        {preview && (
          <UI.Tabs
            onTabSelected={({ label }) => setTab(label)}
            variant={'secondary'}
          >
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
          icon={farClipboard}
          label={'Copy to clipboard'}
          iconSelected={faClipboardCheck}
          activated={copyState == 'ok'}
        />
      </div>

      <LiveProvider code={code} scope={{ ...UI, ...scope }}>
        {tab === 'Preview' && (
          <>
            <LivePreview
              className={classNames(' bg-inverse-surface/[0.05]', {
                'flex justify-center items-center flex-1 flex-col p-8': center,
              })}
            />
            <LiveError />
          </>
        )}
        {tab == 'Code' && (
          <div className={'p-4 bg-inverse-surface/[0.05] pr-12'}>
            {!children && (
              <>
                <LiveEditor />
                <LiveError />
              </>
            )}
            {children && children}
          </div>
        )}
      </LiveProvider>
    </UI.Card>
  );
};
