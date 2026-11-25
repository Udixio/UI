// Tailwind reads the classes as written in this file: keep each one spelled out, never built from parts.

/**
 * The styles of the API reference, set once on the element around its entries instead of on each of their elements: the
 * page has about three hundred entries and thousands of rows, links and code spans, and one class list per element
 * made most of its weight (review 6, M4: 1.38 MB of HTML, two thirds of it in class attributes). Each rule targets
 * the plain markup the components write (ApiSymbol, ApiHtmlEntry, ApiTable, ApiText, ApiType):
 *
 * - an entry is a `details[data-api-entry]`; its `summary` holds the heading, the kind (`span`) and the summary sentence
 *   (`[data-sum]`), and draws its chevron itself (`::after`); its body is the `div` after the summary;
 * - `[data-title]` is the label of a part of the body (Parameters, Returns, Example…);
 * - `dl[data-rows]` is a table of rows (parameters, members, inputs, fields): `dt > code` the name, `dt > small` a flag,
 *   `dd > span` the description, `dd > small` the type and the default; a `dl[data-rows][data-labels]` has words, not code,
 *   for names (On, Value);
 * - `code` is an inline code span; `code[data-type]` a type, `pre code` a signature or an example;
 * - `a` a link to another entry or to a page.
 */

/** Links and focus rings, shared by the entries, the index and the table of import paths. */
export const apiLinkClass = [
  '[&_a]:rounded-xs [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline',
  '[&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-on-surface',
].join(' ');

/** Around every entry of both tiers. */
export const apiEntriesClass = [
  'not-prose',
  apiLinkClass,
  // An entry, folded: its summary is the row the reader scans.
  '[&_[data-api-entry]]:scroll-mt-24 [&_[data-api-entry]]:border-b [&_[data-api-entry]]:border-outline-variant',
  '[&_summary]:-mx-3 [&_summary]:grid [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:grid-cols-[auto_1fr_auto]',
  '[&_summary]:items-baseline [&_summary]:gap-x-3 [&_summary]:gap-y-1 [&_summary]:rounded-xl [&_summary]:px-3 [&_summary]:py-3',
  '[&_summary::-webkit-details-marker]:hidden [&_summary:hover]:bg-surface-container-low',
  '[&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:-outline-offset-2 [&_summary:focus-visible]:outline-on-surface',
  '[&_summary>:is(h3,h4,h5)]:min-w-0 [&_summary>:is(h3,h4,h5)]:break-words [&_summary>:is(h3,h4,h5)]:font-mono',
  '[&_summary>:is(h3,h4,h5)]:text-title-medium [&_summary>:is(h3,h4,h5)]:text-on-surface',
  '[&_summary>span]:text-label-medium [&_summary>span]:text-on-surface-variant',
  // The chevron, drawn by two borders of the summary's ::after: it points down, and up once the entry is open.
  "[&_summary]:after:col-start-3 [&_summary]:after:row-span-2 [&_summary]:after:row-start-1 [&_summary]:after:me-2 [&_summary]:after:size-2 [&_summary]:after:content-['']",
  '[&_summary]:after:self-center [&_summary]:after:rotate-45 [&_summary]:after:border-e-2 [&_summary]:after:border-b-2 [&_summary]:after:border-on-surface-variant',
  'motion-safe:[&_summary]:after:transition-transform [&_[open]>summary]:after:-rotate-135',
  '[&_summary>[data-sum]]:col-span-2 [&_summary>[data-sum]]:text-body-medium [&_summary>[data-sum]]:text-on-surface-variant',
  // The open entry.
  '[&_details>div]:flex [&_details>div]:flex-col [&_details>div]:gap-4 [&_details>div]:pt-1 [&_details>div]:pb-8',
  '[&_details>div]:text-body-medium [&_details>div]:text-on-surface-variant',
  '[&_[data-title]]:mb-2 [&_[data-title]]:text-title-small [&_[data-title]]:text-on-surface',
  '[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:ps-5 [&_[data-text]]:flex [&_[data-text]]:flex-col [&_[data-text]]:gap-2',
  // Code: a span in prose, a type, a signature or an example.
  '[&_code]:rounded [&_code]:bg-surface-container-highest [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-on-surface',
  '[&_code[data-type]]:break-words [&_code[data-type]]:bg-transparent [&_code[data-type]]:px-0 [&_code[data-type]]:text-[1em] [&_code[data-type]]:text-on-surface-variant',
  // A signature or an example is set as every code block of the site (16 px on 28 px), and its long lines wrap, even
  // inside a word, rather than scroll sideways (as CodePreview's codePanelClass).
  '[&_pre]:rounded-2xl [&_pre]:bg-surface-container-highest [&_pre]:px-4 [&_pre]:py-3 [&_pre]:whitespace-pre-wrap [&_pre]:wrap-anywhere',
  '[&_pre]:font-mono [&_pre]:text-base [&_pre]:leading-7 [&_pre]:tracking-normal [&_pre]:text-on-surface [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[length:inherit]',
  // A table of rows.
  '[&_dl[data-rows]]:divide-y [&_dl[data-rows]]:divide-outline-variant [&_dl[data-rows]]:rounded-2xl [&_dl[data-rows]]:bg-surface-container-low',
  '[&_[data-rows]>div]:grid [&_[data-rows]>div]:gap-x-6 [&_[data-rows]>div]:gap-y-1 [&_[data-rows]>div]:px-4 [&_[data-rows]>div]:py-3',
  'md:[&_[data-rows]>div]:grid-cols-[minmax(9rem,13rem)_1fr] [&_[data-rows]_dt]:min-w-0 [&_[data-rows]_dt]:text-on-surface [&_[data-rows]_dd]:flex [&_[data-rows]_dd]:min-w-0 [&_[data-rows]_dd]:flex-col [&_[data-rows]_dd]:gap-1',
  '[&_[data-rows]_dt]:break-words [&_[data-rows]_dt]:font-mono [&_[data-rows][data-labels]_dt]:font-sans',
  '[&_dt>small]:ms-1 [&_dt>small]:text-label-small [&_dt>small[data-required]]:text-primary [&_dt>small[data-block]]:ms-0 [&_dt>small[data-block]]:block',
  '[&_dd>span]:text-on-surface [&_dd>small]:text-body-small',
  // Methods and properties: the signature, then what it does.
  '[&_dl[data-methods]]:flex [&_dl[data-methods]]:flex-col [&_dl[data-methods]]:gap-3 [&_[data-methods]_dd]:mt-1',
].join(' ');

