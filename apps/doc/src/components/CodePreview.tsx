import React, { useMemo, useRef, useState } from 'react';

type Props = {
  code?: string;
  language?: string;
  initiallyOpen?: boolean;
  title?: string;
  preview?: React.ReactNode;
  previewHtml?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function CodePreview({
  code = '',
  language = 'tsx',
  initiallyOpen = true,
  title = 'Example',
  preview,
  previewHtml,
  children,
  className = '',
}: Props) {
  const [open, setOpen] = useState<boolean>(initiallyOpen);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const liveRef = useRef<HTMLDivElement | null>(null);

  const contentText = useMemo(() => {
    if (typeof code === 'string' && code.length > 0) return code;
    // If children is a code block rendered by MDX, we still want its textContent.
    // As fallback for SSR, try to stringify children if it is a string.
    if (typeof children === 'string') return children;
    return '';
  }, [code, children]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contentText);
      setCopyState('ok');
      if (liveRef.current) liveRef.current.textContent = 'Code copied to clipboard';
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
    <div className={`rounded-md border border-outline-variant bg-surface-variant/10 ${className}`}> 
      {/* Preview area */}
      <div className="p-4 bg-surface/50 rounded-t-md">
        {typeof previewHtml === 'string' && previewHtml.length > 0 ? (
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          preview
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-b border-outline-variant/60 bg-surface-container-lowest">
        <div className="text-sm font-medium text-on-surface/80">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm px-3 py-1.5 rounded-md border border-outline-variant hover:bg-surface-container-high/60 focus:bg-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-on-surface"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span>{open ? 'Hide code' : 'Show code'}</span>
            <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <button
            type="button"
            className={`text-sm px-3 py-1.5 rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${copyState === 'ok' ? 'bg-green-100 border-green-300 text-green-700' : copyState === 'error' ? 'bg-red-100 border-red-300 text-red-700' : 'border-outline-variant hover:bg-surface-container-high/60 text-on-surface'}`}
            aria-label="Copy code"
            onClick={handleCopy}
          >
            {copyState === 'ok' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="relative" style={{ display: open ? 'block' : 'none' }}>
        {code ? (
          <pre className="m-0 p-4 overflow-auto text-sm bg-surface-container-lowest text-on-surface rounded-b-md"><code className={`language-${language}`} data-language={language}>{code}</code></pre>
        ) : (
          <div className="m-0 p-4 overflow-auto text-sm bg-surface-container-lowest text-on-surface rounded-b-md">
            {children}
          </div>
        )}
        <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-surface-container rounded text-on-surface-variant opacity-60">
          {language.toUpperCase()}
        </div>
      </div>

      {/* Screen reader announcements */}
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
