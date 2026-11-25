/**
 * The filter of the API reference (/motion/api): a Udixio TextField that keeps, as the reader types, the entries whose
 * name, kind or summary holds every word typed; the count of the shown entries as its supporting text, announced politely
 * once the reader pauses; an empty state; and a
 * button that opens or folds every shown entry at once.
 *
 * It works on the server-rendered page, not on data of its own: an entry is a `details[data-api-entry]` (ApiSymbol,
 * ApiHtmlEntry), hidden when it does not match; an element marked `data-api-filter-group` (a tier, a block, a group, a
 * section) is hidden when it holds no shown entry; in the index (`[data-api-index]`), a link to an entry is hidden with
 * it, a link to a group counts its shown entries, and an `li` or a `[data-api-index-group]` with nothing shown is hidden.
 * Nothing is removed from the page: Ctrl+F and the anchors still reach every entry once the filter is cleared, and the
 * page clears it itself when an anchor points to a hidden entry (`API_FILTER_CLEAR`).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, IconButton, TextField } from '@udixio/ui-react';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iExpandAll } from '@udixio/icons-rounded-400/expand_all';
import { iCollapseAll } from '@udixio/icons-rounded-400/collapse_all';
import { API_FILTER_CLEAR } from './apiPage';


type Entry = { element: HTMLDetailsElement; text: string };

/** The words of a query, each of which an entry must hold. */
const wordsOf = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

const entriesOf = (): Entry[] =>
  [...document.querySelectorAll<HTMLDetailsElement>('details[data-api-entry]')].map((element) => ({
    element,
    text: (element.querySelector('summary')?.textContent ?? '').replace(/\s+/g, ' ').toLowerCase(),
  }));

const shownIn = (root: Element) => root.querySelectorAll('details[data-api-entry]:not([hidden])').length;

/** Hides what the query leaves empty, and returns the count of shown entries. */
function apply(entries: Entry[], query: string): number {
  const words = wordsOf(query);
  let shown = 0;
  for (const { element, text } of entries) {
    const match = words.every((word) => text.includes(word));
    element.hidden = !match;
    if (match) shown += 1;
  }
  // Inner groups first: an outer group is empty when every group in it is.
  const groups = [...document.querySelectorAll<HTMLElement>('[data-api-filter-group]')].reverse();
  for (const group of groups) group.hidden = shownIn(group) === 0;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-api-index] a[href^="#"]')) {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) continue;
    const count = target.matches('details') ? Number(!target.hidden) : shownIn(target);
    const label = link.querySelector<HTMLElement>('[data-count]');
    if (label) label.textContent = String(count);
    link.closest('li')?.toggleAttribute('hidden', count === 0);
  }
  for (const group of document.querySelectorAll<HTMLElement>('[data-api-index-group]')) {
    group.hidden = group.querySelector('li:not([hidden])') === null;
  }
  return shown;
}

export function ApiFilter({ total }: { total: number }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(total);
  const [announcement, setAnnouncement] = useState('');
  const [allOpen, setAllOpen] = useState(false);
  const entries = useRef<Entry[]>([]);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  /** Whether every shown entry is open: the button then folds them. */
  const measureOpen = useCallback(() => {
    const visible = entries.current.filter(({ element }) => !element.hidden);
    setAllOpen(visible.length > 0 && visible.every(({ element }) => element.open));
  }, []);

  useEffect(() => {
    entries.current = entriesOf();
    // Cleared at once, not at the next render: the page scrolls to the entry it asked for right after.
    const clear = () => {
      setShown(apply(entries.current, ''));
      setQuery('');
    };
    let frame = 0;
    // `toggle` does not bubble: it is caught on its way down. Opening every entry fires one each, measured once a frame.
    const onToggle = (event: Event) => {
      if (!(event.target instanceof HTMLDetailsElement) || !event.target.hasAttribute('data-api-entry')) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureOpen);
    };
    document.addEventListener(API_FILTER_CLEAR, clear);
    document.addEventListener('toggle', onToggle, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener(API_FILTER_CLEAR, clear);
      document.removeEventListener('toggle', onToggle, true);
    };
  }, [measureOpen]);

  useEffect(() => {
    setShown(apply(entries.current, query));
    measureOpen();
  }, [query, measureOpen]);

  const words = wordsOf(query);
  const count = words.length > 0 ? `${shown} of ${total} entries` : `${total} entries`;

  // The count is announced once the reader pauses, not at each key.
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(words.length > 0 ? count : ''), 600);
    return () => window.clearTimeout(timer);
  }, [count, words.length]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    }
  };

  const toggleAll = () => {
    const open = !allOpen;
    for (const { element } of entries.current) if (!element.hidden) element.open = open;
    setAllOpen(open);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        {/* The field's own clear button: a Udixio IconButton over its trailing end (the TextField's trailing icon is not a
            control), in place of the browser's, which does not follow the theme and which Firefox does not draw. */}
        <div className="relative min-w-0 flex-1 basis-72">
        <TextField
          ref={input}
          className="w-full [&_input]:pe-10 [&_input::-webkit-search-cancel-button]:appearance-none"
          variant="outlined"
          type={'search' as 'text'}
          label="Filter the reference"
          leadingIcon={iSearch}
          value={query}
          onChange={setQuery}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          onKeyDown={onKeyDown}
          supportingText={count}
        />
        {query && (
          <IconButton
            className="absolute end-2 top-2"
            size="small"
            icon={iClose}
            label="Clear the filter"
            onClick={() => {
              setQuery('');
              input.current?.focus();
            }}
          />
        )}
        </div>
        <Button
          variant="text"
          size="small"
          icon={allOpen ? iCollapseAll : iExpandAll}
          label={allOpen ? 'Fold all' : 'Open all'}
          disabled={shown === 0}
          onClick={toggleAll}
        />
      </div>
      <p role="status" className="sr-only">{announcement}</p>
      {words.length > 0 && shown === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface-container-low p-6">
          <p className="text-title-medium text-on-surface">Nothing matches “{query.trim()}”</p>
          <p className="text-body-medium text-on-surface-variant">
            The filter reads the name, the kind and the first sentence of each entry. Try one word of the name, or of what it does.
          </p>
          <Button
            variant="tonal"
            size="small"
            label="Clear the filter"
            onClick={() => {
              setQuery('');
              input.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
