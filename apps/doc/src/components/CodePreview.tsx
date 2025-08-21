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
  center?: string;
};

export const CodePreview = ({
  code,
  scope,
  children,
  center = true,
  className = '',
}: Props) => {
  const [open, setOpen] = useState<boolean>(true);
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

  const [tab, setTab] = useState<'Code' | 'Preview'>(code ? 'Preview' : 'Code');

  return (
    <UI.Card
      className={classNames('not-prose  flex-col', {
        'min-h-48 flex': code,
      })}
      variant={'filled'}
    >
      <div
        className={classNames(' justify-between pr-2 ', {
          'flex bg-surface-container-high': code,
          'w-fit float-right': !code,
        })}
      >
        {code && (
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
          icon={farClipboard}
          ariaLabel={'Copy to clipboard'}
          iconSelected={faClipboardCheck}
          activated={copyState == 'ok'}
        />
      </div>

      <LiveProvider code={code} scope={{ ...UI, ...scope }}>
        {tab === 'Preview' && (
          <div
            className={classNames(' bg-inverse-surface/[0.05]', {
              'flex justify-center items-center flex-1': center,
            })}
          >
            <LivePreview /> <LiveError />
          </div>
        )}
        {tab == 'Code' && (
          <div className={'p-4 bg-inverse-surface/[0.05]'}>
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
