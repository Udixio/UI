import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Search } from '@udixio/ui-react';

export interface DocumentationSearchProps {
  /** Whether the hosting panel currently shows the search; focuses the input. */
  open: boolean;
  /** Asks the hosting panel to close, after a result was chosen. */
  onClose: () => void;
}

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PagefindResultData {
  url?: string;
  excerpt?: string;
  meta?: Record<string, string | undefined>;
}

interface PagefindResult {
  data: () => Promise<PagefindResultData>;
}

interface PagefindResponse {
  results: PagefindResult[];
}

interface PagefindApi {
  search: (
    term: string,
    options?: { excerptLength?: number },
  ) => Promise<PagefindResponse>;
}

interface DocumentationSearchResult {
  href: string;
  title: string;
  excerpt: string;
}

const MAX_RESULTS = 8;
const MAX_EXCERPT_LENGTH = 240;

const stripMarkup = (value = '') => {
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (typeof document === 'undefined' || !text.includes('&')) return text;

  // Pagefind returns escaped HTML in excerpts. Decode it without injecting the
  // excerpt into the DOM as markup, then normalize whitespace once more.
  const decoder = document.createElement('textarea');
  decoder.innerHTML = text;
  return decoder.value.replace(/\s+/g, ' ').trim();
};

const shortenExcerpt = (value: string) => {
  if (value.length <= MAX_EXCERPT_LENGTH) return value;

  const shortened = value
    .slice(0, MAX_EXCERPT_LENGTH)
    .replace(/\s+\S*$/, '')
    .trim();
  return `${shortened}…`;
};

const removeDuplicateTitle = (excerpt: string, title: string) => {
  const normalizedTitle = title.trim().toLocaleLowerCase();
  if (
    !normalizedTitle ||
    !excerpt.toLocaleLowerCase().startsWith(normalizedTitle)
  ) {
    return excerpt;
  }

  const nextCharacter = excerpt[normalizedTitle.length] ?? '';
  if (nextCharacter && /[\p{L}\p{N}]/u.test(nextCharacter)) return excerpt;

  return excerpt
    .slice(normalizedTitle.length)
    .replace(/^[\s:.;,!?–—-]+/, '')
    .trim();
};

const resultMessage = (message: string) => (
  <div
    role="option"
    aria-disabled="true"
    aria-live="polite"
    tabIndex={-1}
    className="px-4 py-5 text-body-medium text-on-surface-variant"
  >
    {message}
  </div>
);

/**
 * Documentation search shown inside the navigation rail's side panel.
 * Pagefind remains the index/search engine; Udixio Search owns the
 * interaction and accessibility behavior.
 */
export const DocumentationSearch = ({
  open,
  onClose,
}: DocumentationSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentationSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const pagefindPromiseRef = useRef<Promise<PagefindApi> | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPagefind = useCallback((): Promise<PagefindApi> => {
    const cachedPagefind = pagefindPromiseRef.current;
    if (cachedPagefind) return cachedPagefind;

    const bundleUrl = new URL('/pagefind/pagefind.js', window.location.origin)
      .href;
    const pagefindPromise = import(/* @vite-ignore */ bundleUrl)
      .then((module) => module as PagefindApi)
      .catch((error: unknown) => {
        pagefindPromiseRef.current = null;
        throw error;
      });

    pagefindPromiseRef.current = pagefindPromise;
    return pagefindPromise;
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!normalizedQuery) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const runSearch = async () => {
        try {
          const pagefind = await loadPagefind();
          const response = await pagefind.search(normalizedQuery, {
            excerptLength: 18,
          });
          const resolvedResults = await Promise.all(
            response.results.slice(0, MAX_RESULTS).map(async (result) => {
              const data = await result.data();
              const href = data.meta?.url ?? data.url;
              if (!href) return null;

              const rawExcerpt = stripMarkup(data.excerpt);
              const title =
                stripMarkup(data.meta?.title) || rawExcerpt || 'Documentation';
              const excerpt = removeDuplicateTitle(
                shortenExcerpt(rawExcerpt),
                title,
              );
              return {
                href,
                title,
                excerpt,
              } satisfies DocumentationSearchResult;
            }),
          );

          if (requestIdRef.current !== requestId) return;
          setResults(
            resolvedResults.filter(
              (result): result is DocumentationSearchResult => result !== null,
            ),
          );
          setStatus('ready');
        } catch {
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setStatus('error');
        }
      };

      setStatus('loading');
      void runSearch();
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [loadPagefind, query]);

  useEffect(() => {
    if (!open) {
      requestIdRef.current += 1;
      setQuery('');
      setResults([]);
      setStatus('idle');
      return undefined;
    }

    // The panel is still sliding open; wait a frame so focus does not scroll
    // the collapsed content.
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [open]);

  const handleQueryChange = (nextQuery: string) => {
    requestIdRef.current += 1;
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      setResults([]);
      setStatus('idle');
    } else {
      setStatus('loading');
    }
  };

  const hasQuery = query.trim().length > 0;
  let resultContent: ReactNode = null;

  if (hasQuery) {
    if (status === 'loading') {
      resultContent = resultMessage('Searching documentation…');
    } else if (status === 'error') {
      resultContent = resultMessage(
        'The documentation search is temporarily unavailable.',
      );
    } else if (results.length === 0) {
      resultContent = resultMessage('No documentation matches this search.');
    } else {
      resultContent = results.map((result) => (
        <a
          key={result.href}
          href={result.href}
          role="option"
          aria-selected={false}
          tabIndex={-1}
          className="block rounded-xl px-4 py-3 text-on-surface transition-colors hover:bg-on-surface/[0.08] focus-visible:bg-on-surface/[0.08] focus-visible:outline-none"
          onClick={onClose}
        >
          <span className="block text-title-medium">{result.title}</span>
          {result.excerpt && (
            <span className="mt-1 block text-body-medium text-on-surface-variant">
              {result.excerpt}
            </span>
          )}
        </a>
      ));
    }
  }

  return (
    <div className="p-4">
      <Search
        ref={inputRef}
        label="Search documentation"
        placeholder="Search documentation"
        clearLabel="Clear search"
        resultsLabel="Documentation search results"
        query={query}
        onQueryChange={handleQueryChange}
        className="max-w-none"
      >
        {resultContent}
      </Search>
    </div>
  );
};
