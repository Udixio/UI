import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@udixio/ui-react';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';

/** How long the button shows that the code was copied. */
const COPIED_FOR = 1600;

/**
 * Copies a text, and says so: `copied` is true for a moment after a copy (the button shows a check), and the polite live
 * region (`liveRef`, an empty element the caller renders) tells a screen reader that the copy worked or failed.
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const announce = (message: string) => {
    const region = liveRef.current;
    if (!region) return;
    // The same message twice in a row is announced again: the region is emptied first.
    region.textContent = '';
    requestAnimationFrame(() => (region.textContent = message));
  };

  async function copy(source?: string) {
    if (!source) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      announce('Code copied to clipboard');
    } catch {
      setCopied(false);
      announce('The code could not be copied: select it instead.');
    }

    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      if (liveRef.current) liveRef.current.textContent = '';
    }, COPIED_FOR);
  }

  return { copied, copy, liveRef };
}

/**
 * The copy button of the site's code: Udixio's standard icon button, whose tooltip is its label. A copy swaps its icon for
 * a check in the primary tone for a moment; the name stays the action's, the live region says it is done.
 */
export const CopyIconButton = ({
  label,
  copied,
  onCopy,
  className,
  ...attributes
}: {
  label: string;
  copied: boolean;
  onCopy: () => void;
  className?: string;
  suppressHydrationWarning?: boolean;
  [attribute: `data-${string}`]: string | undefined;
}) => (
  <IconButton
    {...attributes}
    size="xSmall"
    icon={copied ? iCheck : iContentCopy}
    label={label}
    onClick={onCopy}
    className={`${copied ? 'text-primary' : ''} ${className ?? ''}`}
  />
);

