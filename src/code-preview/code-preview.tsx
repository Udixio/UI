import React, { FunctionComponent, useEffect, useState } from 'react';

import { Tab, Tabs } from '../navigation/tabs';
import { IconButton } from '../button';
import { Highlight, themes } from 'prism-react-renderer';
import classNames from 'classnames';
import classnames from 'classnames';
import { LivePreview, LiveProvider } from 'react-live';
import { Diviser } from '../diviser';
import {
  faClipboard,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';

export interface CodePreviewProps {
  className?: string;
  code: string;
  renderPreview?: boolean;
  scope?: Record<string, unknown> | undefined;
}

export const CodePreview: FunctionComponent<CodePreviewProps> = ({
  className,
  code,
  renderPreview,
  scope,
}) => {
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // Add this state
  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCodeCopied(true);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  useEffect(() => {
    if (isCodeCopied) {
      const timeoutId = setTimeout(() => {
        setIsCodeCopied(false);
      }, 1750);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isCodeCopied]);

  return (
    <div
      className={classNames(
        'border-outline-variant w-full border bg-surface rounded-xl overflow-hidden',
        { dark: !renderPreview || selectedTab === 1 }
      )}
    >
      <div
        className={classNames('flex justify-between  relative', {
          'items-center': renderPreview,
        })}
      >
        {renderPreview && (
          <Tabs
            onTabSelected={({ index }) => {
              setSelectedTab(index);
            }}
            variant={'secondary'}
          >
            <Tab label={'Preview'} />
            <Tab label={'Code'}></Tab>
          </Tabs>
        )}
        <IconButton
          activated={isCodeCopied}
          className={classNames('mr-2', {
            'absolute right-0 top-2': !renderPreview,
          })}
          arialLabel="Copy code to clipboard"
          onToggle={copyCodeToClipboard}
          icon={faClipboard}
          iconSelected={faClipboardCheck}
        ></IconButton>
        <Diviser className="text-surface-container-highest absolute bottom-0" />
      </div>

      <div className="px-4 py-3 !bg-surface flex">
        {renderPreview && (
          <div
            className={classnames(
              'overflow-auto transition-[all,opacity] duration-300',
              {
                'flex-1 opacity-100  delay-[0s,150ms]':
                  renderPreview && selectedTab === 0,
                'flex-[0] opacity-0': renderPreview && selectedTab === 1,
              }
            )}
          >
            <LiveProvider scope={{ ...scope, React, useState }} code={code}>
              <LivePreview />
            </LiveProvider>
          </div>
        )}
        <Highlight theme={themes.vsDark} code={code.trim()} language="tsx">
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={classnames(
                '!bg-surface overflow-auto transition-[all,opacity] duration-300',
                {
                  'flex-[0] opacity-0': renderPreview && selectedTab === 0,
                  'flex-1 opacity-100  delay-[0s,150ms]':
                    renderPreview && selectedTab === 1,
                }
              )}
              style={style}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};
